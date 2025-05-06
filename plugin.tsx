/**
 * The `game_of_life` class is an Obsidian plugin that provides a game-like experience
 * with customizable settings, views, and commands. It manages the lifecycle of the plugin,
 * including loading settings, registering views, and handling periodic tasks.
 */
import { Plugin, Notice } from 'obsidian';
import { GameSettings, selfSettingTab } from './data/settings';
import { ViewService } from './services/viewServices';
import { DataService } from './services/dataService';
import { registerCommands } from './commands/registerCommands';
import { QuestSettings } from './constants/DEFAULT';

export default class GOL extends Plugin {
	// Create all the settings for the game...
    settings: GameSettings;
    questSetting: QuestSettings;
    intervalId: number | undefined;
    viewService: ViewService;
    dataService: DataService;

    async onload() {
        console.warn('loading plugin');

        // Initialize services and load settings
        this.viewService = new ViewService(this);
        this.dataService = new DataService(this.app);
        await this.dataService.loadSettings();
        this.settings = this.dataService.settings;
        this.questSetting = this.dataService.questSetting;

        // Register views (main and side view)
        this.viewService.registerViews();

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

        // Register commands (all the commands of the plugin - ctrl + p)
        registerCommands(this, this.viewService);

        // Set interval for periodic check
        this.intervalId = window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000);
    }

    onunload() {
        console.warn('unloading plugin');
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    async newQuest() {
		// Open the quest modal to create a new quest
        const { QuestModal } = await import('./modales/questModal');
        new QuestModal(this.app, this).open();
    }

    async saveSettings() {
        await this.dataService.saveSettings();
    }
}
