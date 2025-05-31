import { App, TFile, Notice } from 'obsidian';
import { UserSettings, DEFAULT_SETTINGS, Quest, StatBlock } from '../constants/DEFAULT';
import { pathUserDB } from "../constants/paths";

export class DataService {
    app: App;
    settings: UserSettings;
    private quests: Quest[] = [];

    constructor(app: App) {
        this.app = app;
    }

    async loadSettings() {
        await this.loadUser();
        await this.loadQuests();
        // await this.syncCompletedQuests();
    }

    async loadUser() {
        try {
            const pathUserDB = `${this.app.vault.configDir}/plugins/game-of-life/data/db/user.json`;
            const content = await this.app.vault.adapter.read(pathUserDB);
            this.settings = JSON.parse(content);
        } catch (error) {
            // If file doesn't exist, create it with default structure
            try {
                const dirPath = pathUserDB.substring(0, pathUserDB.lastIndexOf('/'));
                await this.app.vault.adapter.mkdir(dirPath);
                this.settings = DEFAULT_SETTINGS;
                await this.app.vault.adapter.write(pathUserDB, JSON.stringify(this.settings, null, 2));
            } catch (createError) {
                console.error("Error creating user data file:", createError);
                throw createError;
            }
        }
    }

    async loadQuests(): Promise<Quest[]> {
        try {
            const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
            const content = await this.app.vault.adapter.read(questsPath);
            this.quests = JSON.parse(content);
            return this.quests;
        } catch (error) {
            console.error("Error loading quests:", error);
            return [];
        }
    }

    async saveSettings() {
        try {
            const pathUserDB = `${this.app.vault.configDir}/plugins/game-of-life/data/db/user.json`;
            await this.app.vault.adapter.write(pathUserDB, JSON.stringify(this.settings, null, 2));
        } catch (error) {
            console.error("Error saving settings:", error);
            new Notice("Failed to save settings");
        }
    }

    async saveQuestsToFile(quests: Quest[]): Promise<void> {
        try {
            const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
            await this.app.vault.adapter.write(questsPath, JSON.stringify(quests, null, 2));
            // this.quests = quests;
            // await this.syncCompletedQuests();
        } catch (error) {
            console.error("Error saving quests:", error);
            throw error;
        }
    }

    async loadQuestsFromFile(): Promise<Quest[]> {
        try {
            const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
            const content = await this.app.vault.adapter.read(questsPath);
            const quests = JSON.parse(content);
            // this.quests = quests;
            // await this.syncCompletedQuests();
            return quests;
        } catch (error) {
            console.error("Error loading quests:", error);
            return [];
        }
    }

//     private async syncCompletedQuests() {
//         if (!this.settings || !this.quests) return;

//         // Update quests with completion status from user settings
//         this.quests = this.quests.map(quest => ({
//             ...quest,
//             progression: {
//                 ...quest.progression,
//                 isCompleted: this.settings.user1.completedQuests.includes(quest.id)
//             }
//         }));

//         // Update user settings with completion status from quests
//         this.settings.user1.completedQuests = this.quests
//             .filter(quest => quest.progression.isCompleted)
//             .map(quest => quest.id);

//         // Save both updates
//         await this.saveSettings();
//         await this.saveQuestsToFile(this.quests);
//     }
}
