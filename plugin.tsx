import { Plugin, Notice } from 'obsidian';
import { GameSettings, selfSettingTab } from './data/settings';
import { ViewService } from './services/viewServices';
import { DataService } from './services/dataService';
import { registerCommands } from './commands/registerCommands';
import { QuestSettings } from './modales/questModal';

// export const AppContext = createContext<App | undefined>(undefined); // todo : trouver a quoi ca sert (ancienne version)


export default class game_of_life extends Plugin {
    settings: GameSettings;
    questSetting: QuestSettings;
    intervalId: number | undefined;
    viewService: ViewService;
    dataService: DataService;

    async onload() {
        console.warn('loading plugin');
        
        // Initialize services
        this.viewService = new ViewService(this);
        this.dataService = new DataService(this.app);
        
        // Load settings
        await this.dataService.loadSettings();
        this.settings = this.dataService.settings;
        this.questSetting = this.dataService.questSetting;
        
        // Register views
        this.viewService.registerViews();
        
        // Register settings tab
        this.addSettingTab(new selfSettingTab(this.app, this));
        
        // Add ribbon icons
        this.addRibbonIcon('dice', 'Activate sideview', () => {
            this.viewService.openSideView();
            new Notice("Welcome Back !");
        });

        this.addRibbonIcon('sword', 'Activate mainview', () => {
            this.viewService.openMainView();
            new Notice("Welcome Back !");
        });
        
        // Register commands
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
        console.log('t\'as une nouvelle quete bro');
        const { QuestModal } = await import('./modales/questModal');
        new QuestModal(this.app, this).open();
    }

    async saveSettings() {
        await this.dataService.saveSettings();
    }
}
