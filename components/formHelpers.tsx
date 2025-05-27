import { ButtonComponent, Notice } from "obsidian";
import { Quest } from "../constants/DEFAULT";
import { DescriptionInput, PriorityInput, DifficultyInput, dueDateInput, RequireLevelInput, RequirePreviousQuestsInput, RewardAttributeInput, rewardItemsInput } from "./inputs";
import type GOL from "../plugin";
import { separator, titleSection, subTitle, DescriptionHelper } from "./uiHelpers";
import { TextComponent } from "obsidian";

interface SettingsSection {
    priorityInput: PriorityInput;
    difficultyInput: DifficultyInput;
    dueDateInput: dueDateInput;
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

export const getSettingsInputs = (container: HTMLElement): SettingsSection => {
    separator(container);
    subTitle(container, "Settings");
    return {
        priorityInput: new PriorityInput(container),
        difficultyInput: new DifficultyInput(container),
        dueDateInput: new dueDateInput(container)
    };
};

export const getRequirementsInputs = (container: HTMLElement, plugin: GOL): RequirementsSection => {
    separator(container);
    subTitle(container, "Requirements");
    return {
        requireLevelInput: new RequireLevelInput(container),
        requirePreviousQuestsInput: new RequirePreviousQuestsInput(container, plugin)
    };
};

export const getRewardInputs = (container: HTMLElement, plugin: GOL): RewardsSection => {
    separator(container);
    subTitle(container, "Rewards");

    return {
        rewardAttributeInput: new RewardAttributeInput(container, plugin),
        rewardItemsInput: new rewardItemsInput(container),
        rewardXPInput: createXPRewardInput(container)
    };
};

const createXPRewardInput = (container: HTMLElement): TextComponent => { //todo delete this
    const rewardContainer = container.createDiv({ cls: "form-group" });
    rewardContainer.createEl("label", { text: "Bonus XP:" });
	new DescriptionHelper(rewardContainer, "You can add bonus XP. If you complete the quest you can then choose in wich attribute you want to add the bonus XP.");
    const rewardXPInput = new TextComponent(rewardContainer);
    rewardXPInput.setValue("1");
    rewardXPInput.inputEl.setAttribute("type", "number");
    rewardXPInput.inputEl.setAttribute("min", "0");
    rewardXPInput.inputEl.setAttribute("style", "width: 100%;");
    return rewardXPInput;
};
