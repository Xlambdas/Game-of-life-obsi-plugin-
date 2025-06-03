import { App, TFile, Notice } from 'obsidian';
import { UserSettings, DEFAULT_SETTINGS, Quest, StatBlock, Habit } from '../constants/DEFAULT';
import { pathUserDB } from "../constants/paths";

export class DataService {
    app: App;
    settings: UserSettings;
    private quests: Quest[] = [];
	private habits: Habit[] = [];

    constructor(app: App) {
        this.app = app;
    }

    async loadSettings() {
        await this.loadUser();
        await this.loadQuests();
		await this.loadHabits();
        // await this.syncCompletedQuests();
    }

    async loadUser() {
        try {
            const pathUserDB = `${this.app.vault.configDir}/plugins/game-of-life/data/db/user.json`;
            const content = await this.app.vault.adapter.read(pathUserDB);
            this.settings = JSON.parse(content);
            return this.settings;
        } catch (error) {
            // If file doesn't exist, create it with default structure
            try {
                const dirPath = pathUserDB.substring(0, pathUserDB.lastIndexOf('/'));
                await this.app.vault.adapter.mkdir(dirPath);
                this.settings = DEFAULT_SETTINGS;
                await this.app.vault.adapter.write(pathUserDB, JSON.stringify(this.settings, null, 2));
                return this.settings;
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

	async loadHabits(): Promise<Habit[]> {
		try {
			const habitsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/habits.json`;
			const content = await this.app.vault.adapter.read(habitsPath);
			this.habits = JSON.parse(content);
			return this.habits;
		} catch (error) {
			console.error("Error loading habits:", error);
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
            return quests;
        } catch (error) {
            console.error("Error loading quests:", error);
            return [];
        }
    }

	async saveHabitsToFile(habits: Habit[]): Promise<void> {
		try {
			const habitsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/habits.json`;
			await this.app.vault.adapter.write(habitsPath, JSON.stringify(habits, null, 2));
			this.habits = habits;
		} catch (error) {
			console.error("Error saving habits:", error);
			throw error;
		}
	}
	
	async loadHabitsFromFile(): Promise<Habit[]> {
		try {
			const habitsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/habits.json`;
			const content = await this.app.vault.adapter.read(habitsPath);
			const habits = JSON.parse(content);
			this.habits = habits;
			return habits;
		} catch (error) {
			console.error("Error loading habits:", error);
			return [];
		}
	}

}
