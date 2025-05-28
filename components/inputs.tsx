import { TextComponent } from "obsidian";
import GOL from "plugin";
import { DescriptionHelper } from "./uiHelpers";


export class TitleInput {
	private input: TextComponent;
	private description: DescriptionHelper;

	constructor(container: HTMLElement, initialValue?: string) {
		const titleContainer = container.createDiv({ cls: "form-group required" });
		titleContainer.createEl("label", { text: "Title *" });
		this.input = new TextComponent(titleContainer);
		this.input.setPlaceholder("Enter quest title...");
		this.input.inputEl.setAttribute("style", "width: 100%;");
		this.input.inputEl.setAttribute("required", "true");
		if (initialValue) {
			this.input.setValue(initialValue);
		}
		this.description = new DescriptionHelper(titleContainer, "A clear and concise title helps you stay focused on your quest's main objective.");
	}

	getValue(): string {
		return this.input.getValue();
	}
}


export class ShortDescriptionInput {
	private input: TextComponent;
	private description: DescriptionHelper;

	constructor(container: HTMLElement, initialValue?: string) {
		const shortDescContainer = container.createDiv({ cls: "form-group" });
		shortDescContainer.createEl("label", { text: "Short Description *" });
		this.input = new TextComponent(shortDescContainer);
		this.input.setPlaceholder("Enter short quest description...");
		this.input.inputEl.setAttribute("style", "width: 100%;");
		this.input.inputEl.setAttribute("required", "true");
		if (initialValue) {
			this.input.setValue(initialValue);
		}
		this.description = new DescriptionHelper(shortDescContainer, "A brief summary that will be visible in the side view. Keep it concise but informative!");
	}

	getValue(): string {
		return this.input.getValue();
	}
}


export class DescriptionInput {
	private input: HTMLTextAreaElement;
	private description: DescriptionHelper;

	constructor(container: HTMLElement, initialValue?: string) {
		const descriptionContainer = container.createDiv({ cls: "form-group" });
		descriptionContainer.createEl("label", { text: "Full description" });
		
		this.input = descriptionContainer.createEl("textarea", {
			placeholder: "Enter quest description...",
			cls: "quest-description"
		}) as HTMLTextAreaElement;
		
		// Configuration des propriétés de base
		this.input.rows = 4;
		
		// Définition de la valeur initiale
		if (initialValue) {
			this.input.value = initialValue;
		}
		
		this.description = new DescriptionHelper(descriptionContainer, "The more vivid and detailed your quest is, the more powerful and motivating it becomes. Add purpose, emotion, and clarity!");
	}

	getValue(): string {
		return this.input.value;
	}
}


export class CategoryInput {
	private input: HTMLSelectElement;
	private description: DescriptionHelper;
	private plugin: GOL;

	constructor(container: HTMLElement, plugin: any, initialValue?: string) {
		this.plugin = plugin;
		const categoryContainer = container.createDiv({ cls: "form-group" });
		categoryContainer.createEl("label", { text: "Category" });
		this.input = categoryContainer.createEl("select", {
			placeholder: "Select a category..."
		}) as HTMLSelectElement;
		this.input.style.width = "100%";
		this.input.style.height = "30px";
		this.input.style.borderRadius = "5px";
		this.input.style.border = "1px solid var(--input-border)";
		this.input.style.padding = "5px";
		this.input.style.marginBottom = "10px";
		this.input.style.fontSize = "14px";
		this.input.style.fontWeight = "normal";
		this.input.style.color = "var(--text-muted)";
		this.input.style.backgroundColor = "var(--background-secondary)";
		this.input.style.cursor = "pointer";
		this.input.style.outline = "none";
		this.input.style.transition = "all 0.3s ease";
		this.input.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";

		const defaultCategories = [
			"Undefined",
			"Physical",        // strength, endurance, agility
			"Mental",          // intelligence, wisdom, perception
			"Social",          // charisma, leadership
			"Creative",        // could map to intelligence + perception
			"Emotional",       // maybe to wisdom, charisma
			"Organizational",  // wisdom, intelligence
			"Exploration",     // perception, endurance
		];
		const userCategories = this.plugin.settings.user1.settings.questsCategories || [];
		const allCategories = [...new Set([...defaultCategories, ...userCategories])];

		allCategories.forEach(category => {
			const option = this.input.createEl("option", {
				text: category,
				value: category
			});
		});

		// Add "Add new category" option
		const newCategoryOption = this.input.createEl("option", {
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
		this.input.addEventListener("change", (e: Event) => {
			if (this.input.value === "new") {
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
				const option = this.input.createEl("option", {
					text: newCategory,
					value: newCategory
				});
				this.input.value = newCategory;
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
		newCategoryInput.addEventListener("keypress", (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				addButton.click();
			}
		});

		if (initialValue) {
			this.input.value = initialValue;
		}
	}

	getValue(): string {
		return this.input.value;
	}
}

export class PriorityInput {
	private input: HTMLSelectElement;
	private description: DescriptionHelper;

	constructor(container: HTMLElement, initialValue?: string) {
		const priorityContainer = container.createDiv({ cls: "form-group" });
		priorityContainer.createEl("label", { text: "Priority" });
		this.input = priorityContainer.createEl("select", {
			placeholder: "Select a priority...",
			cls: "priority-select"
		}) as HTMLSelectElement;
		this.input.style.width = "100%";
		this.input.style.height = "30px";
		this.input.style.borderRadius = "5px";
		this.input.style.border = "1px solid var(--input-border)";
		this.input.style.padding = "5px";
		this.input.style.marginBottom = "10px";
		this.input.style.fontSize = "14px";
		this.input.style.fontWeight = "normal";
		this.input.style.color = "var(--text-muted)";

		// Add options
		const priorities = ["low", "medium", "high"];
		priorities.forEach(priority => {
			const option = this.input.createEl("option", {
				text: priority.charAt(0).toUpperCase() + priority.slice(1),
				value: priority
			});
		});
		if (initialValue) {
			this.input.value = initialValue;
		}
	}

	getValue(): string {
		return this.input.value;
	}
}

export class DifficultyInput {
	private input: HTMLSelectElement;
	private description: DescriptionHelper;

	constructor(container: HTMLElement, initialValue?: string) {
		const difficultyContainer = container.createDiv({ cls: "form-group" });
		difficultyContainer.createEl("label", { text: "Estimated difficulty" });
		this.input = difficultyContainer.createEl("select", {
			placeholder: "Select a difficulty...",
			cls: "difficulty-select"
		}) as HTMLSelectElement;
		this.input.style.width = "100%";
		this.input.style.height = "30px";
		this.input.style.borderRadius = "5px";
		this.input.style.border = "1px solid var(--input-border)";
		this.input.style.padding = "5px";
		this.input.style.marginBottom = "10px";
		this.input.style.fontSize = "14px";
		this.input.style.fontWeight = "normal";
		this.input.style.color = "var(--text-muted)";

		// Add options
		const difficulties = ["easy", "medium", "hard", "expert"];
		difficulties.forEach(difficulty => {
			const option = this.input.createEl("option", {
				text: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
				value: difficulty
			});
		});
		if (initialValue) {
			this.input.value = initialValue;
		}
	}

	getValue(): string {
		return this.input.value;
	}
}


export class dueDateInput {
	private input: HTMLInputElement;
	private description: DescriptionHelper;

	constructor(container: HTMLElement, initialValue?: Date) {
		const dueDateContainer = container.createDiv({ cls: "form-group" });
		dueDateContainer.createEl("label", { text: "Due date" });
		this.input = dueDateContainer.createEl("input", {
			type: "date",
			cls: "due-date-input"
		}) as HTMLInputElement;
		this.input.style.width = "100%";

		if (initialValue) {
			const year = initialValue.getFullYear();
			const month = String(initialValue.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
			const day = String(initialValue.getDate()).padStart(2, '0');
			this.input.value = `${year}-${month}-${day}`;
		}

		this.description = new DescriptionHelper(dueDateContainer, "Set a deadline to keep your quest on track. A clear end date helps you stay focused and motivated!");
	}

	getValue(): Date | undefined {
		if (!this.input.value) return undefined;
		const [year, month, day] = this.input.value.split('-').map(Number);
		return new Date(year, month - 1, day); // Month is 0-indexed in Date constructor
	}

	setValue(date: Date): Date | undefined {
		if (!(date instanceof Date) || isNaN(date.getTime())) {
			console.error("Invalid date provided to dueDateInput.setValue");
			return undefined;
		}
		if (!date) return undefined;
		this.input.style.display = "block";
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
		const day = String(date.getDate()).padStart(2, '0');
		this.input.value = `${year}-${month}-${day}`;
	}
}


export class SubtasksInput { //todo : refactor to use TextComponent
	private input: HTMLTextAreaElement;
	private description: DescriptionHelper;

	constructor(container: HTMLElement, initialValue?: string) {
		const subtasksContainer = container.createDiv({ cls: "form-group" });
		subtasksContainer.createEl("label", { text: "Subtasks (one per line)" });
		this.input = subtasksContainer.createEl("textarea", {
			placeholder: "Enter subtasks, one per line...",
			cls: "subtasks-input"
		}) as HTMLTextAreaElement;
		this.input.style.width = "100%";
		this.input.style.height = "100px";
		this.input.style.resize = "vertical";
		if (initialValue) {
			this.input.value = initialValue;
		}
		
		this.description = new DescriptionHelper(subtasksContainer, "Break down your quest into smaller, manageable tasks. This makes it easier to track progress and stay motivated!");
	}

	getValue(): string {
		return this.input.value;
	}
}


export class RequireLevelInput {
	private input: HTMLInputElement;
	private description: DescriptionHelper;

	constructor(container: HTMLElement, initialValue?: number) {
		const levelContainer = container.createDiv({ cls: "form-group" });
		levelContainer.createEl("label", { text: "Level min" });
		this.input = levelContainer.createEl("input", {
			type: "number",
			cls: "require-level-input"
		}) as HTMLInputElement;
		this.input.setAttribute("min", "0");
		this.input.style.width = "100%";
		this.input.style.marginBottom = "10px";
		if (initialValue !== undefined) {
			this.input.value = initialValue.toString();
		}
		
		this.description = new DescriptionHelper(levelContainer, "Set a minimum level required to start this quest. This helps ensure that you are adequately prepared for the challenges ahead!");
	}

	getValue(): number {
		return parseInt(this.input.value, 10);
	}
}


export class RequirePreviousQuestsInput {
	private input: HTMLSelectElement;
	private description: DescriptionHelper;
	private quests: string[] = [];

	constructor(container: HTMLElement, plugin: any, initialValue?: string[]) {
		const previousQuestsContainer = container.createDiv({ cls: "form-group" });
		previousQuestsContainer.createEl("label", { text: "Required previous quests" });


		this.description = new DescriptionHelper(
			previousQuestsContainer,
			"This setting is not available yet..."
		);

	}
	getValue(): string[] {
		return [""];
	}
}

export class RewardAttributeInput {
	private attributePairs: { attributeSelect: HTMLSelectElement; xpInput: HTMLInputElement }[] = [];
	private description: DescriptionHelper;
	private plugin: GOL;

	constructor(container: HTMLElement, plugin: any, initialValue?: { attribute: string; xp: number }[]) {
		this.plugin = plugin;

		const attributeRewardContainer = container.createDiv({ cls: "form-group" });
		attributeRewardContainer.createEl("label", { text: "Attribute XP Rewards:" });

		this.description = new DescriptionHelper(
			attributeRewardContainer,
			"Assign XP rewards to specific attributes for this quest."
		);

		// Container for attribute pairs
		const attributePairsContainer = attributeRewardContainer.createDiv({ cls: "attribute-pairs-container" });

		// Add button to add new attribute pair
		const addAttributeButton = attributeRewardContainer.createEl("button", {
			text: "+ Add Attribute Reward",
			cls: "mod-cta"
		});

		// Function to create a new attribute pair
		const createAttributePair = (selectedAttr?: string, xpValue?: number) => {
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
			if (!selectedAttr) placeholderOption.selected = true;

			// Add attribute options
			attributes.forEach(attr => {
				const option = attributeSelect.createEl("option", {
					text: attr.charAt(0).toUpperCase() + attr.slice(1),
					value: attr
				});
				if (selectedAttr === attr) option.selected = true;
			});

			// XP amount input
			const xpInput = pairContainer.createEl("input", {
				type: "number",
				placeholder: "XP amount...",
				cls: "attribute-xp-input"
			}) as HTMLInputElement;
			xpInput.style.width = "35%";
			xpInput.style.marginRight = "8px";
			if (xpValue !== undefined) xpInput.value = xpValue.toString();

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

				Array.from(attributeSelect.options).forEach(option => {
					if (option.value === "") return;
					option.disabled = selectedAttributes.includes(option.value);
				});

				if (selectedAttributes.includes(attributeSelect.value)) {
					attributeSelect.value = "";
				}
			};

			attributeSelect.addEventListener("change", updateAvailableAttributes);

			removeButton.addEventListener("click", () => {
				const index = this.attributePairs.findIndex(p => p.attributeSelect === attributeSelect);
				if (index !== -1) {
					this.attributePairs.splice(index, 1);
					this.attributePairs.forEach(pair => {
						const event = new Event("change");
						pair.attributeSelect.dispatchEvent(event);
					});
				}
				pairContainer.remove();
			});

			this.attributePairs.push({ attributeSelect, xpInput });

			this.attributePairs.forEach(pair => {
				const event = new Event("change");
				pair.attributeSelect.dispatchEvent(event);
			});
		};

		// Always show the add button and the container
		let hasNonZero = false;
		if (initialValue && Array.isArray(initialValue)) {
			initialValue.forEach(pair => {
				if (pair.xp && pair.xp !== 0) {
					createAttributePair(pair.attribute, pair.xp);
					hasNonZero = true;
				}
			});
		}
		// If no initial non-zero, show at least one empty pair
		if (!hasNonZero) {
			createAttributePair();
		}

		addAttributeButton.addEventListener("click", (e) => {
			e.preventDefault();
			createAttributePair();
		});
	}

	getValue(): { attribute: string; xp: number }[] {
		return this.attributePairs
			.map(pair => ({
				attribute: pair.attributeSelect.value,
				xp: parseInt(pair.xpInput.value, 10)
			}))
			.filter(pair => pair.attribute && !isNaN(pair.xp));
	}

	getStatBlock(): Record<string, number> {
		const statBlock: Record<string, number> = {};
		this.getValue().forEach(({ attribute, xp }) => {
			if (attribute && typeof xp === "number" && xp > 0) {
				statBlock[attribute] = xp;
			}
		});
		return statBlock;
	}
}



export class rewardItemsInput {
	private input: HTMLTextAreaElement;
	private description: DescriptionHelper;

	constructor(container: HTMLElement, initialValue?: string) {
		const itemsContainer = container.createDiv({ cls: "form-group" });
		itemsContainer.createEl("label", { text: "Reward items (one per line)" });
		this.description = new DescriptionHelper(itemsContainer, "List the items you will receive as a reward for completing this quest. This adds tangible value to your achievements!");

		this.input = itemsContainer.createEl("textarea", {
			placeholder: "Enter reward items, one per line...",
			cls: "reward-items-input"
		}) as HTMLTextAreaElement;
		this.input.style.width = "100%";
		this.input.style.height = "100px";
		this.input.style.resize = "vertical";
		if (initialValue) {
			this.input.value = initialValue;
		}
	}

	getValue(): string {
		return this.input.value;
	}
}

