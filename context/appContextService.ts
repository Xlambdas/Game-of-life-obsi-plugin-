import { Vault } from "obsidian";
import { DataService } from "./services/dataService";
import { Quest } from "data/DEFAULT";
import { v4 as uuid } from 'uuid';


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

	// DataService methods (for user management)
	getUserData(): any {
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

	// DataService methods (for quests management)
	getQuests() {
		return this.dataService.getQuests();
	}

	setQuests(quests: Quest[]): void {
		this.dataService.setQuests(quests);
	}
}
