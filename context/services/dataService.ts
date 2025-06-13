import { Vault, TFile, normalizePath } from 'obsidian';
// from files :
import { DEFAULT_SETTINGS } from '../../data/DEFAULT';

export class DataService {
	private userPath: string;
	private questsPath: string;
	private vault: Vault;
	private data: Record<string, any> = {};
	private quests: Record<string, any> = {};

	constructor(vault: Vault) {
		this.vault = vault;
		this.userPath = normalizePath(".obsidian/plugins/game-of-life/data/user.json");
		this.questsPath = normalizePath(".obsidian/plugins/game-of-life/data/quests.json");
	}

	// -----------------------
	// general methods
	async load () {
		await this.loadUser();
		await this.loadQuests();
	}

	private async save(type: 'user' | 'quests' = 'user'): Promise<void> {
		if (type === 'user') {
			const folder = this.userPath.substring(0, this.userPath.lastIndexOf("/"));
			await this.vault.adapter.mkdir(folder);
			const content = JSON.stringify(this.data, null, 2);
			await this.vault.adapter.write(this.userPath, content);
		} else if (type === 'quests') {
			const folder = this.questsPath.substring(0, this.questsPath.lastIndexOf("/"));
			await this.vault.adapter.mkdir(folder);
			const content = JSON.stringify(this.quests, null, 2);
			await this.vault.adapter.write(this.questsPath, content);
		}
	}

	async ensureDataFile(): Promise<void> {
		const exists = await this.vault.adapter.exists(this.userPath);
		if (!exists) {
			console.warn("User data file not found, initializing with default structure...");
			await this.resetData();
		}
	}

	async resetData(): Promise<void> {
		this.data = DEFAULT_SETTINGS;
		this.quests = {};
		await this.save('user');
		await this.save('quests');
	}

	// -----------------------
	// User management
	async loadUser(): Promise<void> {
		await this.ensureDataFile();
		const content = await this.vault.adapter.read(this.userPath);
		try {
			this.data = JSON.parse(content);
		} catch {
			console.warn("Corrupted user data file, resetting to default structure...");
			await this.resetData();
		}
	}

	getUser(key: string): any {
		return this.data[key];
	}

	async setUser(key: string, value: any): Promise<void> {
		this.data[key] = value;
		await this.save();
	}

	// ------------------------
	// Quests management
	async loadQuests(): Promise<void> {
		const exists = await this.vault.adapter.exists(this.questsPath);
		if (!exists) {
			console.warn("Quests data file not found, creating with default structure...");
			await this.save('quests');
		}

		const content = await this.vault.adapter.read(this.questsPath);
		this.quests = JSON.parse(content);
	}

	getQuests(): Record<string, any> {
		return this.quests;
	}

	async setQuests(quests: Record<string, any>): Promise<void> {
		this.quests = quests;
		await this.save('quests');
	}

}
