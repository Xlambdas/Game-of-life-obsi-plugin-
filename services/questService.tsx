import { App, EventRef, Notice, Modal } from 'obsidian';
import { Quest, DEFAULT_QUEST, StatBlock } from '../constants/DEFAULT';
import { viewSyncService } from './syncService';
import { DataService } from "./dataService";
import { validateQuestFormData } from '../components/questHelpers';
import { QuestFormData } from '../types/quest';

export class QuestServices {
    private app: App;
    private plugin: any;
    private dataService: DataService;
    private quests: Quest[] = [];
    private completedQuestIds: string[] = [];
    private questCounter: number = 0;

    constructor(app: App, plugin: any) {
        this.app = app;
        this.plugin = plugin;
        this.dataService = this.plugin.dataService;
        this.initializeQuestCounter();
    }

    // Gets a specific quest by ID
    getQuestById(id: string): Quest | undefined {
        return this.quests.find(q => q.id === id);
    }

    async handleDelete(questId: string): Promise<void> {
        if (confirm('Are you sure you want to delete this quest? This action cannot be undone.')) {
            try {
                const quests = await this.dataService.loadQuestsFromFile();
                const updatedQuests = quests.filter((q: Quest) => q.id !== questId);
                await this.dataService.saveQuestsToFile(updatedQuests);
                new Notice('Quest deleted successfully');
                viewSyncService.emitStateChange({ questsUpdated: true });
            } catch (error) {
                console.error('Error deleting quest:', error);
                new Notice('Failed to delete quest');
            }
        }
    }

    async handleSave(quest: Quest, formData: QuestFormData): Promise<void> {
        try {
            const validationError = validateQuestFormData(formData);
            if (validationError) {
                new Notice(validationError);
                return;
            }
            formData.questId = quest.id;
            await this.saveQuestToJSON(formData);
            new Notice('Quest updated successfully');
            viewSyncService.emitStateChange({ questsUpdated: true });
        } catch (error) {
            console.error('Error saving quest:', error);
            new Notice('Failed to save quest changes');
        }
    }

    private async initializeQuestCounter() { // todo : use dataService (simplify)
        try {
            // const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
            // const content = await this.app.vault.adapter.read(questsPath);
			// const quests = JSON.parse(content);
            const quests = this.plugin.dataService.loadQuests()
            
            // Initialize the counter with the highest existing ID
            const maxId = quests.reduce((max: number, quest: Quest) => {
                const idNum = parseInt(quest.id.replace('quest_', ''));
                return isNaN(idNum) ? max : Math.max(max, idNum);
            }, 0);
            this.questCounter = maxId;

            // Créer un Set des IDs utilisés
            const usedIds = new Set<number>();
            quests.forEach((quest: Quest) => {
                const idNum = parseInt(quest.id.replace('quest_', ''));
                if (!isNaN(idNum)) {
                    usedIds.add(idNum);
                }
            });

            // Trouver le premier ID disponible en partant de 1
            let firstAvailableId = 1;
            while (usedIds.has(firstAvailableId)) {
                firstAvailableId++;
            }

            // Si le premier ID disponible est plus petit que le maxId,
            // on l'utilise comme point de départ
            if (firstAvailableId < maxId) {
                this.questCounter = firstAvailableId - 1;
            }
        } catch (error) {
            console.error("Error initializing quest counter:", error);
            this.questCounter = 0;
        }
    }

    private generateQuestId(): string { // todo : find the real use
        // Incrémenter le compteur et retourner le nouvel ID
        this.questCounter++;
        return `quest_${this.questCounter}`;
    }

    async setQuestCompleted(
        questId: string,
        completed: boolean,
        updateCallback: (xp: number) => Promise<void>
    ): Promise<boolean> {
        const quest = this.getQuestById(questId);
        if (!quest) {
            console.error("Quest not found:", questId);
            return false;
        }

        // Update local state
        quest.progression.isCompleted = completed;
        quest.progression.completed_at = new Date();
        quest.progression.progress = 100;

        // Update completed quests list
        if (completed) {
            if (!this.completedQuestIds.includes(questId)) {
                this.completedQuestIds.push(questId);
                // Award XP
                await updateCallback(quest.reward.XP);
                new Notice(`Quest completed! Earned ${quest.reward.XP} XP`);
            }
        } else {
            this.completedQuestIds = this.completedQuestIds.filter(id => id !== questId);
            // Remove XP
            await updateCallback(-quest.reward.XP);
            new Notice(`Quest uncompleted. Removed ${quest.reward.XP} XP`);
        }

        // Notify listeners about state change
        viewSyncService.emitStateChange({ questsUpdated: true });

        return true;
    }

    getAllQuests(): Quest[] {
        return this.quests;
    }

    private updateAttributesByCategory(category: string, currentAttributes: StatBlock): StatBlock {
        const attributes = { ...currentAttributes };
        
        // Mapping des catégories vers les attributs
        const categoryToAttribute: { [key: string]: keyof StatBlock } = {
            'Physical': 'strength',
            'Study': 'intelligence',
            'Social': 'charisma',
            'Personal': 'wisdom',
            'Work': 'endurance',
            'Adventure': 'agility',
            'Exploration': 'perception'
        };

        // Si la catégorie existe dans notre mapping, on incrémente l'attribut correspondant
        const attributeToUpdate = categoryToAttribute[category];
        if (attributeToUpdate) {
            attributes[attributeToUpdate] = (attributes[attributeToUpdate] || 0) + 1;
        }

        return attributes;
    }

    async saveQuestToJSON(formData: QuestFormData): Promise<Quest> {
        try {
            let quests = await this.dataService.loadQuestsFromFile();
            let quest: Quest;
            const existingQuestIndex = quests.findIndex(q => q.id === formData.questId);

            // Valeurs par défaut pour les attributs
            const defaultAttributes: StatBlock = {
                strength: 0,
                agility: 0,
                endurance: 0,
                charisma: 0,
                wisdom: 0,
                perception: 0,
                intelligence: 0
            };

            // Utiliser les attributs par défaut de DEFAULT_QUEST s'ils existent
            const defaultQuestAttributes = DEFAULT_QUEST.reward.attributes || defaultAttributes;

            if (existingQuestIndex !== -1) {
                // Update existing quest
                quest = quests[existingQuestIndex];
                quest.title = formData.title;
                quest.shortDescription = formData.shortDescription;
                quest.description = formData.description;
                quest.settings.priority = formData.priority as "low" | "medium" | "high";
                quest.settings.difficulty = formData.difficulty as "easy" | "medium" | "hard" | "expert";
                quest.settings.category = formData.category;
                quest.reward.XP = formData.reward_XP;
                quest.progression.dueDate = formData.dueDate;
                
                if (!quest.requirements) {
                    quest.requirements = { ...DEFAULT_QUEST.requirements };
                }
                quest.requirements.level = formData.require_level;
                quest.requirements.previousQuests = Array.isArray(formData.require_previousQuests) 
                    ? formData.require_previousQuests 
                    : formData.require_previousQuests.split(',');
                
                // Si des attributs sont fournis manuellement, les utiliser
                if (formData.attributeRewards) {
                    quest.reward.attributes = {
                        ...defaultAttributes,
                        ...formData.attributeRewards
                    };
                } else {
                    // Sinon, mettre à jour les attributs en fonction de la catégorie
                    const currentAttributes: StatBlock = {
                        ...defaultAttributes,
                        ...quest.reward.attributes
                    };
                    const updatedAttributes = this.updateAttributesByCategory(formData.category, currentAttributes);
                    quest.reward.attributes = updatedAttributes;
                }
            } else {
                // Create new quest using DEFAULT_QUEST as base
                const newId = this.generateQuestId();
                
                // Si des attributs sont fournis manuellement, les utiliser
                let finalAttributes: StatBlock;
                if (formData.attributeRewards) {
                    finalAttributes = {
                        ...defaultAttributes,
                        ...formData.attributeRewards
                    };
                } else {
                    // Sinon, mettre à jour les attributs en fonction de la catégorie
                    const baseAttributes: StatBlock = {
                        ...defaultAttributes
                    };
                    finalAttributes = this.updateAttributesByCategory(formData.category, baseAttributes);
                }

                quest = {
                    ...DEFAULT_QUEST,
                    id: newId,
                    title: formData.title,
                    shortDescription: formData.shortDescription || "",
                    description: formData.description || "",
                    created_at: new Date(),
                    settings: {
                        ...DEFAULT_QUEST.settings,
                        priority: formData.priority as "low" | "medium" | "high",
                        difficulty: formData.difficulty as "easy" | "medium" | "hard" | "expert",
                        category: formData.category || DEFAULT_QUEST.settings.category,
                    },
                    progression: {
                        ...DEFAULT_QUEST.progression,
                        isCompleted: false,
                        completed_at: new Date(0),
                        progress: 0,
                        dueDate: formData.dueDate || undefined,
                    },
                    reward: {
                        ...DEFAULT_QUEST.reward,
                        XP: formData.reward_XP || DEFAULT_QUEST.reward.XP,
                        attributes: finalAttributes,
                    },
                    requirements: {
                        ...DEFAULT_QUEST.requirements,
                        level: formData.require_level,
                        previousQuests: Array.isArray(formData.require_previousQuests) 
                            ? formData.require_previousQuests 
                            : formData.require_previousQuests.split(','),
                    },
                    isSystemQuest: false
                };
                quests.push(quest);
            }

            await this.dataService.saveQuestsToFile(quests);
            new Notice('Quest saved successfully');
            return quest;
        } catch (error) {
            console.error('Error saving quest:', error);
            new Notice('Failed to save quest');
            throw error;
        }
    }

    /**
     * Get completed quest IDs for saving to user settings
     */
    getCompletedQuestIds(): string[] {
        return this.completedQuestIds;
    }

    /**
     * Update completed quest IDs (e.g., from loaded user settings)
     */
    updateCompletedQuestIds(ids: string[]) {
        this.completedQuestIds = ids;

        // Update quest completion status
        this.quests = this.quests.map(quest => ({
            ...quest,
            completed: this.completedQuestIds.includes(quest.id)
        }));
    }

    getQuestDueDate(questId: string): Date | undefined {
        const quest = this.getQuestById(questId);
        if (!quest) {
            return undefined;
        }
        return quest.progression.dueDate;
    }

    async createQuest(formData: QuestFormData): Promise<Quest> {
        return this.saveQuestToJSON(formData);
    }

}

export class QuestServices_old {
	private app: App;
	private plugin: any;
	private quests: Quest[] = [];
	private completedQuestIds: string[] = [];
	private questCounter: number = 0;
	private availableIds: Set<number> = new Set();

	constructor(app: App, plugin: any) {
		this.app = app;
		this.plugin = plugin;
		this.initializeQuestCounter();
	}

	private async initializeQuestCounter() {
		try {
			const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
			const content = await this.app.vault.adapter.read(questsPath);
			const quests = JSON.parse(content);
			
			// Initialiser le compteur avec le plus grand ID existant
			const maxId = quests.reduce((max: number, quest: Quest) => {
				const idNum = parseInt(quest.id.replace('quest_', ''));
				return isNaN(idNum) ? max : Math.max(max, idNum);
			}, 0);
			this.questCounter = maxId;

			// Créer un ensemble des IDs utilisés
			const usedIds = new Set<number>();
			quests.forEach((quest: Quest) => {
				const idNum = parseInt(quest.id.replace('quest_', ''));
				if (!isNaN(idNum)) {
					usedIds.add(idNum);
				}
			});

			// Créer un ensemble des IDs disponibles (1 à maxId)
			this.availableIds = new Set<number>();
			for (let i = 1; i <= maxId; i++) {
				if (!usedIds.has(i)) {
					this.availableIds.add(i);
				}
			}
		} catch (error) {
			console.error("Error initializing quest counter:", error);
			this.questCounter = 0;
			this.availableIds = new Set<number>();
		}
	}

	private generateQuestId(): string {
		let id: number;
		
		// Si des IDs sont disponibles, utiliser le plus petit
		if (this.availableIds.size > 0) {
			id = Math.min(...this.availableIds);
			this.availableIds.delete(id);
		} else {
			// Sinon, incrémenter le compteur
			this.questCounter++;
			id = this.questCounter;
		}
		
		return `quest_${id}`;
	}

	/**
	 * Configure l'écouteur pour les modifications du fichier Markdown
	 */
	// private setupMarkdownFileListener() {
	// 	// Supprimer l'ancien écouteur s'il existe
	// 	if (this.markdownFileEventRef) {
	// 		this.app.workspace.offref(this.markdownFileEventRef);
	// 	}

	// 	// Créer un nouvel écouteur
	// 	this.markdownFileEventRef = this.app.workspace.on('editor-change', async (editor: any, view: any) => {
	// 		if (view?.file) {
	// 			const markdownPath = `${this.plugin.settings.user1.settings.questsFolder}/${this.plugin.settings.user1.settings.questsFileName}`;
	// 			if (view.file.path === markdownPath) {
	// 				console.log('Markdown file changed, syncing to JSON...');
	// 				try {
	// 					const content = await this.app.vault.adapter.read(markdownPath);
	// 					// await this.syncMarkdownToJSON(content);
	// 				} catch (error) {
	// 					console.error('Error syncing markdown changes:', error);
	// 					new Notice('Failed to sync markdown changes to JSON');
	// 				}
	// 			}
	// 		}
	// 	});
	// }

    /**
     * Template for new quests file
     */
    private getQuestsTemplate(): string {
        return `# Quests

> This file contains your quests. Edit them directly or use the plugin interface.
> Each quest is defined by a level 2 heading (##) with YAML frontmatter.
> The frontmatter should be enclosed in --- markers.

## Example Quest
---
- title: Example Quest
- description: This is an example quest
- reward:
	- XP: 50
	- items: []
- difficulty: easy
- priority: medium
- category: tutorial
- due_date: 2024-12-31
---
`;
    }

	/**
     * Gets all quests
     */
    getAllQuests(): Quest[] {
        return this.quests;
    }

    /**
     * Gets a specific quest by ID
     */
    getQuestById(id: string): Quest | undefined {
        return this.quests.find(q => q.id === id);
    }

    /**
     * Sets the completion status of a quest
     */
    async setQuestCompleted(
        questId: string,
        completed: boolean,
        updateCallback: (xp: number) => Promise<void>
    ): Promise<boolean> {
        const quest = this.getQuestById(questId);
        if (!quest) {
            console.error("Quest not found:", questId);
            return false;
        }
        
        // Update local state
		quest.progression.isCompleted = completed;
		quest.progression.completed_at = new Date();
		quest.progression.progress = 100;
        
        // Update completed quests list
        if (completed) {
            if (!this.completedQuestIds.includes(questId)) {
                this.completedQuestIds.push(questId);
                // Award XP
                await updateCallback(quest.reward.XP);
                new Notice(`Quest completed! Earned ${quest.reward.XP} XP`);
            }
        } else {
            this.completedQuestIds = this.completedQuestIds.filter(id => id !== questId);
            // Remove XP
            await updateCallback(-quest.reward.XP);
            new Notice(`Quest uncompleted. Removed ${quest.reward.XP} XP`);
        }
        
        // Notify listeners about state change
        viewSyncService.emitStateChange({ questsUpdated: true });
        
        return true;
    }

    /**
     * Saves a new quest to the JSON file
     */
    async saveQuestToJSON(
        title: string,
        shortDescription: string,
        description: string,
        reward: number,
        require_level: number,
        require_previousQuests: string,
        difficulty: string,
        category: string,
        dueDate: Date | undefined,
        priority: string,
        questId?: string,
        attributes?: StatBlock
    ): Promise<Quest> {
        try {
            const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
            let quests: Quest[] = [];
            
            try {
                const content = await this.app.vault.adapter.read(questsPath);
                quests = JSON.parse(content);
            } catch (error) {
                console.log("No existing quests file found, creating new one");
            }

            let quest: Quest;
            const existingQuestIndex = quests.findIndex(q => q.id === questId);

            if (existingQuestIndex !== -1) {
                // Update existing quest
                quest = quests[existingQuestIndex];
                quest.title = title;
                quest.shortDescription = shortDescription;
                quest.description = description;
                quest.settings.priority = priority as "low" | "medium" | "high";
                quest.settings.difficulty = difficulty as "easy" | "medium" | "hard" | "expert";
                quest.settings.category = category;
                quest.reward.XP = reward;
                quest.progression.dueDate = dueDate;
                if (!quest.requirements) {
                    quest.requirements = {
                        level: 0,
                        previousQuests: [],
                        stats: {
                            strength: 0,
                            agility: 0,
                            endurance: 0,
                            charisma: 0,
                            wisdom: 0,
                            perception: 0,
                            intelligence: 0
                        }
                    };
                }
                quest.requirements.level = require_level;
                quest.requirements.previousQuests = require_previousQuests ? require_previousQuests.split(',') : [];
                
                if (attributes) {
                    quest.reward.attributes = attributes;
                }
            } else {
                // Create new quest
                const newId = this.generateQuestId();
                const defaultQuest = { ...DEFAULT_QUEST };
                quest = {
                    ...defaultQuest,
                    id: newId,
                    title,
                    shortDescription: shortDescription || "",
                    description: description || "",
                    created_at: new Date(),
                    settings: {
                        ...defaultQuest.settings,
                        priority: priority as "low" | "medium" | "high",
                        difficulty: difficulty as "easy" | "medium" | "hard" | "expert",
                        category,
                    },
                    progression: {
                        ...defaultQuest.progression,
                        isCompleted: false,
                        completed_at: new Date(0),
                        progress: 0,
                        dueDate: dueDate || undefined,
                    },
                    reward: {
                        ...defaultQuest.reward,
                        XP: reward,
                        attributes: attributes || defaultQuest.reward.attributes,
                    },
                    requirements: {
                        ...defaultQuest.requirements,
                        level: require_level,
                        previousQuests: require_previousQuests ? require_previousQuests.split(',') : [],
                    },
                    isSystemQuest: false
                };
                quests.push(quest);
            }

            await this.app.vault.adapter.write(questsPath, JSON.stringify(quests, null, 2));
            new Notice('Quest saved successfully');
            return quest;
        } catch (error) {
            console.error('Error saving quest:', error);
            new Notice('Failed to save quest');
            throw error;
        }
    }

    async saveQuestToMarkdown(quest: Omit<Quest, 'id' | 'completed'>): Promise<Quest> {
        try {
            const fullPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.md`;
            const content = await this.app.vault.adapter.read(fullPath);
            // Generate ID using counter
            const id = this.generateQuestId();

            // Format as markdown with YAML frontmatter
            const questMarkdown = `
 ## ${quest.title}
 ---
 xp: ${quest.reward.XP}
 description: ${quest.description}
 difficulty: ${quest.settings.difficulty || 'easy'}
 category: ${quest.settings.category || 'uncategorized'}
 ${quest.settings.priority ? `priority: ${quest.settings.priority}` : ''}
 ${quest.progression.dueDate ? `due_date: ${quest.progression.dueDate}` : ''}
 ---
 
 `;

            // Append to file
            await this.app.vault.adapter.write(
                fullPath, 
                content + questMarkdown
            );

            const newQuest = {
                ...DEFAULT_QUEST,
                id,
                reward: quest.reward,
            }

            this.quests.push(newQuest);
            
            new Notice("Quest created successfully!");
            return newQuest;

			} catch (error) {
				console.error("Error saving quest:", error);
				throw error;
			}
		}

    /**
     * Get completed quest IDs for saving to user settings
     */
    getCompletedQuestIds(): string[] {
        return this.completedQuestIds;
    }

    /**
     * Update completed quest IDs (e.g., from loaded user settings)
     */
    updateCompletedQuestIds(ids: string[]) {
        this.completedQuestIds = ids;
        
        // Update quest completion status
        this.quests = this.quests.map(quest => ({
            ...quest,
            completed: this.completedQuestIds.includes(quest.id)
        }));
    }

    /**
     * Synchronise les quêtes du fichier JSON vers le fichier Markdown
     */
    async syncQuestsToMarkdown(): Promise<void> {
        try {
            const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
            const markdownPath = `${this.plugin.settings.user1.settings.questsFolder}/${this.plugin.settings.user1.settings.questsFileName}`;
            
            // Vérifier si le fichier JSON existe et contient des données
            const jsonExists = await this.app.vault.adapter.exists(questsPath);
            if (!jsonExists) {
                console.error('Quests JSON file not found');
                return;
            }

            // Lire les quêtes existantes
            const content = await this.app.vault.adapter.read(questsPath);
            const quests: Quest[] = JSON.parse(content);
            
            if (!Array.isArray(quests) || quests.length === 0) {
                console.error('No quests found in JSON file');
                return;
            }

            // Créer une sauvegarde du JSON actuel
            const backupPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests_backup_${Date.now()}.json`;
            await this.app.vault.adapter.write(backupPath, content);
            
            // Vérifier si le dossier existe
            const folderExists = await this.app.vault.adapter.exists(this.plugin.settings.user1.settings.questsFolder);
            if (!folderExists) {
                await this.app.vault.createFolder(this.plugin.settings.user1.settings.questsFolder);
            }

            // Vérifier si le fichier Markdown existe déjà
            const markdownExists = await this.app.vault.adapter.exists(markdownPath);
            if (markdownExists) {
                // Si le fichier existe, vérifier s'il contient des données
                const currentContent = await this.app.vault.adapter.read(markdownPath);
                if (currentContent.trim() === '') {
                    // Si le fichier est vide, on le supprime pour le recréer
                    await this.app.vault.adapter.remove(markdownPath);
                }
            }
            
            // Générer le contenu Markdown
            let markdownContent = `# Quests\n\n`;
            markdownContent += `> This file contains your quests. Edit them directly or use the plugin interface.\n`;
            markdownContent += `> Each quest is defined by a level 3 heading (###) with YAML frontmatter.\n`;
            markdownContent += `> The frontmatter should be enclosed in --- markers.\n\n`;

            // Séparer les quêtes complétées et non complétées
            const completedQuests = quests.filter(quest => quest.progression.isCompleted);
            const activeQuests = quests.filter(quest => !quest.progression.isCompleted);

            // Fonction pour trier les quêtes par priorité
            const sortByPriority = (a: Quest, b: Quest) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const priorityA = a.settings.priority || 'low';
                const priorityB = b.settings.priority || 'low';
                return priorityOrder[priorityA] - priorityOrder[priorityB];
            };

            // Trier les quêtes
            completedQuests.sort(sortByPriority);
            activeQuests.sort(sortByPriority);

            // Section des quêtes actives
            markdownContent += `## Active Quests\n\n`;
            for (const quest of activeQuests) {
                markdownContent += `### ${quest.title}\n`;
                markdownContent += `---\n`;
                markdownContent += `shortDescription: ${quest.shortDescription || ""}\n`;
                markdownContent += `description: ${quest.description || ""}\n`;
                markdownContent += `reward:\n`;
                markdownContent += `  XP: ${quest.reward.XP}\n`;
                markdownContent += `  items: ${JSON.stringify(quest.reward.items || [])}\n`;
                markdownContent += `difficulty: ${quest.settings.difficulty || "easy"}\n`;
                markdownContent += `category: ${quest.settings.category || "Other"}\n`;
                markdownContent += `priority: ${quest.settings.priority || "low"}\n`;
                if (quest.progression.dueDate) {
                    markdownContent += `dueDate: ${quest.progression.dueDate}\n`;
                }
                markdownContent += `created_at: ${quest.created_at}\n`;
                markdownContent += `\n---\n\n`;
            }

            // Section des quêtes complétées
            if (completedQuests.length > 0) {
                markdownContent += `## Completed Quests\n\n`;
                for (const quest of completedQuests) {
                    markdownContent += `### ${quest.title}\n`;
                    markdownContent += `---\n`;
                    markdownContent += `shortDescription: ${quest.shortDescription || ""}\n`;
                    markdownContent += `description: ${quest.description || ""}\n`;
                    markdownContent += `reward:\n`;
                    markdownContent += `  XP: ${quest.reward.XP}\n`;
                    markdownContent += `  items: ${JSON.stringify(quest.reward.items || [])}\n`;
                    markdownContent += `difficulty: ${quest.settings.difficulty || "easy"}\n`;
                    markdownContent += `category: ${quest.settings.category || "Other"}\n`;
                    markdownContent += `priority: ${quest.settings.priority || "low"}\n`;
                    if (quest.progression.dueDate) {
                        markdownContent += `dueDate: ${quest.progression.dueDate}\n`;
                    }
                    markdownContent += `created_at: ${quest.created_at}\n`;
                    markdownContent += `\n---\n\n`;
                }
            }
            
            // Écrire dans le fichier Markdown
            await this.app.vault.adapter.write(markdownPath, markdownContent);
            
        } catch (error) {
            console.error("Error synchronizing quests to Markdown:", error);
            throw error;
        }
    }

    /**
     * Synchronise les modifications du fichier Markdown vers le JSON
     */
    // async syncMarkdownToJSON(markdownContent: string): Promise<void> {
    //     try {
    //         if (!markdownContent || markdownContent.trim() === '') {
    //             console.log('Markdown file is empty, skipping sync');
    //             return;
    //         }

    //         const questsPath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
            
    //         // Lire les quêtes existantes
    //         let existingQuests: Quest[] = [];
    //         try {
    //             const content = await this.app.vault.adapter.read(questsPath);
    //             existingQuests = JSON.parse(content);
    //         } catch (error) {
    //             console.log('No existing quests file or error reading it');
    //         }

    //         // Créer une map des quêtes existantes avec le titre comme clé
    //         const existingQuestsMap = new Map<string, Quest>();
    //         existingQuests.forEach(quest => {
    //             existingQuestsMap.set(quest.title, quest);
    //         });

    //         // Parser le contenu Markdown
    //         const quests: Quest[] = [];
            
    //         // Séparer le contenu en sections principales (##)
    //         const mainSections = markdownContent.split(/^##\s+/m).filter(section => section.trim());
            
    //         for (const section of mainSections) {
    //             if (section.startsWith('Quests')) continue;
                
    //             const isCompleted = section.includes('Completed Quests');
    //             const questBlocks = section.split(/^###\s+/m).filter(block => block.trim());
                
    //             for (const questBlock of questBlocks) {
    //                 const [title, ...rest] = questBlock.split('\n');
    //                 const yamlContent = rest.join('\n');
                    
    //                 const yamlMatch = yamlContent.match(/---\n([\s\S]*?)\n---/);
    //                 if (!yamlMatch) continue;
                    
    //                 const yamlText = yamlMatch[1];
    //                 const metadata: any = {};
                    
    //                 // Parser le YAML
    //                 yamlText.split('\n').forEach(line => {
    //                     const [key, ...valueParts] = line.split(':');
    //                     if (key && valueParts.length > 0) {
    //                         const value = valueParts.join(':').trim();
    //                         if (key.trim() === 'reward') {
    //                             metadata.reward = {};
    //                             const rewardLines = value.split('\n');
    //                             rewardLines.forEach(rewardLine => {
    //                                 const [rewardKey, ...rewardValueParts] = rewardLine.split(':');
    //                                 if (rewardKey && rewardValueParts.length > 0) {
    //                                     const rewardValue = rewardValueParts.join(':').trim();
    //                                     if (rewardKey.trim() === 'XP') {
    //                                         metadata.reward.XP = parseInt(rewardValue) || 0;
    //                                     } else if (rewardKey.trim() === 'items') {
    //                                         try {
    //                                             metadata.reward.items = JSON.parse(rewardValue);
    //                                         } catch (e) {
    //                                             metadata.reward.items = [];
    //                                         }
    //                                     }
    //                                 }
    //                             });
    //                         } else {
    //                             metadata[key.trim()] = value;
    //                         }
    //                     }
    //                 });

    //                 // Vérifier si la quête existe déjà
    //                 const existingQuest = existingQuestsMap.get(title.trim());
    //                 let questId: string;

    //                 if (existingQuest) {
    //                     // Utiliser l'ID existant
    //                     questId = existingQuest.id;
    //                 } else {
    //                     // Générer un nouvel ID
    //                     questId = this.generateQuestId();
    //                 }

    //                 const quest: Quest = {
    //                     id: questId,
    //                     title: title.trim(),
    //                     shortDescription: metadata.shortDescription || existingQuest?.shortDescription || "",
    //                     description: metadata.description || existingQuest?.description || "",
    //                     reward: {
    //                         XP: metadata.reward?.XP || existingQuest?.reward.XP || 0,
    //                         items: metadata.reward?.items || existingQuest?.reward.items || []
    //                     },
    //                     progression: {
    //                         isCompleted: isCompleted,
    //                         completed_at: isCompleted ? new Date() : new Date(0),
    //                         progress: isCompleted ? 100 : 0,
    //                         dueDate: metadata.dueDate || existingQuest?.progression.dueDate || "",
    //                         subtasks: [],
    //                     },
    //                     settings: {
    //                         difficulty: metadata.difficulty || existingQuest?.settings.difficulty || "easy",
    //                         category: metadata.category || existingQuest?.settings.category || "Other",
    //                         priority: metadata.priority || existingQuest?.settings.priority || "low",
    //                     },
    //                     created_at: existingQuest?.created_at || new Date(),
    //                     progress: existingQuest?.progress || 0,
    //                     requirements: existingQuest?.requirements || {
    //                         level: 0,
    //                         previousQuests: []
    //                     }
    //                 };
                    
    //                 quests.push(quest);
    //             }
    //         }

    //         // Vérifier les IDs dupliqués
    //         const idMap = new Map<string, Quest>();
    //         const duplicateIds = new Set<string>();
            
    //         quests.forEach(quest => {
    //             if (idMap.has(quest.id)) {
    //                 duplicateIds.add(quest.id);
    //             } else {
    //                 idMap.set(quest.id, quest);
    //             }
    //         });

    //         // Corriger les IDs dupliqués
    //         if (duplicateIds.size > 0) {
    //             console.log('Found duplicate IDs:', Array.from(duplicateIds));
    //             quests.forEach(quest => {
    //                 if (duplicateIds.has(quest.id)) {
    //                     quest.id = this.generateQuestId();
    //                 }
    //             });
    //         }
            
    //         // Sauvegarder dans le JSON
    //         await this.app.vault.adapter.write(questsPath, JSON.stringify(quests, null, 2));
    //         new Notice("Quests synchronized to JSON successfully!");
            
    //         // Mettre à jour le cache local
    //         this.quests = quests;
            
    //     } catch (error) {
    //         console.error("Error synchronizing Markdown to JSON:", error);
    //         new Notice("Failed to synchronize quests to JSON");
    //         throw error;
    //     }
    // }

}
