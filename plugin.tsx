/**
 * The `game_of_life` class is an Obsidian plugin that provides a game-like experience
 * with customizable settings, views, and commands. It manages the lifecycle of the plugin,
 * including loading settings, registering views, and handling periodic tasks.
 */
import { App, Plugin, Notice } from 'obsidian';
import { selfSettingTab } from './data/settings';
import { ViewService } from './services/viewServices';
import { DataService } from './services/dataService';
import { registerCommands } from './commands/registerCommands';
import { createContext } from 'react';
// import { AppContextService, AppContextType, AppContextProvider } from 'context/appContext';
import { createRoot } from 'react-dom/client';
import { DEFAULT_SETTINGS, Quest, UserSettings } from './constants/DEFAULT';
import { appContextService } from 'context/appContextService';
import { QuestServices } from './services/questService';




export default class GOL extends Plugin {
	// Create all the settings for the game...
    settings: UserSettings;
    quest: Quest;
	questService: QuestServices;
	// testQuestSettings: QuestSettings[];
    intervalId: number | undefined;
    viewService: ViewService;
    dataService: DataService;
	autoSaveIntervalId: number | undefined;

    async onload() {
        console.warn('loading plugin');
        await this.loadSettings();
        console.log('Settings loaded:', this.settings);

        // Initialize services and load settings
        console.log('Initializing services...');
        this.dataService = new DataService(this.app);
        this.questService = new QuestServices(this.app);
        console.log('Services created:', { 
            dataService: !!this.dataService, 
            questService: !!this.questService 
        });
        
        // Initialize appContextService with the plugin instance
        appContextService.initialize(this);
        console.log('App context initialized');
        
        // Load settings first
        await this.dataService.loadSettings();
        if (this.dataService) {
            this.settings = this.dataService.settings;
            console.log('Data service settings loaded:', this.settings);
        }


        // Register views (main and side view)
		this.viewService = new ViewService(this);
        this.viewService.registerViews();
        console.log('Views registered');

        // Register commands (all the commands of the plugin - ctrl + p)
        registerCommands(this, this.viewService);
        console.log('Commands registered');

        // Register settings tab (settings of the plugin itself)
        this.addSettingTab(new selfSettingTab(this.app, this));
        console.log('Settings tab registered');

        // Add ribbon icons (icons in the left sidebar)
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
        console.log('Ribbon icons added');

        // Set interval for periodic check
        this.autoSaveIntervalId = window.setInterval(() => {
			appContextService.saveUserDataToFile();
		}, appContextService.getRefreshRate());

        this.intervalId = window.setInterval(() => console.log('setInterval'), appContextService.getRefreshRate());
        console.log('Intervals set');
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
        console.log('Current plugin state:', {
            questService: this.questService,
            settings: this.settings,
            pluginInstance: this
        });
        
        if (!this.questService) {
            console.error('Quest service not initialized');
            new Notice("Quest service not initialized. Please reload the plugin.");
            return;
        }

        try {
            // Open the quest modal to create a new quest
            const { QuestModal } = await import('./modales/questModal');
            // Ensure we're passing the actual plugin instance
            const modal = new QuestModal(this.app, this);
            console.log('Created QuestModal with plugin instance:', {
                hasQuestService: !!this.questService,
                pluginInstance: this
            });
            modal.open();
        } catch (error) {
            console.error('Error creating quest modal:', error);
            new Notice("Failed to create quest modal. Check console for details.");
        }
    }

	async openQuestsFile() {
        if (!this.questService) {
            new Notice("Quest management service not initialized");
            return;
        }
        
        const questsPath = this.settings?.user1?.settings?.questsFilePath || 'Quests.md';
        const questsFolder = this.settings?.user1?.settings?.questsFolder || '';
        const fullPath = questsFolder ? `${questsFolder}/${questsPath}` : questsPath;

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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

    async saveSettings() {
		await this.saveData(this.settings);
		if (this.dataService) {
			await this.dataService.saveSettings();
		}


		new Notice('Settings saved !');
    }
	
}
