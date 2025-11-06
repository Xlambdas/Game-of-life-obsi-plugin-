import { Notice } from "obsidian";
// from file (services, default):
import { useAppContext } from "../../context/appContext";
import { DEFAULT_QUEST, DEFAULT_CATEGORIES, DefaultCategory, DEFAULT_DIFFICULTIES, DefaultDifficulty, DEFAULT_PRIORITIES, DefaultPriority, Quest } from "../../data/DEFAULT";
import { AttributeBlock } from "data/attributeDetails";
// from file (UI, components):
import { validateValue } from "../forms/UI/formHelpers";
import { updateAttributesByCategory } from "components/habits/habitHelpers";

export async function validateAndBuildQuest({
	existingQuest,
	title, shortDescription, description,
	category, priority, difficulty,
	dueDate, levelMin, reqQuests, condQuests, condHabits, attributeRewards,
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
	reqQuests: { id: string, title: string }[] | null,
	condQuests: { id: string, title: string, targetProgress: number }[] | null,
	condHabits: { id: string, title: string, targetStreak: number }[] | null,
	attributeRewards: AttributeBlock,
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
	if (condQuests) {
		const invalidCondQuests = condQuests.filter(cq =>
			!cq.id ||
			typeof cq.targetProgress !== "number" ||
			!Number.isFinite(cq.targetProgress) ||
			cq.targetProgress < 1 ||
			cq.targetProgress > 100
		);
		if (invalidCondQuests.length > 0) {
			errors.condQuests = "All condition quests must be selected and have a target progress between 1 and 100.";
		}
	}

	if (condHabits) {
		const invalidCondHabits = condHabits.filter(ch =>
			!ch.id ||
			typeof ch.targetStreak !== "number" ||
			!Number.isFinite(ch.targetStreak) ||
			ch.targetStreak < 1
		);
		if (invalidCondHabits.length > 0) {
			errors.condHabits = "All condition habits must be selected and have a target streak of at least 1.";
		}
	}

	// Get user for attribute reward validation
	const user = appContext.getUser();
	console.log("requirements prerequisiteQuest", reqQuests);

	// --- Update attributes if category chosen ---
	let updatedAttributes = { ...attributeRewards };
	if (category && category !== (existingQuest?.settings.category || "")) {
		updatedAttributes = updateAttributesByCategory(category, updatedAttributes);
	}

	if (updatedAttributes) {
		const invalidAttributes = Object.entries(updatedAttributes).filter(([attr, xp]) => xp < 0);
		if (invalidAttributes.length > 0) {
			errors.attributeRewards = "Attribute rewards cannot be negative.";
		}
		const sumAttributes = Object.values(updatedAttributes).reduce((sum, val) => sum + val, 0);
		if (sumAttributes > (10 * (1 + (user.xpDetails.level || 1) / 10))) {
			errors.attributeRewards = `You can't allocate more than ${10 * (1 + (user.xpDetails.level || 1) / 10)} points in total.`;
			if (category) {
				errors.attributeRewards += "\n Keep in mind that selecting a category automatically allocates some points.";
			}
		}
	}

	if (Object.keys(errors).length > 0) {
		new Notice("Please fix the errors in the form.");
		if (errors.attributeRewards) {
			new Notice(errors.attributeRewards);
		}
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
			subtasks: {
				...((existingQuest?.progression.subtasks) || DEFAULT_QUEST.progression.subtasks),
				conditionQuests: condQuests && condQuests.length > 0 ? condQuests : [],
				conditionHabits: condHabits && condHabits.length > 0 ? condHabits : [],
			},
		},
		requirements: {
			...((existingQuest?.requirements) || DEFAULT_QUEST.requirements),
			level: Math.max(levelMin, 1),
			previousQuests: reqQuests && reqQuests.length > 0 ? reqQuests : [],
		},
		reward: {
			...((existingQuest?.reward) || DEFAULT_QUEST.reward),
			attributes: updatedAttributes,
		}
	};

	return { quest: newQuest, errors: {} };
}
