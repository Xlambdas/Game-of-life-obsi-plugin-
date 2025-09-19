import { App } from 'obsidian';
import { AppContextService } from '../appContextService';
import { Quest } from '../../data/DEFAULT';
import { CreateQuestModal } from '../../modal/questModal';

export default class QuestService {
	private appContext: AppContextService;

	constructor(contextService: AppContextService) {
		this.appContext = contextService;
	}

	async createQuest(app: App): Promise<void> {
		new CreateQuestModal(app).open();
	}

	async saveQuest(quest: Quest): Promise<void> {
		console.log("Saving quest :", quest);
		await this.appContext.addQuest(quest);
	}

	async addCategory(newCategory: string): Promise<void> {
		const user = this.appContext.getUser();
		const categories = user.settings.addedCategories || [];
		
		if (!categories.includes(newCategory)) {
			const updatedCategories = [...categories, newCategory];
			await this.appContext.updateUserData({
				settings: { ...user.settings, addedCategories: updatedCategories }
			});
		}
	}

	getUserCategories(): string[] {
		return this.appContext.getUser().settings.addedCategories || [];
	}

	async toggleQuestCompletion(quest: Quest): Promise<Quest> {
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
		await this.appContext.updateQuest(updatedQuest);
		return updatedQuest;
	}
}

