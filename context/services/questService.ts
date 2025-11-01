import { App } from 'obsidian';
// from files (services, default) :
import { AppContextService } from '../appContextService';
import { DEFAULT_ATTRIBUTES, Quest, UserSettings } from '../../data/DEFAULT';
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
		// console.log("Saving quest :", quest);
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
				completedAt: completed ? new Date() : null,
				lastUpdated: new Date(),
				attempts: completed ? quest.progression.attempts + 1 : quest.progression.attempts,
				failures: !completed ? quest.progression.failures + 1 : quest.progression.failures,
			},
		};
		return this.refreshQuests(updatedQuest);
	}


	async refreshQuests(quest: Quest): Promise<Quest> {
		console.log("Refreshing quest progress :", quest);
		const subtasks = quest.progression.subtasks;
		if (!subtasks) return {
			...quest,
			progression: {
				...quest.progression,
				completedAt: quest.progression.isCompleted ? quest.progression.completedAt : null,
				progress: quest.progression.isCompleted ? 100 : 0,
				lastUpdated: new Date(),
			},
		};

		const conditionQuests = subtasks.conditionQuests || [];
		const conditionHabits = subtasks.conditionHabits || [];
		const lenSubtask = conditionQuests.length + conditionHabits.length;

		if (lenSubtask === 0) return {
			...quest,
			progression: {
				...quest.progression,
				isCompleted: quest.progression.isCompleted,
				completedAt: quest.progression.isCompleted ? quest.progression.completedAt : null,
				progress: quest.progression.isCompleted ? 100 : 0,
				lastUpdated: new Date(),
			},
		};

		let temporaryProgress = 0;

		// Handle conditionQuests
		if (conditionQuests.length > 0) {
			const allQuests = await this.appContext.dataService.loadAllQuests();
			for (const conditionQuest of conditionQuests) {
				const actualQuest = allQuests.find(q => q.id === conditionQuest.id);				
				if (actualQuest) {
					// Calculate how much this subtask contributes (weighted equally among all subtasks)
					const subtaskWeight = 100 / lenSubtask;

					// Calculate progress as a percentage of target
					const progressRatio = Math.min(
						actualQuest.progression.progress / conditionQuest.targetProgress,
						1 // Cap at 100%
					);
					temporaryProgress += subtaskWeight * progressRatio;
				}
			}
		}
		if (conditionHabits.length > 0) {
			const allHabits = await this.appContext.dataService.loadAllHabits();
			for (const conditionHabit of conditionHabits) {
				const actualHabit = allHabits.find(h => h.id === conditionHabit.id);				
				if (actualHabit) {
					// Calculate how much this subtask contributes (weighted equally among all subtasks)
					const subtaskWeight = 100 / lenSubtask;

					// Calculate progress as a percentage of target
					const progressRatio = Math.min(
						actualHabit.streak.best / conditionHabit.targetStreak,
						1 // Cap at 100%
					);
					temporaryProgress += subtaskWeight * progressRatio;
				}
			}
		}

		// Round to avoid floating point issues
		temporaryProgress = Math.round(temporaryProgress);

		// If quest is already completed, keep it at 100
		if (temporaryProgress > 100) temporaryProgress = 100;
		const progress = quest.progression.isCompleted ? 100 : temporaryProgress;

		return {
			...quest,
			progression: {
				...quest.progression,
				isCompleted: progress >= 100,
				completedAt: progress >= 100 ? new Date() : null,
				progress: progress,
				lastUpdated: new Date(),
				attempts: progress >= 100 ? quest.progression.attempts + 1 : quest.progression.attempts,
			},
		};
	}


	validateRequirements = (quest: Quest, user: UserSettings, quests: Quest[]): boolean => {
		// Validate level requirement
		const userLevel = user.xpDetails.level ?? 1;
		const questLevel = quest.requirements.level || 1;
		if (questLevel > userLevel) return false;

		// Validate attribute requirements
		const userAttributes = user.attribute ?? DEFAULT_ATTRIBUTES;
		const questAttributes = quest.requirements.attributes || {};
		
		for (const [attr, reqValue] of Object.entries(questAttributes)) {
			const userValue = (userAttributes as any)[attr] ?? 0;
			if (userValue < (reqValue ?? 0)) return false;
		}

		// -----------------------------
		// Validate previous quests requirement
		const prevQuests = quest.requirements.previousQuests;
		if (!prevQuests || prevQuests.length === 0) return true;

		// Ensure quests data is available
		if (!quests) {
			console.warn("No quests provided to validateRequirements");
			return false;
		}

		// Build set of completed quest IDs
		const questsArray: Quest[] = Array.isArray(quests) ? quests : (Object.values(quests) as Quest[]);
		const completedQuestIds = new Set<string>(
			questsArray
				.filter((q: Quest) => q.progression?.isCompleted)
				.map((q: Quest) => q.id)
		);

		// Check if all required previous quests are completed
		for (const prevQuest of prevQuests) {
			const prevQuestId = typeof prevQuest === 'string' ? prevQuest : prevQuest?.id;

			if (!prevQuestId || !completedQuestIds.has(prevQuestId)) {
				return false;
			}
		}
		return true;
	};
}

