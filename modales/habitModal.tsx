import { App, Modal, Notice, ToggleComponent } from "obsidian";
import { TextComponent, ButtonComponent } from "obsidian";
import GOL from "../plugin";
import { Habit } from '../constants/DEFAULT';
import { viewSyncService } from '../services/syncService';
import { TitleInput, ShortDescriptionInput, DescriptionInput, CategoryInput, PriorityInput, DifficultyInput } from "../components/inputs";
import { separator, createHeader, titleSection, subTitle } from "../components/uiHelpers";
import { endButton } from "../components/questUI";
import { getDescrInput, getSettingsInputs } from "components/formHelpers";
import { getFormData } from "components/questHelpers";

export class CreateHabitModal extends Modal {
    private plugin: GOL;
    private titleInput: TitleInput;
    private shortDescriptionInput: ShortDescriptionInput;
    private descriptionInput: DescriptionInput;
    private difficultyInput: DifficultyInput;
    private priorityInput: PriorityInput;
    private categoryInput: CategoryInput;

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
        // this.createEndButtons(contentEl);
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
    }

    // private createEndButtons(contentEl: HTMLElement) {
    //     endButton({
	// 		version: "create",
    //         contentEl: contentEl,
    //         plugin: {
    //             questService: {
    //                 saveQuestToJSON: (
    //                     title: string,
    //                     shortDescription: string,
    //                     description: string,
    //                     reward_XP: number,
    //                     require_level: number,
    //                     require_previousQuests: string,
    //                     difficulty: string,
    //                     category: string,
	// 					dueDate: Date | undefined,
    //                     priority: string,
    //                     questId: string,
    //                     attributeRewards: any
    //                 ) => {
    //                     // Create a new habit object
    //                     const habit: Habit = {
    //                         id: `Habit_${Date.now()}`,
    //                         title,
    //                         shortDescription,
    //                         description,
    //                         created_at: new Date(),
    //                         settings: {
    //                             type: 'habit',
    //                             category: category as any,
    //                             priority: priority as any,
    //                             difficulty: difficulty as any,
    //                             isSecret: false,
    //                             isTimeSensitive: false,
    //                         },
    //                         recurrence: {
    //                             interval: 1,
    //                             unit: 'days',
    //                         },
    //                         streak: {
    //                             current: 0,
    //                             best: 0,
    //                             history: [],
    //                         },
    //                         penalty: {
    //                             XPLoss: 0,
    //                             breackStreak: false,
    //                         },
    //                         reward: {
    //                             XP: reward_XP,
    //                             attributes: attributeRewards,
    //                             items: [],
    //                         },
    //                         isSystemHabit: false,
    //                     };

    //                     // Save the habit
    //                     return this.plugin.questService.saveQuestToJSON(
    //                         title,
    //                         shortDescription,
    //                         description,
    //                         reward_XP,
    //                         require_level,
    //                         require_previousQuests,
    //                         difficulty,
    //                         category,
    //                         undefined,
    //                         priority,
    //                         habit.id,
    //                         attributeRewards
    //                     );
    //                 }
    //             }
    //         },
    //         close: () => this.close(),
            // getFormData: () => {
            //     const formData = getFormData({
            //         titleInput: this.titleInput,
            //         shortDescriptionInput: this.shortDescriptionInput,
            //         descriptionInput: this.descriptionInput,
            //         priorityInput: this.priorityInput,
            //         difficultyInput: this.difficultyInput,
            //         categoryInput: this.categoryInput,
            //     });
            //     return formData;
    //         }
    //     });
    // }
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
        const { priorityInput, difficultyInput } = getSettingsInputs(contentEl, this.habit.settings.priority, this.habit.settings.difficulty);
        this.priorityInput = priorityInput;
        this.difficultyInput = difficultyInput;
        this.endButton(contentEl);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private endButton(contentEl: HTMLElement) {
        const buttonContainer = contentEl.createDiv({cls: "button-container"});
        const flexContainer = buttonContainer.createDiv({ cls: "buttons-flex-container" });
        const noteContainer = flexContainer.createDiv({ cls: "required-note-container" });
        noteContainer.createEl("p", { text: '* Required fields', cls: 'required-note' });

        const buttonsGroup = flexContainer.createDiv({ cls: "buttons-group" });

        new ButtonComponent(buttonsGroup)
            .setButtonText("save")
            .onClick(async () => {
                try {
                    // Create updated habit object
                    const updatedHabit: Habit = {
                        ...this.habit,
                        title: this.titleInput.getValue().trim(),
                        shortDescription: this.shortDescriptionInput.getValue().trim(),
                        description: this.descriptionInput.getValue().trim(),
                        settings: {
                            ...this.habit.settings,
                            category: this.categoryInput.getValue().trim() as any,
                            priority: this.priorityInput.getValue().trim() as any,
                            difficulty: this.difficultyInput.getValue().trim() as any,
                        }
                    };

                    new Notice('Habit updated successfully');
                    viewSyncService.emitStateChange({ questsUpdated: true });
                    this.close();
                } catch (error) {
                    console.error('Error saving habit:', error);
                    new Notice('Failed to save habit changes');
                }
            });

        new ButtonComponent(buttonsGroup)
            .setButtonText("Delete")
            .setWarning()
            .onClick(async () => {
                if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
                    try {
                        const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
                        const content = await this.app.vault.adapter.read(questsPath);
                        const quests = JSON.parse(content);
                        
                        const updatedQuests = quests.filter((q: any) => q.id !== this.habit.id);
                        
                        await this.app.vault.adapter.write(questsPath, JSON.stringify(updatedQuests, null, 2));
                        
                        new Notice('Habit deleted successfully');
                        viewSyncService.emitStateChange({ questsUpdated: true });
                        this.close();
                    } catch (error) {
                        console.error('Error deleting habit:', error);
                        new Notice('Failed to delete habit');
                    }
                }
            });
    }
}
