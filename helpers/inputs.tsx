import { TextComponent } from "obsidian";
import GOL from "plugin";
import { DescriptionHelper } from "./UIHelpers";
import { DEFAULT_CATEGORIES, DEFAULT_PRIORITIES, DEFAULT_DIFFICULTIES, AttributeBlock } from "../data/DEFAULT";
import QuestService from "context/services/questService";


export class TitleInput {
	private input: TextComponent;

	constructor(container: HTMLElement, initialValue?: string) {
		const titleContainer = container.createDiv({ cls: "form-group required", attr: { style: "display: flex; align-items: center; gap: 8px; width: 100%;" } });
		titleContainer.createEl("label", { text: "Title *", attr: { style: "margin: 0;" } });
		this.input = new TextComponent(titleContainer);
		this.input.setPlaceholder("Enter quest title...");
		this.input.inputEl.setAttribute("style", "flex: 1 1 auto; width: auto; min-width: 0;");
		this.input.inputEl.setAttribute("required", "true");
		if (initialValue) {
			this.input.setValue(initialValue);
		}
	}

	getValue(): string {
		return this.input.getValue();
	}
}

export class ShortDescriptionInput {
	private input: TextComponent;
	private description: DescriptionHelper;

	constructor(container: HTMLElement, initialValue?: string) {
		const shortDescContainer = container.createDiv({ cls: "form-group required" });
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
		// this.input.rows = 4;

		if (initialValue) {
			this.input.value = initialValue;
		}
		this.description = new DescriptionHelper(descriptionContainer, "The more vivid and detailed your description is, the more powerful and motivating it becomes. Add purpose, emotion, and clarity!");
	}

	getValue(): string {
		return this.input.value;
	}
}

export class CategoryInput {
	private input: HTMLSelectElement;
	private description: DescriptionHelper;
	private questService: QuestService;

	constructor(container: HTMLElement, questService: QuestService, initialValue?: string) {
		this.questService = questService;
		const categoryContainer = container.createDiv({ cls: "form-group", attr: { style: "display: flex; flex-direction: row; gap: 8px;" } });
		categoryContainer.createEl("label", { text: "Category" });
		this.input = categoryContainer.createEl("select", {
			placeholder: "Select a category..."
		}) as HTMLSelectElement;
		// this.input.style.width = "100%";
		// this.input.style.height = "30px";
		// this.input.style.borderRadius = "5px";
		// this.input.style.border = "1px solid var(--input-border)";
		// this.input.style.padding = "5px";
		// this.input.style.marginBottom = "10px";
		// this.input.style.fontSize = "14px";
		// this.input.style.fontWeight = "normal";
		// this.input.style.color = "var(--text-muted)";
		// this.input.style.backgroundColor = "var(--background-secondary)";
		// this.input.style.cursor = "pointer";
		// this.input.style.outline = "none";
		// this.input.style.transition = "all 0.3s ease";
		// this.input.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";

		const defaultCategories = DEFAULT_CATEGORIES;
		const userCategories = this.questService.getUserCategories
			? this.questService.getUserCategories()
			: [];
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
				await this.questService.addCategory(newCategory);
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
		const priorityContainer = container.createDiv({ cls: "form-group", attr: { style: "display: flex; flex-direction: row; gap: 8px;" } });
		priorityContainer.createEl("label", { text: "Priority" });
		this.input = priorityContainer.createEl("select", {
			placeholder: "Select a priority...",
			cls: "form-group"
		}) as HTMLSelectElement;


		// Add options
		const priorities = DEFAULT_PRIORITIES;
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
		const difficultyContainer = container.createDiv({ cls: "form-group", attr: { style: "display: flex; flex-direction: row; gap: 8px;" } });
		difficultyContainer.createEl("label", { text: "Estimated difficulty" });
		this.input = difficultyContainer.createEl("select", {
			placeholder: "Select a difficulty...",
			cls: "difficulty-select"
		}) as HTMLSelectElement;

		// Add options
		const difficulties = DEFAULT_DIFFICULTIES;
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


export class DueDateInput {
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

	// setValue(date: Date): Date | undefined {
	// 	if (!(date instanceof Date) || isNaN(date.getTime())) {
	// 		console.error("Invalid date provided to dueDateInput.setValue");
	// 		return undefined;
	// 	}
	// 	if (!date) return undefined;
	// 	this.input.style.display = "block";
	// 	const year = date.getFullYear();
	// 	const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
	// 	const day = String(date.getDate()).padStart(2, '0');
	// 	this.input.value = `${year}-${month}-${day}`;
	// }
}


