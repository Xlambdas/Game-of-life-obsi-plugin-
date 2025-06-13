import { Vault } from "obsidian";
import { DataService } from "./services/dataService";
import { Quest } from "data/DEFAULT";
import { v4 as uuid } from 'uuid';


export class AppContextService {
	private static _instance: AppContextService;
	private dataService: DataService;
	// private quests: Quest[] = [];

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

	// DataService methods (for user management)
	getUserData(key: string): any {
		return this.dataService.getUser(key);
	}

	setUserData(key: string, value: any): void {
		this.dataService.setUser(key, value);
	}

	// DataService methods (for quests management)
	getQuests() {
		return this.dataService.getQuests();
	}

	setQuests(quests: Quest[]): void {
		this.dataService.setQuests(quests);
	}
}
