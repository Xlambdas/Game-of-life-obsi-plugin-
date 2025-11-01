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
	private difficulty: UserSettings["settings"]["difficulty"];

	constructor(appService: AppContextService) {
		this.appService = appService;
		this.difficulty = this.appService.getUser().settings.difficulty;
	}

	public async updateXPFromAttributes_old(
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
		const diffMultiplier = { easy: 1.2, normal: 1.0, hard: 0.8, expert: 0.6 }[user.settings.difficulty] as number;

		const currentAttributes = { ...user.attribute };
		const xpMultiplier = { easy: 1.2, normal: 1.0, hard: 0.8, expert: 0.6 }[this.difficulty] as number;

		let addedXP = 0;
		for (const [key, value] of Object.entries(attributes)) {
			if (value !== undefined && typeof value === "number") {
				const xpChange = value * xpMultiplier;
				addedXP += xpChange;

				if (!isCompleted) { // substract attribute
					currentAttributes[key as keyof typeof currentAttributes] =
						Math.max((currentAttributes[key as keyof typeof currentAttributes] ?? 0) - xpChange, 0);
				} else { // add attribute
					currentAttributes[key as keyof typeof currentAttributes] =
						(currentAttributes[key as keyof typeof currentAttributes] ?? 0) + xpChange;
				}
			}
		}
		if (!isCompleted) {
			addedXP = -addedXP;
		}

		// Recalculate the total XP as the sum of all attributes :
		if (isCompleted && addedXP > 0) {
			new Notice(`You gained ${Math.round(addedXP)} XP from attributes!`);
		} else if (!isCompleted && addedXP < 0) {
			new Notice(`You lost ${Math.round(Math.abs(addedXP))} XP from attributes.`);
		}
		const newUser = await this.addXP(user, addedXP);
		const totalAttributeXp = Object.values(currentAttributes)
			.filter(v => typeof v === "number")
			.reduce((acc, val) => acc + (val ?? 0), 0);

		const updatedXpDetails = {
			...newUser.xpDetails,
			xp: totalAttributeXp,
		};

		// 5. Return updated user object (no save)
		return {
			...newUser,
			xpDetails: updatedXpDetails,
			attribute: currentAttributes,
		};
	}

	public async updateXPFromAttributes(
		attributes: Partial<UserSettings["attribute"]>,
		isCompleted: boolean,
		type: 'quest' | 'habit' = 'quest',
		level?: number
	): Promise<UserSettings> {
		/* Update user's attributes based on difficulty and class affinity.
		- XP is always the sum of all attributes (source of truth)
		- Difficulty affects HOW MUCH attributes you gain (harder = less attributes on easy, more on expert)
		- Class affinity gives bonus attributes for aligned skills
		- Awards FREE POINTS based on difficulty and source type
		- All calculations result in INTEGER attributes (no floats)
		*/
		const user = this.appService.getUser();
		if (!user) throw new Error("No user found");

		const currentAttributes = { ...user.attribute };

		// Difficulty modifier: Use percentages (integers) to avoid floats
		const difficultyPercent = {
			easy: 130,       // 130% of attributes (easy to level up)
			normal: 100,    // 100% of attributes (standard)
			hard: 80,      // 80% of attributes (harder to level up)
			expert: 60     // 60% of attributes (big reward)
		}[user.settings.difficulty] ?? 100;

		// Class affinity: bonus percentage for specific attributes (integers)
		const classAffinityPercent = {
			user: {},
			warrior: { strength: 20, endurance: 20, resilience: 10 },      // +20% for main stats
			mage: { intelligence: 20, wisdom: 20, perception: 10 },
			rogue: { agility: 20, perception: 20, charisma: 10 },
			healer: { wisdom: 20, spirit: 20, willpower: 10 },
			scholar: { intelligence: 20, wisdom: 10, perception: 10 },
			bard: { charisma: 20, spirit: 10, flow: 10 },
		};

		const userClass = user.persona?.class || 'user';
		const affinities = classAffinityPercent[userClass as keyof typeof classAffinityPercent] || classAffinityPercent.user;

		let totalAttributeGain = 0;
		let freePointsEarned = 0;

		// Free points based on difficulty and source type
		if (isCompleted) {
			if (type === 'quest') {
				freePointsEarned = {
					easy: 0,
					normal: 1,
					hard: 2,
					expert: 3
				}[user.settings.difficulty] ?? 0;
			} else if (type === 'habit' && level !== undefined) {
				const habitLevelThreshold = {
					easy: 5,        // Level 5+ required for easy
					normal: 3,      // Level 3+ required for normal
					hard: 2,        // Level 2+ required for hard
					expert: 2       // Level 2+ required for expert
				}[this.difficulty] ?? 3;
				if (level >= habitLevelThreshold) {
					// Calculate free points: 1 point per X levels above threshold
					const levelsAboveThreshold = level - habitLevelThreshold;
					freePointsEarned = Math.floor(levelsAboveThreshold / 2) + 1; // 1 point, +1 per 2 levels
				}
			}
		}

		// Process each attribute
		for (const [key, value] of Object.entries(attributes)) {
			if (value !== undefined && typeof value === "number" && value !== 0) {
				const attrKey = key as keyof typeof currentAttributes;

				// 1. Apply difficulty multiplier (percentage-based, rounded to integer)
				let attributeGain = Math.round((value * difficultyPercent) / 100);

				// 2. Apply class affinity bonus (if this attribute matches the class)
				const affinityBonus = affinities[attrKey as keyof typeof affinities] || 0;
				if (affinityBonus > 0) {
					attributeGain = Math.round((attributeGain * (100 + affinityBonus)) / 100);
				}

				// Ensure at least 1 point if original value was positive
				if (value > 0 && attributeGain < 1) {
					attributeGain = 1;
				}
				totalAttributeGain += Math.abs(attributeGain);

				// 3. Update the attribute (always integers)
				if (!isCompleted) {
					// Remove attributes (and thus XP)
					currentAttributes[attrKey] = Math.max(
						(currentAttributes[attrKey] ?? 0) - attributeGain, 0
					);
				} else {
					// Add attributes (and thus XP)
					currentAttributes[attrKey] = (currentAttributes[attrKey] ?? 0) + attributeGain;
				}
			}
		}

		// Calculate NEW total XP from sum of all attributes (always integer)
		const newTotalXP = Math.round(
			Object.values(currentAttributes)
				.filter(v => typeof v === "number")
				.reduce((acc, val) => acc + (val ?? 0), 0)
		);

		// Calculate the XP change
		const oldTotalXP = user.xpDetails.xp || 0;
		const xpChange = newTotalXP - oldTotalXP;

		// Show notice
		if (isCompleted && xpChange > 0) {
			const difficultyText = user.settings.difficulty !== 'normal'
				? ` (${user.settings.difficulty}: ${difficultyPercent}%)`
				: '';
			const classText = userClass !== 'default' && Object.keys(attributes).some(k => affinities[k as keyof typeof affinities])
				? ` 🌟 ${userClass} bonus!`
				: '';
			new Notice(`+${totalAttributeGain} attributes gained! (+${xpChange} XP)${difficultyText}${classText}`);
		} else if (!isCompleted && xpChange < 0) {
			new Notice(`-${totalAttributeGain} attributes lost. (${xpChange} XP)`);
		}

		// Update XP details based on attributes (source of truth)
		const updatedXpDetails = {
			...user.xpDetails,
			xp: newTotalXP, // XP = sum of attributes (already rounded)
		};

		// Calculate level from XP
		const xpCalc = this.computeXpFromTotal(newTotalXP, user.xpDetails.maxLevel);
		updatedXpDetails.level = xpCalc.level;
		updatedXpDetails.newXp = xpCalc.newXp;
		updatedXpDetails.lvlThreshold = xpCalc.lvlThreshold;

		return {
			...user,
			xpDetails: updatedXpDetails,
			attribute: currentAttributes,
		};
	}

	// Helper method to calculate level from XP (you already have this, but ensuring it's used)
	private calculateLevelFromXP(totalXp: number): number {
		const calc = this.computeXpFromTotal(totalXp);
		return calc.level;
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

	public async spendFreePoints(
		attributeKey: keyof UserSettings["attribute"],
		pointsToSpend: number
	): Promise<UserSettings> {
		/* Allow user to manually allocate free points to any attribute.
		- Deducts from freePts
		- Adds to the chosen attribute
		- Updates total XP (since XP = sum of attributes)
		*/
		const user = this.appService.getUser();
		if (!user) throw new Error("No user found");

		const currentFreePts = user.xpDetails.freePts ?? 0;
		
		// Validate
		if (pointsToSpend < 1) {
			new Notice("Must spend at least 1 point.");
			return user;
		}
		
		if (pointsToSpend > currentFreePts) {
			new Notice(`Not enough free points! You have ${currentFreePts} available.`);
			return user;
		}

		// Update attribute
		const currentAttributes = { ...user.attribute };
		currentAttributes[attributeKey] = (currentAttributes[attributeKey] ?? 0) + pointsToSpend;

		// Recalculate total XP from attributes
		const newTotalXP = Math.round(
			Object.values(currentAttributes)
				.filter(v => typeof v === "number")
				.reduce((acc, val) => acc + (val ?? 0), 0)
		);

		// Recalculate level
		const xpCalc = this.computeXpFromTotal(newTotalXP, user.xpDetails.maxLevel);

		// Update XP details
		const updatedXpDetails = {
			...user.xpDetails,
			xp: newTotalXP,
			level: xpCalc.level,
			newXp: xpCalc.newXp,
			lvlThreshold: xpCalc.lvlThreshold,
			freePts: currentFreePts - pointsToSpend,
		};

		// Save to database
		await this.appService.updateUserData({ 
			xpDetails: updatedXpDetails,
			attribute: currentAttributes
		});

		new Notice(`+${pointsToSpend} ${attributeKey}! (${updatedXpDetails.freePts} free points remaining)`);

		return {
			...user,
			xpDetails: updatedXpDetails,
			attribute: currentAttributes,
		};
	}
}

