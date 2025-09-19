import { Vault, App } from "obsidian";
import { DataService } from "./services/dataService";
import { Habit, Quest, UserSettings } from "data/DEFAULT";

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

	// Singleton init
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

	// ----------------------
	// Generic access
	async get(key: 'user' | 'quests' | 'habits'): Promise<any> {
		switch (key) {
			case "user":
				return this.dataService.getUser();
			case "quests":
				return this.dataService.getQuests();
			case "habits":
				return this.dataService.getHabits();
			default:
				throw new Error(`Invalid key: ${key}. Expected 'user', 'quests' or 'habits'.`);
		}
	}

	// ----------------------
	// User
	getUser(): UserSettings {
		return this.dataService.getUser();
	}

	saveUser(user: UserSettings): void {
		this.dataService.saveUser(user);
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

	// -----------------------
	// Quests
	async getQuests(): Promise<Record<string, Quest>> {
		return this.dataService.getQuests();
	}

	addQuest(quest: Quest): Promise<void> {
		return this.dataService.addQuest(quest);
	}

	async updateQuest(updatedQuest: Quest): Promise<void> {
		const quests = await this.getQuests();
		if (!quests[updatedQuest.id]) {
			throw new Error(`Quest with id ${updatedQuest.id} does not exist`);
		}
		quests[updatedQuest.id] = updatedQuest;
		await this.dataService.setQuests(quests);
	}

	async getQuestById(id: string): Promise<Quest | null> {
		const quests = await this.getQuests();
		return quests[id] || null;
	}

	async deleteAllQuests(): Promise<void> {
		return this.dataService.deleteAllQuests();
	}

	// -----------------------
	// Habits
	async getHabits(): Promise<Record<string, Habit>> {
		return this.dataService.getHabits();
	}

	addHabit(habit: Habit): Promise<void> {
		return this.dataService.addHabit(habit);
	}

	async updateHabit(updatedHabit: Habit): Promise<void> {
		const habits = await this.getHabits();
		if (!habits[updatedHabit.id]) {
			throw new Error(`Habit with id ${updatedHabit.id} does not exist`);
		}
		habits[updatedHabit.id] = updatedHabit;
		await this.dataService.setHabits(habits);
	}

	async getHabitById(id: string): Promise<Habit | null> {
		const habits = await this.getHabits();
		return habits[id] || null;
	}
	async deleteAllHabits(): Promise<void> {
		return this.dataService.deleteAllHabits();
	}

}
