// import { getAppContextService } from '../../plugin';
import { AppContextService } from '../appContextService';
import { Quest } from '../../data/DEFAULT';
import { v4 as uuid } from 'uuid';
import { CreateQuestModal } from '../../modal/questModal';
import { App } from 'obsidian';
import GOL from '../../plugin';

export default class QuestService {
	private appContext: AppContextService;

	constructor(contextService: AppContextService) {
		this.appContext = contextService;
	}

	async createQuest(app: App): Promise<void> {
		new CreateQuestModal(app).open();
	}

	async saveQuest(quest: Quest): Promise<void> {
		console.log("Saving quest (quest Service):", quest);
		await this.appContext.addQuest(quest);
	}

	async addCategory(newCategory: string): Promise<void> {
		const user = this.appContext.getUser();
		if (!user.settings.addedCategories) {
			user.settings.addedCategories = [];
		}
		if (!user.settings.addedCategories.includes(newCategory)) {
			user.settings.addedCategories.push(newCategory);
			this.appContext.updateUserData({
				settings: {
					...user.settings,
					addedCategories: user.settings.addedCategories
				}
			});
		}
	}
	getUserCategories(): string[] {
		const user = this.appContext.getUser();
		return user.settings.addedCategories || [];
	}
	async toggleQuestCompletion(quest: Quest): Promise<Quest> {
    // Cloner l'objet pour éviter les mutations directes
    const updatedQuest: Quest = {
      ...quest,
      progression: {
        ...quest.progression,
        isCompleted: !quest.progression.isCompleted,
        progress: !quest.progression.isCompleted ? 100 : 0,
        completedAt: !quest.progression.isCompleted ? new Date() : null,
        lastUpdated: new Date(),
      },
    };

    // Sauvegarde en DB via AppContextService
    await this.appContext.updateQuest(updatedQuest);

    return updatedQuest;
  }
}

