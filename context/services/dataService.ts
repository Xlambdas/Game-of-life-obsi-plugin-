import { Vault, TFile, normalizePath } from 'obsidian';


export class DataService {
	private userPath: string;
	private vault: Vault;
	private data: Record<string, any> = {};

	constructor(vault: Vault) {
		this.vault = vault;
		this.userPath = normalizePath(".obsidian/plugins/game-of-life/data/user.json");
	}

	async load() {
		try {
			const file = this.vault.getAbstractFileByPath(this.userPath);
			if (file instanceof TFile) {
				const content = await this.vault.read(file);
				this.data = JSON.parse(content);
			}
		} catch (err) {
			console.warn("No data file found, starting fresh.");
			this.data = {};
		}
	}

	async save() {
		const content = JSON.stringify(this.data, null, 2);
		await this.vault.adapter.mkdir(normalizePath("your-plugin-data"));
		await this.vault.adapter.write(normalizePath(this.userPath), content);
	}

	get(key: string): any {
		return this.data[key];
	}

	async set(key: string, value: any): Promise<void> {
		this.data[key] = value;
		await this.save();
	}
}
