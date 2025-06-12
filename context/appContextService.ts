import React, { createContext, useContext, useState, useEffect } from "react";
import { AppContextType } from "./appContext";
import GOL from "../plugin";
import { viewSyncService } from "services/syncService";
import { Notice } from "obsidian";
import { Quest, UserSettings, Habit  } from "../constants/DEFAULT";
import { XpService } from "services/xpService";
import { DataService } from "services/dataService";
import { DEFAULT_SETTINGS } from "../constants/DEFAULT";


// Singleton service to manage the application context
class AppContextService {
    private static instance: AppContextService;
    private context: AppContextType;
	private _dataService: DataService;
	private _plugin: GOL;
	private _settings: UserSettings;
	private _quests: Quest;
	private _habits: Habit;
	private _xpService: XpService;
	private saveDebounceTimout: NodeJS.Timeout | null = null;
	private readonly SAVE_DELAY: number = 2000; // 2 second delay for saving
	// private _listeners: Set<(context: AppContextType | null) => void> = new Set();

    private constructor() {}

    public static getInstance(): AppContextService {
        if (!AppContextService.instance) {
            AppContextService.instance = new AppContextService();
        }
        return AppContextService.instance;
    }

	get plugin(): GOL {
		return this._plugin;
	}
	get settings(): UserSettings {
		return this._settings;
	}
	get dataService(): DataService {
		return this._dataService;
	}
	get quests(): Quest {
		return this._quests;
	}
	get habits(): Habit {
		return this._habits;
	}
	get xpService(): XpService {
		return this._xpService;
	}

	set plugin(plugin: GOL) {
		this._plugin = plugin;
		console.log("✅ Plugin instance set in AppContextService");
	}

    async initialize(plugin: GOL): Promise<void> {
		this._plugin = plugin;
		this._dataService = new DataService(plugin.app);
		await this._dataService.loadSettings();

		this._settings = this._dataService.settings || plugin.settings;
		this._quests = plugin.quest;
		this._habits = plugin.habit;

		this._xpService = new XpService(plugin.app, plugin);
    }

	getContext(): AppContextType | null {
        return this.context;
    }

	scheduleSave(): void {
		if (this.saveDebounceTimout) {
			clearTimeout(this.saveDebounceTimout);
		}
		this.saveDebounceTimout = setTimeout(() => {
			this.saveUserDataToFile();
		}, this.plugin?.settings.user1.settings.refreshRate);
	}

	private async saveData(): Promise<void> {
		try {
			await Promise.all([
				this.saveUserDataToFile(),
				this.saveQuestDataToFile(),
				this.saveHabitDataToFile()
			]);
			console.log("All data saved successfully");
		} catch (error) {
			console.error("Error saving data:", error);
		}
	}

	async updateUserSettings(newData: Partial<UserSettings>): Promise<void> {
		if (!this._dataService || !this._plugin) {
			console.error("Cannot update user settings: DataService or Plugin instance is not available");
			return;
		}
		try {
			const updatedSettings = this.deepMerge(this._settings || this._plugin.settings, newData);

			this._plugin.settings = updatedSettings;
            this._settings = updatedSettings;
            this._dataService.settings = updatedSettings;

            await this.saveUserDataToFile();

            viewSyncService.emitStateChange(this._settings);
			console.log('Settings updated successfully:', updatedSettings);
		} catch (error) {
			console.error("Error updating user settings:", error);
            await this.loadAllData();
		}
		const updatedSettings = { ...this._plugin.settings, ...newData };
        
        // Mettez à jour toutes les références
        this._plugin.settings = updatedSettings;
        this._settings = updatedSettings;
        this._dataService.settings = updatedSettings;
        
        // Émettez le changement
        viewSyncService.emitStateChange(this._settings);


		await this.saveUserDataToFile();
        
        console.log('Settings updated successfully:', updatedSettings);
		// this._plugin.settings = { ...this._plugin.settings, ...newData };
		// this._settings = this._plugin.settings;
		// this._dataService.settings = this._settings;
        // viewSyncService.emitStateChange(this._settings);
		// this.scheduleSave();
	}
	// Méthode helper pour fusion profonde des objets
    private deepMerge(target: any, source: any): any {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

	// Méthode pour forcer la synchronisation depuis le fichier
    async forceReloadFromFile(): Promise<void> {
        try {
            await this._dataService.loadSettings();
            const fileSettings = this._dataService.settings;
            
            if (fileSettings) {
                this._plugin.settings = fileSettings;
                this._settings = fileSettings;
                viewSyncService.emitStateChange(this._settings);
                console.log('✅ Settings force-reloaded from file');
            }
        } catch (error) {
            console.error('❌ Failed to force reload settings:', error);
        }
    }

	async updateQuestSettings(newData: Partial<Quest>): Promise<void> {
		if (!this._plugin) {
			console.error("Cannot update quest settings: Plugin instance is not available");
			return;
		}
		this._plugin.quest = { ...this._plugin.quest, ...newData };
		this._quests = this._plugin.quest;
		this.scheduleSave();
	}

	async updateHabitSettings(newData: Partial<Habit>): Promise<void> {
		if (!this._plugin) {
			console.error("Cannot update quest settings: Plugin instance is not available");
			return;
		}
		this._plugin.habit = { ...this._plugin.habit, ...newData };
		this._habits = this._plugin.habit;
		this.scheduleSave();
	}

	// Mettre à jour spécifiquement l'XP
    async updateXP(amount: number): Promise<void> {
		if (!this._xpService) {
            console.error("XpService is not available.");
            return;
        }

        try {
            const result = this._xpService.addXp(amount);
            
            // Emit level update if leveled up
            if (result.leveledUp) {
                viewSyncService.emitLevelUpdate(result.level);
            }
            
            // Always emit state change to update UI
            viewSyncService.emitStateChange(this._settings);
            
            // Schedule save
            this.scheduleSave();
            
            console.log(`✅ XP updated: +${amount} (Level: ${result.level}, XP: ${this._xpService.getCurrentXp()})`);
        } catch (error) {
            console.error("❌ Failed to update XP:", error);
        }

        // if (!this._plugin || !this._plugin.settings?.user1?.persona) {
		// 	console.error("Plugin instance or user settings are not available.");
		// 	return;
		// }
		// const persona = this._plugin.settings.user1.persona;

		// const attribute = this._plugin.settings.user1.attribute;
		// const totalAttribute = Object.values(attribute).reduce((sum, val) => sum + (typeof val === "number" ? val : 0), 0);
		// persona.xp = Math.max(0, persona.xp + amount);


		// const calcul = this.CalculLevel(persona.xp, persona.level);
		// persona.level = calcul.level;
		// persona.newXp = calcul.newXp;
		// persona.lvlThreshold = calcul.lvlSeuil;
		// viewSyncService.emitLevelUpdate(persona.level);
		// viewSyncService.emitStateChange(this._settings);

        // // Planifier une sauvegarde
        // this.scheduleSave();
    }

	getCurrentXp(): number {
        return this._xpService?.getCurrentXp() ?? 0;
    }

    getCurrentLevel(): number {
        return this._xpService?.getCurrentLevel() ?? 1;
    }

    setXp(newXp: number): void {
        if (!this._xpService) {
            console.error("❌ XpService is not available.");
            return;
        }

        try {
            const result = this._xpService.setXp(newXp);
            
            if (result.leveledUp) {
                viewSyncService.emitLevelUpdate(result.level);
            }
            
            viewSyncService.emitStateChange(this._settings);
            this.scheduleSave();
        } catch (error) {
            console.error("❌ Failed to set XP:", error);
        }
    }

    resetXp(): void {
        if (!this._xpService) {
            console.error("❌ XpService is not available.");
            return;
        }

        try {
            this._xpService.resetXp();
            viewSyncService.emitStateChange(this._settings);
            this.scheduleSave();
        } catch (error) {
            console.error("❌ Failed to reset XP:", error);
        }
    }

    getXpProgress(): { current: number; needed: number; percentage: number } {
        if (!this._xpService) {
            return { current: 0, needed: 100, percentage: 0 };
        }

        return {
            current: this._xpService.getCurrentXp(),
            needed: this._xpService.getXpForNextLevel(),
            percentage: this._xpService.getProgressToNextLevel()
        };
    }

    // Vérifier si l'utilisateur doit monter de niveau
	// private CalculLevel(xp: number, level: number): { level: number, newXp: number, lvlSeuil: number } {
	// 	if (!this._plugin || !this._plugin.settings?.user1?.persona) return { level, newXp: xp, lvlSeuil: 100 };

	// 	let lvl = 1;
	// 	let seuil = 100;

	// 	while (xp >= seuil) {
	// 		if (lvl === level) {
	// 			new Notice("Level up!");
	// 		}
	// 		xp -= seuil;
	// 		seuil = Math.trunc(seuil * 1.2);
	// 		lvl++;
	// 	}
	// 	return { level: lvl, newXp: xp, lvlSeuil: seuil };
	// }

	async saveUserDataToFile() {
		if (!this.plugin || !this._dataService) {
			console.error("DataService or Plugin instance is not available for saveUserDataToFile.");
			return;
		}

		try {
			await this._dataService.saveSettings();
			await this._plugin?.saveData(this._plugin.settings);
			// await this.saveToVaultFile();

			viewSyncService.emitDataSaved();
		} catch (err) {
			console.error("Failed to save user data:", err);
		}
	}

	async saveQuestDataToFile() {
		if (!this.plugin || !this._dataService) {
			console.error("DataService or Plugin instance is not available for saveQuestDataToFile.");
			return;
		}

		try {
			if (!this._plugin) {
				throw new Error("Plugin instance is not available.");
			}
			const questsArray = Array.isArray(this._plugin.quest) ? this._plugin.quest : [this._plugin.quest];
			await this._dataService.saveQuestsToFile(questsArray);
			await this._plugin.saveData(this._plugin.quest);
		} catch (err) {
			console.error("Failed to save Quest data:", err);
		}
	}

	async saveHabitDataToFile() {
		if (!this._dataService || !this._plugin) {
            console.error("DataService or Plugin instance is not available for saveHabitDataToFile.");
            return;
        }

        try {
            const habitsArray = Array.isArray(this._plugin.habit) ? this._plugin.habit : [this._plugin.habit];
            await this._dataService.saveHabitsToFile(habitsArray);

            await this._plugin.saveData(this._plugin.habit);
		} catch (err) {
			console.error("Failed to save Habit data:", err);
		}
	}

	async loadAllData(): Promise<void> {
        if (!this._dataService) {
            console.error("DataService is not available for loadAllData.");
            return;
        }

        try {
            await this._dataService.loadSettings();
            this._settings = this._dataService.settings;
            
            // Synchroniser avec le plugin
            if (this._plugin) {
                this._plugin.settings = this._settings;
            }
            
            viewSyncService.emitStateChange(this._settings);
            console.log("✅ All data loaded successfully");
        } catch (error) {
            console.error("❌ Failed to load data:", error);
        }
    }

    // Méthodes pour les quests et habits via DataService
    async loadQuests(): Promise<Quest[]> {
        if (!this._dataService) {
            console.error("DataService is not available.");
            return [];
        }
        return await this._dataService.loadQuestsFromFile();
    }

    async loadHabits(): Promise<Habit[]> {
        if (!this._dataService) {
            console.error("DataService is not available.");
            return [];
        }
        return await this._dataService.loadHabitsFromFile();
    }


	private async saveToVaultFile() {
		if (!this.plugin) {
			console.error("Plugin instance is not available for saveToVaultFile.");
			return;
		}

		try {
			const adapter = this.plugin.app.vault.adapter;
			const dbDir = `${this.plugin.app.vault.configDir}/plugins/game-of-life/data/db`;
			await adapter.mkdir(dbDir);

			const path = `${this.plugin.app.vault.configDir}/plugins/game-of-life/data/db/user.json`;
			await adapter.write(path, JSON.stringify(this.plugin.settings, null, 2));
			// console.log("✅ Données utilisateur sauvegardées dans user.json", JSON.stringify(this.plugin.settings, null, 2));
		} catch (err) {
			console.error("Failed to save to user.json :", err);
		}
	}

	// Get and transform refresh rate
	getRefreshRate(): number {
		if (!this._plugin || !this._plugin.settings?.user1?.settings) {
			return 5000; // Default value if settings are not available
		}
		
		const refreshRate = this._plugin.settings.user1.settings.refreshRate;
		
		// Ensure the value is a positive number and within reasonable bounds
		const transformedRate = Math.max(1000, Math.min(300000, refreshRate));
		console.log('Current refresh rate:', transformedRate, 'ms and original value:', refreshRate);
		// If the value is not a number or is invalid, return default
		if (isNaN(transformedRate)) {
			return 5000;
		}
		
		return transformedRate;
	}

	// Update refresh rate and notify all views
	updateRefreshRate(newRate: number): void {
		if (!this._plugin || !this._plugin.settings?.user1?.settings) {
			console.error('Cannot update refresh rate: settings not available');
			return;
		}

		const transformedRate = Math.max(1000, Math.min(300000, newRate));
		if (isNaN(transformedRate)) {
			console.error('Invalid refresh rate value:', newRate);
			return;
		}

		console.log('Updating refresh rate to:', transformedRate);
		this._plugin.settings.user1.settings.refreshRate = transformedRate;
		viewSyncService.emitRefreshRateChange(transformedRate);
		this.scheduleSave();
	}

	async synchronizeSettings(): Promise<void> {
        try {
            await this._dataService.loadSettings();
            const loadedSettings = this._dataService.settings;
            
            if (loadedSettings) {
                this._plugin.settings = loadedSettings;
                this._settings = loadedSettings;
                viewSyncService.emitStateChange(this._settings);
                console.log("✅ Settings synchronized");
            }
        } catch (error) {
            console.error("❌ Failed to synchronize settings:", error);
        }
    }

    // SOLUTION 6: Getter pour toujours obtenir les settings à jour
    get currentSettings(): UserSettings {
        return this._settings || this._plugin?.settings || DEFAULT_SETTINGS;
    }
}

export const appContextService = AppContextService.getInstance();
