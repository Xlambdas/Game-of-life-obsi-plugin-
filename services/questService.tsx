import { App, EventRef, Notice, Modal } from 'obsidian';
import { Quest, DEFAULT_QUEST, StatBlock, DefaultCategory, DefaultPriority, DefaultDifficulty } from '../constants/DEFAULT';
import { viewSyncService } from './syncService';
import { DataService } from "./dataService";
import { validateQuestFormData, QuestFormData } from '../components/questFormHelpers';
import { updateAttributesByCategory } from '../components/formHelpers';
import GOL from '../plugin';
import { useAppContext } from 'context/appContext';

export class QuestServices {
    private app: App;
    private plugin: GOL;
    private dataService: DataService;
    private quests: Quest[] = [];
    private completedQuestIds: string[] = [];
    private questCounter: number = 0;
    private usedIds: Set<number> = new Set();

    constructor(app: App, plugin: any) {
        this.app = app;
        this.plugin = plugin;
        this.dataService = this.plugin.dataService;
        this.initializeQuestCounter();
    }

    getAllQuests(): Quest[] {
        return this.quests;
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

    private async initializeQuestCounter(): Promise<void> {
        try {
            const quests = await this.plugin.dataService.loadQuestsFromFile();
            if (!Array.isArray(quests)) {
                console.error("Quests data is not an array:", quests);
                this.questCounter = 0;
                return;
            }
            // Track all used IDs
            quests.forEach((quest: Quest) => {
                const idNum = parseInt(quest.id.replace('quest_', ''));
                if (!isNaN(idNum)) {
                    this.usedIds.add(idNum);
                }
            });
        } catch (error) {
            console.error("Error initializing quest counter:", error);
            this.questCounter = 0;
        }
    }

    private generateQuestId(): string {
        // Find first available ID
        let newId = 1;
        while (this.usedIds.has(newId)) {
            newId++;
        }
        this.usedIds.add(newId);
        return `quest_${newId}`;
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
			// quest.progression.completed_at = new Date();
			// quest.progression.progress = 100;
            if (!this.completedQuestIds.includes(questId)) {
                this.completedQuestIds.push(questId);
                // Award XP
                await updateCallback(quest.reward.XP);
                new Notice(`Quest completed! Earned ${quest.reward.XP} XP`);
            }
        } else {
			quest.progression.completed_at = new Date(0);
			quest.progression.progress = 0;
            this.completedQuestIds = this.completedQuestIds.filter(id => id !== questId);
            // Remove XP
            await updateCallback(-quest.reward.XP);
            new Notice(`Quest uncompleted. Removed ${quest.reward.XP} XP`);
        }

		// Save the updated quest data
		try {
			await this.plugin.dataService.saveQuestsToFile(this.quests);
		} catch (error)	 {
			console.error('Error saving quest completion status:', error);
			return false;
		}

        // Notify listeners about state change
        viewSyncService.emitStateChange({ questsUpdated: true });

        return true;
    }

	async handleCompleteQuest(quest: Quest, plugin: any, setQuests: any, setError: any, updateXP: any) {
		try {
			const quests = await this.plugin.dataService.loadQuests();
			console.log("Quests loaded:", quests);
            const userData: any = await this.plugin.dataService.loadUser();
            if (userData == null || userData.user1 == null) {
                throw new Error("User data is missing or malformed");
            }
            console.log("User data loaded:", userData);
            // First update local state for immediate UI feedback
            setQuests((prevQuests: Quest[]) =>
                prevQuests.map(q =>
                    q.id === quest.id ? { ...q, progression: { ...q.progression, isCompleted: !q.progression.isCompleted } } : q
                )
            );

			const isCurrentlyCompletedInUI = quest.progression.isCompleted;
			console.log(`Quest ${quest.id} UI state - Completed: ${isCurrentlyCompletedInUI}`);

			if (isCurrentlyCompletedInUI) {
				// Marquer comme non complétée et enlever XP :
				console.log(`Unmarking quest ${quest.id} as completed and removing ${quest.reward.XP} XP`);
				userData.user1.persona.xp -= quest.reward.XP;
				userData.user1.completedQuests = userData.user1.completedQuests.filter((id: string) => id !== quest.id);

				// update the status in the quests file
				const updatedQuests = quests.map((q: Quest) =>
					q.id === quest.id ? { ...q, progression: { ...q.progression, isCompleted: false, progress: 0, completed_at: new Date(0) } } : q
				);
				await this.plugin.dataService.saveQuestsToFile(updatedQuests);
				await this.plugin.dataService.saveSettings();
				updateXP(-quest.reward.XP);
				new Notice(`Quest uncompleted. Removed ${quest.reward.XP} XP`);
			} else {
				// If the quest is not currently completed in the UI, mark it as completed and add XP:
				console.log(`Marking quest ${quest.id} as completed and adding ${quest.reward.XP} XP`);

				if (!userData.user1.completedQuests.includes(quest.id)) {
					userData.user1.completedQuests.push(quest.id);
					userData.user1.persona.xp += quest.reward.XP;

					const updatedQuests = quests.map((q: Quest) =>
						q.id === quest.id ? { ...q, progression: { ...q.progression, isCompleted: true, progress: 100, completed_at: new Date() } } : q
					);
					await this.plugin.dataService.saveQuestsToFile(updatedQuests);
					await this.plugin.dataService.saveSettings();
					updateXP(quest.reward.XP);
					new Notice(`Quest completed! Earned ${quest.reward.XP} XP`);
				} else {
					// The quest was already marked as completed in the user data, but not in the UI.. Should not happen
					console.warn(`Quest ${quest.id} was already completed in data but not in UI`);
				}
			}
			setError(null);
		} catch (error) {
			console.error("Error handling quest completion:", error);
			setError("Failed to update quest status");
			new Notice("Failed to update quest status");
		}
	}

    async saveQuestToJSON(formData: QuestFormData): Promise<Quest> {
        try {
            let quests = await this.dataService.loadQuestsFromFile();
            let quest: Quest;
            const existingQuestIndex = quests.findIndex(q => q.id === formData.questId);

            // Valeurs par défaut pour les attributs
            const defaultAttributes = updateAttributesByCategory(
                formData.category,
                DEFAULT_QUEST.reward.attributes ?? {} as StatBlock
            ) || (DEFAULT_QUEST.reward.attributes ?? {} as StatBlock);


            const defaultQuestAttributes = DEFAULT_QUEST.reward.attributes || defaultAttributes;

            if (existingQuestIndex !== -1) {
                // Update existing quest
                quest = quests[existingQuestIndex];
                quest.title = formData.title;
                quest.shortDescription = formData.shortDescription;
                quest.description = formData.description;
                quest.settings.priority = formData.priority as DefaultPriority;
                quest.settings.difficulty = formData.difficulty as DefaultDifficulty;
                quest.settings.category = formData.category as DefaultCategory | string;
                quest.reward.XP = formData.reward_XP;
                quest.progression.dueDate = formData.dueDate;
                
                if (!quest.requirements) {
                    quest.requirements = { ...DEFAULT_QUEST.requirements };
                }
                quest.requirements.level = formData.require_level;
                quest.requirements.previousQuests = Array.isArray(formData.require_previousQuests) 
                    ? formData.require_previousQuests 
                    : formData.require_previousQuests.split(',');
                
                // if attributes are provided manually, use them
                if (formData.attributeRewards) {
                    quest.reward.attributes = {
                        ...defaultAttributes,
                        ...formData.attributeRewards
                    };
                } else {
                    const currentAttributes: StatBlock = {
                        ...defaultAttributes,
                        ...quest.reward.attributes
                    };
                    const updatedAttributes = updateAttributesByCategory(formData.category, currentAttributes);
                    quest.reward.attributes = updatedAttributes;
                }
            } else {
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
                    finalAttributes = updateAttributesByCategory(formData.category, baseAttributes);
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
                        priority: formData.priority as DefaultPriority,
                        difficulty: formData.difficulty as DefaultDifficulty,
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




// ------------------------------------------------
// old version //todo : delete when no use anymore
// ------------------------------------------------

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
