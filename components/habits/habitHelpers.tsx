import { Notice } from "obsidian";
// from file (services, default):
import { useAppContext } from "../../context/appContext";
import { DEFAULT_HABIT, DEFAULT_CATEGORIES, DefaultCategory, DEFAULT_DIFFICULTIES, DefaultDifficulty, DEFAULT_PRIORITIES, DefaultPriority, Habit, DefaultRecurrence } from "../../data/DEFAULT";
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
	attributeRewards: { attribute: string; xp: number; }[],
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

	if (Object.keys(errors).length > 0) {
		new Notice("Please fix the errors in the form.");
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
			attributes: attributeRewards,
		}
	};

	if (existingHabit) {
		await appContext.updateHabit(newHabit);
	} else {
		await appContext.addHabit(newHabit);
	}

	return { habit: newHabit, errors: {} };
}
