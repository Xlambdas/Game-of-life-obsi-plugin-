import { Vault } from "obsidian";
import { DataService } from "./services/dataService";

export class AppContextService {
	private static _instance: AppContextService;
	private dataService: DataService;

	private constructor(vault: Vault) {
		this.dataService = new DataService(vault);
		this.dataService.load();
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

	getData(key: string): any {
		return this.dataService.get(key);
	}

	setData(key: string, value: any): void {
		this.dataService.set(key, value);
	}
}
