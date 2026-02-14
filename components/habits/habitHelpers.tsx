import { Notice } from "obsidian";
// from file (services, default):
import { useAppContext } from "../../context/appContext";
import { DEFAULT_HABIT, DEFAULT_CATEGORIES, DefaultCategory, DEFAULT_DIFFICULTIES, DefaultDifficulty, DEFAULT_PRIORITIES, DefaultPriority, Habit, DefaultRecurrence } from "../../data/DEFAULT";
import { AttributeBlock, DEFAULT_ATTRIBUTES } from "data/attributeDetails";
// from file (UI, components):
import { validateValue } from "../forms/UI/formHelpers";

export async function validateAndBuildHabit({
	existingHabit,
	title, shortDescription, description,
	interval, unit,
	category, priority, difficulty,
	attributeRewards,
	appContext
}: {
	existingHabit?: any,
	title: string,
	shortDescription: string,
	description: string,
	interval: number,
	unit: string,
	category: string,
	priority: string,
	difficulty: string,
	attributeRewards: AttributeBlock,
	appContext: ReturnType<typeof useAppContext>
}): Promise<{ habit: Habit | null; errors: { [key: string]: string } }> {
	const errors: { [key: string]: string } = {};

	// Validation
	if (!title.trim()) {
		errors.title = "Title is required.";
	}
	if (!shortDescription.trim()) {
		errors.shortDescription = "Short description is required.";
	}

	if (!interval || isNaN(interval) || interval < 1) {
			errors.interval = "Interval must be a positive number.";
	}
	const user = appContext.getUser();

	// --- Update attributes if category chosen ---
	let updatedAttributes = { ...attributeRewards };
	if (category && category !== (existingHabit?.settings.category || "")) {
		updatedAttributes = updateAttributesByCategory(category, updatedAttributes);
	}

	if (updatedAttributes) {
		const invalidAttributes = Object.entries(updatedAttributes).filter(([attr, xp]) => xp < 0);
		if (invalidAttributes.length > 0) {
			errors.attributeRewards = "Attribute rewards cannot be negative.";
		}
		const sumAttributes = Object.values(updatedAttributes)
			.reduce((sum, val) => sum + val, 0);

		// Base allocation
		const basePoints = 3;
		// XP bonus coming from habit level progression
		const habitXPBonus = existingHabit?.progress?.XP || 0;
		// Base allocation formula
		const baseMax = basePoints * (1 + (user.xpDetails.level || 1) / 10);
		// Final allowed allocation
		const maxAllocation = Math.floor(baseMax + habitXPBonus);

		if (sumAttributes > maxAllocation) {
			errors.attributeRewards =
				`You can't allocate more than ${maxAllocation} points in total.`;
			if (category !== "undefined") {
				errors.attributeRewards += "\nKeep in mind that selecting a category automatically allocates some points.";
			}
		}

	}

	if (Object.keys(errors).length > 0) {
		new Notice("Please fix the errors in the form.");
		if (errors.attributeRewards) {
			new Notice(errors.attributeRewards);
		}
		return { habit: null, errors };
	}


	const newHabit: Habit = {
		...(existingHabit || DEFAULT_HABIT),
		title: title.trim(),
		shortDescription: shortDescription.trim(),
		description: description.trim() || "",
		settings: {
			...((existingHabit?.settings) || DEFAULT_HABIT.settings),
			category: validateValue(category, DEFAULT_CATEGORIES, DEFAULT_HABIT.settings.category as DefaultCategory),
			priority: validateValue(priority, DEFAULT_PRIORITIES, DEFAULT_HABIT.settings.priority as DefaultPriority),
			difficulty: validateValue(difficulty, DEFAULT_DIFFICULTIES, DEFAULT_HABIT.settings.difficulty as DefaultDifficulty),
		},
		recurrence: {
			...existingHabit?.recurrence,
			interval: interval,
			unit: unit as DefaultRecurrence,
		},
		reward: {
			...((existingHabit?.reward) || DEFAULT_HABIT.reward),
			attributes: updatedAttributes,
		}
	};

	return { habit: newHabit, errors: {} };
}


export const updateAttributesByCategory = (category: string, attributes: AttributeBlock): AttributeBlock => {
	const updatedAttributes: AttributeBlock = { ...DEFAULT_ATTRIBUTES, ...attributes };

	switch (category) {
		case 'Physical':
			updatedAttributes.strength += 1;
			updatedAttributes.agility += 1;
			updatedAttributes.endurance += 1;
			break;
		case 'Mental':
			updatedAttributes.wisdom += 1;
			updatedAttributes.perception += 1;
			updatedAttributes.intelligence += 1;
			break;
		case 'Social':
			updatedAttributes.charisma += 1;
			updatedAttributes.intelligence += 1;
			break;
		case 'Creative':
			updatedAttributes.charisma += 1;
			updatedAttributes.perception += 1;
			break;
		case 'Emotional':
			updatedAttributes.wisdom += 1;
			updatedAttributes.charisma += 1;
			break;
		case 'Organizational':
			updatedAttributes.intelligence += 1;
			updatedAttributes.perception += 1;
			break;
		case 'Exploration':
			updatedAttributes.agility += 1;
			updatedAttributes.perception += 1;
			updatedAttributes.intelligence += 1;
			break;
		default:
			break; // No changes for undefined or other categories
	}

	console.log("Updated Attributes by Category:", updatedAttributes);
	return updatedAttributes;
}
