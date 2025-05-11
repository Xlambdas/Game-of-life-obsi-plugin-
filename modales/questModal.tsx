import { App, Modal, Notice, ToggleComponent } from "obsidian";
import { TextComponent, ButtonComponent } from "obsidian";
import { DEFAULT_QUEST_SETTINGS, Quest } from "../constants/DEFAULT";
import GOL from "../plugin";

export class QuestModal extends Modal {
    plugin: GOL;
    titleInput: TextComponent;
    descriptionInput: TextComponent;
    rewardInput: TextComponent;
	quest: any;

    constructor(app: App, plugin: GOL) {
        super(app);
        console.log('QuestModal constructor - plugin:', plugin);
        if (!plugin || !(plugin instanceof GOL)) {
            console.error('Invalid plugin instance passed to QuestModal');
            throw new Error('Invalid plugin instance');
        }
        this.plugin = plugin;
		this.quest = this.plugin.quest;
    }

	private getFormData() {
		const title = this.titleInput.getValue().trim();
		const description = this.descriptionInput.getValue().trim();
		const reward = this.rewardInput ? parseInt(this.rewardInput.getValue()) : 0;

		return {
			title,
			description,
			reward
		};
	}

	private normalMode = (advancedContainer: HTMLElement) => {
		// show the form with the title and description for the quests.
		const {contentEl} = this;
		const advancedMode = contentEl.querySelector(".advanced-mode");
		if (advancedMode) {
			advancedMode.remove();
		}

		if (advancedContainer) {
			advancedContainer.empty();
		}
		const formContainer = advancedContainer.createDiv({ cls: "quest-form" });

		// Title
		const titleContainer = formContainer.createDiv({ cls: "form-group" });
		titleContainer.createEl("label", { text: "Title:" });
		this.titleInput = new TextComponent(titleContainer);
		this.titleInput.setPlaceholder("Enter quest title...");
		this.titleInput.inputEl.setAttribute("style", "width: 100%;");

		// Description
		const descriptionContainer = formContainer.createDiv({ cls: "form-group" });
		descriptionContainer.createEl("label", { text: "Description:" });
		this.descriptionInput = new TextComponent(descriptionContainer);
		this.descriptionInput.setPlaceholder("Enter quest description...");
		this.descriptionInput.inputEl.setAttribute("style", "width: 100%; height: 80px;");
	}

	private endButton = () => {
		// show the buttons.
		const {contentEl} = this;
		// Buttons container
		const buttonsContainer = contentEl.createDiv({ cls: "buttons-container" });
		// Cancel button
		new ButtonComponent(buttonsContainer)
			.setButtonText("Cancel")
			.onClick(() => {
				this.close();
			});

		// Save button
		new ButtonComponent(buttonsContainer)
			.setButtonText("Save Quest")
			.setCta()
			.onClick(async () => {
				const { title, description, reward } = this.getFormData();
				if (!title) {
					new Notice("Quest title is required!");
					return;
				}

				if (isNaN(reward) || reward < 0) {
					new Notice("XP reward must be a positive number!");
					return;
				}

				if (!this.plugin?.questService) {
					return;
				}

				try {
					await this.plugin.questService.saveQuestToJSON(title, description, reward);
					this.close();
				} catch (error) {
					console.error("Error saving quest:", error);
					new Notice("Failed to save quest. Check console for details.");
				}
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

        const advancedModeToggle = new ToggleComponent(headerContainer)
            .setTooltip("Show/hide supplementary settings")
            .setValue(false)
            .onChange((value) => {
                mainContainer.empty();
                if (value) {
                    // Advanced mode
                    const advancedContainer = mainContainer.createDiv({ cls: "advanced-mode" });
                    advancedContainer.createEl("h3", { text: "Supplementary settings" });
                    // Title
                    const titleContainer = advancedContainer.createDiv({ cls: "form-group" });
                    titleContainer.createEl("label", { text: "Title:" });
                    this.titleInput = new TextComponent(titleContainer);
                    this.titleInput.setPlaceholder("Enter quest title...");
                    this.titleInput.inputEl.setAttribute("style", "width: 100%;");

                    // Description
                    const descriptionContainer = advancedContainer.createDiv({ cls: "form-group" });
                    descriptionContainer.createEl("label", { text: "Description:" });
                    this.descriptionInput = new TextComponent(descriptionContainer);
                    this.descriptionInput.setPlaceholder("Enter quest description...");
                    this.descriptionInput.inputEl.setAttribute("style", "width: 100%; height: 80px;");

                    // XP Reward
                    const rewardContainer = advancedContainer.createDiv({ cls: "form-group" });
                    rewardContainer.createEl("label", { text: "XP Reward:" });
                    this.rewardInput = new TextComponent(rewardContainer);
                    this.rewardInput.setValue("50");
                    this.rewardInput.inputEl.setAttribute("type", "number");
                    this.rewardInput.inputEl.setAttribute("min", "0");
                    this.rewardInput.inputEl.setAttribute("style", "width: 100%;");
                } else {
                    // Normal mode
                    const normalContainer = mainContainer.createDiv({ cls: "normal-mode" });
                    this.normalMode(normalContainer);
                }
            });

		this.endButton();
    }

    onClose() {
        this.contentEl.empty();
    }
}
