import { Vault } from "obsidian";
import { DataService } from "./services/dataService";
import { Quest } from "data/DEFAULT";
import { v4 as uuid } from 'uuid';
import { UserSettings } from "data/DEFAULT";


export class AppContextService {
	private static _instance: AppContextService;
	private dataService: DataService;

	private constructor(vault: Vault) {
		this.dataService = new DataService(vault);
	}

	static async init(vault: Vault) {
		const instance = new AppContextService(vault);
		await instance.dataService.load();
		this._instance = instance;
	}

	static getInstance(): AppContextService {
		if (!this._instance) {
			throw new Error("AppContextService is not initialized");
		}
		return this._instance;
	}

	// data management methods
	async get(key: 'user' | 'quests') {
		if (key !== 'user' && key !== 'quests') {
			throw new Error(`Invalid key: ${key}. Expected 'user' or 'quests'.`);
		}
		if (key === 'quests') {
			return this.dataService.getQuests();
		}
		if (key === 'user') {
			return this.dataService.getUser();
		}
		throw new Error(`Unknown key: ${key}`);
	}

	getUser(): UserSettings {
		return this.dataService.getUser();
	}


	setUserData(key: string, value: any): void {
		this.dataService.setUser(key, value);
	}

	reloadUserData(): void {
		this.dataService.loadUser().catch(err => {
			console.error("Failed to reload user data:", err);
		});
	}

	updateUserData(newData: Partial<UserSettings>): void {
		this.dataService.updateUser(newData);
	}

	setQuests(quests: Quest[]): void {
		this.dataService.setQuests(quests);
	}
	getQuests(): Record<string, Quest> {
		return this.dataService.getQuests();
	}
}
