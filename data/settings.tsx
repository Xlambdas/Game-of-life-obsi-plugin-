/**
 * Represents the settings for the Game of Life plugin.
 */
import { PluginSettingTab, Plugin, App, Setting, Modal } from 'obsidian';
import { QuestSettings } from 'constants/DEFAULT';
import { RuleModal, difficultyModal, tutorialModal } from '../modales/settingModal';

export interface GameSettings {
	user1: {
		settings: {
			difficulty: string;
			theme: string;
			language: string;
		};
		persona: {
			name: string;
			class: string;
			health: number;
			xp: number;
			level: number;
			newXp: number;
			lvlThreshold: number;
		};
		attribute: {
			strength: number;
			agility: number;
			endurance: number;
			charisma: number;
			wisdom: number;
			perception: number;
			intelligence: number;
		};
		free_pts: number;
		inventory: {};
		equipment: {};
		habits: {};
		quests: {};
		completedQuests: string[],
		skills: {};
	}
}

export const DEFAULT_SETTINGS: GameSettings = {
	user1: {
		settings: {
			difficulty: 'easy',
			theme: 'default',
			language: 'en',
		},
		persona: {
			name: "User",
			class: "user",
			health: 100,
			xp: 0,
			level: 1,
			newXp: 0,
			lvlThreshold: 100,
		},
		attribute: {
			strength: 10,
			agility: 10,
			endurance: 10,
			charisma: 10,
			wisdom: 10,
			perception: 10,
			intelligence: 10
		},
		free_pts: 0,
		inventory: {},
		equipment: {},
		habits: {},
		quests: {},
		completedQuests: [],
		skills: {},
	}
}

export class selfSettingTab extends PluginSettingTab {
	// Initialize and show the settings
	settings: GameSettings;
	plugin: any;
	dataUser: any;
	dataQuest: QuestSettings;

	constructor(app: App, plugin: any) {
		super(app, plugin);
		this.plugin = plugin;
		this.dataUser = JSON.parse(JSON.stringify(this.plugin.settings));
	}

	display(): void {
		// Display the settings in the obsidian settings
		const { containerEl } = this;

		containerEl.empty();
		const title = containerEl.createEl('h2', { text: 'Game of Life Plugin Settings' });
		title.style.textAlign = 'center';
		console.log('display all : ', this.plugin);
		console.log('display test data : ', this.dataUser);
		/** generals settings : include github documentation and tutoriel */
		containerEl.createEl('h4', { text: 'General Settings' });
		new Setting(containerEl)
			.setName('Documentation')
			.setDesc('Click to open the full documentation on github.')
			.addButton(button =>
				button
				.setButtonText('Open Docs')
				.onClick(() => {
					window.open('https://github.com/Xlambdas/game-of-life')
				})
			);

		// tutorial part
		new Setting(containerEl) // todo
			.setName('Tutorial')
			.setDesc('Click to navigate through the tutorial and the different settings...')
			.addButton(button =>
				button
					.setButtonText('start now')
					.onClick(async () => {
						new tutorialModal(this.app).open();
						console.log('show tutorial')
					})
			);

		/** game settings : include game rules, difficulty, and user persona */
		containerEl.createEl('h4', { text: 'Game Settings' });
		const descGameSettings = containerEl.createEl('p', { text: 'You are not allowed to change the rule of the game, but if you do, do it at your own risk !' });
		descGameSettings.style.fontStyle = 'italic';
		descGameSettings.style.fontSize = '12px';

		// game rules part :
		new Setting(containerEl)
			.setName('Game\'s Rules')
			.setDesc('Click to have a pop up which show the rules of your game.')
			.addButton(button =>
				button
					.setButtonText('rules')
					.onClick(async () => {
						new RuleModal(this.app).open();
					})
			);

		// choose difficulty :
		new Setting(containerEl)
			.setName('Choose your difficulty :')
			.setDesc('Select one of the available choices.')
			.addDropdown(dropdown => {
				dropdown.addOptions({
					easy: 'easy',
					medium: 'medium',
					hard: 'hard',
					platinium: 'platinium',
				});
				dropdown.setValue(this.plugin.settings.user1.settings.difficulty || DEFAULT_SETTINGS.user1.settings.difficulty);
				const difficulty = dropdown.getValue();
				console.log('diff value', difficulty)
				dropdown.onChange(async (diffValue) => {
					const modal = new difficultyModal(this.app);
					modal.openAndWait().then((value) => {
						console.log("Difficulty(file:settings.tsx)=>value get :", value);
						if (value == true) {
							this.plugin.settings.user1.settings.difficulty = diffValue;
							this.plugin.saveSettings();
							console.log('Difficulty(file:settings.tsx)=> Selected if :', value, diffValue);
						} else {
							this.plugin.saveSettings();
							console.log('Difficulty(file:settings.tsx)=> save settings :', value);
						}
					});

				});
			});

		// choose name :
		new Setting(containerEl)
			.setName('Username')
			.setDesc('This name will be used for your persona.')
			.addText(text =>
				text
					.setValue(this.plugin.settings.user1.persona.name)
					.onChange(async (value) => {
						this.plugin.settings.user1.persona.name = value;
						await this.plugin.saveSettings();
					})
			);

		// choose class :
		new Setting(containerEl)
			.setName('Choose your class:')
			.setDesc('Select one of the available choices.')
			.addDropdown(dropdown => {
				dropdown.addOptions({
					user: 'user',
					warrior: 'warrior',
					mage: 'mage',
					rogue: 'rogue',
					healer: 'healer',
				});
				dropdown.setValue(this.plugin.settings.user1.persona.class || DEFAULT_SETTINGS.user1.persona.class);
				const classValue = dropdown.getValue();
				console.log('classe value', classValue)
				dropdown.onChange(async (classValue) => {
					this.plugin.settings.user1.persona.class = classValue;
					this.plugin.saveSettings();
				});
			});

		/** Final settings : delete all the data */
		containerEl.createEl('h4', { text: 'Final Settings' });

		new Setting(containerEl)
			.setName('Reset Game Settings')
			.setDesc('Click to restart the settings to default. Be careful, all your game data may be erased... If so close this window after clicking this button.')
			.addButton(button => {
				button
					.setButtonText('reset')
					.onClick(async () => {
						this.plugin.settings = { ...DEFAULT_SETTINGS};
						console.log('settings reset', this.plugin.settings);
						// useEffect(() => {}, [this.plugin.settings]);
						await this.plugin.saveSettings();
					})
					.buttonEl.style.backgroundColor = '#cb2d06';
			});

		// ---------- | dev part | ---------------
		containerEl.createEl('h4', { text: 'Debug' });
		new Setting(containerEl)
			.setName('Xp')
			.addText(text =>
				text
					.setValue(this.plugin.settings.user1.persona.xp.toString())
					.onChange(async (value) => {
						const xpValue = parseInt(value, 10);
						if (!isNaN(xpValue)) {
							this.plugin.settings.user1.persona.xp = xpValue;
							await this.plugin.saveSettings();
						}
					})
					.inputEl.setAttr('type', 'number')
			);
		new Setting(containerEl)
			.setName('level')
			.addText(text =>
				text
					.setValue(this.plugin.settings.user1.persona.level)
					.onChange(async (value) => {
						this.plugin.settings.user1.persona.level = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
