import { App, Modal, Notice, ToggleComponent } from "obsidian";
import { TextComponent, ButtonComponent } from "obsidian";
import GOL from "../plugin";
import { Quest } from '../constants/DEFAULT';
import { viewSyncService } from '../services/syncService';
import { TitleInput, ShortDescriptionInput, DescriptionInput, CategoryInput, PriorityInput, DifficultyInput, dueDateInput, SubtasksInput, RequireLevelInput, RequirePreviousQuestsInput, RewardAttributeInput, rewardItemsInput } from "../components/inputs";
import { separator, createHeader, titleSection, subTitle } from "../components/uiHelpers";
import { endButton } from "../components/questUI";
import { getDescrInput, getSettingsInputs, getRequirementsInputs, getRewardInputs } from "components/formHelpers";

// Version : cur

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
	private dueDateInput: dueDateInput;
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
		const { priorityInput, difficultyInput, dueDateInput } = getSettingsInputs(container);
		this.priorityInput = priorityInput;
		this.difficultyInput = difficultyInput;
		this.dueDateInput = dueDateInput;
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
				questService: this.plugin.questService
			},
			close: () => this.close(),
			getFormData: () => this.getFormData()
		});
	}

	private getFormData() {
		return {
			title: this.titleInput.getValue().trim(),
			shortDescription: this.shortDescriptionInput.getValue().trim(),
			description: this.descriptionInput?.getValue()?.trim() || "",
			reward_XP: this.rewardXPInput ? parseInt(this.rewardXPInput.getValue()) || 0 : 0,
			reward_items: this.rewardItemsInput?.getValue()?.trim() || "",
			require_level: this.requireLevelInput ? this.requireLevelInput.getValue() || 0 : 0,
			require_previousQuests: this.requirePreviousQuestsInput ? this.requirePreviousQuestsInput.getValue() : "",
			dueDate: this.dueDateInput?.getValue() || "",
			priority: this.priorityInput?.getValue() || "low",
			difficulty: this.difficultyInput?.getValue() || "easy",
			category: this.categoryInput?.getValue() || "",
			attributeRewards: this.rewardAttributeInput?.getStatBlock?.() || {
				strength: 0,
				agility: 0,
				endurance: 0,
				charisma: 0,
				wisdom: 0,
				perception: 0,
				intelligence: 0
			}
		};
	}
}






// -------------------------------------------------------
// quest modification modal
// -------------------------------------------------------

export class ModifyQuestModal extends Modal {
	plugin: GOL;
	quest: Quest;
	attributePairs: { attributeSelect: HTMLSelectElement; xpInput: HTMLInputElement }[] = [];

	constructor(app: App, plugin: GOL) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Modify Quest' });

		// Title
		const titleContainer = contentEl.createDiv('setting-item');
		titleContainer.createEl('label', { text: 'Title *' });
		const titleInput = titleContainer.createEl('input', {
			type: 'text',
			value: this.quest.title
		});

		// Short Description
		const shortDescContainer = contentEl.createDiv('setting-item');
		shortDescContainer.createEl('label', { text: 'Short Description' });
		const shortDescInput = shortDescContainer.createEl('input', {
			type: 'text',
			value: this.quest.shortDescription
		});

		// Description
		const descContainer = contentEl.createDiv('setting-item');
		descContainer.createEl('label', { text: 'Description' });
		const descInput = descContainer.createEl('textarea', {
			text: this.quest.description
		});
		descInput.style.width = '100%';
		descInput.style.height = '100px';

		// XP Reward
		const xpContainer = contentEl.createDiv('setting-item');
		xpContainer.createEl('label', { text: 'XP Reward' });
		const xpInput = xpContainer.createEl('input', {
			type: 'number',
			value: this.quest.reward.XP.toString()
		});

		// Attribute Rewards
		const attributeRewardContainer = contentEl.createDiv('setting-item');
		attributeRewardContainer.createEl('label', { text: 'Attribute XP Rewards:' });
		
		// Container for attribute pairs
		const attributePairsContainer = attributeRewardContainer.createDiv({ cls: "attribute-pairs-container" });
		
		// Add button to add new attribute pair
		const addAttributeButton = attributeRewardContainer.createEl("button", {
			text: "+ Add Attribute Reward",
			cls: "mod-cta"
		});

		// Function to create a new attribute pair
		const createAttributePair = (initialAttribute?: string, initialXP?: number) => {
			const pairContainer = attributePairsContainer.createDiv({ cls: "attribute-pair" });
			pairContainer.style.display = "flex";
			pairContainer.style.alignItems = "center";
			pairContainer.style.marginBottom = "8px";
			
			// Attribute select
			const attributeSelect = pairContainer.createEl("select", {
				cls: "attribute-select"
			}) as HTMLSelectElement;
			attributeSelect.style.width = "50%";
			attributeSelect.style.marginRight = "8px";

			// Add options for each attribute
			const attributes = ["strength", "agility", "endurance", "charisma", "wisdom", "perception", "intelligence"];
			// Add placeholder option
			const placeholderOption = attributeSelect.createEl("option", {
				text: "Select attribute...",
				value: ""
			}) as HTMLOptionElement;
			placeholderOption.disabled = true;
			placeholderOption.selected = !initialAttribute;
			// Add attribute options
			attributes.forEach(attr => {
				const option = attributeSelect.createEl("option", {
					text: attr.charAt(0).toUpperCase() + attr.slice(1),
					value: attr
				});
				if (attr === initialAttribute) {
					option.selected = true;
				}
			});

			// XP amount input
			const xpInput = pairContainer.createEl("input", {
				type: "number",
				placeholder: "XP amount...",
				cls: "attribute-xp-input"
			}) as HTMLInputElement;
			xpInput.style.width = "35%";
			xpInput.style.marginRight = "8px";
			if (initialXP) {
				xpInput.value = initialXP.toString();
			}

			// Remove button
			const removeButton = pairContainer.createEl("button", {
				text: "×",
				cls: "mod-warning"
			});
			removeButton.style.width = "24px";
			removeButton.style.height = "24px";
			removeButton.style.padding = "0";
			removeButton.style.display = "flex";
			removeButton.style.alignItems = "center";
			removeButton.style.justifyContent = "center";

			// Function to update available attributes
			const updateAvailableAttributes = () => {
				const selectedAttributes = this.attributePairs
					.filter(p => p.attributeSelect !== attributeSelect)
					.map(p => p.attributeSelect.value);

				// Disable options that are already selected in other pairs
				Array.from(attributeSelect.options).forEach(option => {
					option.disabled = selectedAttributes.includes(option.value);
				});

				// If current selection is now disabled, reset it
				if (selectedAttributes.includes(attributeSelect.value)) {
					attributeSelect.value = "";
				}
			};

			// Update available attributes when this select changes
			attributeSelect.addEventListener("change", updateAvailableAttributes);

			// Remove this pair when clicking the remove button
			removeButton.addEventListener("click", () => {
				const index = this.attributePairs.findIndex(p => p.attributeSelect === attributeSelect);
				if (index !== -1) {
					this.attributePairs.splice(index, 1);
					// Update available attributes in all other pairs
					this.attributePairs.forEach(pair => {
						const event = new Event("change");
						pair.attributeSelect.dispatchEvent(event);
					});
				}
				pairContainer.remove();
			});

			// Add to attribute pairs array
			this.attributePairs.push({ attributeSelect, xpInput });

			// Update available attributes for all pairs
			this.attributePairs.forEach(pair => {
				const event = new Event("change");
				pair.attributeSelect.dispatchEvent(event);
			});

			return { attributeSelect, xpInput };
		};

		// Add initial attribute pairs from the quest
		if (this.quest.reward.attributes) {
			Object.entries(this.quest.reward.attributes).forEach(([attr, xp]) => {
				if (xp > 0) {
					createAttributePair(attr, xp);
				}
			});
		}

		// Add new attribute pair when clicking the add button
		addAttributeButton.addEventListener("click", () => {
			createAttributePair();
		});

		// Difficulty
		const difficultyContainer = contentEl.createDiv('setting-item');
		difficultyContainer.createEl('label', { text: 'Difficulty' });
		const difficultySelect = difficultyContainer.createEl('select', {
			cls: "difficulty-select"
		});
		difficultyContainer.style.width = '100%';
		['easy', 'medium', 'hard', 'expert'].forEach(diff => {
			const option = difficultySelect.createEl('option', {
				text: diff.charAt(0).toUpperCase() + diff.slice(1),
				value: diff
			});
			if (diff === this.quest.settings.difficulty) {
				option.selected = true;
			}
		});

		// Category
		const categoryContainer = contentEl.createDiv('setting-item');
		categoryContainer.createEl('label', { text: 'Category' });
		const categoryInput = categoryContainer.createEl('input', {
			type: 'text',
			value: this.quest.settings.category
		});

		// Priority
		const priorityContainer = contentEl.createDiv('setting-item');
		priorityContainer.createEl('label', { text: 'Priority' });
		const prioritySelect = priorityContainer.createEl('select');
		['low', 'medium', 'high'].forEach(prio => {
			const option = prioritySelect.createEl('option', {
				text: prio.charAt(0).toUpperCase() + prio.slice(1),
				value: prio
			});
			if (prio === this.quest.settings.priority) {
				option.selected = true;
			}
		});

		// Due Date
		const dueDateContainer = contentEl.createDiv('setting-item');
		dueDateContainer.createEl('label', { text: 'Due Date' });
		const dueDateInput = dueDateContainer.createEl('input', {
			type: 'date',
			value: this.quest.progression.dueDate ? new Date(this.quest.progression.dueDate).toISOString().split('T')[0] : ''
		});

		// Save Button
		const buttonContainer = contentEl.createDiv('setting-item');
		const saveButton = buttonContainer.createEl('button', {
			text: 'Save Changes',
			cls: 'mod-cta'
		});

		// Delete Button
		const deleteButton = buttonContainer.createEl('button', {
			text: 'Delete Quest',
			cls: 'mod-warning'
		});

		saveButton.addEventListener('click', async () => {
			try {
				// Get attribute rewards
				const attributeRewards: Record<string, number> = {};
				this.attributePairs.forEach(pair => {
					if (pair.attributeSelect.value && pair.xpInput.value) {
						attributeRewards[pair.attributeSelect.value] = parseInt(pair.xpInput.value) || 0;
					}
				});

				// Save changes
				await this.plugin.questService.saveQuestToJSON(
					titleInput.value,
					shortDescInput.value,
					descInput.value,
					parseInt(xpInput.value) || 0,
					0, // level requirement
					'', // previous quests
					difficultySelect.value,
					categoryInput.value,
					dueDateInput.value,
					prioritySelect.value,
					this.quest.id, // Pass the quest ID for updating
					attributeRewards // Pass the attribute rewards
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

		deleteButton.addEventListener('click', async () => {
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
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

function getValue() {
	throw new Error("Function not implemented.");
}

