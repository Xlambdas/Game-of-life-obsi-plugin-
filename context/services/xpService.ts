import { AppContextService } from "../appContextService";
import { UserSettings } from "data/DEFAULT";
import { Notice } from "obsidian";

export interface XpCalc {
	totalXp: number;
	level: number;
	newXp: number;
	lvlThreshold: number;
}

export function computeXpFromTotal(totalXp: number, maxLevel?: number): XpCalc {
	// sécurité
	let total = Math.max(0, Math.trunc(totalXp)); // entier >= 0
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

	// Si on a atteint le niveau max, on plafonne newXp pour l'affichage
	if (level >= capLevel) {
		// remaining peut être énorme si totalXp >= somme thresholds ; on plafonne l'affichage
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

/**
 * Ajoute amount (peut être négatif) au total XP de l'utilisateur,
 * recalcule level/newXp/lvlThreshold à partir du total et persiste.
 */
export async function addXP(
	appService: AppContextService,
	user: UserSettings,
	amount: number
): Promise<UserSettings> {
	const currentXp = Math.max(0, user.xpDetails?.xp ?? 0);
	const maxLevel = user.xpDetails?.maxLevel;
	const newTotal = Math.max(0, currentXp + Math.trunc(amount));

	const calc = computeXpFromTotal(newTotal, maxLevel);

	// notification de level-up (comparaison avant / après)
	const prevLevel = user.xpDetails?.level ?? 1;
	if (calc.level > prevLevel) {
		new Notice(`🎉 Félicitations — niveau ${calc.level} atteint !`);
	}

	const updatedXpDetails = {
		...user.xpDetails,
		xp: calc.totalXp,
		level: calc.level,
		newXp: calc.newXp,
		lvlThreshold: calc.lvlThreshold,
	};

	// Persister uniquement xpDetails (moins risqué que de réécrire tout l'objet user)
	await appService.updateUserData({ xpDetails: updatedXpDetails });

	const updatedUser: UserSettings = {
		...user,
		xpDetails: updatedXpDetails,
	};

	return updatedUser;
}


/** Normalise xpDetails d'un user (réécrit xpDetails en cohérence avec xp total). */
export async function normalizeUserXpOnLoad(appService: AppContextService): Promise<void> {
	const user = appService.getUser();
	if (!user) return;

	const xpTotal = Math.max(0, user.xpDetails?.xp ?? 0);
	const maxLevel = user.xpDetails?.maxLevel;
	const calc = computeXpFromTotal(xpTotal, maxLevel);

	// Si incohérence (ex: newXp négatif ou level mismatch), on persist la version calculée
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
		// Optionnel : mettre à jour l'instance user en mémoire si nécessaire
	}
}

