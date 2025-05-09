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
    quests: Quest;
	questService: QuestServices;
	// testQuestSettings: QuestSettings[];
    intervalId: number | undefined;
    viewService: ViewService;
    dataService: DataService;
	autoSaveIntervalId: number | undefined;

    async onload() {
        console.warn('loading plugin');
		await this.loadSettings();

        // Initialize services and load settings
        this.dataService = new DataService(this.app);
		this.questService = new QuestServices(this.app);
		// Initialize appContextService with the plugin instance
		appContextService.initialize(this);
        await this.dataService.loadSettings();
		if (this.dataService) {
			this.settings = this.dataService.settings;
		}
		await this.questService.initialize({
			questsFilePath: this.settings?.user1.settings.questsFilePath || '',
			questsFolder: this.settings?.user1.settings.questsFolder || '',
			completedQuestIds: this.settings?.user1.completedQuests || [],
		})

        // this.questSetting = this.dataService.questSetting;

		// const appContext: AppContextType = {
        //     plugin: this,
        //     settings: this.settings,
        //     // quests: this.testQuestSettings,
        //     updateUserSettings: (newData: Partial<UserSettings>) => {
        //         this.settings = { ...this.settings, ...newData };
        //         // Optionally save settings after update
        //         this.dataService.saveSettings();
        //     },
        //     // updateQuests: (newQuests: QuestSettings[]) => {
        //     //     // this.testQuestSettings = newQuests;
        //     //     // Optionally save settings after update
        //     //     this.dataService.saveSettings();
        //     // }
        // };

        // Initialize the global context service
        // AppContextService.getInstance().initialize(appContext);

        // Register views (main and side view)
		this.viewService = new ViewService(this);
        this.viewService.registerViews();

        // Register commands (all the commands of the plugin - ctrl + p)
        registerCommands(this, this.viewService);

        // Register settings tab (settings of the plugin itself)
        this.addSettingTab(new selfSettingTab(this.app, this));

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


        // Set interval for periodic check
        this.autoSaveIntervalId = window.setInterval(() => {
			appContextService.saveUserDataToFile();
		}, appContextService.getRefreshRate());

		this.intervalId = window.setInterval(() => console.log('setInterval'), appContextService.getRefreshRate());
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
		// Open the quest modal to create a new quest
        const { QuestModal } = await import('./modales/questModal');
        new QuestModal(this.app, this).open();
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

		// Update quest management service with new settings
        if (this.questService) {
            await this.questService.initialize({
                questsFilePath: this.settings?.user1?.settings?.questsFilePath || 'Quests.md',
				questsFolder: this.settings?.user1?.settings?.questsFolder || '',
                completedQuestIds: this.settings.user1?.completedQuests || []
            });
        }

		new Notice('Settings saved !');
    }
	async exportQuestsToCSV() {
        if (!this.questService) {
            new Notice("Quest management service not initialized");
            return;
        }
        
        const csv = this.questService.exportQuestsToCSV();
        const fileName = 'quests_export.csv';
        
        try {
            await this.app.vault.create(fileName, csv);
            new Notice(`Quests exported to ${fileName}`);
        } catch (error) {
            console.error("Error exporting quests:", error);
            new Notice("Failed to export quests");
        }
    }
    
    async importQuestsFromCSV(filePath: string) {
        if (!this.questService) {
            new Notice("Quest management service not initialized");
            return;
        }
        
        try {
            const content = await this.app.vault.adapter.read(filePath);
            await this.questService.importQuestsFromCSV(content);
            new Notice("Quests imported successfully");
        } catch (error) {
            console.error("Error importing quests:", error);
            new Notice("Failed to import quests");
        }
    }
}
