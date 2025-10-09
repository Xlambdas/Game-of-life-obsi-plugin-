import { Vault, App } from "obsidian";
import { Habit, Quest, UserSettings } from "data/DEFAULT";
import XpService from "./services/xpService";
import DataService from "./services/dataService";
import HabitService from "./services/habitService";
import QuestService from "./services/questService";


export class AppContextService {
	/* Singleton service providing access to data operations and app context.
		Wraps DataService and provides higher-level methods if needed.
	*/
	private static _instance: AppContextService;
	private app: App;
	private vault: Vault;

	// Services
	public dataService: DataService;
	public xpService: XpService;
	public habitService: HabitService;
	public questService: QuestService;

	private constructor(vault: Vault, app: App) {
		this.app = app;
		this.vault = vault;
		this.dataService = new DataService(vault);

		// Initialize other services with this context
		this.xpService = new XpService(this);
		this.habitService = new HabitService(this);
		this.questService = new QuestService(this);
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
	// Getters
	public getApp(): App {
		return this.app;
	}

	public getVault(): Vault {
		return this.vault;
	}


	// ----------------------
	// Generic access
	// async get(key: 'user' | 'quests' | 'habits'): Promise<any> {
	// 	switch (key) {
	// 		case "user":
	// 			return this.dataService.getUser();
	// 		case "quests":
	// 			return this.dataService.getQuests();
	// 		case "habits":
	// 			return this.dataService.getHabits();
	// 		default:
	// 			throw new Error(`Invalid key: ${key}. Expected 'user', 'quests' or 'habits'.`);
	// 	}
	// }

	// ----------------------
	// User
	getUser(): UserSettings {
		return this.dataService.getUser();
	}

	updateUserData(newData: Partial<UserSettings>): Promise<void> {
		return this.dataService.updateUser(newData);
	}

	// -----------------------
	// Quests
	// async getQuests(): Promise<Record<string, Quest>> {
	// 	return this.dataService.getQuests();
	// }

	// addQuest(quest: Quest): Promise<void> {
	// 	return this.dataService.addQuest(quest);
	// }

	// async updateQuest(updatedQuest: Quest): Promise<void> {
	// 	const quests = await this.getQuests();
	// 	if (!quests[updatedQuest.id]) {
	// 		throw new Error(`Quest with id ${updatedQuest.id} does not exist`);
	// 	}
	// 	quests[updatedQuest.id] = updatedQuest;
	// 	await this.dataService.setQuests(quests);
	// }

	// async deleteAllQuests(): Promise<void> {
	// 	return this.dataService.deleteAllQuests();
	// }

	// // -----------------------
	// // Habits
	// async getHabits(): Promise<Record<string, Habit>> {
	// 	return this.dataService.getHabits();
	// }

	// addHabit(habit: Habit): Promise<void> {
	// 	return this.dataService.addHabit(habit);
	// }

	// async updateHabit(updatedHabit: Habit): Promise<void> {
	// 	const habits = await this.getHabits();
	// 	if (!habits[updatedHabit.id]) {
	// 		// If not found, create it (upsert behavior)
	// 		habits[updatedHabit.id] = updatedHabit;
	// 	} else {
	// 		habits[updatedHabit.id] = updatedHabit;
	// 	}
	// 	await this.dataService.setHabits(habits);
	// }

	// async deleteAllHabits(): Promise<void> {
	// 	return this.dataService.deleteAllHabits();
	// }

	// async getAllHabit(): Promise<Habit[]> {
	// 	const habits = await this.getHabits();
	// 	return Object.values(habits);
	// }
	// async saveAllHabits(habits: Habit[]): Promise<void> {
	// 	const habitMap: Record<string, Habit> = {};
	// 	habits.forEach(habit => {
	// 		habitMap[habit.id] = habit;
	// 	});
	// 	return this.dataService.setHabits(habitMap);
	// }
}
