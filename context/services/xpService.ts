import { Notice } from "obsidian";
// from files (services, default):
import { AppContextService } from "../appContextService";
import { UserSettings } from "data/DEFAULT";

export interface XpCalc {
	totalXp: number;
	level: number;
	newXp: number;
	lvlThreshold: number;
}

export default class XpService {
	/* Service handling XP calculations and user xpDetails updates.
		Includes functions to compute level from total XP, add XP, and normalize on load.
	*/
	private appService: AppContextService;

	constructor(appService: AppContextService) {
		this.appService = appService;
	}

	public async updateXPFromAttributes(
		attributes: Partial<UserSettings["attribute"]>,
		isCompleted: boolean
	): Promise<UserSettings> {
		/* Update user's attributes and XP details.
		- Adds provided attribute values to user's current ones.
		- Recalculates total XP as the sum of all attributes.
		- Returns the updated UserSettings object (no persistence here).
		*/
		const user = this.appService.getUser();
		if (!user) throw new Error("No user found");

		// 1. Clone current attributes
		const currentAttributes = { ...user.attribute };

		// 2. Apply updates (incremental)
		for (const [key, value] of Object.entries(attributes)) {
			if (value !== undefined && typeof value === "number") {
				if (!isCompleted) {
					currentAttributes[key as keyof typeof currentAttributes] =
						Math.max((currentAttributes[key as keyof typeof currentAttributes] ?? 0) - value, 0);
					continue;
				} else {
					currentAttributes[key as keyof typeof currentAttributes] =
						(currentAttributes[key as keyof typeof currentAttributes] ?? 0) + value;
				}
			}
		}

		// 3. Compute total XP as sum of all attributes (rounded)
		const totalXp = Object.values(currentAttributes)
			.filter(v => typeof v === "number")
			.reduce((acc, val) => acc + (val ?? 0), 0);

		const addedXP = isCompleted ? Object.values(attributes).reduce((acc, val) => acc + (val ?? 0), 0) : Object.values(attributes).reduce((acc, val) => acc - (val ?? 0), 0);
		if (isCompleted && addedXP > 0) {
			new Notice(`You gained ${addedXP} XP from attributes!`);
		}

		const newUser = await this.addXP(user, addedXP);

		// console.log(`Current total XP: New total XP: ${totalXp}`);
		// 4. Update XP details if present
		const updatedXpDetails = {
			...newUser.xpDetails,
			xp: totalXp,
		};

		// 5. Return updated user object (no save)
		return {
			...newUser,
			xpDetails: updatedXpDetails,
			attribute: currentAttributes,
		};
	}


	private computeXpFromTotal(totalXp: number, maxLevel?: number): XpCalc {
		/* Calcule level/newXp/lvlThreshold à partir du total XP.
			maxLevel optionnel : si défini, plafonne le level à cette valeur.
			Retourne un objet { totalXp, level, newXp, lvlThreshold }.
		*/
		let total = Math.max(0, Math.trunc(totalXp)); // normalisation
		const baseThreshold = 100;
		let level = 1;
		let threshold = baseThreshold;
		let remaining = total;

		const capLevel = typeof maxLevel === "number" ? Math.max(1, Math.trunc(maxLevel)) : Infinity;

		while (remaining >= threshold && level < capLevel) {
			remaining -= threshold;
			level += 1;
			threshold = Math.floor(threshold * 1.2);
		}

		// If user has reached max level, cap remaining XP to just below next threshold
		if (level >= capLevel) {
			remaining = Math.min(remaining, Math.max(0, threshold - 1));
			level = capLevel;
		}

		return {
			totalXp: total,
			level,
			newXp: remaining,
			lvlThreshold: threshold,
		};
	}

	public async addXP(
		user: UserSettings,
		amount: number
	): Promise<UserSettings> {
		/* add (or remove) XP to a user, updating their xpDetails accordingly.
			Triggers a level-up Notice if applicable.
			Persists the updated xpDetails via appService.updateUserData.
			Returns the updated UserSettings object.
		*/
		const currentXp = Math.max(0, user.xpDetails?.xp ?? 0);
		const maxLevel = user.xpDetails?.maxLevel;
		const newTotal = Math.max(0, currentXp + Math.trunc(amount));

		const calc = this.computeXpFromTotal(newTotal, maxLevel);

		const prevLevel = user.xpDetails?.level ?? 1;
		if (calc.level > prevLevel) {
			new Notice(`congrats — level ${calc.level} reached!`);
		}

		const updatedXpDetails = {
			...user.xpDetails,
			xp: calc.totalXp,
			level: calc.level,
			newXp: calc.newXp,
			lvlThreshold: calc.lvlThreshold,
		};

		// Persist the updated xpDetails
		await this.appService.updateUserData({ xpDetails: updatedXpDetails });

		const updatedUser: UserSettings = {
			...user,
			xpDetails: updatedXpDetails,
		};

		return updatedUser;
	}

	public async normalizeUserXpOnLoad(): Promise<void> {
		/* load the user from appService, recalcule et persiste ses xpDetails si incohérence détectée.
			Utilisé au chargement de l'app pour corriger d'éventuelles erreurs.
		*/
		const user = this.appService.getUser();
		if (!user) return;

		const xpTotal = Math.max(0, user.xpDetails?.xp ?? 0);
		const maxLevel = user.xpDetails?.maxLevel;
		const calc = this.computeXpFromTotal(xpTotal, maxLevel);

		const needsUpdate =
			user.xpDetails?.level !== calc.level ||
			user.xpDetails?.newXp !== calc.newXp ||
			user.xpDetails?.lvlThreshold !== calc.lvlThreshold ||
			user.xpDetails?.xp !== calc.totalXp;

		if (needsUpdate) {
			const updated = {
				...user.xpDetails,
				xp: calc.totalXp,
				level: calc.level,
				newXp: calc.newXp,
				lvlThreshold: calc.lvlThreshold,
			};
			await this.appService.updateUserData({ xpDetails: updated });
		}
	}

	public getDaysUntil_old(today: Date, targetDate: Date): number {
		/* Calculate days until the next occurrence of targetDay (0=Sunday, 6=Saturday).
			If today is targetDay, returns 0.
		*/
		const todayMidnight = new Date(today);
		todayMidnight.setHours(0, 0, 0, 0);
		const targetMidnight = new Date(targetDate);
		targetMidnight.setHours(0, 0, 0, 0);
		const diffTime = targetMidnight.getTime() - todayMidnight.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays >= 0 ? diffDays : 0;
	}

	public getDaysUntil(today: Date, targetDate: Date, type: 'quest'| 'habit'): string {
		const todayMidnight = new Date(today);
		todayMidnight.setHours(0, 0, 0, 0);
		const targetMidnight = new Date(targetDate);
		targetMidnight.setHours(0, 0, 0, 0);
		// console.log("Calculating days until:", todayMidnight, targetMidnight);
		const diffTime = targetMidnight.getTime() - todayMidnight.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (type === 'habit') {
			if (diffDays <= 0) return "Today";
			if (diffDays === 1) return "Next tomorrow";
			if (diffDays < 7) return `Next in ${diffDays} days`;

			const diffWeeks = Math.floor(diffDays / 7);
			const remainingDays = diffDays % 7;

			if (remainingDays === 0) return `Next in ${diffWeeks} week${diffWeeks > 1 ? "s" : ""}`;
			return `Next in ${diffWeeks} week${diffWeeks > 1 ? "s" : ""} and ${remainingDays} day${remainingDays > 1 ? "s" : ""}`;
		} else {
			return diffDays >= 0 ? diffDays.toString() : "0";
		}
	}
}

