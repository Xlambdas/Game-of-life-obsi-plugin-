import { App, PluginSettingTab, Setting } from "obsidian";
// from files (services, plugin, default) :
import GOL from "../plugin";
import { AppContextService } from "../context/appContextService";
import { DEFAULT_SETTINGS } from "../data/DEFAULT";
// from files (UI) :
import { mainTitle, titleSection, DescriptionHelper } from "./UIHelpers";
import { TutorialModal } from "../modal/tutorialModal";
import { RuleModal } from "../modal/ruleModal";
import { difficultyModal } from "../modal/diffModal";

export class selfSettingsTab extends PluginSettingTab {
	private contextService: AppContextService;

	constructor(app: App, plugin: GOL) {
		super(app, plugin);
		this.contextService = AppContextService.getInstance();
	}

	display(): void {
		// Display the settings in the obsidian settings
		const { containerEl } = this;
		containerEl.empty();
		const appContextService = AppContextService.getInstance();

		mainTitle(containerEl, "Game of Life Plugin");

		/** generals settings : include github documentation and tutoriel */
		titleSection(containerEl, "General Settings");
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
		new Setting(containerEl)
			.setName('Tutorial')
			.setDesc('Click to navigate through the tutorial and the different settings...')
			.addButton(button =>
				button
					.setButtonText('start now')
					.onClick(async () => {
						new TutorialModal(this.app).open();
						console.log('show tutorial')
					})
			);

		/** game settings : include game rules, difficulty, and user persona */
		titleSection(containerEl, "Game Settings");
		new DescriptionHelper(containerEl, 'Here you can change the game settings, like the difficulty, the user persona, and the game rules.');
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

				const currentUser = this.contextService.getUser();
				let currentDifficulty: string = currentUser.settings.difficulty ||DEFAULT_SETTINGS.settings.difficulty;
				dropdown.setValue(currentDifficulty);

				dropdown.onChange(async (diffValue) => {
					const modal = new difficultyModal(this.app);
					const confirmed = await modal.openAndWait();

					if (confirmed === true) {
						await this.contextService.updateUserData({
							...currentUser,
							settings: {
								...currentUser.settings,
								difficulty: diffValue
							}
						});
					}
				});
			});

		// choose name :
		new Setting(containerEl)
			.setName('Username')
			.setDesc('This name will be used for your persona.')
			.addText(text =>
				text
					.setValue(this.contextService.getUser().persona.name)
					.setPlaceholder('Enter your name')
					.onChange(async (value) => {
						const currentSettings = this.contextService.getUser();
						await this.contextService.updateUserData({
							persona: {
								...currentSettings.persona,
								name: value
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
				const currentUser = this.contextService.getUser();
				let currentClass: string = currentUser.persona.class || DEFAULT_SETTINGS.persona.class;
				dropdown.setValue(currentClass);

                dropdown.onChange(async (classValue) => {
                    await this.contextService.updateUserData({
                        ...currentUser,
                        persona: {
                            ...currentUser.persona,
                            class: classValue
                        }
                    });
                });
			});

		/** advanced settings : include data version, and reset data */
		titleSection(containerEl, "Advanced Settings");
		new DescriptionHelper(containerEl, 'Here you can change the advanced settings, like the data version, and reset your data.');

		// Reset settings
        new Setting(containerEl)
            .setName('Reset Game Settings')
            .setDesc('Click to restart the settings to default.')
            .addButton(button => {
                button
                    .setButtonText('reset')
                    .onClick(async () => {
                        await this.contextService.updateUserData(DEFAULT_SETTINGS);
						await this.contextService.deleteAllQuests();
						await this.contextService.deleteAllHabits();
                        this.display();
                    })
                    .buttonEl.style.backgroundColor = '#cb2d06';
            });
	}
}
