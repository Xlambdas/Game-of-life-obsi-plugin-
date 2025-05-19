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
		category: 'work' | 'study' | 'social' | 'undefined' | string;
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
}
/*
* Quest Default Settings
*/

export const DEFAULT_QUEST: Quest = {
	id: "Quest_0",
	title: "Tutorial",
	shortDescription: "This is your first quest.",
	description: "This is your first quest.",
	created_at: new Date(),
	settings: {
		type: 'quest',
		category: 'work',
		priority: 'low',
		difficulty: 'easy',
		isSecret: false,
		isTimeSensitive: false,
	},
	progression: {
		isCompleted: false,
		completed_at: new Date(0),
		progress: 0,
		dueDate: new Date(0),
		subtasks: [],
	},
	reward: {
		XP: 1,
		items: [],
		attributes: {
			strength: 0,
			agility: 0,
			endurance: 0,
			charisma: 0,
			wisdom: 0,
			perception: 0,
			intelligence: 1,
		},
		unlock: [],
	},
	requirements: {
		level: 0,
		previousQuests: [],
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
	failureConsequence: "You failed the quest.",
};

















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
}


export interface Quest_old {
	settings: {
		id: string;
		title: string;
		shortDescription: string;
		description: string;
		priority?: 'low' | 'medium' | 'high';
		difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
		category: 'work' | 'study' | 'social' | string;
	};
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
		attributes?: {
			strength: number;
			agility: number;
			endurance: number;
			charisma: number;
			wisdom: number;
			perception: number;
			intelligence: number;
		};
		unlock?: string[];
    };
    requirements?: {
        level?: number;
        previousQuests?: string[];
		stats?: {
			strength: number;
			agility: number;
			endurance: number;
			charisma: number;
			wisdom: number;
			perception: number;
			intelligence: number;
		};
    };
    recurrence?: {
        interval: number;
        unit: "days" | "weeks" | "months";
    };
    isSecret?: boolean;
    isTimeSensitive?: boolean;
	failureConsequence?: string;
}

export const DEFAULT_QUEST_SETTINGS_OLD: Quest_old= {
	settings: {
		id: "Quest_0",
		title: "Tutorial",
		shortDescription: "This is your first quest.",
		description: "This is your first quest.",
		priority: "low",
		difficulty: "easy",
		category: "",
	},
	progression: {
		isCompleted: false,
		completed_at: new Date(),
		progress: 0,
		dueDate: new Date(),
		subtasks: [],
	},
	reward: {
		XP: 1,
		items: [],
		attributes: {
			strength: 0,
			agility: 0,
			endurance: 0,
			charisma: 0,
			wisdom: 0,
			perception: 0,
			intelligence: 0
		},
		unlock: [],
	},
	requirements: {
		level: 0,
		previousQuests: [],
		stats: {
			strength: 0,
			agility: 0,
			endurance: 0,
			charisma: 0,
			wisdom: 0,
			perception: 0,
			intelligence: 0
		}
	},
	recurrence: {
		interval: 0,
		unit: "days",
	},
	isSecret: false,
	isTimeSensitive: false,
	failureConsequence: "",
};


