import type { Plugin } from "obsidian";
import { Notice, ButtonComponent } from "obsidian";
import { Quest, StatBlock } from "../constants/DEFAULT";
import { QuestFormData, FormInputs } from "../types/quest";

export type EndButtonDeps = {
	version: "create" | "edit";
	contentEl: HTMLElement;
	onSubmit: () => Promise<void>;
	onCancel?: () => void;
	onDelete?: () => Promise<void>;
};

export const createQuestFromFormData = (formData: QuestFormData): Omit<Quest, 'id'> => {
	const { title, shortDescription, description, reward_XP, require_level, require_previousQuests, difficulty, category, priority, attributeRewards } = formData;

	return {
		title,
		shortDescription,
		description,
		created_at: new Date(),
		reward: {
			XP: reward_XP,
			attributes: {
				strength: attributeRewards.strength || 0,
				agility: attributeRewards.agility || 0,
				endurance: attributeRewards.endurance || 0,
				charisma: attributeRewards.charisma || 0,
				wisdom: attributeRewards.wisdom || 0,
				perception: attributeRewards.perception || 0,
				intelligence: attributeRewards.intelligence || 0
			}
		},
		settings: {
			type: 'quest',
			priority: priority as "low" | "medium" | "high",
			difficulty: difficulty as "easy" | "medium" | "hard" | "expert",
			category: category || "Other",
			isSecret: false,
			isTimeSensitive: false
		},
		progression: {
			isCompleted: false,
			completed_at: new Date(0),
			progress: 0,
			subtasks: []
		},
		requirements: {
			level: require_level,
			previousQuests: Array.isArray(require_previousQuests) ? require_previousQuests : [],
			stats: {
				strength: 0,
				agility: 0,
				endurance: 0,
				charisma: 0,
				wisdom: 0,
				perception: 0,
				intelligence: 0
			}
		},
		isSystemQuest: false
	};
};

export const validateQuestFormData = (formData: QuestFormData): string | null => {
	const { title, shortDescription, reward_XP, require_level } = formData;

	if (!title) {
		return "Quest title is required!";
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
	dueDateInput?: { getValue: () => Date | undefined };
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
		dueDate: inputs.dueDateInput?.getValue(),
		attributeRewards: inputs.rewardAttributeInput?.getStatBlock?.() || {
			strength: 0,
			agility: 0,
			endurance: 0,
			charisma: 0,
			wisdom: 0,
			perception: 0,
			intelligence: 0
		}
	};
	return formData;
}
