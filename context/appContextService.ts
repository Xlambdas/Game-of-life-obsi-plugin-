import { Vault, App } from "obsidian";
import { Habit, Quest, UserSettings } from "data/DEFAULT";
import XpService from "./services/xpService";
import UnlocksService from "./services/unlockService";
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
	public unlocksService: UnlocksService;
	public habitService: HabitService;
	public questService: QuestService;

	private constructor(vault: Vault, app: App) {
		this.app = app;
		this.vault = vault;
		this.dataService = new DataService(vault);

		// Initialize other services with this context
		this.xpService = new XpService(this);
		this.unlocksService = new UnlocksService(this);
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
	// User
	getUser(): UserSettings {
		return this.dataService.getUser();
	}

	updateUserData(newData: Partial<UserSettings>): Promise<void> {
		return this.dataService.updateUser(newData);
	}
}
