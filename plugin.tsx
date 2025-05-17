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
import { DEFAULT_SETTINGS, Quest, UserSettings } from './constants/DEFAULT';
import { appContextService } from 'context/appContextService';
import { markdownServices } from './services/questService';
import { QuestModal } from './modales/questModal';


export default class GOL extends Plugin {
	// Create all the settings for the game...
    settings: UserSettings;
    quest: Quest;
	questService: markdownServices;
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
        this.questService = new markdownServices(this.app, this);

        // Initialize appContextService with the plugin instance
        appContextService.initialize(this);

        // Load settings first
        await this.dataService.loadSettings();
        if (this.dataService) {
            this.settings = this.dataService.settings;
        }

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

        // Ajouter un gestionnaire d'événements pour la synchronisation des quêtes
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
                            await this.questService.syncQuestsToMarkdown();
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

        // Ajouter un gestionnaire pour les modifications du fichier Markdown
        this.registerEvent(
            this.app.vault.on('modify', async (file) => {
                if (!file || !(file instanceof TFile)) return;
                
                const questsFileName = this.settings?.user1?.settings?.questsFileName || 'Quests.md';
                const questsFolder = this.settings?.user1?.settings?.questsFolder || '';
                const fullPath = questsFolder ? `${questsFolder}/${questsFileName}` : questsFileName;

                if (file.path === fullPath) {
                    try {
                        const content = await this.app.vault.read(file);
                        await this.questService.syncMarkdownToJSON(content);
                    } catch (error) {
                        console.error('Error syncing markdown to JSON:', error);
                        new Notice("Failed to synchronize quests to JSON");
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
            const modal = new QuestModal(this.app, this);
            modal.open();
        } catch (error) {
            console.error('Error creating quest modal:', error);
            new Notice("Failed to create quest modal. Check console for details.");
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
