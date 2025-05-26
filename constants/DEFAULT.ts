/*
* User Default Settings
*/
export interface UserSettings {
	user1: {
		settings: {
			difficulty: string;
			theme: string;
			language: string;
			questsFolder: string;
			questsFileName: string;
			refreshRate: number;
			questsCategories: string[];
		};
		persona: {
			name: string;
			class: string;
			health: number;
			xp: number;
			level: number;
			newXp: number;
			lvlThreshold: number;
		};
		attribute: {
			strength: number;
			agility: number;
			endurance: number;
			charisma: number;
			wisdom: number;
			perception: number;
			intelligence: number;
		};
		free_pts: number;
		inventory: {};
		equipment: {};
		habits: {};
		quests: {};
		completedQuests: string[],
		skills: {};
	}
}

export const DEFAULT_SETTINGS: UserSettings = {
	user1: {
		settings: {
			difficulty: 'easy',
			theme: 'default',
			language: 'en',
			questsFolder: '',
			questsFileName: 'Quests.md',
			refreshRate: 100,
			questsCategories: ['Work', 'Study', 'Social', 'Other'],
		},
		persona: {
			name: "User",
			class: "user",
			health: 100,
			xp: 0,
			level: 1,
			newXp: 0,
			lvlThreshold: 100,
		},
		attribute: {
			strength: 10,
			agility: 10,
			endurance: 10,
			charisma: 10,
			wisdom: 10,
			perception: 10,
			intelligence: 10
		},
		free_pts: 0,
		inventory: {},
		equipment: {},
		habits: {},
		quests: {},
		completedQuests: [],
		skills: {},
	}
}

export type StatBlock = {
	strength: number;
	agility: number;
	endurance: number;
	charisma: number;
	wisdom: number;
	perception: number;
	intelligence: number;
}


export type TaskType = 'quest' | 'habit'; // | 'skill' | 'goal';

export interface BaseTask {
	id: string;
	title: string;
	shortDescription: string;
	description: string;
	created_at: Date;
	settings: {
		type: 'quest' | 'habit';
		priority?: 'low' | 'medium' | 'high';
		difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
		category: 'Physical' | 'study' | 'social' | 'personal' | 'undefined' | string;
		isSecret?: boolean;
		isTimeSensitive?: boolean;
	};
}

export interface Quest extends BaseTask {
	settings: {type: 'quest'} & BaseTask['settings'];
	progression: {
		isCompleted: boolean;
		completed_at: Date;
		progress: number;
		dueDate?: Date;
		subtasks?: string[];
	};
	reward: {
		XP: number;
		items?: string[];
		attributes?: StatBlock;
		unlock?: string[];
	}
	requirements?: {
		level?: number;
		previousQuests?: string[];
		stats?: StatBlock;
	};
	recurrence?: never;
	failureConsequence?: string;
	isSystemQuest?: boolean;
}
/*
* Quest Default Settings
*/

export const DEFAULT_QUEST: Quest = {
	id: "Quest_0",
	title: "Tutorial",
	shortDescription: "This is your first quest.",
	description: "This is your first quest.",
	created_at: new Date(), // Auto generated
	settings: {
		type: 'quest', // Auto generated
		category: 'work', // todo: do the association between the categories and the attributes..
		priority: 'low', // todo: do algo
		difficulty: 'easy', // todo: do algo
		isSecret: false, // Auto generated
		isTimeSensitive: false, // todo: do algo to set the limit time
	},
	progression: {
		isCompleted: false,
		completed_at: new Date(0), // Auto generated
		progress: 0, // Auto generated (0-100) //todo: do algo
		dueDate: new Date(0), // Auto generated //todo do algo
		subtasks: [], // todo: do algo
	},
	reward: {
		XP: 1, // todo: do algo
		items: [], // todo: do algo
		attributes: {
			strength: 0,
			agility: 0,
			endurance: 0,
			charisma: 0,
			wisdom: 0,
			perception: 0,
			intelligence: 1,
		},
		unlock: [], // todo: do algo
	},
	requirements: { // todo: do algo
		level: 0,
		previousQuests: [], // todo: do algo
		stats: {
			strength: 0,
			agility: 0,
			endurance: 0,
			charisma: 0,
			wisdom: 0,
			perception: 0,
			intelligence: 0,
		},
	},
	recurrence: undefined,
	failureConsequence: "You failed the quest.", // todo: do algo
	isSystemQuest: true // todo: do algo
};


/*
* Habit Default Settings
*/


export interface Habit extends BaseTask {
	settings: {type: 'habit'} & BaseTask['settings'];
	recurrence: {
		interval: number;
		unit: "days" | "weeks" | "months";
	};
	streak: {
		current: number;
		best: number;
		resetDate?: Date;
	};
	penalty?: {
		XPLoss: number;
		breackStreak: boolean;
	};
	reward?: {
		XP: number;
		attributes?: StatBlock;
		items?: string[];
	};
	isSystemHabit?: boolean;
}

export const DEFAULT_HABIT: Habit = {
	id: "Habit_0",
	title: "Tutorial",
	shortDescription: "This is your first habit.",
	description: "This is your first habit.",
	created_at: new Date(),
	settings: {
		type: 'habit',
		category: 'personal',
		priority: 'low',
		difficulty: 'easy',
		isSecret: false,
		isTimeSensitive: false,
	},
	recurrence: {
		interval: 1,
		unit: 'days',
	},
	streak: {
		current: 0,
		best: 0,
		resetDate: new Date(),
	},
	penalty: {
		XPLoss: 0,
		breackStreak: false,
	},
	reward: {
		XP: 0,
		attributes: {
			strength: 0,
			agility: 0,
			endurance: 1,
			charisma: 0,
			wisdom: 0,
			perception: 0,
			intelligence: 0,
		},
		items: [],
	},
	isSystemHabit: false,
};
