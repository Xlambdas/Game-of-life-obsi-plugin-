// from file (service/default):
import { AppContextService } from "../appContextService";
import { UNLOCK_QUEST_FORM, UNLOCK_HABIT_FORM } from "data/unlocks";

export default class UnlocksService {
	private appService: AppContextService;

	constructor(appService: AppContextService) {
		this.appService = appService;
	}

	public unlocksQuestForm(playerLevel: number): string[] {
		const unlockedFeatures: string[] = [];
		const unlockLevels = UNLOCK_QUEST_FORM;
		for (const [feature, level] of Object.entries(unlockLevels)) {
			if (playerLevel >= level) {
				unlockedFeatures.push(feature);
			}
		}
		return unlockedFeatures;
	}

	public unlocksHabitForm(playerLevel: number): string[] {
		const unlockedFeatures: string[] = [];
		// Currently no unlocks for habit form, but structure is here for future features
		const unlockLevels = UNLOCK_HABIT_FORM; // Placeholder, replace with actual habit unlocks if needed
		for (const [feature, level] of Object.entries(unlockLevels)) {
			if (playerLevel >= level) {
				unlockedFeatures.push(feature);
			}
		}
		return unlockedFeatures;
	}
}

