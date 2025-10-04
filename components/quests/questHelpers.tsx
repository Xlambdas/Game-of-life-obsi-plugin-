import { Notice } from "obsidian";
// from file (services, default):
import { useAppContext } from "../../context/appContext";
import { DEFAULT_QUEST, DEFAULT_CATEGORIES, DefaultCategory, DEFAULT_DIFFICULTIES, DefaultDifficulty, DEFAULT_PRIORITIES, DefaultPriority, Quest } from "../../data/DEFAULT";
// from file (UI, components):
import { validateValue } from "../forms/UI/formHelpers";

export async function validateAndBuildQuest({
	existingQuest,
	title, shortDescription, description,
	category, priority, difficulty,
	dueDate, levelMin, attributeRewards,
	appContext
}: {
	existingQuest?: any,
	title: string,
	shortDescription: string,
	description: string,
	category: string,
	priority: string,
	difficulty: string,
	dueDate: Date | undefined,
	levelMin: number,
	attributeRewards: { attribute: string; xp: number; }[],
	appContext: ReturnType<typeof useAppContext>
}): Promise<{ quest: Quest | null; errors: { [key: string]: string } }> {
	const errors: { [key: string]: string } = {};

	// Validation
	if (!title.trim()) {
		errors.title = "Title is required.";
	}
	if (!shortDescription.trim()) {
		errors.shortDescription = "Short description is required.";
	}
	if (dueDate) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const dueDateObj = new Date(dueDate);
		dueDateObj.setHours(0, 0, 0, 0);
		if (dueDateObj < today) {
			errors.dueDate = "Due date must be today or in the future.";
		}
	}
	if (levelMin < 1) {
		errors.levelMin = "Level must be at least 1.";
	}

	if (Object.keys(errors).length > 0) {
		new Notice("Please fix the errors in the form.");
		return { quest: null, errors };
	}

	const newQuest: Quest = {
		...(existingQuest || DEFAULT_QUEST),
		title: title.trim(),
		shortDescription: shortDescription.trim(),
		description: description.trim() || "",
		settings: {
			...((existingQuest?.settings) || DEFAULT_QUEST.settings),
			category: validateValue(category, DEFAULT_CATEGORIES, DEFAULT_QUEST.settings.category as DefaultCategory),
			priority: validateValue(priority, DEFAULT_PRIORITIES, DEFAULT_QUEST.settings.priority as DefaultPriority),
			difficulty: validateValue(difficulty, DEFAULT_DIFFICULTIES, DEFAULT_QUEST.settings.difficulty as DefaultDifficulty),
			isTimeSensitive: !!dueDate,
		},
		progression: {
			...((existingQuest?.progression) || DEFAULT_QUEST.progression),
			dueDate: dueDate ? new Date(dueDate) : undefined,
			lastUpdated: new Date(),
		},
		requirements: {
			...((existingQuest?.requirements) || DEFAULT_QUEST.requirements),
			level: Math.max(levelMin, 1),
		},
		reward: {
			...((existingQuest?.reward) || DEFAULT_QUEST.reward),
			attributes: attributeRewards,
		}
	};

	if (existingQuest) {
		await appContext.updateQuest(newQuest);
	} else {
		await appContext.addQuest(newQuest);
	}

	return { quest: newQuest, errors: {} };
}
