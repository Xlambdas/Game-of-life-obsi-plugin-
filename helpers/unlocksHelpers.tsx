import { UNLOCK_QUEST_FORM, UNLOCK_HABIT_FORM, UNLOCK_VIEW, UNLOCK_ELEMENT } from '../data/unlocks';

interface UnlockItem {
	category: string;
	name: string;
	level: number;
}

export const getUnlocksForLevel_old = (level: number): UnlockItem[] => {
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



import {
	QUEST_FORM_DETAILS,
	HABIT_FORM_DETAILS,
	VIEW_DETAILS,
	ELEMENT_DETAILS,
	UnlockDetail
} from "../data/unlockDetails";


export function getUnlocksForLevel(level: number): UnlockDetail[] {
	const unlocks: UnlockDetail[] = [];
	
	// Check Quest Form unlocks
	for (const [feature, requiredLevel] of Object.entries(UNLOCK_QUEST_FORM)) {
		if (requiredLevel === level && QUEST_FORM_DETAILS[feature]) {
			unlocks.push(QUEST_FORM_DETAILS[feature]);
		}
	}
	
	// Check Habit Form unlocks
	for (const [feature, requiredLevel] of Object.entries(UNLOCK_HABIT_FORM)) {
		if (requiredLevel === level && HABIT_FORM_DETAILS[feature]) {
			unlocks.push(HABIT_FORM_DETAILS[feature]);
		}
	}
	
	// Check View unlocks
	for (const [feature, requiredLevel] of Object.entries(UNLOCK_VIEW)) {
		if (requiredLevel === level && VIEW_DETAILS[feature]) {
			unlocks.push(VIEW_DETAILS[feature]);
		}
	}
	
	// Check Element unlocks
	for (const [feature, requiredLevel] of Object.entries(UNLOCK_ELEMENT)) {
		if (requiredLevel === level && ELEMENT_DETAILS[feature]) {
			unlocks.push(ELEMENT_DETAILS[feature]);
		}
	}
	
	return unlocks;
}
