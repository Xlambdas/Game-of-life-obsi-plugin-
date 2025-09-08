/*
* User Default Settings
*/
export interface UserSettings {
	settings: {
		difficulty: 'easy' | 'normal' | 'hard' | 'expert' | string;
		theme: string;
		language: string;
		refreshRate: number;
		addedCategories: string[];
		dataVersion: number;
	};
	persona: {
		name: string;
		class: string;
		health: number;
		maxHealth: number;
		mana?: number;
		maxMana?: number;
		energy?: number;
		maxEnergy?: number;
		alignment?: {
			order: 'good' | 'neutral' | 'evil';
			chaos: 'lawful' | 'neutral' | 'chaotic';
		};
		titles?: string[];
		reputation?: {
			guilds: Record<string, number>; // Guild name and reputation score
			factions: Record<string, number>; // Faction name and reputation score
			kingdoms: Record<string, number>; // Kingdom name and reputation score
			individuals: Record<string, number>; // Individual name and reputation score
			events: Record<string, number>; // Event name and reputation score
			locations: Record<string, number>; // Location name and reputation score
			quests: Record<string, number>; // Quest name and reputation score
			achievements: Record<string, number>; // Achievement name and reputation score
		};
		achievements?: string[]; // List of achievement IDs
		traits?: string[]; // List of trait IDs
		abilities?: string[]; // List of ability IDs
	}
	xpDetails: {
		xp: number;
		level: number;
		maxLevel: number;
		newXp: number;
		lvlThreshold: number;
		freePts: number;
	};
	attribute: AttributeBlock;
	skills: {
		[key: string]: {
			level: number;
			maxLevel: number;
			xp: number;
		};
	};
	habits: {
		[id: string]: {
			level: number;
			maxLevel: number;
			xp: number;
		};
	};
	quests: {
		[id: string]: {
			level: number;
			maxLevel: number;
			xp: number;
		};
	};
	completedQuests: string[];
	objectives: string[];
	challenges: string[];
	buffs: {
		[id: string]: {
			duration: number; // in seconds
			effect: string; // Description of the buff effect
		};
	};
	debuffs: {
		[id: string]: {
			duration: number; // in seconds
			effect: string; // Description of the debuff effect
		};
	};
	
	achievements: {
		[id: string]: {
			title: string;
			description: string;
			date: Date;
		};
	};
	lastLogin: Date;
	sessionTime: number; // in seconds
	activityLog: {
		date: Date;
		action: string; // Description of the action
	}[];
	notifications: {
		id: string;
		message: string;
		date: Date;
		read: boolean;
	}[];
	journalNotes: {
	[id: string]: {
			title: string;
			content: string;
			date: Date;
	};
	};
	questsProgress: {
		[id: string]: {
			progress: number;
			isCompleted: boolean;
			completedAt: Date | null;
		};
	}
}

export const DEFAULT_SETTINGS: UserSettings = {
	settings: {
		difficulty: 'easy',
		theme: 'light',
		language: 'en',
		refreshRate: 60, // in seconds
		addedCategories: [],
		dataVersion: 1, // Increment this when changing the data structure
	},
	persona: {
		name: 'Hero',
		class: 'user',
		health: 100,
		maxHealth: 100,
		mana: 50,
		maxMana: 50,
		energy: 100,
		maxEnergy: 100,
		alignment: {
			order: 'good',
			chaos: 'lawful',
		},
		titles: [],
		reputation: {
			guilds: {},
			factions: {},
			kingdoms: {},
			individuals: {},
			events: {},
			locations: {},
			quests: {},
			achievements: {},
		},
	},
	xpDetails: {
		xp: 0,
		level: 1,
		maxLevel: 100,
		newXp: 0,
		lvlThreshold: 100,
		freePts: 0,
	},
	attribute: {
		strength: 0,
		agility: 0,
		endurance: 0,
		charisma: 0,
		wisdom: 0,
		perception: 0,
		intelligence: 0,
		willpower: 0,
		spirit: 0,
		flow: 0,
		reputation: 0,
		resilience: 0
	},
	skills: {},
	habits: {},
	quests: {},
	completedQuests: [],
	objectives: [],
	challenges: [],
	buffs: {},
	debuffs: {},
	achievements: {},
	lastLogin: new Date(),
	sessionTime: 0, // in seconds
	activityLog: [],
	notifications: [],
	journalNotes: {},
	questsProgress: {}
};


export const DEFAULT_CATEGORIES = [
	'Undefined',
	'Physical',
	'Mental',
	'Social',
	'Creative',
	'Emotional',
	'Organizational',
	'Exploration'
];
export type DefaultCategory = typeof DEFAULT_CATEGORIES[number] | string;

export const DEFAULT_PRIORITIES = ['low', 'medium', 'high'] as const;
export type DefaultPriority = typeof DEFAULT_PRIORITIES[number];
export const DEFAULT_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export type DefaultDifficulty = typeof DEFAULT_DIFFICULTIES[number];
export const DEFAULT_RECURRENCES = ['days', 'weeks', 'months'] as const;
export type DefaultRecurrence = typeof DEFAULT_RECURRENCES[number];

export type AttributeBlock = {
  strength: number;
  agility: number;
  endurance: number;
  charisma: number;
  wisdom: number;
  perception: number;
  intelligence: number;
  willpower: number;
  spirit: number;
  flow: number;
  reputation: number;
  resilience: number;
}


export type TaskType = 'quest' | 'habit'; // | 'skill' | 'goal';

export interface BaseTask {
	id: string;
	title: string;
	shortDescription: string;
	description: string;
	created_at: Date;
	settings: {
		type: TaskType;
		priority?: DefaultPriority;
		difficulty?: DefaultDifficulty;
		category: DefaultCategory;
		isSecret?: boolean;
		isTimeSensitive?: boolean;
	};
}


export interface Quest extends BaseTask {
	settings: { type: 'quest' } & BaseTask['settings'];

	progression: {
		isCompleted: boolean;
		completedAt: Date | null;
		progress: number; // 0 to 100
		dueDate?: Date;
		startedAt?: Date;
		lastUpdated?: Date;
		subtasks?: string[];
		attempts?: number;
		failures?: number;
		timeSpentMinutes?: number;
	};

	reward: {
		XP: number;
		items?: string[];
		attributes?: Partial<AttributeBlock>; // gains in stats
		unlocks?: string[];
		badges?: string[]; // achievements
		title?: string; // e.g. "Beast of Discipline"
		spiritBoost?: number; // motivation reward
	};

	requirements: {
		level: number;
		previousQuests?: string[];
		attributes?: Partial<AttributeBlock>; // minimum stats
		timeAvailableMinutes?: number; // practical constraint
		tagsRequired?: string[]; // e.g. ['outdoor', 'focus']
	};

	meta: {
		difficulty: 'easy' | 'medium' | 'hard' | 'epic';
		category: 'physical' | 'mental' | 'social' | 'creative' | 'discipline' | 'undefined' | string;
		tags?: string[];
		isSystemQuest?: boolean;
		createdBy?: 'system' | 'user' | 'plugin';
		linkedToGoal?: string; // goal ID or label
		estimatedDurationMinutes?: number;
		recommendedTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any';
		energyRequired?: number; // spirit cost
		willpowerRequired?: number;
	};

	failureConsequence?: {
		description?: string;
		spiritLoss?: number;
		XPLoss?: number;
		lockoutTimeMinutes?: number;
	};

	notes?: string;
}

export const DEFAULT_QUEST: Quest = {
	id: "Quest_0",
	title: "Tutorial Quest",
	shortDescription: "Learn the basics of the game.",
	description: "This is your first quest. Complete it to understand how the game works.",
	created_at: new Date(), // Auto generated
	settings: {
		type: 'quest', // Auto generated
		category: 'Undefined',
		priority: 'low', // todo: do algo
		difficulty: 'easy', // todo: do algo
		isSecret: false, // Auto generated
		isTimeSensitive: false, // Auto generated // todo: do algo to set the limit time
	},
	progression: {
		isCompleted: false,
		completedAt: null, // Auto generated
		progress: 0, // Auto generated (0-100) // todo: do algo
		dueDate: new Date(0), // todo do algo
		startedAt: new Date(0), // todo do algo
		lastUpdated: new Date(0), // todo do algo
		subtasks: [], // todo: do algo
		attempts: 0, // Auto generated
		failures: 0, // Auto generated
		timeSpentMinutes: 0, // Auto generated
	},
	reward: {
		XP: 10, // todo: do algo
		items: [], // todo: do algo
		attributes: {
			strength: 0,
			agility: 0,
			endurance: 0,
			charisma: 0,
			wisdom: 0,
			perception: 0,
			intelligence: 1,
			willpower: 0,
			spirit: 0,
			flow: 0,
			reputation: 0,
			resilience: 0
		},
		unlocks: [], // todo: do algo
		badges: [], // todo: do algo
		title: "Novice Adventurer", // e.g. "Beast of Discipline"
		spiritBoost: 0, // motivation reward
	},
	requirements: { // todo: do algo
		level: 0,
		previousQuests: [], // todo: do algo
		attributes: {
			strength: 0,
			agility: 0,
			endurance: 0,
			charisma: 0,
			wisdom: 0,
			perception: 0,
			intelligence: 0,
			willpower: 0,
			spirit: 0,
			flow: 0,
			reputation: 0,
			resilience: 0
		},
		timeAvailableMinutes: 30, // practical constraint
		tagsRequired: [], // e.g. ['outdoor', 'focus']
	},
	meta: {
		difficulty: 'easy',
		category: 'Undefined',
		tags: [],
		isSystemQuest: false,
		createdBy: 'system', // 'user' or 'plugin'
		linkedToGoal: '', // goal ID or label
		estimatedDurationMinutes: 30, // estimated time to complete
		recommendedTimeOfDay: 'any', // 'morning', 'afternoon', 'evening', 'any'
		energyRequired: 0, // spirit cost
		willpowerRequired: 0, // willpower cost
	},
	failureConsequence: {
		description: "You failed the quest. Try again!",
		spiritLoss: 0, // spirit cost
		XPLoss: 0, // XP cost
		lockoutTimeMinutes: 0, // time before you can retry
	},
	notes: "This is a system-generated quest to help you get started. Complete it to unlock more features.",
};

/*
* Quest Default Settings
*/
export interface Quest_old extends BaseTask {
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
		attributes?: AttributeBlock;
		unlock?: string[];
	}
	requirements: {
		level: number;
		previousQuests?: string[];
		stats: AttributeBlock;
	};
	// recurrence: never;
	failureConsequence?: string;
	isSystemQuest?: boolean;
}

export const DEFAULT_QUEST_old: Quest_old = {
	id: "Quest_0",
	title: "Tutorial",
	shortDescription: "This is your first quest.",
	description: "This is your first quest.",
	created_at: new Date(), // Auto generated
	settings: {
		type: 'quest', // Auto generated
		category: 'Undefined',
		priority: 'low', // todo: do algo
		difficulty: 'easy', // todo: do algo
		isSecret: false, // Auto generated
		isTimeSensitive: false, //Auto generated // todo: do algo to set the limit time
	},
	progression: {
		isCompleted: false,
		completed_at: new Date(0), // Auto generated
		progress: 0, // Auto generated (0-100) //todo: do algo
		dueDate: new Date(0), //todo do algo
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
			willpower: 0,
			spirit: 0,
			flow: 0,
			reputation: 0,
			resilience: 0
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
			willpower: 0,
			spirit: 0,
			flow: 0,
			reputation: 0,
			resilience: 0
		},
	},
	// recurrence: undefined, // Auto generated // todo: do algo
	failureConsequence: "You failed the quest.", // todo: do algo
	isSystemQuest: false // Auto generated // todo: do algo
};


/*
* Habit Default Settings
*/


export interface Habit extends BaseTask {
	settings: {type: 'habit'} & BaseTask['settings'];
	recurrence: {
		interval: number;
		unit: DefaultRecurrence;
	};
	streak: {
		current: number;
		best: number;
		history: {
			date: Date;
			success: boolean;
		}[];
		isCompletedToday: boolean; // Auto generated based on history
		nextDate: Date; // Auto generated based on recurrence
	};
	penalty?: {
		XPLoss: number;
		breackStreak: boolean;
	};
	reward: {
		XP: number;
		attributes?: AttributeBlock;
		items?: string[];
	};
	isSystemHabit?: boolean;
}

export const DEFAULT_HABIT: Habit = {
	id: "Habit_0",
	title: "drink water",
	shortDescription: "Stay hydrated",
	description: "This is your first habit.",
	created_at: new Date(),
	settings: {
		type: 'habit',
		category: 'undefined',
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
		history: [],
		isCompletedToday: false, // Auto generated
		nextDate: new Date(), // Auto generated based on recurrence
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
			willpower: 0,
			spirit: 0,
			flow: 0,
			reputation: 0,
			resilience: 0
		},
		items: [],
	},
	isSystemHabit: false,
};
