import { App, Modal, Notice, ToggleComponent } from "obsidian";
import { TextComponent, ButtonComponent } from "obsidian";
import GOL from "../plugin";
import { Quest, StatBlock } from '../constants/DEFAULT';
import { viewSyncService } from '../services/syncService';
import { TitleInput, ShortDescriptionInput, DescriptionInput, CategoryInput, PriorityInput, DifficultyInput, RequireLevelInput, RequirePreviousQuestsInput, RewardAttributeInput, rewardItemsInput, dueDateInput } from "../components/inputs";
import { separator, createHeader, titleSection, subTitle } from "../components/uiHelpers";
import { endButton } from "../components/questUI";
import { getDescrInput, getSettingsInputs, getRequirementsInputs, getRewardInputs } from "components/formHelpers";
import { create } from "domain";
import { getFormData } from "components/questHelpers";

// Version : cursor

interface RewardsSection {
	rewardAttributeInput: RewardAttributeInput;
	rewardItemsInput: rewardItemsInput;
	rewardXPInput: TextComponent;
	dueDateInput: dueDateInput;
}

export class CreateQuestModal extends Modal {
	private plugin: GOL;
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

	constructor(app: App, plugin: GOL) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		createHeader(contentEl, 'Create New Quest');
		const mainContainer = this.createMainContainer(contentEl);
		this.createAdvancedModeToggle(contentEl, mainContainer);
		this.createEndButtons(contentEl);
	}

	onClose() {
		this.contentEl.empty();
	}

	private createMainContainer(contentEl: HTMLElement): HTMLElement {
		const mainContainer = contentEl.createDiv({ cls: "quest-form" });
		this.createNormalMode(mainContainer);
		return mainContainer;
	}

	private createNormalMode(container: HTMLElement) {
		const formContainer = container.createDiv({ cls: "quest-form" });
		this.titleInput = new TitleInput(formContainer);
		this.shortDescriptionInput = new ShortDescriptionInput(formContainer);
		this.categoryInput = new CategoryInput(formContainer, this.plugin);
	}

	private createAdvancedModeToggle(contentEl: HTMLElement, mainContainer: HTMLElement) {
		const advancedContainer = mainContainer.createDiv({ cls: "advanced-mode" });
		const headerContainer = contentEl.querySelector(".header-container") as HTMLElement;
		if (!headerContainer) {
			console.error("Header container not found");
			return;
		}

		new ToggleComponent(headerContainer)
			.setTooltip("Show/hide supplementary settings")
			.setValue(false)
			.onChange((value) => {
				if (value) {
					this.showAdvancedMode(advancedContainer);
				} else {
					advancedContainer.empty();
				}
			});
	}

	private showAdvancedMode(container: HTMLElement) {
		separator(container);
		titleSection(container, "Supplementary Settings");
		this.descriptionInput = getDescrInput(container);
		const { priorityInput, difficultyInput } = getSettingsInputs(container);
		this.priorityInput = priorityInput;
		this.difficultyInput = difficultyInput;
		const {requireLevelInput , requirePreviousQuestsInput } = getRequirementsInputs(container, this.plugin);
		this.requireLevelInput = requireLevelInput;
		this.requirePreviousQuestsInput = requirePreviousQuestsInput;
		const { rewardAttributeInput, rewardItemsInput, rewardXPInput } = getRewardInputs(container, this.plugin);
		this.rewardAttributeInput = rewardAttributeInput;
		this.rewardItemsInput = rewardItemsInput;
		this.rewardXPInput = rewardXPInput;
	}

	private createEndButtons(contentEl: HTMLElement) {
		endButton({
			contentEl: contentEl,
			plugin: {
				questService: {
					saveQuestToJSON: (
						title: string,
						shortDescription: string,
						description: string,
						reward_XP: number,
						require_level: number,
						require_previousQuests: string,
						difficulty: string,
						category: string,
						priority: string,
						questId: string,
						attributeRewards: any
					) => {
						return this.plugin.questService.saveQuestToJSON(
							title,
							shortDescription,
							description,
							reward_XP,
							require_level,
							require_previousQuests,
							difficulty,
							category,
							undefined, // dueDate
							priority,
							questId,
							attributeRewards
						);
					}
				}
			},
			close: () => this.close(),
			getFormData: () => {
				const formData = getFormData({
					titleInput: this.titleInput,
					shortDescriptionInput: this.shortDescriptionInput,
					descriptionInput: this.descriptionInput,
					rewardXPInput: this.rewardXPInput,
					rewardItemsInput: this.rewardItemsInput,
					requireLevelInput: this.requireLevelInput,
					requirePreviousQuestsInput: this.requirePreviousQuestsInput,
					priorityInput: this.priorityInput,
					difficultyInput: this.difficultyInput,
					categoryInput: this.categoryInput,
					rewardAttributeInput: this.rewardAttributeInput
				});
				return formData;
			}
		});
	}
}




// -------------------------------------------------------
// quest modification modal
// -------------------------------------------------------

export class ModifyQuestModal extends Modal {
	plugin: GOL;
	quest: Quest;
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
	private attributePairs: { attributeSelect: HTMLSelectElement; xpInput: HTMLInputElement }[] = [];

	constructor(app: App, plugin: GOL) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		createHeader(contentEl, 'Modify Quest');
		separator(contentEl);
		subTitle(contentEl, 'General');
		this.titleInput = new TitleInput(contentEl, this.quest.title);
		this.shortDescriptionInput = new ShortDescriptionInput(contentEl, this.quest.shortDescription);
		this.descriptionInput = new DescriptionInput(contentEl, this.quest.description);
		this.categoryInput = new CategoryInput(contentEl, this.plugin, this.quest.settings.category);
		const { priorityInput, difficultyInput } = getSettingsInputs(contentEl, this.quest.settings.priority, this.quest.settings.difficulty);
		this.priorityInput = priorityInput;
		this.difficultyInput = difficultyInput;

		// Properly handle dueDate conversion
		let dueDate: Date | undefined;
		if (this.quest.progression.dueDate) {
			if (typeof this.quest.progression.dueDate === 'string') {
				dueDate = new Date(this.quest.progression.dueDate);
			} else if (this.quest.progression.dueDate instanceof Date) {
				dueDate = this.quest.progression.dueDate;
			}
		}
		this.dueDateInput = new dueDateInput(contentEl, dueDate);

		const { requireLevelInput, requirePreviousQuestsInput } = getRequirementsInputs(contentEl, this.plugin, this.quest.requirements.level, this.quest.requirements.previousQuests ? this.quest.requirements.previousQuests : []);
		this.requireLevelInput = requireLevelInput;
		this.requirePreviousQuestsInput = requirePreviousQuestsInput;

		// Convertir les attributs existants en format attendu par RewardAttributeInput
		const existingAttributes: StatBlock = this.quest.reward.attributes
			? this.quest.reward.attributes
			: { strength: 0, agility: 0, endurance: 0, charisma: 0, wisdom: 0, perception: 0, intelligence: 0 };

		const { rewardAttributeInput, rewardItemsInput, rewardXPInput } = getRewardInputs(contentEl, this.plugin, existingAttributes, this.quest.reward.XP);
		this.rewardAttributeInput = rewardAttributeInput;
		this.rewardItemsInput = rewardItemsInput;
		this.rewardXPInput = rewardXPInput;
		this.endButton(contentEl);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
	private endButton(contentEl: HTMLElement) {
		// Save Button
		const buttonContainer = contentEl.createDiv({cls: "button-container"});
		const flexContainer = buttonContainer.createDiv({ cls: "buttons-flex-container" });
		const noteContainer = flexContainer.createDiv({ cls: "required-note-container" });
		noteContainer.createEl("p", { text: '* Required fields', cls: 'required-note' });

		const buttonsGroup = flexContainer.createDiv({ cls: "buttons-group" });

		// save button
		new ButtonComponent(buttonsGroup)
			.setButtonText("save")
			.onClick(async () => {
				try {
				// Get attribute rewards
				const attributeRewards: StatBlock = {
					strength: 0,
					agility: 0,
					endurance: 0,
					charisma: 0,
					wisdom: 0,
					perception: 0,
					intelligence: 0
				};
				if (this.rewardAttributeInput) {
					const statBlock = this.rewardAttributeInput.getStatBlock();
					Object.assign(attributeRewards, statBlock);
				}

				// Get due date
				const dueDateString = this.dueDateInput ? this.dueDateInput.getValue() : '';
				let dueDate = dueDateString ? new Date(dueDateString) : undefined;
				if (dueDate && dueDate.toString() === 'Invalid Date') {
					dueDate = undefined;
				}

				// Save changes
				await this.plugin.questService.saveQuestToJSON(
					this.titleInput.getValue().trim(),
					this.shortDescriptionInput.getValue().trim(),
					this.descriptionInput.getValue().trim(),
					this.rewardXPInput ? parseInt(this.rewardXPInput.getValue()) || 0 : 0,
					this.requireLevelInput ? this.requireLevelInput.getValue() || 0 : 0,
					this.requirePreviousQuestsInput ? this.requirePreviousQuestsInput.getValue().join(',') : '',
					this.difficultyInput.getValue().trim(),
					this.categoryInput.getValue().trim(),
					dueDate,
					this.priorityInput.getValue().trim(),
					this.quest.id, // Pass the quest ID for updating
					attributeRewards // Pass the attribute rewards as a StatBlock
				);

				new Notice('Quest updated successfully');
				// Notify view to reload
				viewSyncService.emitStateChange({ questsUpdated: true });
				this.close();
			} catch (error) {
				console.error('Error saving quest:', error);
				new Notice('Failed to save quest changes');
			}
		});

		new ButtonComponent(buttonsGroup)
			.setButtonText("Delete")
			.setWarning()
			.onClick(async () => {
				if (confirm('Are you sure you want to delete this quest? This action cannot be undone.')) {
				try {
					// Delete the quest from the JSON file
					const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
					const content = await this.app.vault.adapter.read(questsPath);
					const quests = JSON.parse(content);
					
					// Filter out the quest to delete
					const updatedQuests = quests.filter((q: Quest) => q.id !== this.quest.id);
					
					// Save the updated quests
					await this.app.vault.adapter.write(questsPath, JSON.stringify(updatedQuests, null, 2));
					
					new Notice('Quest deleted successfully');
					// Notify view to reload
					viewSyncService.emitStateChange({ questsUpdated: true });
					this.close();
				} catch (error) {
					console.error('Error deleting quest:', error);
					new Notice('Failed to delete quest');
				}
			}
		}
		);
	}
}
 