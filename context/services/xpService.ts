import { Notice } from "obsidian";
// from files (services, default):
import { AppContextService } from "../appContextService";
import { UserSettings } from "data/DEFAULT";
import { DateString } from "helpers/dateHelpers";

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

		const calc = this.computeXpFromTotal(newTotalXP, user.xpDetails.maxLevel);

		// Update XP details based on attributes (source of truth)
		let updatedXpDetails = { ...user.xpDetails };
		if (calc.level > user.xpDetails.maxLevel) {
			updatedXpDetails = {
				...user.xpDetails,
				xp: newTotalXP, // XP = sum of attributes
				newXp: calc.newXp + user.xpDetails.lvlThreshold, // if not the biggest level possible sum of any remaining XP
			};
		} else {
			updatedXpDetails = {
				...user.xpDetails,
				xp: newTotalXP, // XP = sum of attributes
				level: calc.level,
				newXp: calc.newXp,
				lvlThreshold: calc.lvlThreshold,
			};
		}

		await this.appService.updateUserData({
			xpDetails: updatedXpDetails,
			attribute: currentAttributes
		});

		return {
			...user,
			xpDetails: updatedXpDetails,
			attribute: currentAttributes,
		};
	}

	public getDaysUntil(today: DateString, targetDate: DateString, type: 'quest'| 'habit'): string {
		const todayMidnight = new Date(today);
		todayMidnight.setHours(0, 0, 0, 0);
		const targetMidnight = new Date(targetDate);
		targetMidnight.setHours(0, 0, 0, 0);

		const diffDays = Math.ceil((targetMidnight.getTime() - todayMidnight.getTime()) / 86400000);

		if (type === 'quest') {
			return diffDays >= 0 ? diffDays.toString() : "0";
		}

		if (diffDays <= 0) return "Today";
		if (diffDays === 1) return "Next tomorrow";
		if (diffDays < 7) return `Next in ${diffDays} days`;

		const weeks = Math.floor(diffDays / 7);
		const remainingDays = diffDays % 7;

		if (remainingDays === 0) return `Next in ${weeks} week${weeks > 1 ? "s" : ""}`;
		return `Next in ${weeks} week${weeks > 1 ? "s" : ""} and ${remainingDays} day${remainingDays > 1 ? "s" : ""}`;
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
		const newXp = newTotalXP - (user.xpDetails.xp - user.xpDetails.newXp);

		// Recalculate level
		const xpCalc = this.computeXpFromTotal(newTotalXP, user.xpDetails.maxLevel);

		// Update XP details
		const updatedXpDetails = {
			...user.xpDetails,
			xp: newTotalXP,
			newXp: newXp,
			freePts: currentFreePts - pointsToSpend,
		};

		// Save to database
		await this.appService.updateUserData({
			xpDetails: updatedXpDetails,
			attribute: currentAttributes
		});

		return {
			...user,
			xpDetails: updatedXpDetails,
			attribute: currentAttributes,
		};
	}

	public async goNextLevel(user: UserSettings): Promise<Partial<UserSettings>> {
		/* Advances the user to the next level and updates maxLevel */
		const currentMaxLevel = user.xpDetails.maxLevel;
		if (currentMaxLevel === user.xpDetails.level && user.xpDetails.newXp >= user.xpDetails.lvlThreshold) {
			const newMaxLevel = currentMaxLevel + 1;
			console.log("Increasing maxLevel from", currentMaxLevel, "to", newMaxLevel);

			// Recalculate with the updated maxLevel
			const calc = this.computeXpFromTotal(user.xpDetails.xp, newMaxLevel);

			const updatedXpDetails = {
				...user.xpDetails,
				level: calc.level,
				newXp: calc.newXp,
				lvlThreshold: calc.lvlThreshold,
				maxLevel: newMaxLevel,
			};

			await this.appService.updateUserData({
				xpDetails: updatedXpDetails
			});

			return {
				...user,
				xpDetails: updatedXpDetails,
			};
		} else {
			return user;
		}
	}

	private computeXpFromTotal(totalXp: number, maxLevel: number): XpCalc {
		/* Calculates level/newXp/lvlThreshold from total XP.
			maxLevel: if defined, caps the level at this value.
			Returns { totalXp, level, newXp, lvlThreshold }.
		*/
		let total = Math.max(0, Math.trunc(totalXp));
		const baseThreshold = 100;
		let level = 1;
		let threshold = baseThreshold;
		let remaining = total;

		const capLevel = typeof maxLevel === "number" ? Math.max(1, Math.trunc(maxLevel)) : Infinity;

		// Calculate what level the XP would naturally be at
		while (remaining >= threshold && level < capLevel) {
			remaining -= threshold;
			level += 1;
			threshold = Math.floor(threshold * 1.2);
		}

		return {
			totalXp: total,
			level: level,
			newXp: remaining,
			lvlThreshold: threshold,
		};
	}
}

