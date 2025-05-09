import { App, TFile } from 'obsidian';
import { UserSettings, DEFAULT_SETTINGS } from '../constants/DEFAULT';

import { pathUserDB } from "../constants/paths";

export class DataService {
    app: App;
    settings: UserSettings;
    // questSetting: testQuestSettings;

    constructor(app: App) {
        this.app = app;
        this.settings = { ...DEFAULT_SETTINGS };
        // this.questSetting = { ...DEFAULT_TEST_QUEST_SETTINGS };
    }

    async loadSettings() {
        // Load all the data and the settings
        await this.loadUserSettings();
        // await this.loadQuestSettings();
    }

    async loadUserSettings() {
        // Load the data in the file user.json
        const path = `${this.app.vault.configDir}${pathUserDB}`;
        try {
            if (await this.app.vault.adapter.exists(path)) {
                const content = await this.app.vault.adapter.read(path);
                const parsed = JSON.parse(content);
                this.settings = { ...DEFAULT_SETTINGS, ...parsed };
                console.log("✅ user.json chargé :", this.settings);
                return this.settings;
            } else {
                console.warn("user.json introuvable, création avec défauts.");
                this.settings = { ...DEFAULT_SETTINGS };
                return this.settings;
            }
        } catch (err) {
            console.error("❌ Erreur loadUserSettings :", err);
            this.settings = { ...DEFAULT_SETTINGS };
            return this.settings;
        }
    }

    // async loadQuestSettings() {
    //     // Load the data in the file quests.json
    //     const path = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
    //     try {
    //         if (await this.app.vault.adapter.exists(path)) {
    //             const content = await this.app.vault.adapter.read(path);
    //             const parsed = JSON.parse(content);
    //             this.questSetting = { ...DEFAULT_QUEST_SETTINGS, ...parsed };
    //             console.log("✅ quests.json chargé :", this.questSetting);
    //             return this.questSetting;
    //         } else {
    //             console.warn("quests.json introuvable, création avec défauts.");
    //             this.questSetting = { ...DEFAULT_TEST_QUEST_SETTINGS };
    //             return this.questSetting;
    //         }
    //     } catch (err) {
    //         console.error("❌ Erreur loadQuestSettings :", err);
    //         this.questSetting = { ...DEFAULT_TEST_QUEST_SETTINGS };
    //         return this.questSetting;
    //     }
    // }

    async saveSettings() {
        // save all the data and the settings in user.json and then in quests.json
        const path = `${this.app.vault.configDir}/plugins/game-of-life/data/db/user.json`;
        await this.app.vault.adapter.write(path, JSON.stringify(this.settings, null, 2));

        // const pathQuest = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
        // await this.app.vault.adapter.write(pathQuest, JSON.stringify(this.questSetting, null, 2));
		// console.log("Data user save.")
    }

    async openFile(filePath: string) {
        // Open the file in the editor
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file instanceof TFile) {
            this.app.workspace.openLinkText(filePath, "", true);
        } else {
            console.log("Fichier introuvable :", filePath);
        }
    }
}
