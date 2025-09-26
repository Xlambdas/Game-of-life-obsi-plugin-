import { App } from 'obsidian';
// from files (services, default) :
import { AppContextService } from '../appContextService';
import { Quest } from '../../data/DEFAULT';
// from files (UI):
import { CreateQuestModal } from '../../modal/questModal';

export default class QuestService {
	/* Higher-level quest operations: create, save, update, toggle completion.
		Uses AppContextService for data access.
		Handles UI interactions like opening modals.
	*/
	private appContext: AppContextService;

	constructor(contextService: AppContextService) {
		this.appContext = contextService;
	}

	async createQuest(app: App): Promise<void> {
		new CreateQuestModal(app).open();
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

