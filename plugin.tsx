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
	questService: QuestServices;
	habit: Habit;
	habitService: HabitServices;
    intervalId: number | undefined;
    viewService: ViewService;
    dataService: DataService;
	autoSaveIntervalId: number | undefined;
	xpService: XpService;

    async onload() {
        console.warn('loading plugin');
		await this.loadSettings();

        // Initialize services and load settings
        this.dataService = new DataService(this.app);
        await this.dataService.loadSettings();
		if (this.dataService) {
            this.settings = this.dataService.settings;
        }
		this.xpService = new XpService(this.app, this);

        this.questService = new QuestServices(this.app, this);
        this.habitService = new HabitServices(this.app, this);
        appContextService.initialize(this);

        // Register views (main and side view); settings tab
        this.viewService = new ViewService(this);
        this.viewService.registerViews();
        this.addSettingTab(new selfSettingTab(this.app, this));

        // Register commands (all the commands of the plugin - ctrl + p)
        registerCommands(this, this.viewService);

        this.addRibbonIcon('dice', 'Activate sideview', () => {
            this.viewService.openSideView();
            new Notice("Welcome Back !");
        });

        this.addRibbonIcon('sword', 'Activate mainview', () => {
            this.viewService.openMainView();
            new Notice("Welcome Back !");
        });

        this.addRibbonIcon('checkbox-glyph', 'Open Quests File', () => {
            this.openQuestsFile();
        });

        // Set interval for periodic check
        this.autoSaveIntervalId = window.setInterval(() => {
            appContextService.saveUserDataToFile();
        }, appContextService.getRefreshRate());

        this.intervalId = window.setInterval(() => console.log('setInterval'), appContextService.getRefreshRate());

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

    onunload() {
        console.warn('unloading plugin');
        appContextService.saveUserDataToFile();

        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        if (this.autoSaveIntervalId) {
            clearInterval(this.autoSaveIntervalId);
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
		const modal = new ModifyQuestModal(this.app, this);
		modal.open();
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

        if (!this.questService) {
            console.error('Quest service not initialized');
            return;
        }

        try {
            // Ensure we're passing the actual plugin instance
            const modal = new CreateHabitModal(this.app, this);
            modal.open();
        } catch (error) {
            console.error('Error creating quest modal:', error);
            new Notice("Failed to create quest modal. Check console for details.");
        }
    }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

    async saveSettings() {
		await this.saveData(this.settings);
		if (this.dataService) {
			await this.dataService.saveSettings();
		}
    }
}
