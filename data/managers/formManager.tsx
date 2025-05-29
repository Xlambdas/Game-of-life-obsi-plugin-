import { App, TextComponent, ToggleComponent } from 'obsidian';
import GOL from '../../plugin';
import { TitleInput, ShortDescriptionInput, DescriptionInput, rewardItemsInput, DifficultyInput, RequireLevelInput, RequirePreviousQuestsInput, PriorityInput, CategoryInput, RewardAttributeInput, dueDateInput  } from '../../components/inputs';
import { separator, titleSection } from 'components/uiHelpers';
import { getDescrInput, getSettingsInputs, getRequirementsInputs, getRewardInputs } from 'components/formHelpers';
import { QuestFormData } from '../../types/quest';
import { Quest } from '../../constants/DEFAULT';


export class QuestFormManager {
	private titleInput: TitleInput;
	private shortDescriptionInput: ShortDescriptionInput;
	private descriptionInput: DescriptionInput;
	private rewardXPInput: TextComponent;
	private rewardItemsInput: rewardItemsInput;
	private difficultyInput: DifficultyInput;
	private requireLevelInput: RequireLevelInput;
	private requirePreviousQuestsInput: RequirePreviousQuestsInput;
	private priorityInput: PriorityInput;
	private categoryInput: CategoryInput;
	private rewardAttributeInput: RewardAttributeInput;
	private dueDateInput: dueDateInput;

	constructor(
		container: HTMLElement,
		header: HTMLElement | null,
		plugin: GOL,
		existingQuest?: Quest) {
		// Create form container
		const form = container.createDiv({ cls: "quest-form" });
		
		// normal mode
		this.titleInput = new TitleInput(form, existingQuest?.title);
		this.shortDescriptionInput = new ShortDescriptionInput(form, existingQuest?.shortDescription);
		this.categoryInput = new CategoryInput(form, plugin, existingQuest?.settings.category);

		// advanced mode
		const advancedContainer = form.createDiv({ cls: "advanced-mode" });
		if (!header) {
			console.error("Header container not found");
			return;
		}

		new ToggleComponent(header)
			.setTooltip("Show/hide supplementary settings")
			.setValue(false)
			.onChange((value) => {
				if (value) {
					this.showAdvancedMode(advancedContainer, plugin, existingQuest);
				} else {
					advancedContainer.empty();
				}
			});
	}

	showAdvancedMode(container: HTMLElement, plugin: GOL, existingQuest?: Quest) {
		separator(container);
		titleSection(container, "Supplementary Settings");
		this.descriptionInput = new DescriptionInput(container, existingQuest?.description);
		const { priorityInput, difficultyInput } = getSettingsInputs(
			container, 
			existingQuest?.settings.priority, 
			existingQuest?.settings.difficulty
		);
		this.priorityInput = priorityInput;
		this.difficultyInput = difficultyInput;

		// Convert dueDate string to Date object if it exists
		let dueDate: Date | undefined = undefined;
		if (existingQuest?.progression.dueDate) {
			dueDate = new Date(existingQuest.progression.dueDate);
		}
		this.dueDateInput = new dueDateInput(container, dueDate);

		const {requireLevelInput , requirePreviousQuestsInput } = getRequirementsInputs(
			container, 
			plugin, 
			existingQuest?.requirements.level,
			existingQuest?.requirements.previousQuests
		);
		this.requireLevelInput = requireLevelInput;
		this.requirePreviousQuestsInput = requirePreviousQuestsInput;
		const { rewardAttributeInput, rewardItemsInput, rewardXPInput } = getRewardInputs(
			container, 
			plugin, 
			existingQuest?.reward.attributes,
			existingQuest?.reward.XP
		);
		this.rewardAttributeInput = rewardAttributeInput;
		this.rewardItemsInput = rewardItemsInput;
		this.rewardXPInput = rewardXPInput;
	}

	public getFormData(): QuestFormData {
		const formData: QuestFormData = {
			title: this.titleInput.getValue().trim(),
			shortDescription: this.shortDescriptionInput.getValue().trim(),
			description: "",
			reward_XP: 0,
			require_level: 0,
			require_previousQuests: [],
			priority: "normal",
			difficulty: "easy",
			category: this.categoryInput.getValue() || "general",
			attributeRewards: {},
			dueDate: undefined
		};

		// Only get values from advanced mode inputs if they exist
		if (this.descriptionInput) {
			formData.description = this.descriptionInput.getValue().trim();
		}
		if (this.rewardXPInput) {
			formData.reward_XP = parseInt(this.rewardXPInput.getValue()) || 0;
		}
		if (this.requireLevelInput) {
			formData.require_level = this.requireLevelInput.getValue() || 0;
		}
		if (this.requirePreviousQuestsInput) {
			formData.require_previousQuests = this.requirePreviousQuestsInput.getValue() || [];
		}
		if (this.priorityInput) {
			formData.priority = this.priorityInput.getValue() || "normal";
		}
		if (this.difficultyInput) {
			formData.difficulty = this.difficultyInput.getValue() || "easy";
		}
		if (this.rewardAttributeInput) {
			formData.attributeRewards = this.rewardAttributeInput.getStatBlock() || {};
		}
		if (this.dueDateInput) {
			formData.dueDate = this.dueDateInput.getValue();
		}

		return formData;
	}
}
