import { Vault } from "obsidian";
import { DataService } from "./services/dataService";
import { Quest } from "data/DEFAULT";
import { v4 as uuid } from 'uuid';
import { UserSettings } from "data/DEFAULT";
import { App } from "obsidian";

// gérer la data globale, CRUD, sauvegarde/reload, accès aux services (dataService, questService, etc.).
// Ce fichier ne doit pas toucher à React ni à l’UI.

export class AppContextService {
	private static _instance: AppContextService;
	private dataService: DataService;
	private app: App;

	private constructor(vault: Vault, app: App) {
		this.dataService = new DataService(vault);
		this.app = app;
	}

	public getApp(): App {
		return this.app;
	}

	static async init(vault: Vault, app: App) {
		const instance = new AppContextService(vault, app);
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

	updateUserData(newData: Partial<UserSettings>): Promise<void> {
		return this.dataService.updateUser(newData);
	}

	setQuests(quests: Quest[]): void {
		this.dataService.setQuests(quests);
	}
	async getQuests(): Promise<Record<string, Quest>> {
		return this.dataService.getQuests();
	}
	addQuest(quest: Quest): Promise<void> {
		return this.dataService.addQuest(quest);
	}
	async updateQuest(updatedQuest: Quest): Promise<void> {
		const questsObj = await this.getQuests();
		const questsArr = Object.values(questsObj);
		const index = questsArr.findIndex(q => q.id === updatedQuest.id);
		if (index === -1) {
			return Promise.reject(new Error(`Quest with id ${updatedQuest.id} does not exist`));
		}
		questsArr[index] = updatedQuest;
		// Convert array back to object for storage
		const updatedQuestsObj: Record<string, Quest> = {};
		for (const quest of questsArr) {
			updatedQuestsObj[quest.id] = quest;
		}
		return this.dataService.setQuests(updatedQuestsObj);
	}
	// 	const existingQuests = await this.dataService.getQuests();
	// 	if (!existingQuests[updatedQuest.id]) {
	// 		return Promise.reject(new Error(`Quest with id ${updatedQuest.id} does not exist`));
	// 	}
	// 	existingQuests[updatedQuest.id] = updatedQuest;
	// 	return this.dataService.setQuests(existingQuests);
	// }
	async getQuestById(id: string): Promise<Quest | null> {
		const quests = await this.getQuests();
		return quests[id] || null;
	}
	async deleteAllQuests(): Promise<void> {
		return this.dataService.deleteAllQuests();
	}
}
