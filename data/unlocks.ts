
export const UNLOCK_QUEST_FORM: Record<string, number> = {
	category: 1,
	description: 1,
	priority: 2,
	difficulty: 2,
	dueDate: 3,
	requirements: 2,
	attributeRewards: 1,
	progressConditions: 1 //3
};

export const UNLOCK_HABIT_FORM: Record<string, number> = {
	category: 1,
	recurrence: 1,//2,
	description: 1,
	priority: 1,//3,
	difficulty: 1, //3,
	rewards: 1, //3,
};

export const UNLOCK_VIEW: Record<string, number> = {
	side: 1,
	main: 2,
	dashboard: 5,
	full: 7,
};

export const UNLOCK_ELEMENT: Record<string, number> = {
	habit: 1,
	quest: 1,
	objectif: 3,
	task: 4,
	note: 4,
	guys: 5,
};

export const UNLOCK_HABIT_VIEW: Record<string, number> = {
	stats: 0, //1,
};
