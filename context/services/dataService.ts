import { Vault, TFile, normalizePath } from 'obsidian';
// from files :
import { UserSettings, DEFAULT_SETTINGS, Quest, DEFAULT_QUEST } from '../../data/DEFAULT';

export class DataService {
	private userPath: string;
	private questsPath: string;
	private vault: Vault;
	private user: UserSettings = DEFAULT_SETTINGS;
	private quests: Record<string, Quest> = {};

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

	async ensureDataFile(): Promise<void> {
		const exists = await this.vault.adapter.exists(this.userPath);
		if (!exists) {
			console.warn("User data file not found, initializing with default structure...");
			await this.resetData();
		}
	}

	async resetData(): Promise<void> {
		this.user = DEFAULT_SETTINGS;
		this.quests = {};
		await this.save('user');
		await this.save('quests');
	}

	// -----------------------
	// common methods
	private async save(type: 'user' | 'quests' = 'user'): Promise<void> {
		if (type === 'user') {
			const folder = this.userPath.substring(0, this.userPath.lastIndexOf("/"));
			await this.vault.adapter.mkdir(folder);
			const content = JSON.stringify(this.user, null, 2);
			await this.vault.adapter.write(this.userPath, content);
		} else if (type === 'quests') {
			const folder = this.questsPath.substring(0, this.questsPath.lastIndexOf("/"));
			await this.vault.adapter.mkdir(folder);
			const content = JSON.stringify(this.quests, null, 2);
			await this.vault.adapter.write(this.questsPath, content);
		}
	}

	get(key: 'user' | 'quests'): UserSettings | Record<string, Quest> {
		if (key === 'user') {
			return this.user;
		}
		if (key === 'quests') {
			return this.quests;
		}
		throw new Error(`Unknown key: ${key}`);
	}

	// -----------------------
	// User management
	async loadUser(): Promise<void> {
		await this.ensureDataFile();
		const content = await this.vault.adapter.read(this.userPath);
		try {
			const parsed = JSON.parse(content);
			// Vérification basique : doit être un objet non null et non array
			if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
				throw new Error("Invalid user data format");
			}
			// Vérifie que tous les champs de DEFAULT_SETTINGS sont présents
			for (const key of Object.keys(DEFAULT_SETTINGS)) {
				if (!(key in parsed)) {
					throw new Error(`Missing user data field: ${key}`);
				}
			}
			this.user = parsed;
		} catch {
			console.warn("Corrupted user data file, resetting to default structure...");
			await this.resetData();
		}
	}

	async setUser(key: string, value: any): Promise<void> {
		(this.user as any)[key] = value;
		await this.save();
	}
	async updateUser(newData: Partial<UserSettings>): Promise<void> {
		this.user = { ...this.user, ...newData };
		await this.save();
	}

	getUser(): UserSettings {
		return this.user;
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

	async addQuest(questData: Partial<Quest>): Promise<void> {
		
		const id = questData.id || `quest_${Object.keys(this.quests).length + 1}`;
		this.quests[id] = { ...DEFAULT_QUEST, ...questData };
		await this.save('quests');
	}

	async setQuests(quests: Record<string, any>): Promise<void> {
		this.quests = quests;
		await this.save('quests');
	}

	getQuests(): Record<string, Quest> {
		return this.quests;
	}

}
