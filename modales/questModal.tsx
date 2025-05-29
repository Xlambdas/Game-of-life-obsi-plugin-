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
import { getFormData, validateQuestFormData } from "components/questHelpers";
import { QuestFormData, FormInputs, RewardsSection } from "../types/quest";
import { QuestFormManager } from "../data/managers/formManager";

// Version : cursor

export class CreateQuestModal extends Modal {
	private plugin: GOL;
	private formManager: QuestFormManager;

	constructor(app: App, plugin: GOL) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const headerEl = contentEl.createDiv({ cls: "header-container" });
		createHeader(headerEl, 'Create New Quest');
		const formContainer = contentEl.createDiv({ cls: "quest-form" });
		this.formManager = new QuestFormManager(formContainer, headerEl, this.plugin)
		this.createEndButtons(contentEl);
	}

	onClose() {
		this.contentEl.empty();
	}

	private createEndButtons(contentEl: HTMLElement) {
		endButton({
			version: 'create',
			contentEl: contentEl,
			onSubmit: async () => {
				const formData = this.formManager.getFormData();
				await this.plugin.questService.saveQuestToJSON(formData);
				this.close();
			},
			onCancel: () => this.close(),
		});
	}
}




// -------------------------------------------------------
// quest modification modal
// -------------------------------------------------------

export class ModifyQuestModal extends Modal {
	plugin: GOL;
	quest: Quest;
	private formManager: QuestFormManager;

	constructor(app: App, plugin: GOL) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const headerEl = contentEl.createDiv({ cls: "header-container" });
		createHeader(headerEl, 'Modify Quest');
		const formContainer = contentEl.createDiv({ cls: "quest-form" });
		this.formManager = new QuestFormManager(formContainer, headerEl, this.plugin, this.quest);
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
				await this.plugin.questService.handleSave(this.quest, formData);
				this.close();
			},
			onDelete: async () => {
				await this.plugin.questService.handleDelete(this.quest.id);
				new Notice(`Quest "${this.quest.title}" deleted successfully.`);
				this.close()
			},
		});
	}
}
