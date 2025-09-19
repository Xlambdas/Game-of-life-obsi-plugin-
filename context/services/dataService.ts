import { Vault, normalizePath } from 'obsidian';
// from files :
import { UserSettings, DEFAULT_SETTINGS, Quest, DEFAULT_QUEST, Habit, DEFAULT_HABIT } from '../../data/DEFAULT';

export class DataService {
	private userPath: string;
	private questsPath: string;
	private habitsPath: string;
	private vault: Vault;

	private user: UserSettings = DEFAULT_SETTINGS;
	private quests: Record<string, Quest> = {};
	private habits: Record<string, Habit> = {};

	constructor(vault: Vault) {
		this.vault = vault;
		this.userPath = normalizePath(".obsidian/plugins/game-of-life/data/user.json");
		this.questsPath = normalizePath(".obsidian/plugins/game-of-life/data/quests.json");
		this.habitsPath = normalizePath(".obsidian/plugins/game-of-life/data/habits.json");
	}

	// -----------------------
	// global init
	async load (): Promise<void> {
		await this.loadUser();
		await this.loadQuests();
		await this.loadHabits();
	}

	async resetData(): Promise<void> {
		this.user = DEFAULT_SETTINGS;
		this.quests = {};
		this.habits = {};
		await this.save('user');
		await this.save('quests');
		await this.save('habits');
	}

	private async ensureDataFile(path: string, defaultContent: any): Promise<void> {
		const exists = await this.vault.adapter.exists(path);
		if (!exists) {
			console.warn(`${path} not found, creating with default structure...`);
			const folder = path.substring(0, path.lastIndexOf("/"));
			await this.vault.adapter.mkdir(folder);
			await this.vault.adapter.write(path, JSON.stringify(defaultContent, null, 2));
		}
	}

	// -----------------------
	// save Helpers
	private async save(type: 'user' | 'quests' | 'habits'): Promise<void> {
		let path: string;
		let content: string;

		switch (type) {
			case 'user':
				path = this.userPath;
				content = JSON.stringify(this.user, null, 2);
				break;
			case 'quests':
				path = this.questsPath;
				content = JSON.stringify(this.quests, null, 2);
				break;
			case 'habits':
				path = this.habitsPath;
				content = JSON.stringify(this.habits, null, 2);
				break;
			default:
				throw new Error(`Unknown type: ${type}`);
		}

		const folder = path.substring(0, path.lastIndexOf("/"));
		await this.vault.adapter.mkdir(folder);
		await this.vault.adapter.write(path, content);
	}

	// -----------------------
	// generic get
	get(key: 'user' | 'quests' | 'habits'): UserSettings | Record<string, Quest> | Record<string, Habit> {
		if (key === 'user') {
			return this.user;
		}
		if (key === 'quests') {
			return this.quests;
		}
		if (key === 'habits') {
			return this.habits;
		}
		throw new Error(`Unknown key: ${key}`);
	}

	// -----------------------
	// User
	async loadUser(): Promise<void> {
		await this.ensureDataFile(this.userPath, DEFAULT_SETTINGS);
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
			this.user = DEFAULT_SETTINGS;
			await this.save('user');
		}
	}

	async saveUser(user: UserSettings): Promise<void> {
		this.user = user;
		await this.save('user');
	}

	async setUser(key: string, value: any): Promise<void> {
		(this.user as any)[key] = value;
		await this.save('user');
	}
	async updateUser(newData: Partial<UserSettings>): Promise<void> {
		this.user = { ...this.user, ...newData };
		await this.save('user');
	}

	getUser(): UserSettings {
		return this.user;
	}

	// ------------------------
	// Quests
	async loadQuests(): Promise<void> {
		await this.ensureDataFile(this.questsPath, {});
		const content = await this.vault.adapter.read(this.questsPath);
		this.quests = JSON.parse(content);
	}

	async addQuest(questData: Partial<Quest>): Promise<void> {
		const id = questData.id || `quest_${Object.keys(this.quests).length + 1}`;
		this.quests[id] = { ...DEFAULT_QUEST, ...questData, id };
		await this.save('quests');
	}

	async setQuests(quests: Record<string, Quest>): Promise<void> {
		this.quests = quests;
		await this.save('quests');
	}

	async getQuests(): Promise<Record<string, Quest>> {
		return this.quests;
	}

	async deleteAllQuests(): Promise<void> {
		this.quests = {};
		await this.save('quests');
	}

	async saveAllQuests(quests: Quest[]): Promise<void> {
		const questsObj: Record<string, Quest> = {};
		for (const quest of quests) {
			questsObj[quest.id] = quest;
		}
		this.quests = questsObj;
		await this.save('quests');
	}

	async loadAllQuests(): Promise<Quest[]> {
		await this.loadQuests();
		return Object.values(this.quests);
	}

	// ------------------------
	// Habits
	async loadHabits(): Promise<void> {
		await this.ensureDataFile(this.habitsPath, {});
		const content = await this.vault.adapter.read(this.habitsPath);
		this.habits = JSON.parse(content);
	}

	async addHabit(habitData: Partial<Habit>): Promise<void> {
		const id = habitData.id || `habit_${Object.keys(this.habits).length + 1}`;
		this.habits[id] = { ...DEFAULT_HABIT, ...habitData, id };
		await this.save('habits');
	}

	async setHabits(habits: Record<string, Habit>): Promise<void> {
		this.habits = habits;
		await this.save('habits');
	}

	async getHabits(): Promise<Record<string, Habit>> {
		return this.habits;
	}

	async deleteAllHabits(): Promise<void> {
		this.habits = {};
		await this.save('habits');
	}

	async saveAllHabits(habits: Habit[]): Promise<void> {
		const habitsObj: Record<string, Habit> = {};
		for (const habit of habits) {
			habitsObj[habit.id] = habit;
		}
		await this.setHabits(habitsObj);
	}

	async loadAllHabits(): Promise<Habit[]> {
		await this.loadHabits();
		return Object.values(this.habits);
	}
}
