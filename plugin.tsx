/**
 * The `game_of_life` class is an Obsidian plugin that provides a game-like experience
 * with customizable settings, views, and commands. It manages the lifecycle of the plugin,
 * including loading settings, registering views, and handling periodic tasks.
 */
import { Plugin, Notice, TFile } from 'obsidian';
import { selfSettingTab } from './data/settings';
import { ViewService } from './services/viewServices';
import { DataService } from './services/dataService';
import { registerCommands } from './commands/registerCommands';
import { DEFAULT_SETTINGS, UserSettings, Quest, Habit } from './constants/DEFAULT';
import { appContextService } from 'context/appContextService';
import { QuestServices } from './services/questService';
import { CreateQuestModal, ModifyQuestModal } from './modales/questModal';
import { CreateHabitModal } from './modales/habitModal';
import { HabitServices } from './services/habitService';
import './styles/calendarView.css';
import { XpService } from 'services/xpService';


export default class GOL extends Plugin {
	// Create all the settings for the game...
    settings: UserSettings;
    quest: Quest;
	habit: Habit;

	// Services
	questService: QuestServices;
	habitService: HabitServices;
    viewService: ViewService;

	// timer
	intervalId: number | undefined;
	autoSaveIntervalId: number | undefined;

    async onload() {
        console.warn('loading plugin');

		try {
			await this.loadSettings();
			await appContextService.initialize(this);

			const loadedSettings = appContextService.settings;
			if (loadedSettings) {
				this.settings = loadedSettings;
				console.log('Settings loaded from appContextService:');
			}

			this.questService = new QuestServices(this.app, this);
			this.habitService = new HabitServices(this.app, this);

			this.viewService = new ViewService(this);
            this.viewService.registerViews();
            this.addSettingTab(new selfSettingTab(this.app, this));
            registerCommands(this, this.viewService);

			this.setupRibbonIcons();
			this.setupAutoSave();
			// this.setupPeriodicTasks();
			// Set interval for periodic check
			this.autoSaveIntervalId = window.setInterval(() => {
				appContextService.saveUserDataToFile();
			}, appContextService.getRefreshRate());

			this.intervalId = window.setInterval(() => console.log('setInterval'), appContextService.getRefreshRate());
			this.registerFileEvents();

		} catch (error) {
			console.error('Error loading settings or initializing services:', error);
			new Notice("Failed to load settings or initialize services. Check console for details.");
		}
    }

    onunload() {
        console.warn('unloading plugin');
		this.saveDataBeforeUnload();

        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        if (this.autoSaveIntervalId) {
            clearInterval(this.autoSaveIntervalId);
        }
    }

	private setupRibbonIcons() {
		this.addRibbonIcon('plus', 'New Quest', async () => {
			await this.newQuest();
		});

        this.addRibbonIcon('dice', 'Activate sideview', () => {
            this.viewService.openSideView();
            new Notice("Welcome Back !");
        });

        this.addRibbonIcon('sword', 'Activate mainview', () => {
            this.viewService.openMainView();
            new Notice("Welcome Back !");
        });

        // this.addRibbonIcon('checkbox-glyph', 'Open Quests File', () => {
        //     this.openQuestsFile();
        // });
	}

	private setupAutoSave() {
		const refreshRate = appContextService.getRefreshRate();
		this.autoSaveIntervalId = window.setInterval(async () => {
			try {
				await appContextService.saveUserDataToFile();
			} catch (error) {
				console.error('Error during auto-save:', error);
			}
		}, refreshRate);
	}

	private setupPeriodicTasks() {
		const refreshRate = appContextService.getRefreshRate();
		this.intervalId = window.setInterval(() => {
			console.log('Periodic task running...');
			// You can add any periodic tasks here
		}, refreshRate);
	}

	private registerFileEvents() {
		this.registerEvent(
			this.app.workspace.on('file-open', async (file) => {
                if (!file) return;
                
                const questsFileName = this.settings?.user1?.settings?.questsFileName || 'Quests.md';
                const questsFolder = this.settings?.user1?.settings?.questsFolder || '';
                const fullPath = questsFolder ? `${questsFolder}/${questsFileName}` : questsFileName;

                if (file.path === fullPath) {
                    try {
                        // Vérifier si le fichier JSON existe
                        const jsonPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
                        const jsonExists = await this.app.vault.adapter.exists(jsonPath);
                        if (jsonExists) {
                            new Notice("Quests synchronized successfully!");
                        } else {
                            console.error('Quests JSON file not found');
                            new Notice("Quests JSON file not found");
                        }
                    } catch (error) {
                        console.error('Error syncing quests to markdown:', error);
                        new Notice("Failed to synchronize quests");
                    }
                }
            })
        );
    }

    private async saveDataBeforeUnload() {
        try {
            await appContextService.saveUserDataToFile();
            // await appContextService.saveQuestDataToFile();
            // await appContextService.saveHabitDataToFile();
            console.log('Data saved before unload');
        } catch (error) {
            console.error('Failed to save data before unload:', error);
        }
    }

    async newQuest() {
        console.log('Creating new quest...');

        if (!this.questService) {
            console.error('Quest service not initialized');
            return;
        }

        try {
            // Ensure we're passing the actual plugin instance
            const modal = new CreateQuestModal(this.app, this);
            modal.open();
        } catch (error) {
            console.error('Error creating quest modal:', error);
            new Notice("Failed to create quest modal. Check console for details.");
        }
    }

	async modifyQuest() {
		try {
			const modal = new ModifyQuestModal(this.app, this);
			modal.open();
		} catch (error) {
			console.error('Error opening modify quest modal:', error);
			new Notice("Failed to open quest editor. Check console for details.");
		}
	}

	async openQuestsFile() {
        if (!this.questService) {
            return;
        }

        const questsFileName = this.settings?.user1?.settings?.questsFileName || 'Quests.md';
        const questsFolder = this.settings?.user1?.settings?.questsFolder || '';
        const fullPath = questsFolder ? `${questsFolder}/${questsFileName}` : questsFileName;

        try {
            const file = this.app.vault.getAbstractFileByPath(fullPath);
            if (file) {
                await this.app.workspace.openLinkText(fullPath, "", true);
            } else {
                new Notice(`Quests file not found at ${fullPath}`);
            }
        } catch (error) {
            console.error("Error opening quests file:", error);
            new Notice("Failed to open quests file");
        }
    }

    async newHabit() {
        console.log('Creating new habit...');

        if (!this.habitService) {
            console.error('Habit service not initialized');
            return;
        }

        try {
            const modal = new CreateHabitModal(this.app, this);
            modal.open();
        } catch (error) {
            console.error('Error creating habit modal:', error);
            new Notice("Failed to create habit modal. Check console for details.");
        }
    }

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

    async saveSettings() {
		try {
			await appContextService.updateUserSettings(this.settings);
		} catch (error) {
			console.error("Error saving settings:", error);
			new Notice("Failed to save settings. Check console for details.");
		}
    }
}
