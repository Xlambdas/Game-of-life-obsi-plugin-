import {  } from "../inputs";
import type GOL from "../../plugin";
import { separator, subTitle, DescriptionHelper } from "../UIHelpers";
import { TextComponent } from "obsidian";
import { AttributeBlock } from "data/DEFAULT";
import { PriorityInput, DifficultyInput } from "../inputs";

export type EndButtonDeps = {
	version: "create" | "edit";
	contentEl: HTMLElement;
	onSubmit: () => Promise<void>;
	onCancel?: () => void;
	onDelete?: () => Promise<void>;
};


export const getSettingsInputs = (container: HTMLElement, priority?: string, difficulty?: string): { priorityInput: PriorityInput; difficultyInput: DifficultyInput } => {
    separator(container);
    subTitle(container, "Settings");
    return {
        priorityInput: new PriorityInput(container, priority),
        difficultyInput: new DifficultyInput(container, difficulty),
    };
};



// export const getRewardInputs = (container: HTMLElement, plugin: GOL, reward_attribute?: AttributeBlock, reward_XP?: number): RewardsSection => {
//     separator(container);
//     subTitle(container, "Rewards");

//     return {
//         rewardAttributeInput: new RewardAttributeInput(
//             container,
//             plugin,
//             reward_attribute
//                 ? Object.entries(reward_attribute).map(([attribute, xp]) => ({ attribute, xp }))
//                 : undefined
//         ),
//         rewardItemsInput: new RewardItemsInput(container),
//         rewardXPInput: createXPRewardInput(container, reward_XP)
//     };
// };
