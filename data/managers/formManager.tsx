import { App, Notice, TextComponent, ToggleComponent } from 'obsidian';
import GOL from '../../plugin';
import { TitleInput, ShortDescriptionInput, DescriptionInput, RewardItemsInput, DifficultyInput, RequireLevelInput, RequirePreviousQuestsInput, PriorityInput, CategoryInput, RewardAttributeInput, dueDateInput, RecurrenceIntervalInput, RecurrenceUnitInput  } from '../../components/inputs';
import { separator, titleSection } from 'components/uiHelpers';
import { getSettingsInputs, getRequirementsInputs, getRewardInputs, QuestFormData, getRecurrenceInputs } from 'components/formHelpers';
import { HabitFormData } from 'components/habitFormHelpers';
import { Quest, Habit, DefaultPriority, DefaultDifficulty } from '../../constants/DEFAULT';


export class QuestFormManager {
	private titleInput: TitleInput;
	private shortDescriptionInput: ShortDescriptionInput;
	private descriptionInput: DescriptionInput;
	private rewardXPInput: TextComponent;
	private rewardItemsInput: RewardItemsInput;
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
		const form = container.createDiv({ cls: "form" });
		
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
			category: this.categoryInput.getValue() || "undefined",
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
	public validateForm(formData: QuestFormData): boolean {
		const { title, shortDescription, reward_XP, require_level } = formData;

		if (!title) {
			new Notice("Quest title is required!");
			return false;
		}
		if (!shortDescription) {
			new Notice("Short description is required!");
			return false;
		}
		if (isNaN(reward_XP) || reward_XP < 0) {
			new Notice("XP reward must be a positive number!");
			return false;
		}
		if (require_level < 0) {
			new Notice("Level must be a positive number!");
			return false;
		}

		return true;
	}
}



export class HabitFormManager {
	private titleInput: TitleInput;
	private shortDescriptionInput: ShortDescriptionInput;
	private descriptionInput: DescriptionInput;
	private rewardItemsInput: RewardItemsInput;
	private difficultyInput: DifficultyInput;
	private requireLevelInput: RequireLevelInput;
	private requirePreviousQuestsInput: RequirePreviousQuestsInput;
	private priorityInput: PriorityInput;
	private categoryInput: CategoryInput;
	private rewardAttributeInput: RewardAttributeInput;
	private dueDateInput: dueDateInput;
	private recurrenceIntervalInput: RecurrenceIntervalInput;
	private recurrenceUnitInputs: RecurrenceUnitInput;


	constructor(
		container: HTMLElement,
		header: HTMLElement | null,
		plugin: GOL,
		existingHabit?: Habit) {
		// Create form container
		const form = container.createDiv({ cls: "form" });
		
		// normal mode
		this.titleInput = new TitleInput(form, existingHabit?.title);
		this.shortDescriptionInput = new ShortDescriptionInput(form, existingHabit?.shortDescription);
		this.categoryInput = new CategoryInput(form, plugin, existingHabit?.settings.category);
		const { intervalInput, unitInput } = getRecurrenceInputs(
			form,
			existingHabit?.recurrence.unit,
			existingHabit?.recurrence.interval
		);
		this.recurrenceIntervalInput = intervalInput;
		this.recurrenceUnitInputs = unitInput;


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
					this.showAdvancedMode(advancedContainer, plugin, existingHabit);
				} else {
					advancedContainer.empty();
				}
			});
	}
	showAdvancedMode(container: HTMLElement, plugin: GOL, existingHabit?: Habit) {
		separator(container);
		titleSection(container, "Supplementary Settings");
		this.descriptionInput = new DescriptionInput(container, existingHabit?.description);
		const { priorityInput, difficultyInput } = getSettingsInputs(
			container,
			existingHabit?.settings.priority,
			existingHabit?.settings.difficulty
		);
		this.priorityInput = priorityInput;
		this.difficultyInput = difficultyInput;

		const { requireLevelInput, requirePreviousQuestsInput } = getRequirementsInputs(container, plugin);
		this.requireLevelInput = requireLevelInput;
		this.requirePreviousQuestsInput = requirePreviousQuestsInput;

	}
	public getFormData(): HabitFormData {
		const formData: HabitFormData = {
			title: this.titleInput.getValue().trim(),
			shortDescription: this.shortDescriptionInput.getValue().trim(),
			description: "",
			reward_XP: 0,
			require_level: 0,
			require_previousQuests: [],
			priority: (this.priorityInput?.getValue() || "low") as DefaultPriority,
			difficulty: (this.difficultyInput?.getValue() || "easy") as DefaultDifficulty,
			category: this.categoryInput.getValue() || "undefined",
			attributeRewards: {},
			recurrence_interval: this.recurrenceIntervalInput.getValue() || 1,
			recurrence_unit: (this.recurrenceUnitInputs.getValue() || "day") as "day" | "week" | "month"
		};

		// Only get values from advanced mode inputs if they exist
		if (this.descriptionInput) {
			formData.description = this.descriptionInput.getValue().trim();
		}
		if (this.requireLevelInput) {
			formData.require_level = this.requireLevelInput.getValue() || 0;
		}
		if (this.requirePreviousQuestsInput) {
			formData.require_previousQuests = this.requirePreviousQuestsInput.getValue() || [];
		}

		return formData;
	}

	public validateForm(formData: HabitFormData): boolean {
		const { title, shortDescription, recurrence_interval } = formData;

		if (!title) {
			new Notice("Habit title is required!");
			return false;
		}
		if (!shortDescription) {
			new Notice("Short description is required!");
			return false;
		}
		if (typeof recurrence_interval !== "number" || isNaN(recurrence_interval) || recurrence_interval < 1) {
			new Notice("Recurrence interval must be a positive number!");
			return false;
		}

		return true;
	}
}
