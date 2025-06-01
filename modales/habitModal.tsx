import { App, Modal, Notice, ToggleComponent } from "obsidian";
import { TextComponent, ButtonComponent } from "obsidian";
import GOL from "../plugin";
import { Habit } from '../constants/DEFAULT';
import { viewSyncService } from '../services/syncService';
import { TitleInput, ShortDescriptionInput, DescriptionInput, CategoryInput, PriorityInput, DifficultyInput } from "../components/inputs";
import { separator, createHeader, titleSection, subTitle } from "../components/uiHelpers";
import { endButton } from "../components/questUI";
import { getDescrInput, getSettingsInputs } from "components/formHelpers";
import { getFormData } from "components/questFormHelpers";

export class CreateHabitModal extends Modal {
    private plugin: GOL;
    private titleInput: TitleInput;
    private shortDescriptionInput: ShortDescriptionInput;
    private descriptionInput: DescriptionInput;
    private difficultyInput: DifficultyInput;
    private priorityInput: PriorityInput;
    private categoryInput: CategoryInput;
    private intervalInput: TextComponent;
    private unitInput: TextComponent;

    constructor(app: App, plugin: GOL) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        createHeader(contentEl, 'Create New Habit');
        const mainContainer = this.createMainContainer(contentEl);
        this.createAdvancedModeToggle(contentEl, mainContainer);
        this.createEndButtons(contentEl);
    }

    onClose() {
        this.contentEl.empty();
    }

    private createMainContainer(contentEl: HTMLElement): HTMLElement {
        const mainContainer = contentEl.createDiv({ cls: "habit-form" });
        this.createNormalMode(mainContainer);
        return mainContainer;
    }

    private createNormalMode(container: HTMLElement) {
        const formContainer = container.createDiv({ cls: "habit-form" });
        this.titleInput = new TitleInput(formContainer);
        this.shortDescriptionInput = new ShortDescriptionInput(formContainer);
        this.categoryInput = new CategoryInput(formContainer, this.plugin);

        // Add recurrence inputs
        const recurrenceContainer = formContainer.createDiv({ cls: "recurrence-container" });
        recurrenceContainer.createEl("h4", { text: "Recurrence" });
        
        const intervalContainer = recurrenceContainer.createDiv({ cls: "interval-container" });
        intervalContainer.createEl("label", { text: "Interval" });
        this.intervalInput = new TextComponent(intervalContainer)
            .setPlaceholder("1")
            .setValue("1");

        const unitContainer = recurrenceContainer.createDiv({ cls: "unit-container" });
        unitContainer.createEl("label", { text: "Unit" });
        this.unitInput = new TextComponent(unitContainer)
            .setPlaceholder("days")
            .setValue("days");
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
    }

    private createEndButtons(contentEl: HTMLElement) {
        endButton({
            version: "create",
            contentEl: contentEl,
            onSubmit: async () => {
                const formData = {
                    title: this.titleInput.getValue().trim(),
                    shortDescription: this.shortDescriptionInput.getValue().trim(),
                    description: this.descriptionInput?.getValue().trim() || "",
                    category: this.categoryInput.getValue().trim(),
                    priority: this.priorityInput?.getValue().trim() || "low",
                    difficulty: this.difficultyInput?.getValue().trim() || "easy",
                    interval: parseInt(this.intervalInput.getValue()) || 1,
                    unit: this.unitInput.getValue().trim() || "days",
                    reward_XP: 10, // Default XP reward
                };

                try {
                    await this.plugin.habitService.saveHabitToJSON(formData);
                    new Notice('Habit created successfully');
                    viewSyncService.emitStateChange({ habitsUpdated: true });
                    this.close();
                } catch (error) {
                    console.error('Error creating habit:', error);
                    new Notice('Failed to create habit');
                }
            },
            onCancel: () => this.close(),
        });
    }
}

export class ModifyHabitModal extends Modal {
    plugin: GOL;
    habit: Habit;
    private titleInput: TitleInput;
    private shortDescriptionInput: ShortDescriptionInput;
    private descriptionInput: DescriptionInput;
    private difficultyInput: DifficultyInput;
    private priorityInput: PriorityInput;
    private categoryInput: CategoryInput;
    private intervalInput: TextComponent;
    private unitInput: TextComponent;

    constructor(app: App, plugin: GOL) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        createHeader(contentEl, 'Modify Habit');
        separator(contentEl);
        subTitle(contentEl, 'General');
        
        this.titleInput = new TitleInput(contentEl, this.habit.title);
        this.shortDescriptionInput = new ShortDescriptionInput(contentEl, this.habit.shortDescription);
        this.descriptionInput = new DescriptionInput(contentEl, this.habit.description);
        this.categoryInput = new CategoryInput(contentEl, this.plugin, this.habit.settings.category);
        
        // Add recurrence inputs
        const recurrenceContainer = contentEl.createDiv({ cls: "recurrence-container" });
        recurrenceContainer.createEl("h4", { text: "Recurrence" });
        
        const intervalContainer = recurrenceContainer.createDiv({ cls: "interval-container" });
        intervalContainer.createEl("label", { text: "Interval" });
        this.intervalInput = new TextComponent(intervalContainer)
            .setValue(this.habit.recurrence.interval.toString());

        const unitContainer = recurrenceContainer.createDiv({ cls: "unit-container" });
        unitContainer.createEl("label", { text: "Unit" });
        this.unitInput = new TextComponent(unitContainer)
            .setValue(this.habit.recurrence.unit);

        const { priorityInput, difficultyInput } = getSettingsInputs(
            contentEl, 
            this.habit.settings.priority, 
            this.habit.settings.difficulty
        );
        this.priorityInput = priorityInput;
        this.difficultyInput = difficultyInput;

        this.createEndButtons(contentEl);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private createEndButtons(contentEl: HTMLElement) {
        endButton({
            version: "edit",
            contentEl: contentEl,
            onSubmit: async () => {
                const formData = {
                    habitId: this.habit.id,
                    title: this.titleInput.getValue().trim(),
                    shortDescription: this.shortDescriptionInput.getValue().trim(),
                    description: this.descriptionInput.getValue().trim(),
                    category: this.categoryInput.getValue().trim(),
                    priority: this.priorityInput.getValue().trim(),
                    difficulty: this.difficultyInput.getValue().trim(),
                    interval: parseInt(this.intervalInput.getValue()) || 1,
                    unit: this.unitInput.getValue().trim() || "days",
                    reward_XP: this.habit.reward?.XP || 10,
                };

                try {
                    await this.plugin.habitService.saveHabitToJSON(formData);
                    new Notice('Habit updated successfully');
                    viewSyncService.emitStateChange({ habitsUpdated: true });
                    this.close();
                } catch (error) {
                    console.error('Error updating habit:', error);
                    new Notice('Failed to update habit');
                }
            },
            onDelete: async () => {
                await this.plugin.habitService.handleDelete(this.habit.id);
                this.close();
            },
        });
    }
}
