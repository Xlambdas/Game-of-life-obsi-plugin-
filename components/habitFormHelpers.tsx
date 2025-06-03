import { Habit, DefaultPriority, DefaultDifficulty } from "../constants/DEFAULT";
import { TextComponent } from "obsidian";
import { RewardAttributeInput, RewardItemsInput, dueDateInput } from "../components/inputs";

export interface HabitFormData {
	title: string;
	shortDescription: string;
	description: string;
	reward_XP: number;
	require_level: number;
	require_previousQuests: string | string[];
	priority: DefaultPriority;
	difficulty: DefaultDifficulty;
	category: string;
	attributeRewards: any;
	recurrence_interval: number;
	recurrence_unit: string;
	habitId?: string;
}

export interface FormInputs {
	titleInput: { getValue: () => string };
	shortDescriptionInput: { getValue: () => string };
	descriptionInput?: { getValue: () => string };
	rewardXPInput?: { getValue: () => string };
	rewardItemsInput?: { getValue: () => string };
	requireLevelInput?: { getValue: () => number };
	requirePreviousQuestsInput?: { getValue: () => string[] | string };
	priorityInput?: { getValue: () => string };
	difficultyInput?: { getValue: () => string };
	categoryInput?: { getValue: () => string };
	rewardAttributeInput?: { getStatBlock?: () => any };
	dueDateInput?: { getValue: () => Date | undefined };
}

export interface RewardsSection {
	rewardAttributeInput: RewardAttributeInput;
	rewardItemsInput: RewardItemsInput;
	rewardXPInput: TextComponent;
	dueDateInput: dueDateInput;
}


export type EndButtonDeps = {
	version: "create" | "edit";
	contentEl: HTMLElement;
	onSubmit: () => Promise<void>;
	onCancel?: () => void;
	onDelete?: () => Promise<void>;
};

export const createHabitFromFormData = (formData: HabitFormData): Omit<Habit, 'id'> => {
	const { title, shortDescription, description, reward_XP, require_level, require_previousQuests, difficulty, category, priority, attributeRewards, recurrence_interval, recurrence_unit } = formData;

	return {
		title,
		shortDescription,
		description,
		created_at: new Date(),
		settings: {
			type: 'habit',
			priority: priority as "low" | "medium" | "high",
			difficulty: difficulty as "easy" | "medium" | "hard" | "expert",
			category: category || "Undefined",
			isSecret: false,
			isTimeSensitive: false
		},
		recurrence: {
			interval: recurrence_interval,
			unit: recurrence_unit as "day" | "week" | "month"
		},
		streak: {
			current: 0,
			best: 0,
			history: [],
			isCompletedToday: false,
			nextDate: new Date()
		},
		penalty: {
			XPLoss: 0,
			breackStreak: false
		},
		reward: {
			XP: 0,
			attributes: {
				strength: 0,
				agility: 0,
				endurance: 0,
				charisma: 0,
				wisdom: 0,
				perception: 0,
				intelligence: 0
			}
		}
	};
};

export const validateHabitFormData = (formData: HabitFormData): string | null => {
	const { title, shortDescription, reward_XP, require_level } = formData;

	if (!title) {
		return "Habit title is required!";
	}
	if (!shortDescription) {
		return "Short description is required!";
	}
	if (isNaN(reward_XP) || reward_XP < 0) {
		return "XP reward must be a positive number!";
	}
	if (require_level < 0) {
		return "Level must be a positive number!";
	}

	return null;
};

export function getFormData(inputs: {
	titleInput: { getValue: () => string };
	shortDescriptionInput: { getValue: () => string };
	descriptionInput?: { getValue: () => string };
	rewardXPInput?: { getValue: () => string };
	rewardItemsInput?: { getValue: () => string };
	requireLevelInput?: { getValue: () => number };
	requirePreviousQuestsInput?: { getValue: () => string[] | string };
	priorityInput?: { getValue: () => string };
	difficultyInput?: { getValue: () => string };
	categoryInput?: { getValue: () => string };
	rewardAttributeInput?: { getStatBlock?: () => any };
	recurrenceIntervalInput?: { getValue: () => number };
	recurrenceUnitInput?: { getValue: () => string };
}) {
	const formData = {
		title: inputs.titleInput.getValue().trim(),
		shortDescription: inputs.shortDescriptionInput.getValue().trim(),
		description: inputs.descriptionInput?.getValue()?.trim() || "",
		reward_XP: inputs.rewardXPInput ? parseInt(inputs.rewardXPInput.getValue()) || 0 : 0,
		require_level: inputs.requireLevelInput ? inputs.requireLevelInput.getValue() || 0 : 0,
		require_previousQuests: inputs.requirePreviousQuestsInput ? inputs.requirePreviousQuestsInput.getValue() : "",
		priority: inputs.priorityInput?.getValue() || "low",
		difficulty: inputs.difficultyInput?.getValue() || "easy",
		category: inputs.categoryInput?.getValue() || "",
		attributeRewards: inputs.rewardAttributeInput?.getStatBlock?.() || {
			strength: 0,
			agility: 0,
			endurance: 0,
			charisma: 0,
			wisdom: 0,
			perception: 0,
			intelligence: 0
		},
		recurrence_interval: inputs.recurrenceIntervalInput ? inputs.recurrenceIntervalInput.getValue() : 1,
		recurrence_unit: inputs.recurrenceUnitInput ? inputs.recurrenceUnitInput.getValue() : "day"
	};
	return formData;
}
