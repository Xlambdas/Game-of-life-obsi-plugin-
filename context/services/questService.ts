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
		await new CreateQuestModal(app, this.appContext).open();
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

}

