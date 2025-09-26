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

export function computeXpFromTotal(totalXp: number, maxLevel?: number): XpCalc {
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


export async function addXP(
	appService: AppContextService,
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

	const calc = computeXpFromTotal(newTotal, maxLevel);

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
	await appService.updateUserData({ xpDetails: updatedXpDetails });

	const updatedUser: UserSettings = {
		...user,
		xpDetails: updatedXpDetails,
	};

	return updatedUser;
}


export async function normalizeUserXpOnLoad(appService: AppContextService): Promise<void> {
	/* load the user from appService, recalcule et persiste ses xpDetails si incohérence détectée.
		Utilisé au chargement de l'app pour corriger d'éventuelles erreurs.
	*/
	const user = appService.getUser();
	if (!user) return;

	const xpTotal = Math.max(0, user.xpDetails?.xp ?? 0);
	const maxLevel = user.xpDetails?.maxLevel;
	const calc = computeXpFromTotal(xpTotal, maxLevel);

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
		await appService.updateUserData({ xpDetails: updated });
	}
}

