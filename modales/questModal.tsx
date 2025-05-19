import { App, Modal, Notice, ToggleComponent } from "obsidian";
import { TextComponent, ButtonComponent } from "obsidian";
import GOL from "../plugin";
import { Quest } from '../constants/DEFAULT';

export class CreateQuestModal extends Modal {
    plugin: GOL;
    titleInput: TextComponent;
	shortDescriptionInput: TextComponent;
    descriptionInput: HTMLTextAreaElement;
    rewardXPInput: TextComponent;
    rewardItemsInput: TextComponent;
    difficultyInput: HTMLSelectElement;
	levelInput: HTMLInputElement;
	previousQuestsInput: HTMLInputElement;
	dueDateInput: HTMLInputElement;
	priorityInput: HTMLSelectElement;
	categoryInput: HTMLSelectElement;

    constructor(app: App, plugin: GOL) {
        super(app);
        this.plugin = plugin;
    }

	private getFormData() {
		const title = this.titleInput.getValue().trim();
		const shortDescription = this.shortDescriptionInput.getValue().trim();
		const description = this.descriptionInput.value.trim();
		const reward_XP = this.rewardXPInput ? parseInt(this.rewardXPInput.getValue()) : 0;
		const reward_items = this.rewardItemsInput ? this.rewardItemsInput.getValue().trim() : "";
		const require_level = this.levelInput ? parseInt(this.levelInput.value) : 0;
		const require_previousQuests = this.previousQuestsInput ? this.previousQuestsInput.value : "";
		const dueDate = this.dueDateInput ? this.dueDateInput.value : "";
		const priority = this.priorityInput ? this.priorityInput.value : "low";
		const difficulty = this.difficultyInput ? this.difficultyInput.value : "easy";
		const category = this.categoryInput ? this.categoryInput.value : "";

		return {
			title,
			shortDescription,
			description,
			reward_XP,
			reward_items,
			require_level,
			require_previousQuests,
			dueDate,
			priority,
			difficulty,
			category
		};
	}

	private normalMode = (Container: HTMLElement) => {
		// show the form with the title and description for the quests.
		const {contentEl} = this;
		const advancedMode = contentEl.querySelector(".advanced-mode");
		if (advancedMode) {
			advancedMode.remove();
		}

		if (Container) {
			Container.empty();
		}
		const formContainer = Container.createDiv({ cls: "quest-form" });

		// Title (Required)
		const titleContainer = formContainer.createDiv({ cls: "form-group required" });
		titleContainer.createEl("label", { text: "Title *" });
		this.titleInput = new TextComponent(titleContainer);
		this.titleInput.setPlaceholder("Enter quest title...");
		this.titleInput.inputEl.setAttribute("style", "width: 100%;");
		this.titleInput.inputEl.setAttribute("required", "true");

		// Description
		const shortDescriptionContainer = formContainer.createDiv({ cls: "form-group" });
		shortDescriptionContainer.createEl("label", { text: "Short Description:" });
		this.shortDescriptionInput = new TextComponent(shortDescriptionContainer);
		this.shortDescriptionInput.setPlaceholder("Enter short quest description... You'll see it on the sideView");
		this.shortDescriptionInput.inputEl.setAttribute("style", "width: 100%;");

		// XP Reward
		const rewardContainer = formContainer.createDiv({ cls: "form-group" });
		rewardContainer.createEl("label", { text: "XP Reward:" });
		this.rewardXPInput = new TextComponent(rewardContainer);
		this.rewardXPInput.setValue("50");
		this.rewardXPInput.inputEl.setAttribute("type", "number");
		this.rewardXPInput.inputEl.setAttribute("min", "0");
		this.rewardXPInput.inputEl.setAttribute("style", "width: 100%;");

		// Items Reward
		const rewardItemsContainer = formContainer.createDiv({ cls: "form-group" });
		rewardItemsContainer.createEl("label", { text: "Items Reward:" });
		this.rewardItemsInput = new TextComponent(rewardItemsContainer);
		this.rewardItemsInput.setPlaceholder("Enter items reward...");
	}

	private endButton = () => {
		// show the buttons.
		const {contentEl} = this;
		// Buttons container
		const buttonsContainer = contentEl.createDiv({ cls: "buttons-container" });
		
		// Create a flex container for the note and buttons
		const flexContainer = buttonsContainer.createDiv({ cls: "buttons-flex-container" });
		
		// Add required fields note on the left
		const noteContainer = flexContainer.createDiv({ cls: "required-note-container" });
		noteContainer.createEl("p", {text: '* Required fields', cls: 'required-note'});
		
		// Create a container for the buttons
		const buttonsGroup = flexContainer.createDiv({ cls: "buttons-group" });
		
		// Cancel button
		new ButtonComponent(buttonsGroup)
			.setButtonText("Cancel")
			.onClick(() => {
				this.close();
			});

		// Save button
		new ButtonComponent(buttonsGroup)
			.setButtonText("Save Quest")
			.setCta()
			.onClick(async () => {
				const { title, shortDescription, description, reward_XP, require_level, require_previousQuests, difficulty, category, dueDate, priority } = this.getFormData();
				if (!title) {
					new Notice("Quest title is required !");
					return;
				}
				if (!shortDescription) {
					new Notice("Short description is required !");
					return;
				}

				if (isNaN(reward_XP) || reward_XP < 0) {
					new Notice("XP reward must be a positive number !");
					return;
				}

				if (require_level < 0) {
					new Notice("Level must be a positive number !");
					return;
				}

				if (!this.plugin?.questService) {
					return;
				}

				try {
					await this.plugin.questService.saveQuestToJSON(title, shortDescription, description, reward_XP, require_level, require_previousQuests, difficulty, category, dueDate, priority);
					this.close();
				} catch (error) {
					console.error("Error saving quest:", error);
					new Notice("Failed to save quest. Check console for details.");
				}
			});
	}

    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.empty();
        // Create header
        const headerContainer = contentEl.createDiv({ cls: "header-container" });
        // Add title
        headerContainer.createEl("h1", {text: 'Create New Quest'});

        // Create main container for the form
        const mainContainer = contentEl.createDiv({ cls: "quest-form" });
		this.normalMode(mainContainer); // by default
		const advancedContainer = mainContainer.createDiv({ cls: "advanced-mode" });


        const advancedModeToggle = new ToggleComponent(headerContainer)
            .setTooltip("Show/hide supplementary settings")
            .setValue(false)
            .onChange((value) => {

                if (value) {
                    // Advanced mode
                    advancedContainer.createEl("h3", { text: "Supplementary settings" });

					// Description
					const descriptionContainer = advancedContainer.createDiv({ cls: "form-group" });
					descriptionContainer.createEl("label", { text: "Full description:" });
					this.descriptionInput = descriptionContainer.createEl("textarea", {
						placeholder: "Enter quest description...",
						cls: "quest-description"
					});
					this.descriptionInput.style.width = "100%";
					this.descriptionInput.style.height = "120px";
					this.descriptionInput.style.resize = "vertical";

                    // Requirements
                    const requirementsContainer = advancedContainer.createDiv({ cls: "form-group" });
                    requirementsContainer.createEl("label", { text: "Requirements:" });
                    const levelContainer = requirementsContainer.createDiv({ cls: "form-group" });
                    levelContainer.createEl("label", { text: "Level:" });
                    this.levelInput = levelContainer.createEl("input", {
                        type: "number",
                        placeholder: "Enter quest level..."
                    });
                    this.levelInput.min = "0";
                    this.levelInput.style.width = "100%";

					// Previous Quests
					const previousQuestsContainer = advancedContainer.createDiv({ cls: "form-group" });
					previousQuestsContainer.createEl("label", { text: "Previous Quests:" });
					this.previousQuestsInput = previousQuestsContainer.createEl("input", {
						type: "text",
						placeholder: "Enter previous quests..."
					});
					this.previousQuestsInput.style.width = "100%";

					// Due Date
					const dueDateContainer = advancedContainer.createDiv({ cls: "form-group" });
					dueDateContainer.createEl("label", { text: "Due Date:" });
					this.dueDateInput = dueDateContainer.createEl("input", {
						type: "date",
						placeholder: "Enter due date..."
					});
					this.dueDateInput.style.width = "100%";

					// Priority
					const priorityContainer = advancedContainer.createDiv({ cls: "form-group" });
					priorityContainer.createEl("label", { text: "Priority:" });
					this.priorityInput = priorityContainer.createEl("select", {
						cls: "priority-select"
					});
					this.priorityInput.style.width = "100%";

					// Add options
					const priorities = ["low", "medium", "high"];
					priorities.forEach(priority => {
						const option = this.priorityInput.createEl("option", {
							text: priority.charAt(0).toUpperCase() + priority.slice(1),
							value: priority
						});
					});

                    // difficulty
                    const difficultyContainer = advancedContainer.createDiv({ cls: "form-group" });
                    difficultyContainer.createEl("label", { text: "Estimated difficulty:" });
                    this.difficultyInput = difficultyContainer.createEl("select", {
                        cls: "difficulty-select"
                    });
                    this.difficultyInput.style.width = "100%";

                    // Add options
                    const difficulties = ["easy", "medium", "difficult"];
                    difficulties.forEach(difficulty => {
                        const option = this.difficultyInput.createEl("option", {
                            text: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
                            value: difficulty
                        });
                    });


					// Category
					const categoryContainer = advancedContainer.createDiv({ cls: "form-group" });
					categoryContainer.createEl("label", { text: "Category:" });
					this.categoryInput = categoryContainer.createEl("select", {
						cls: "category-select"
					});
					this.categoryInput.style.width = "100%";

					// Add predefined categories
					const defaultCategories = ["Main Quest", "Side Quest", "Daily Quest", "Weekly Quest", "Other"];
					const userCategories = this.plugin.settings.user1.settings.questsCategories || [];
					const allCategories = [...new Set([...defaultCategories, ...userCategories])];

					allCategories.forEach(category => {
						const option = this.categoryInput.createEl("option", {
							text: category,
							value: category
						});
					});

					// Add "Add new category" option
					const newCategoryOption = this.categoryInput.createEl("option", {
						text: "+ Add new category",
						value: "new"
					});

					// Create new category input (hidden by default)
					const newCategoryContainer = categoryContainer.createDiv({ cls: "form-group" });
					newCategoryContainer.style.display = "none";
					const newCategoryInput = newCategoryContainer.createEl("input", {
						type: "text",
						placeholder: "Enter new category name..."
					});
					newCategoryInput.style.width = "100%";

					// Add button to confirm new category
					const addButton = newCategoryContainer.createEl("button", {
						text: "Add",
						cls: "mod-cta"
					});

					// Handle new category selection
					this.categoryInput.addEventListener("change", (e) => {
						if (this.categoryInput.value === "new") {
							newCategoryContainer.style.display = "block";
							newCategoryInput.focus();
						} else {
							newCategoryContainer.style.display = "none";
						}
					});

					// Handle adding new category
					addButton.addEventListener("click", async () => {
						const newCategory = newCategoryInput.value.trim();
						if (newCategory) {
							// Add to select
							const option = this.categoryInput.createEl("option", {
								text: newCategory,
								value: newCategory
							});
							this.categoryInput.value = newCategory;
							newCategoryContainer.style.display = "none";
							newCategoryInput.value = "";

							// Save to settings
							if (!this.plugin.settings.user1.settings.questsCategories) {
								this.plugin.settings.user1.settings.questsCategories = [];
							}
							if (!this.plugin.settings.user1.settings.questsCategories.includes(newCategory)) {
								this.plugin.settings.user1.settings.questsCategories.push(newCategory);
								await this.plugin.saveSettings();
							}
						}
					});

					// Handle enter key in new category input
					newCategoryInput.addEventListener("keypress", (e) => {
						if (e.key === "Enter") {
							addButton.click();
						}
					});

                } else {
                    // Normal mode
					advancedContainer.empty();
                    // const normalContainer = mainContainer.createDiv({ cls: "normal-mode" });
                    // this.normalMode(normalContainer);
                }
            });

		this.endButton();
    }

    onClose() {
        this.contentEl.empty();
    }
}


export class ModifyQuestModal extends Modal {
	plugin: GOL;
	quest: Quest;

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

		saveButton.addEventListener('click', async () => {
			try {
				// Update quest with new values
				this.quest.title = titleInput.value;
				this.quest.shortDescription = shortDescInput.value;
				this.quest.description = descInput.value;
				this.quest.reward.XP = parseInt(xpInput.value) || 0;
				this.quest.settings.difficulty = difficultySelect.value as any;
				this.quest.settings.category = categoryInput.value;
				this.quest.settings.priority = prioritySelect.value as any;
				this.quest.progression.dueDate = dueDateInput.value ? new Date(dueDateInput.value) : undefined;

				// Save changes
				await this.plugin.questService.saveQuestToJSON(
					this.quest.title,
					this.quest.shortDescription,
					this.quest.description,
					this.quest.reward.XP,
					0, // level requirement
					'', // previous quests
					this.quest.settings.difficulty || 'easy',
					this.quest.settings.category || '',
					this.quest.progression.dueDate?.toISOString() ?? '',
					this.quest.settings.priority || 'low',
					this.quest.id // Pass the quest ID for updating
				);
				new Notice('Quest updated successfully');
				this.close();
			} catch (error) {
				console.error('Error saving quest:', error);
				new Notice('Failed to save quest changes');
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

