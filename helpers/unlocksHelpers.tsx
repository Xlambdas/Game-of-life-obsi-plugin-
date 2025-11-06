import { UNLOCK_QUEST_FORM, UNLOCK_HABIT_FORM, UNLOCK_VIEW, UNLOCK_ELEMENT } from '../data/unlocks';


interface UnlockItem {
	category: string;
	name: string;
	level: number;
}

export const getUnlocksForLevel = (level: number): UnlockItem[] => {
	const unlocks: UnlockItem[] = [];

	// Quest Form unlocks
	Object.entries(UNLOCK_QUEST_FORM).forEach(([feature, unlockLevel]) => {
		if (unlockLevel === level) {
			unlocks.push({
				category: 'Quest Form',
				name: feature.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase()),
				level: unlockLevel
			});
		}
	});

	// Habit Form unlocks
	Object.entries(UNLOCK_HABIT_FORM).forEach(([feature, unlockLevel]) => {
		if (unlockLevel === level) {
			unlocks.push({
				category: 'Habit Form',
				name: feature.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase()),
				level: unlockLevel
			});
		}
	});

	// View unlocks
	Object.entries(UNLOCK_VIEW).forEach(([feature, unlockLevel]) => {
		if (unlockLevel === level) {
			unlocks.push({
				category: 'View',
				name: feature.charAt(0).toUpperCase() + feature.slice(1) + ' View',
				level: unlockLevel
			});
		}
	});

	// Element unlocks
	Object.entries(UNLOCK_ELEMENT).forEach(([feature, unlockLevel]) => {
		if (unlockLevel === level) {
			unlocks.push({
				category: 'Element',
				name: feature.charAt(0).toUpperCase() + feature.slice(1),
				level: unlockLevel
			});
		}
	});

	return unlocks;
};
