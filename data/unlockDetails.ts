// data/unlockDetails.ts

export interface UnlockDetail {
	name: string;
	category: string;
	level: number;
	description: string;
	benefits?: string[];
	icon?: string;
}

// Quest Form Unlock Details
export const QUEST_FORM_DETAILS: Record<string, UnlockDetail> = {
	category: {
		name: "Quest Categories",
		category: "Quest Form",
		level: 1,
		description: "Organize your quests into different categories to better manage your goals and track progress across different areas of your life.",
		benefits: [
			"Create custom categories for your quests",
			"Filter and view quests by category",
			"Better organization for different life areas"
		],
		icon: "📁"
	},
	description: {
		name: "Quest Descriptions",
		category: "Quest Form",
		level: 1,
		description: "Add detailed descriptions to your quests to clarify objectives and track important notes.",
		benefits: [
			"Write detailed quest objectives",
			"Add context and background information",
			"Reference important details later"
		],
		icon: "📝"
	},
	priority: {
		name: "Quest Priority",
		category: "Quest Form",
		level: 2,
		description: "Set priority levels for your quests to focus on what matters most and optimize your time.",
		benefits: [
			"Mark quests as high, medium, or low priority",
			"Sort and filter by priority level",
			"Focus on important tasks first"
		],
		icon: "⭐"
	},
	difficulty: {
		name: "Quest Difficulty",
		category: "Quest Form",
		level: 2,
		description: "Assign difficulty ratings to quests to better estimate time and effort required for completion.",
		benefits: [
			"Rate quest difficulty from easy to hard",
			"Earn more XP for difficult quests",
			"Better planning and time estimation"
		],
		icon: "⚔️"
	},
	dueDate: {
		name: "Due Dates",
		category: "Quest Form",
		level: 3,
		description: "Set deadlines for your quests to maintain accountability and track time-sensitive objectives.",
		benefits: [
			"Add due dates to time-sensitive quests",
			"Receive reminders for upcoming deadlines",
			"View quests in calendar format"
		],
		icon: "📅"
	},
	requirements: {
		name: "Quest Requirements",
		category: "Quest Form",
		level: 2,
		description: "Define prerequisites and requirements that must be met before completing a quest.",
		benefits: [
			"List materials or resources needed",
			"Set prerequisite quests",
			"Track completion requirements"
		],
		icon: "✓"
	},
	attributeRewards: {
		name: "Attribute Rewards",
		category: "Quest Form",
		level: 1,
		description: "Earn attribute points when completing quests to level up your character's stats.",
		benefits: [
			"Gain strength, intelligence, or other attributes",
			"Build a balanced character profile",
			"Track personal growth across multiple dimensions"
		],
		icon: "💪"
	},
	progressConditions: {
		name: "Progress Conditions",
		category: "Quest Form",
		level: 3,
		description: "Set specific conditions and milestones that track incremental progress toward quest completion.",
		benefits: [
			"Break large quests into smaller steps",
			"Track percentage completion",
			"Celebrate incremental wins"
		],
		icon: "📊"
	}
};

// Habit Form Unlock Details
export const HABIT_FORM_DETAILS: Record<string, UnlockDetail> = {
	category: {
		name: "Habit Categories",
		category: "Habit Form",
		level: 1,
		description: "Organize habits into categories like health, productivity, or learning to maintain balanced personal development.",
		benefits: [
			"Group similar habits together",
			"Track progress across life areas",
			"Better habit organization"
		],
		icon: "🏷️"
	},
	recurrence: {
		name: "Habit Recurrence",
		category: "Habit Form",
		level: 1,
		description: "Set how often habits should be performed - daily, weekly, or custom schedules.",
		benefits: [
			"Define daily, weekly, or monthly habits",
			"Create custom recurrence patterns",
			"Track streak consistency"
		],
		icon: "🔄"
	},
	description: {
		name: "Habit Descriptions",
		category: "Habit Form",
		level: 1,
		description: "Add detailed notes about why this habit matters and how to perform it effectively.",
		benefits: [
			"Document habit purpose and motivation",
			"Add implementation instructions",
			"Track insights and reflections"
		],
		icon: "📝"
	},
	priority: {
		name: "Habit Priority",
		category: "Habit Form",
		level: 3,
		description: "Prioritize habits to focus your energy on the most impactful behaviors first.",
		benefits: [
			"Rank habits by importance",
			"Filter by priority level",
			"Build keystone habits first"
		],
		icon: "⭐"
	},
	difficulty: {
		name: "Habit Difficulty",
		category: "Habit Form",
		level: 3,
		description: "Rate how challenging each habit is to maintain for better self-awareness and planning.",
		benefits: [
			"Assess habit difficulty honestly",
			"Start with easier habits to build momentum",
			"Earn bonus XP for maintaining hard habits"
		],
		icon: "💪"
	},
	rewards: {
		name: "Habit Rewards",
		category: "Habit Form",
		level: 3,
		description: "Define XP and attribute rewards earned from consistently maintaining your habits.",
		benefits: [
			"Earn XP for completing habits",
			"Gain attribute bonuses from streaks",
			"Customize reward amounts"
		],
		icon: "🎁"
	}
};

// View Unlock Details
export const VIEW_DETAILS: Record<string, UnlockDetail> = {
	side: {
		name: "Side Panel View",
		category: "View",
		level: 1,
		description: "Access your quests and habits in a convenient side panel without leaving your current note.",
		benefits: [
			"Quick access to tasks while writing",
			"Doesn't interrupt your workflow",
			"Toggle visibility as needed"
		],
		icon: "📋"
	},
	main: {
		name: "Main View",
		category: "View",
		level: 2,
		description: "Open a dedicated full-width view to focus entirely on managing your quests and habits.",
		benefits: [
			"Full-screen task management",
			"Enhanced detail visibility",
			"Better for planning sessions"
		],
		icon: "📱"
	},
	dashboard: {
		name: "Dashboard View",
		category: "View",
		level: 5,
		description: "Access a comprehensive dashboard with statistics, progress charts, and analytics about your productivity.",
		benefits: [
			"View XP and level progression",
			"See completion statistics",
			"Track habit streaks and trends",
			"Visualize your productivity data"
		],
		icon: "📊"
	},
	full: {
		name: "Full Screen Mode",
		category: "View",
		level: 7,
		description: "Immersive full-screen mode for deep focus sessions and comprehensive planning.",
		benefits: [
			"Distraction-free environment",
			"Maximum screen space for planning",
			"Perfect for weekly reviews"
		],
		icon: "🖥️"
	}
};

// Element Unlock Details
export const ELEMENT_DETAILS: Record<string, UnlockDetail> = {
	habit: {
		name: "Habits",
		category: "Element",
		level: 1,
		description: "Create and track daily habits to build lasting routines and positive behaviors.",
		benefits: [
			"Build consistent daily routines",
			"Track habit streaks",
			"Earn XP from regular completion"
		],
		icon: "🔄"
	},
	quest: {
		name: "Quests",
		category: "Element",
		level: 1,
		description: "Create goal-oriented quests with clear objectives and completion criteria.",
		benefits: [
			"Set and achieve meaningful goals",
			"Break down large projects",
			"Earn rewards upon completion"
		],
		icon: "⚔️"
	},
	task: {
		name: "Tasks",
		category: "Element",
		level: 3,
		description: "Quick, simple tasks for daily to-dos that don't need the complexity of full quests.",
		benefits: [
			"Capture quick to-dos",
			"Faster to create than quests",
			"Perfect for small daily items"
		],
		icon: "✓"
	},
	objectif: {
		name: "Objectives",
		category: "Element",
		level: 4,
		description: "Long-term objectives that group multiple quests together toward a bigger vision.",
		benefits: [
			"Plan long-term goals",
			"Group related quests",
			"Track progress toward big milestones"
		],
		icon: "🎯"
	},
	note: {
		name: "Notes",
		category: "Element",
		level: 4,
		description: "Link your productivity system to your notes for seamless knowledge management.",
		benefits: [
			"Connect quests to research notes",
			"Reference material in context",
			"Build a knowledge base alongside tasks"
		],
		icon: "📓"
	}
};

// Helper function to get all unlock details
export function getAllUnlockDetails(): Record<string, UnlockDetail> {
	return {
		...QUEST_FORM_DETAILS,
		...HABIT_FORM_DETAILS,
		...VIEW_DETAILS,
		...ELEMENT_DETAILS
	};
}

// Helper function to get unlock details by level
export function getUnlockDetailsForLevel(level: number): UnlockDetail[] {
	const allDetails = getAllUnlockDetails();
	return Object.values(allDetails).filter(detail => detail.level === level);
}
