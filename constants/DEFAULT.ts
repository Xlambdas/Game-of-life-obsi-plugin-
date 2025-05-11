export interface Quest {
	id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    reward: {
        XP: number;
        items?: string[];
		completed_at?: string;
    };
    requirements?: {
        level?: number;
        previousQuests?: string[];
    };
    progress?: number; // 0-100 for the progressive quests
	due_date?: string;
    priority?: 'low' | 'medium' | 'high';
    created_at?: string;
    difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
    category?: string;
}


export const DEFAULT_QUEST_SETTINGS: Quest= {
	id: "Quest_0",
	title: "Tutorial",
	description: "This is your first quest.",
	isCompleted: false,
	reward: {
		XP: 5,
		items: [],
	},
	requirements: {
		level: 0,
		previousQuests: [],
	},
	progress: 0,
	due_date: "",
	priority: "low",
	created_at: "",
	difficulty: "easy",
	category: "",
};



export interface UserSettings {
	user1: {
		settings: {
			difficulty: string;
			theme: string;
			language: string;
			questsFolder: string;
			questsFilePath: string;
			refreshRate: number;
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
			questsFilePath: '',
			refreshRate: 100,
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