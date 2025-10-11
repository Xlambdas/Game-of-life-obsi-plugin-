import { App } from 'obsidian';
// from files (services, default) :
import { AppContextService } from '../appContextService';
import { Quest } from '../../data/DEFAULT';
// from files (UI):
// import { CreateQuestModal } from '../../modal/questModal';

export default class QuestService {
	/* Higher-level quest operations: create, save, update, toggle completion.
		Uses AppContextService for data access.
		Handles UI interactions like opening modals.
	*/
	private appContext: AppContextService;

	constructor(contextService: AppContextService) {
		this.appContext = contextService;
	}

	async saveQuest(quest: Quest): Promise<void> {
		console.log("Saving quest :", quest);
		await this.appContext.dataService.updateQuest(quest);
	}

	async questCompletion(
		quest: Quest,
		completed: boolean,
	): Promise<Quest> {
		const updatedQuest: Quest = {
			...quest,
			progression: {
				...quest.progression,
				isCompleted: completed,
				progress: completed ? 100 : 0,
				completedAt: completed ? new Date() : null,
				lastUpdated: new Date(),
				attempts: completed ? quest.progression.attempts + 1 : quest.progression.attempts,
				failures: !completed ? quest.progression.failures + 1 : quest.progression.failures,
			},
		};
		return updatedQuest;
	}

	refreshQuests(quest: Quest): Quest {
		const progress = quest.progression.isCompleted ? 100 : quest.progression.progress;

		return {
			...quest,
			progression: {
				...quest.progression,
				progress: progress,
				lastUpdated: new Date(),
			},
		};
	}
}

