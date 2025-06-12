/**
 * Represents the settings tab for the Game of Life plugin.
 */
import { PluginSettingTab, Plugin, App, Setting, Modal, TextComponent, ExtraButtonComponent } from 'obsidian';
import { RuleModal, difficultyModal, tutorialModal } from '../modales/settingModal';
import { DEFAULT_SETTINGS, UserSettings } from '../constants/DEFAULT';
import { TFolder } from 'obsidian';
import { appContextService } from '../context/appContextService';
import GOL from '../plugin';


export class selfSettingTab extends PluginSettingTab {
	// Initialize and show the settings
	settings: UserSettings;
	plugin: GOL;
	dataUser: any;


	constructor(app: App, plugin: GOL) {
		super(app, plugin);
		this.plugin = plugin;
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
				const currentSettings = appContextService.settings;
                dropdown.setValue(currentSettings.user1.settings.difficulty || DEFAULT_SETTINGS.user1.settings.difficulty);
                dropdown.onChange(async (diffValue) => {
                    const modal = new difficultyModal(this.app);
                    modal.openAndWait().then(async (value) => {
                        if (value == true) {
                            await appContextService.updateUserSettings({
                                user1: {
                                    ...currentSettings.user1,
                                    settings: {
                                        ...currentSettings.user1.settings,
                                        difficulty: diffValue
                                    }
                                }
                            });
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
					.setValue(appContextService.settings.user1.persona.name)
                    .onChange(async (value) => {
                        const currentSettings = appContextService.settings;
                        await appContextService.updateUserSettings({
                            user1: {
                                ...currentSettings.user1,
                                persona: {
                                    ...currentSettings.user1.persona,
                                    name: value
                                }
                            }
                        });
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
				const currentSettings = appContextService.settings;
                dropdown.setValue(currentSettings.user1.persona.class || DEFAULT_SETTINGS.user1.persona.class);
                dropdown.onChange(async (classValue) => {
                    await appContextService.updateUserSettings({
                        user1: {
                            ...currentSettings.user1,
                            persona: {
                                ...currentSettings.user1.persona,
                                class: classValue
                            }
                        }
                    });
                });
			});

		/** Final settings : quests file path and folder */
		containerEl.createEl('h4', { text: 'Final Settings' });

		// quests file path
		// new Setting(containerEl)
		// 	.setName('Quests file')
		// 	.setDesc('Path to the markdown file where quests are stored')
		// 	.addText(text => text
		// 		.setPlaceholder('Quests.md')
		// 		.setValue(this.plugin.settings.user1.settings.questsFileName || 'Quests.md')
		// 		.onChange(async (value) => {
		// 			this.plugin.settings.user1.settings.questsFileName = value;
		// 			await appContextService.dataService.saveSettings();
		// 		})
		// 	);

		// quests folder
		// new Setting(containerEl)
		// 	.setName('Quests folder')
		// 	.setDesc('Select a folder for quests file')
		// 	.addDropdown(async (dropdown) => {
		// 		// Get all folders in the vault
		// 		const folders = this.app.vault.getAllLoadedFiles()
		// 			.filter(file => file instanceof TFolder)
		// 			.map(folder => folder.path);

		// 		// Add root folder option
		// 		dropdown.addOption('', 'Root (/)');

		// 		// Add all other folders
		// 		folders.forEach(folder => {
		// 			dropdown.addOption(folder, folder);
		// 		});

		// 		// Set current value
		// 		dropdown.setValue(this.plugin.settings.user1.settings.questsFolder || '');

		// 		// Handle change
		// 		dropdown.onChange(async (value) => {
		// 			this.plugin.settings.user1.settings.questsFolder = value;
		// 			await appContextService.dataService.saveSettings();
		// 		});
		// 	});

		const refreshRateSetting = new Setting(containerEl)
			.setName('Refresh Rate')
			.setDesc('Refresh rate in seconds (min: 1, max: 300)');


		refreshRateSetting
            .addText((text: TextComponent) => text
                .setPlaceholder('Enter refresh rate in seconds')
                .setValue((appContextService.settings.user1.settings.refreshRate / 1000).toString())
                .onChange(async (value: string) => {
                    const seconds = parseFloat(value);
                    if (!isNaN(seconds) && seconds >= 1 && seconds <= 300) {
                        const milliseconds = Math.round(seconds * 1000);
                        // console.log('Settings: Updating refresh rate to:', seconds, 'seconds');
                        appContextService.updateRefreshRate(milliseconds);
					}
				})
			)
			// .addExtraButton((button: ExtraButtonComponent) => {
			// 	button
			// 		.setIcon('refresh-cw')
			// 		.setTooltip('Reset to default (5 seconds)')
			// 		.onClick(async () => {
			// 			if (this.plugin.settings.user1.settings) {
			// 				// console.log('Settings: Resetting refresh rate to 5 seconds');
			// 				appContextService.updateRefreshRate(5000);
			// 				this.display();
			// 			}
			// 		});
			// });

        // Reset settings
        new Setting(containerEl)
            .setName('Reset Game Settings')
            .setDesc('Click to restart the settings to default.')
            .addButton(button => {
                button
                    .setButtonText('reset')
                    .onClick(async () => {
                        // Utilisez appContextService pour reset
                        await appContextService.updateUserSettings(DEFAULT_SETTINGS);
                        // Rechargez l'affichage
                        this.display();
                    })
                    .buttonEl.style.backgroundColor = '#cb2d06';
            });
	}
}
