import { App, Modal, Notice, ToggleComponent } from "obsidian";
import { TextComponent, ButtonComponent } from "obsidian";
import { QuestSettings, DEFAULT_QUEST_SETTINGS } from "../constants/DEFAULT";

export class QuestModal extends Modal {
	plugin: any;
	dataQuest: QuestSettings;

    constructor(app: App, plugin: any) {
        super(app);
		this.plugin = plugin;
		this.dataQuest = plugin.questSetting;
    }

    onOpen() { // todo - make the visual of the quest taker
        const {contentEl} = this;
        contentEl.createEl("h2", {text: 'Create your quest :'});
		// Toggle button to switch between simple and advanced mode
		const advancedModeToggle = new ToggleComponent(contentEl)
		.setTooltip("Activer/désactiver le mode avancé")
		.setValue(false)
		.onChange((value) => {
			if (value) {
				// Advanced mode enabled
				const advancedContainer = contentEl.createDiv({ cls: "advanced-mode" });
				advancedContainer.createEl("h3", { text: "Paramètres Avancés" });

				// Advanced parameters here
				const descriptionInput = new TextComponent(advancedContainer);
				descriptionInput.setPlaceholder("Description de la quête...");
				descriptionInput.inputEl.setAttribute("style", "width: 100%;");

				const rewardInput = new TextComponent(advancedContainer);
				rewardInput.setPlaceholder("Récompense XP...");
				rewardInput.inputEl.setAttribute("type", "number");
				rewardInput.inputEl.setAttribute("style", "width: 100%;");

				const completedCheckbox = advancedContainer.createEl("label", { text: "Quête terminée ?" });
				const completedInput = new TextComponent(completedCheckbox);
				completedInput.inputEl.setAttribute("type", "checkbox");
			} else {
				// Advanced mode disabled
				const advancedMode = contentEl.querySelector(".advanced-mode");
				if (advancedMode) {
					advancedMode.remove();
				}
			}
		});

		// text area
        const textArea = new TextComponent(contentEl);
        textArea.inputEl.setAttribute("rows", "5");
        textArea.inputEl.setAttribute("style", "width: 100%; resize: vertical;");
        textArea.setPlaceholder("Tapez votre nom ici...");

        // validation button
        new ButtonComponent(contentEl)
            .setButtonText("Enregistrer")
            .onClick(async () => {
                const userInput = textArea.getValue().trim();
                if (userInput) {
                    await this.saveToDatabase(userInput);
                    await this.saveQuestToDB(userInput);
					await this.plugin.saveSettings();
                    new Notice("Texte enregistré !");
                } else {
                    new Notice("Champ vide !");
                }
                this.close();
            });
    }

    onClose() {
        this.contentEl.empty();
    }

    async saveToDatabase(text: string) {
		// save the text to a markdown file
        const filePath = "database.md";
        const fileExists = await this.app.vault.adapter.exists(filePath);

        let content = `- ${text}\n`;
        if (fileExists) {
            const existingContent = await this.app.vault.adapter.read(filePath);
            content = existingContent + content;
        }

        await this.app.vault.adapter.write(filePath, content);
    }

	async saveQuestToDB(text: string) {
		// save the quest to quests.json file
		const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
		const fileExists = await this.app.vault.adapter.exists(filePath);

		let content: QuestSettings = { quests: {}, questList: [] };
		if (fileExists) {
			const existingContent = await this.app.vault.adapter.read(filePath);
			content = JSON.parse(existingContent);
		}

		const newQuestId = `quest_${Object.keys(content.quests).length + 1}`;
		const newQuest = {
			...DEFAULT_QUEST_SETTINGS.quests["quest1"],
			name: text,
		};

		content.quests[newQuestId] = newQuest;
		content.questList.push(newQuestId);

		const updatedContent = JSON.stringify(content, null, 2);

		await this.app.vault.adapter.write(filePath, updatedContent);
	}
}
