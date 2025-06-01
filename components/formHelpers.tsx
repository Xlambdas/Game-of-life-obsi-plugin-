import { DescriptionInput, PriorityInput, DifficultyInput,  RequireLevelInput, RequirePreviousQuestsInput, RewardAttributeInput, rewardItemsInput, dueDateInput } from "./inputs";
import type GOL from "../plugin";
import { separator, subTitle, DescriptionHelper } from "./uiHelpers";
import { TextComponent } from "obsidian";
import { StatBlock } from "constants/DEFAULT";

interface SettingsSection {
    priorityInput: PriorityInput;
    difficultyInput: DifficultyInput;
}

interface RequirementsSection {
    requireLevelInput: RequireLevelInput;
    requirePreviousQuestsInput: RequirePreviousQuestsInput;
}

interface RewardsSection {
    rewardAttributeInput: RewardAttributeInput;
    rewardItemsInput: rewardItemsInput;
    rewardXPInput: TextComponent;
}

export const getDescrInput = (container: HTMLElement): DescriptionInput => {
    return new DescriptionInput(container);
};

export const getSettingsInputs = (container: HTMLElement, priority?: string, difficulty?: string): SettingsSection => {
    separator(container);
    subTitle(container, "Settings");
    return {
        priorityInput: new PriorityInput(container, priority),
        difficultyInput: new DifficultyInput(container, difficulty),
    };
};

export const getRequirementsInputs = (container: HTMLElement, plugin: GOL, require_level?: number, require_previousQuests?: string[]): RequirementsSection => {
    separator(container);
    subTitle(container, "Requirements");
    return {
        requireLevelInput: new RequireLevelInput(container, require_level),
        requirePreviousQuestsInput: new RequirePreviousQuestsInput(container, plugin, require_previousQuests)
    };
};

export const getRewardInputs = (container: HTMLElement, plugin: GOL, reward_attribute?: StatBlock, reward_XP?: number): RewardsSection => {
    separator(container);
    subTitle(container, "Rewards");

    return {
        rewardAttributeInput: new RewardAttributeInput(
            container,
            plugin,
            reward_attribute
                ? Object.entries(reward_attribute).map(([attribute, xp]) => ({ attribute, xp }))
                : undefined
        ),
        rewardItemsInput: new rewardItemsInput(container),
        rewardXPInput: createXPRewardInput(container, reward_XP)
    };
};

const createXPRewardInput = (container: HTMLElement, initialValue?: number): TextComponent => { //todo delete this
    const rewardContainer = container.createDiv({ cls: "form-group" });
    rewardContainer.createEl("label", { text: "Bonus XP:" });
	new DescriptionHelper(rewardContainer, "You can add bonus XP. If you complete the quest you can then choose in wich attribute you want to add the bonus XP.");
    const rewardXPInput = new TextComponent(rewardContainer);
    rewardXPInput.setValue("1");
    rewardXPInput.inputEl.setAttribute("type", "number");
    rewardXPInput.inputEl.setAttribute("min", "0");
    rewardXPInput.inputEl.setAttribute("style", "width: 100%;");

	if (initialValue !== undefined) {
		if (isNaN(initialValue) || initialValue < 0) {
			initialValue = 0; // Ensure the value is non-negative
		}
		rewardXPInput.setValue(initialValue.toString());
	}
	return rewardXPInput;
};


export const updateAttributesByCategory = (category: string, attributes: StatBlock): StatBlock => {
	const updatedAttributes: StatBlock = { ...attributes };

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

	return updatedAttributes;
}


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
