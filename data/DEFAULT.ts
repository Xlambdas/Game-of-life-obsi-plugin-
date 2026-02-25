import { DateHelper, DateString } from "helpers/dateHelpers";
import { AttributeBlock, DEFAULT_ATTRIBUTES } from "./attributeDetails";

/* Default data structures and values for the game. This includes user settings, quests, habits, and related types. */

// calculate difficulty multipliers for XP gain, streaks and milestones
export const DIFFICULTY_RULES = {
	easy: { factor: 1.0, rewardMultiplier: 1.0, freeze: Infinity },
	normal: { factor: 1.1, rewardMultiplier: 1.0, freeze: 4 },
	medium: { factor: 1.2, rewardMultiplier: 1.3, freeze: 3 },
	hard: { factor: 1.5, rewardMultiplier: 1.6, freeze: 1 },
	expert: { factor: 2.0, rewardMultiplier: 2.0, freeze: 0 }
};

export const MILESTONE_CURVES = {
	easy: [7, 14, 30, 60, 120, 240, 365],
	normal: [7, 21, 50, 100, 180, 300],
	medium: [7, 30, 75, 150, 300],
	hard: [7, 45, 120, 300],
	expert: [7, 60, 180, 365]
};



/*
* User Default Settings
*/
export interface UserSettings {
	settings: {
		difficulty: 'easy' | 'normal' | 'hard' | 'expert' | string; //todo : bonus/malus
		theme: string; //todo
		language: string; //todo
		refreshRate: number; //todo : delete
		addedCategories: string[]; //todo
		dataVersion: number; //todo Increment this when changing the data structure
	};
	persona: {
		name: string;
		class: string; // todo : add default classes, each with different starting stats/abilities/appearance/quest bonus...
		health: number;	//todo
		maxHealth: number; //todo
		mana?: number; //todo
		maxMana?: number; //todo
		energy?: number; //todo
		maxEnergy?: number; //todo
		alignment?: {
			order: 'good' | 'neutral' | 'evil';
			chaos: 'lawful' | 'neutral' | 'chaotic';
		}; //todo
		titles?: string[]; // todo : add default titles
		reputation?: {
			guilds: Record<string, number>; // Guild name and reputation score
			factions: Record<string, number>; // Faction name and reputation score
			kingdoms: Record<string, number>; // Kingdom name and reputation score
			individuals: Record<string, number>; // Individual name and reputation score
			events: Record<string, number>; // Event name and reputation score
			locations: Record<string, number>; // Location name and reputation score
			quests: Record<string, number>; // Quest name and reputation score
			achievements: Record<string, number>; // Achievement name and reputation score
		}; // todo
		achievements?: string[]; // List of achievement IDs // todo
		traits?: string[]; // List of trait IDs // todo
		abilities?: string[]; // List of ability IDs // todo
	}
	xpDetails: {
		xp: number; //todo : add calculation for XP gain and for xp attributes
		level: number; //todo : add level up request
		maxLevel: number;
		newXp: number;
		lvlThreshold: number;
		freePts: number; //todo : add points gain and spending
	};
	attribute: AttributeBlock; // todo : add calculation for attribute gain
	skills: {
		[key: string]: {
			level: number;
			maxLevel: number;
			xp: number;
		}; //todo : add default skills and calculation for skill gain/attribute bonus..
	};
	habits: {
		[id: string]: {
			level: number;
			maxLevel: number;
			xp: number;
		}; // todo : add calculation for habit gain and add completion tracking
	};
	quests: {
		[id: string]: {
			level: number;
			maxLevel: number;
			xp: number;
		}; // todo : same as habits
	};
	completedQuests: Record<string, { id: string, title: string }> ; // List of completed quest IDs // todo
	objectives: string[]; // todo
	challenges: string[]; // todo
	buffs: {
		[id: string]: {
			duration: number; // in seconds
			effect: string; // Description of the buff effect
		}; // todo : add calculation for buff duration and effects
	};
	debuffs: {
		[id: string]: {
			duration: number; // in seconds
			effect: string; // Description of the debuff effect
		}; // todo : add calculation for debuff duration and effects
	};

	achievements: {
		[id: string]: {
			title: string;
			description: string;
			date: Date;
		}; // todo : add calculation for achievement unlocking / visualization
	};
	lastLogin: Date; // todo
	sessionTime: number; // in seconds // todo
	activityLog: {
		date: Date;
		action: string; // Description of the action
	}[]; // todo
	notifications: {
		id: string;
		message: string;
		date: Date;
		read: boolean;
	}[]; // todo : search if useful
	journalNotes: {
	[id: string]: {
			title: string;
			content: string;
			date: Date;
	}; // todo : add journal feature / history of the player
	};
	questsProgress: {
		[id: string]: {
			progress: number;
			isCompleted: boolean;
			completedAt: Date | null;
		}; // todo : track quest progress
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
		maxLevel: 1,
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
	completedQuests: {},
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
export const DEFAULT_DIFFICULTIES = ['easy', 'normal', 'medium', 'hard', 'expert'] as const;
export type DefaultDifficulty = typeof DEFAULT_DIFFICULTIES[number];
export const DEFAULT_RECURRENCES = ['days', 'weeks', 'months', 'years'] as const;
export type DefaultRecurrence = typeof DEFAULT_RECURRENCES[number];


export type TaskType = 'quest' | 'habit'; // | 'skill' | 'goal'; //todo : add skills/goals/...

export interface BaseTask {
	id: string; // Auto-generated unique ID
	title: string;
	shortDescription: string;
	description: string;
	created_at: DateString; // Auto-generated
	settings: {
		type: TaskType; // Auto-generated
		priority?: DefaultPriority; // todo: add algo to set priority based on user level/xp/...
		difficulty?: DefaultDifficulty; // todo: add algo to set difficulty based on user level/xp/...
		category: DefaultCategory; // todo: add algo to set category based on user preferences
		isSecret?: boolean; // Auto-generated
		isTimeSensitive?: boolean; // Auto-generated // todo: do algo to set the limit time
	};
	isArchived: boolean; // Auto-generated when the task is archived
}

/*
* Quest Default Settings
*/

export interface Quest extends BaseTask {
	settings: { type: 'quest' } & BaseTask['settings'];

	progression: {
		isCompleted: boolean;
		completedAt: DateString | null; // Auto-generated
		progress: number; // Auto-generated: 0 to 100
		dueDate?: DateString; // todo: do algo
		startedAt?: DateString; // Auto-generated when the quest is started // todo: do algo
		lastUpdated?: DateString; // Auto-generated when the quest is updated // todo: do algo
		subtasks?: {
			conditionQuests: { id: string; title: string; targetProgress: number }[];
			conditionHabits: { id: string; title: string; targetStreak: number }[];
		}; // todo: do algo
		attempts: number; // todo: do algo
		failures: number; // todo: do algo
		timeSpentMinutes?: number; // Auto-generated // todo: do algo
	};

	reward: {
		XP: number; // todo: do algo
		items?: string[]; // item IDs or names // todo: do algo
		attributes?: Partial<AttributeBlock>; // gains in stats // todo: do algo
		unlocks?: string[]; // IDs of skills, abilities, areas, etc. // todo: do algo
		badges?: string[]; // achievements or titles // todo: do algo
		title?: string; // e.g. "Beast of Discipline" // todo: do algo
		spiritBoost?: number; // motivation reward // todo: do algo
	};

	requirements: {
		level: number; // minimum user level //todo: do algo
		previousQuests?: { id: string; title: string}[]; // IDs of prerequisite quests // todo: do algo
		attributes?: Partial<AttributeBlock>; // minimum stats // todo: do algo
		timeAvailableMinutes?: number; // practical constraint // todo: do algo
		tagsRequired?: string[]; // e.g. ['outdoor', 'focus'] // todo: do algo
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
		description?: string; //todo: do algo
		spiritLoss?: number; // spirit cost // todo: do algo
		XPLoss?: number; // XP cost // todo: do algo
		lockoutTimeMinutes?: number; // time before you can retry // todo: do algo
	};

	notes?: string; // additional notes or lore // todo: do algo
}

export const DEFAULT_QUEST: Quest = {
	id: "quest_0", // Auto-generated
	title: "Tutorial Quest",
	shortDescription: "Learn the basics of the game.",
	description: "This is your first quest. Complete it to understand how the game works.",
	created_at: DateHelper.today(), // Auto generated
	settings: {
		type: 'quest', // Auto generated
		category: 'Undefined',
		priority: 'low', // todo: do algo
		difficulty: 'easy', // todo: do algo
		isSecret: false, // Auto generated
		isTimeSensitive: false, // Auto generated // todo: do algo to set the limit time
	},
	isArchived: false, // Auto generated when the task is archived
	progression: {
		isCompleted: false,
		completedAt: null, // Auto generated
		progress: 0, // Auto generated (0-100) // todo: do algo
		dueDate: DateHelper.today(), // todo do algo
		startedAt: DateHelper.today(), // todo do algo
		lastUpdated: DateHelper.today(), // todo do algo
		subtasks: {
			conditionQuests: [],
			conditionHabits: [],
		}, // todo: do algo
		attempts: 0, // Auto generated
		failures: 0, // Auto generated
		timeSpentMinutes: 0, // Auto generated
	},
	reward: {
		XP: 10, // todo: do algo
		items: [], // todo: do algo
		attributes: {
			...DEFAULT_ATTRIBUTES,
			intelligence: 1,
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
			...DEFAULT_ATTRIBUTES
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
* Habit Default Settings
*/

export const WEEKDAY_LABELS: { label: string; short: string; value: Weekday }[] = [
	{ label: 'Sunday', short: 'Su', value: 0 },
	{ label: 'Monday', short: 'Mo', value: 1 },
	{ label: 'Tuesday', short: 'Tu', value: 2 },
	{ label: 'Wednesday', short: 'We', value: 3 },
	{ label: 'Thursday', short: 'Th', value: 4 },
	{ label: 'Friday', short: 'Fr', value: 5 },
	{ label: 'Saturday', short: 'Sa', value: 6 },
];

export const NTH_LABELS: { label: string; value: 1 | 2 | 3 | 4 | 5 }[] = [
	{ label: '1st', value: 1 },
	{ label: '2nd', value: 2 },
	{ label: '3rd', value: 3 },
	{ label: '4th', value: 4 },
	{ label: '5th', value: 5 },
];

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export type Nth = 1 | 2 | 3 | 4 | 5;


export type IntervalRecurrence = {
	type: 'interval';
	interval: number;
	unit: 'days' | 'weeks' | 'months' | 'years';
};

export type WeekdayRecurrence = {
	type: 'weekday';
	days: Array<Weekday>;
	nth?: Array<Nth>;
};

export type Recurrence =
	| IntervalRecurrence
	| WeekdayRecurrence;

export type RecurrenceType = Recurrence['type'];

export const RECURRENCE_TYPES = ['interval', 'weekday'] as const satisfies readonly RecurrenceType[];
export const DEFAULT_RECURRENCE: IntervalRecurrence = {
	type: 'interval',
	interval: 1,
	unit: 'days',
};

export interface Habit extends BaseTask {
	settings: {type: 'habit'} & BaseTask['settings'];
	recurrence: Recurrence;
	streak: {
		current: number; // auto generated
		best: number; // auto generated
		history: {
			date: DateString; // auto generated
			success: boolean; // auto generated
		}[];
		isCompletedToday: boolean; // Auto generated based on history
		nextDate: DateString; // Auto generated based on recurrence
		lastCompletedDate: DateString; // Auto generated based on history
		freeze: { // auto generated
			available: number; // number of available freezes
			history: DateString[]; // dates when freeze was used
		};
	};
	progress: {
		level: number; // habit level progression
		XP: number; // not really usefull ?
		goal: number; // e.g. ml of water
		currentValue: number; // track current amount vs goal
		milestones: {
			target: number; // e.g. 7 days streak
			reward: {
				attributes?: Partial<AttributeBlock>;
				items?: string[];
			};
		}[];
	};
	penalty?: {
		XPLoss: number;
		breackStreak: boolean;
	};
	reward: {
		XP: number; // not really usefull ?
		attributes: AttributeBlock;
		items?: string[];
	};
	isSystemHabit?: boolean;
}

export const DEFAULT_HABIT: Habit = {
	id: "habit_0",
	title: "drink water",
	shortDescription: "Stay hydrated",
	description: "This is your first habit.",
	created_at: DateHelper.today(), // Auto generated
	settings: {
		type: 'habit',
		category: 'undefined',
		priority: 'low',
		difficulty: 'easy',
		isSecret: false,
		isTimeSensitive: false,
	},
	isArchived: false, // Auto generated when the task is archived
	recurrence: { ...DEFAULT_RECURRENCE },
	streak: {
		current: 0,
		best: 0,
		history: [],
		isCompletedToday: false, // Auto generated
		nextDate: DateHelper.today(), // Auto generated based on recurrence
		lastCompletedDate: DateHelper.toDateString(new Date(0)), // Auto generated
		freeze: {
			available: DIFFICULTY_RULES.easy.freeze, // Auto generated based on difficulty
			history: [], // history of freeze usage
		}
	},
	progress: {
		level: 0, // habit level progression
		XP: 0,
		goal: 2000, // e.g. ml of water
		currentValue: 0, // track current amount vs goal
		milestones: [
			{ target: 7, reward: { items: ["Milestones Badge"] } }, // 7 days streak
		],
	},
	penalty: {
		XPLoss: 0,
		breackStreak: false,
	},
	reward: {
		XP: 0,
		attributes: {
			...DEFAULT_ATTRIBUTES,
			endurance: 1
		},
		items: [],
	},
	isSystemHabit: false,
};
