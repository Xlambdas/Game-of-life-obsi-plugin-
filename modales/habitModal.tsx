import { App, Modal, Notice, ToggleComponent } from "obsidian";
import { TextComponent, ButtonComponent } from "obsidian";
import GOL from "../plugin";
import { Habit } from '../constants/DEFAULT';
import { viewSyncService } from '../services/syncService';
import { TitleInput, ShortDescriptionInput, DescriptionInput, CategoryInput, PriorityInput, DifficultyInput, RecurrenceUnitInput, RecurrenceIntervalInput } from "../components/inputs";
import { separator, createHeader, titleSection, subTitle, endButton } from "../components/uiHelpers";
import { getSettingsInputs } from "components/formHelpers";
import { getFormData, HabitFormData } from "components/habitFormHelpers";
import { HabitFormManager } from "data/managers/formManager";


export class CreateHabitModal extends Modal {
    private plugin: GOL;
	private formManager: HabitFormManager;

    constructor(app: App, plugin: GOL) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        const headerEl = contentEl.createDiv({ cls: "header-container" });
        createHeader(headerEl, 'Create New Habit');
        const formContainer = contentEl.createDiv({ cls: "form" });
        this.formManager = new HabitFormManager(formContainer, headerEl, this.plugin);
        this.createEndButtons(contentEl);
    }

    onClose() {
        this.contentEl.empty();
    }

    private createEndButtons(contentEl: HTMLElement) {
        endButton({
            version: "create",
            contentEl: contentEl,
            onSubmit: async () => {
                const formData = this.formManager.getFormData();
                if (!this.formManager.validateForm(formData)) {return; }
				await this.plugin.habitService.saveHabitToJSON(formData);
				this.close();
            },
			onCancel: () => this.close(),
		});
    }
}



/*
* Create a modal to modify the selected quest.
*/

export class ModifyHabitModal extends Modal {
    plugin: GOL;
    habit: Habit;
	private formManager: HabitFormManager;

    constructor(app: App, plugin: GOL) {
        super(app);
        this.plugin = plugin;
    }

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		const headerEl = contentEl.createDiv({ cls: "header-container" });
		createHeader(headerEl, 'Modify Habit');
		const formContainer = contentEl.createDiv({ cls: "form" });
		this.formManager = new HabitFormManager(formContainer, headerEl, this.plugin, this.habit);
		this.createEndButtons(contentEl);
	}

	onClose() {
		this.contentEl.empty();
	}

	private createEndButtons(contentEl: HTMLElement) {
		endButton({
			version: 'edit',
			contentEl: contentEl,
			onSubmit: async () => {
				const formData = this.formManager.getFormData();
				await this.plugin.habitService.handleSave(this.habit, formData);
				this.close();
			},
			onDelete: async () => {
				await this.plugin.habitService.handleDelete(this.habit.id);
				new Notice(`Habit "${this.habit.title}" deleted successfully.`);
				this.close()
			},
		});
	}
}
