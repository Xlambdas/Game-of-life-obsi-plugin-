import { TextComponent } from "obsidian";
import { RewardAttributeInput, rewardItemsInput, dueDateInput } from "../components/inputs";

export interface QuestFormData {
	title: string;
	shortDescription: string;
	description: string;
	reward_XP: number;
	require_level: number;
	require_previousQuests: string | string[];
	priority: string;
	difficulty: string;
	category: string;
	attributeRewards: any;
	dueDate?: Date;
	questId?: string;
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
	rewardItemsInput: rewardItemsInput;
	rewardXPInput: TextComponent;
	dueDateInput: dueDateInput;
} 
