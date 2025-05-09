import { App, Modal, Notice, ToggleComponent } from "obsidian";
import { TextComponent, ButtonComponent } from "obsidian";
import { DEFAULT_QUEST_SETTINGS } from "../constants/DEFAULT";

interface QuestData {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    reward_XP: number;
}


export class QuestModal extends Modal {
    plugin: any;
    titleInput: TextComponent;
    descriptionInput: TextComponent;
    rewardInput: TextComponent;
    
    constructor(app: App, plugin: any) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl("h2", {text: 'Create New Quest'});
        
        // Quest form container
        const formContainer = contentEl.createDiv({ cls: "quest-form" });
        
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
        
        // XP Reward
        const rewardContainer = formContainer.createDiv({ cls: "form-group" });
        rewardContainer.createEl("label", { text: "XP Reward:" });
        this.rewardInput = new TextComponent(rewardContainer);
        this.rewardInput.setValue("50");
        this.rewardInput.inputEl.setAttribute("type", "number");
        this.rewardInput.inputEl.setAttribute("min", "0");
        this.rewardInput.inputEl.setAttribute("style", "width: 100%;");
        
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
                const title = this.titleInput.getValue().trim();
                const description = this.descriptionInput.getValue().trim();
                const reward = parseInt(this.rewardInput.getValue());
                
                if (!title) {
                    new Notice("Quest title is required!");
                    return;
                }
                
                if (isNaN(reward) || reward < 0) {
                    new Notice("XP reward must be a positive number!");
                    return;
                }
                
                await this.saveQuest(title, description, reward);
                this.close();
            });
            
        // Add some basic styling
        contentEl.createEl("style", {
            text: `
                .quest-form {
                    margin-bottom: 20px;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                .buttons-container {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
            `
        });
    }

    onClose() {
        this.contentEl.empty();
    }

    async saveQuest(title: string, description: string, reward: number) {
        try {
            // Path to quests.json file
            const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
            
            // Check if file exists
            const fileExists = await this.app.vault.adapter.exists(questsPath);
            
            // Initialize quests array
            let quests: QuestData[] = [];
            
            // If file exists, read existing quests
            if (fileExists) {
                const content = await this.app.vault.adapter.read(questsPath);
                quests = JSON.parse(content);
                
                // Ensure quests is an array
                if (!Array.isArray(quests)) {
                    quests = [];
                }
            }
            
            // Create new quest ID (using timestamp to ensure uniqueness)
            const questId = `quest_${Date.now()}`;
            
            // Create new quest object
            const newQuest: QuestData = {
                id: questId,
                title: title,
                description: description || "",
                completed: false,
                reward_XP: reward
            };
            
            // Add to quests array
            quests.push(newQuest);
            
            // Save to file
            await this.app.vault.adapter.write(questsPath, JSON.stringify(quests, null, 2));
            
            new Notice("Quest created successfully!");
            
            // Make sure the directory exists
            const dirPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db`;
            const dirExists = await this.app.vault.adapter.exists(dirPath);
            
            if (!dirExists) {
                // Create directory structure if it doesn't exist
                await this.app.vault.adapter.mkdir(dirPath);
            }
            
        } catch (error) {
            console.error("Error saving quest:", error);
            new Notice("Failed to save quest. Check console for details.");
        }
    }
}






// export class QuestModal extends Modal {
// 	plugin: any;
// 	dataQuest: QuestSettings;

//     constructor(app: App, plugin: any) {
//         super(app);
// 		this.plugin = plugin;
// 		this.dataQuest = plugin.questSetting;
//     }

//     onOpen() { // todo - make the visual of the quest taker
//         const {contentEl} = this;
//         contentEl.createEl("h2", {text: 'Create your quest :'});
// 		// Toggle button to switch between simple and advanced mode
// 		const advancedModeToggle = new ToggleComponent(contentEl)
// 		.setTooltip("Activer/désactiver le mode avancé")
// 		.setValue(false)
// 		.onChange((value) => {
// 			if (value) {
// 				// Advanced mode enabled
// 				const advancedContainer = contentEl.createDiv({ cls: "advanced-mode" });
// 				advancedContainer.createEl("h3", { text: "Paramètres Avancés" });

// 				// Advanced parameters here
// 				const descriptionInput = new TextComponent(advancedContainer);
// 				descriptionInput.setPlaceholder("Description de la quête...");
// 				descriptionInput.inputEl.setAttribute("style", "width: 100%;");

// 				const rewardInput = new TextComponent(advancedContainer);
// 				rewardInput.setPlaceholder("Récompense XP...");
// 				rewardInput.inputEl.setAttribute("type", "number");
// 				rewardInput.inputEl.setAttribute("style", "width: 100%;");

// 				const completedCheckbox = advancedContainer.createEl("label", { text: "Quête terminée ?" });
// 				const completedInput = new TextComponent(completedCheckbox);
// 				completedInput.inputEl.setAttribute("type", "checkbox");
// 			} else {
// 				// Advanced mode disabled
// 				const advancedMode = contentEl.querySelector(".advanced-mode");
// 				if (advancedMode) {
// 					advancedMode.remove();
// 				}
// 			}
// 		});

// 		// text area
//         const textArea = new TextComponent(contentEl);
//         textArea.inputEl.setAttribute("rows", "5");
//         textArea.inputEl.setAttribute("style", "width: 100%; resize: vertical;");
//         textArea.setPlaceholder("Tapez votre nom ici...");

//         // validation button
//         new ButtonComponent(contentEl)
//             .setButtonText("Enregistrer")
//             .onClick(async () => {
//                 const userInput = textArea.getValue().trim();
//                 if (userInput) {
//                     await this.saveToDatabase(userInput);
//                     // await this.saveQuestToDB(userInput);
// 					await this.plugin.saveSettings();
//                     new Notice("Texte enregistré !");
//                 } else {
//                     new Notice("Champ vide !");
//                 }
//                 this.close();
//             });
//     }

//     onClose() {
//         this.contentEl.empty();
//     }

//     async saveToDatabase(text: string) {
// 		// save the text to a markdown file
//         const filePath = "database.md";
//         const fileExists = await this.app.vault.adapter.exists(filePath);

//         let content = `- ${text}\n`;
//         if (fileExists) {
//             const existingContent = await this.app.vault.adapter.read(filePath);
//             content = existingContent + content;
//         }

//         await this.app.vault.adapter.write(filePath, content);
//     }

	// async saveQuestToDB(text: string) {
	// 	// save the quest to quests.json file
	// 	const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
	// 	const fileExists = await this.app.vault.adapter.exists(filePath);

	// 	let content: QuestSettings = { quests: {}, questList: [] };
	// 	if (fileExists) {
	// 		const existingContent = await this.app.vault.adapter.read(filePath);
	// 		content = JSON.parse(existingContent);
	// 	}

	// 	const newQuestId = `quest_${Object.keys(content.quests).length + 1}`;
	// 	const newQuest = {
	// 		...DEFAULT_QUEST_SETTINGS.quests["quest1"],
	// 		name: text,
	// 	};

	// 	// content.quests[newQuestId] = newQuest;
	// 	// content.questList.push(newQuestId);

	// 	const updatedContent = JSON.stringify(content, null, 2);

	// 	await this.app.vault.adapter.write(filePath, updatedContent);
	// }
// }
