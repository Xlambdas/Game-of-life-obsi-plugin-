import { App, Modal, Notice, SliderComponent, ToggleComponent } from "obsidian";
import { TextComponent, ButtonComponent } from "obsidian";
import { createRoot } from "react-dom/client";


export interface QuestSettings {
	quests: {
		[questId: string]: {
			name: string;
			description: string;
			completed: boolean;
			reward_XP: number;
			// Add other quest properties as needed
			// e.g., reward_items: string[];
			//       start_date: string; // ISO date string
			//       end_date: string; // ISO date string
			//       prerequisites: string[]; // IDs of prerequisite quests
			//       progress: number; // 0-100% completion
			//       objectives: string[]; // List of objectives to complete
			//       rewards: string[]; // List of rewards for completing the quest
			//       status: "not started" | "in progress" | "completed"; // Current status of the quest
			//       type: "main" | "side"; // Type of quest (main storyline or side quest)
			//       difficulty: "easy" | "medium" | "hard"; // Difficulty level of the quest
			//       location: string; // Location where the quest takes place
			//       tags: string[]; // Tags associated with the quest
			//       notes: string; // Additional notes or lore about the quest
			//       created_at: string; // ISO date string for when the quest was created
			//       updated_at: string; // ISO date string for when the quest was last updated
			//       assigned_to: string; // ID of the user assigned to the quest
			//       priority: "low" | "medium" | "high"; // Priority level of the quest
			//       rewards_claimed: boolean; // Whether the rewards have been claimed
			//       repeatable: boolean; // Whether the quest can be repeated
			//       repeat_interval: string; // Interval for repeating the quest (e.g., "daily", "weekly")
			//       completion_time: number; // Estimated time to complete the quest (in minutes)
			//       completion_date: string; // ISO date string for when the quest was completed
			//       completion_notes: string; // Notes about the quest completion
			//       failure_reason: string; // Reason for quest failure (if applicable)
			//       failure_date: string; // ISO date string for when the quest failed
			//       failure_notes: string; // Notes about the quest failure
			//       rewards_history: { date: string; rewards: string[] }[]; // History of rewards claimed
			//       objectives_completed: { objective: string; date: string }[]; // History of completed objectives
			//       objectives_failed: { objective: string; date: string }[]; // History of failed objectives
			//       objectives_skipped: { objective: string; date: string }[]; // History of skipped objectives
		};
	};
	questList: string[];

}

export const DEFAULT_QUEST_SETTINGS: QuestSettings = {
	quests: {
		quest1: {
			name: "Quest 1",
			description: "Tutorial Quest",
			completed: false,
			reward_XP: 100,
		},
	},
	questList: ["quest1"],
};



export class QuestModal extends Modal {
	plugin: any;
	dataQuest: QuestSettings;

    constructor(app: App, plugin: any) {
        super(app);
		this.plugin = plugin;
		this.dataQuest = plugin.questSetting;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl("h2", {text: 'Create your quest :'});
		// Toggle button to switch between simple and advanced mode
		const advancedModeToggle = new ToggleComponent(contentEl)
		.setTooltip("Activer/désactiver le mode avancé")
		.setValue(false) // État initial : désactivé
		.onChange((value) => {
			if (value) {
				// Mode avancé activé
				const advancedContainer = contentEl.createDiv({ cls: "advanced-mode" });
				advancedContainer.createEl("h3", { text: "Paramètres Avancés" });

				// Add advanced parameters here
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
				// Mode avancé désactivé
				const advancedMode = contentEl.querySelector(".advanced-mode");
				if (advancedMode) {
					advancedMode.remove();
				}
			}
		});

		// Vous pouvez ajouter un texte à côté du toggle
		// contentEl.createEl("span", { text: "Mode Avancé", cls: "toggle-label" }).insertAfter(advancedModeToggle.toggleEl, null);
        // text area
        const textArea = new TextComponent(contentEl);
        textArea.inputEl.setAttribute("rows", "5");
        textArea.inputEl.setAttribute("style", "width: 100%; resize: vertical;");
        textArea.setPlaceholder("Tapez votre nom ici...");

        // Bouton de validation
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
