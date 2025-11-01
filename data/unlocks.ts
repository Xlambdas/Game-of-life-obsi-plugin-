
export const UNLOCK_QUEST_FORM: Record<string, number> = {
	category: 1,
	description: 1,
	priority: 2,
	difficulty: 2,
	dueDate: 3,
	requirements: 1, // 2,
	rewards: 3,
	progressConditions: 1, // 3
};

export const UNLOCK_HABIT_FORM: Record<string, number> = {
	category: 1,
	recurrence: 2,
	description: 1,
	priority: 3,
	difficulty: 3,
	rewards: 3,
};

export const UNLOCK_VIEW: Record<string, number> = {
	side: 1,
	main: 1,
	dashboard: 5,
	full: 7,
};

export const UNLOCK_ELEMENT: Record<string, number> = {
	habit: 1,
	quest: 1,
	obj: 3,
	task: 2,
	note: 3,
};
