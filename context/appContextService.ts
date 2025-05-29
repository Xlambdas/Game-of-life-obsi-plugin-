import React, { createContext, useContext, useState, useEffect } from "react";
import { AppContextType } from "./appContext";
import GOL from "../plugin";
import { viewSyncService } from "services/syncService";
import { Notice } from "obsidian";
import { Quest, UserSettings, Habit  } from "../constants/DEFAULT";


// Singleton service to manage the application context
class AppContextService {
    private static instance: AppContextService;
    private context: AppContextType | null = null;
	private _plugin: GOL | null = null;
	private _settings: UserSettings | null = null;
	private _quests: Quest | null = null;
	private _habits: Habit | null = null;
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

	get plugin(): GOL | null {
		return this._plugin;
	}
	get settings(): UserSettings | null {
		return this._settings;
	}
	get quests(): Quest | null {
		return this._quests;
	}
	get habits(): Habit | null {
		return this._habits;
	}
	set plugin(plugin: GOL | null) {
		this._plugin = plugin;
		console.log("✅ Plugin instance set in AppContextService");
	}

    initialize(plugin: GOL): void {
		this._plugin = plugin;
		this._settings = plugin.settings;
		this._quests = plugin.quest;
		this._habits = plugin.habit;
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

	updateUserSettings(newData: Partial<UserSettings>): void {
		if (!this._plugin) {
			console.error("❌ Cannot update user settings: Plugin instance is not available");
			return;
		}

		this._plugin.settings = { ...this._plugin.settings, ...newData };
		this._settings = this._plugin.settings;
		this._quests = this._plugin.quest;
		this._habits = this._plugin.habit;
        viewSyncService.emitStateChange(this._settings);
		this.scheduleSave();
	}

	updateQuestSettings(newData: Partial<Quest>): void {
		if (!this._plugin) {
			console.error("❌ Cannot update quest settings: Plugin instance is not available");
			return;
		}
		this._plugin.quest = { ...this._plugin.quest, ...newData };
		this._quests = this._plugin.quest;
		this.scheduleSave();
	}
	updateHabitSettings(newData: Partial<Habit>): void {
		if (!this._plugin) {
			console.error("❌ Cannot update quest settings: Plugin instance is not available");
			return;
		}
		this._plugin.habit = { ...this._plugin.habit, ...newData };
		this._habits = this._plugin.habit;
		this.scheduleSave();
	}

	// Mettre à jour spécifiquement l'XP
    async updateXP(amount: number): Promise<void> {
        if (!this._plugin || !this._plugin.settings?.user1?.persona) {
			console.error("Plugin instance or user settings are not available.");
			return;
		}
		const persona = this._plugin.settings.user1.persona;

		persona.xp = Math.max(0, persona.xp + amount);


		const calcul = this.CalculLevel(persona.xp, persona.level);
		persona.level = calcul.level;
		persona.newXp = calcul.newXp;
		persona.lvlThreshold = calcul.lvlSeuil;
		viewSyncService.emitLevelUpdate(persona.level);
		viewSyncService.emitStateChange(this._settings);

        // Planifier une sauvegarde
        this.scheduleSave();
    }

    // Vérifier si l'utilisateur doit monter de niveau
	private CalculLevel(xp: number, level: number): { level: number, newXp: number, lvlSeuil: number } {
		if (!this._plugin || !this._plugin.settings?.user1?.persona) return { level, newXp: xp, lvlSeuil: 100 };

		let lvl = 1;
		let seuil = 100;

		while (xp >= seuil) {
			if (lvl === level) {
				new Notice("Level up!");
			}
			xp -= seuil;
			seuil = Math.trunc(seuil * 1.2);
			lvl++;
		}
		return { level: lvl, newXp: xp, lvlSeuil: seuil };
	}

	async saveUserDataToFile() {
		if (!this.plugin) {
			console.error("Plugin instance is not available for saveUserDataToFile.");
			return;
		}

		try {
			await this.plugin.saveData(this.plugin.settings);
			// console.log("✅ Données utilisateur sauvegardées dans game_data.json");
			this.saveToVaultFile();
			viewSyncService.emitDataSaved();
		} catch (err) {
			console.error("❌ Échec de la sauvegarde :", err);
		}
	}

	async saveQuestDataToFile() {
		if (!this.plugin) {
			console.error("Plugin instance is not available for saveQuestDataToFile.");
			return;
		}

		try {
			await this.plugin.saveData(this.plugin.quest);
		} catch (err) {
			console.error("❌ Échec de la sauvegarde :", err);
		}
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
			console.log("✅ Données utilisateur sauvegardées dans user.json", JSON.stringify(this.plugin.settings, null, 2));
		} catch (err) {
			console.error("❌ Échec de la sauvegarde dans user.json :", err);
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
}

export const appContextService = AppContextService.getInstance();
