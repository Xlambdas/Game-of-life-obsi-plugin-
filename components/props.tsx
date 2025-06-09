import React from 'react';
import GOL from 'plugin';
import { Quest, Habit } from 'constants/DEFAULT';

export interface HabitSideViewProps {
	plugin: GOL;
	// habits: Habit[];
	filteredHabits: Habit[];
	isOpen: boolean;
	filter: string;
	handleToggle: (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => void;
	handleCompleteHabit: (habit: Habit, completed: boolean) => void;
	setFilter: (value: string) => void;
	setSortBy: (sortBy: 'priority' | 'xp' | 'difficulty' | 'date'| 'today' | 'upcoming') => void;
	sortBy: 'priority' | 'xp' | 'difficulty' | 'date' | 'today' | 'upcoming';
	handleModifyHabit: (habit: Habit) => void;
}


export interface QuestSideViewProps {
	// quests: Quest[],
	filteredQuests: Quest[],
	isOpen: boolean,
	filter: string,
	activeTab: 'active' | 'completed' | 'all',
	handleToggle: (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => void,
	handleCompleteQuest: (quest: Quest, completed: boolean) => void,
	setFilter: (value: string) => void,
	setActiveTab: (tab: 'active' | 'completed' | 'all') => void,
	setSortBy: (sortBy: 'priority' | 'xp' | 'difficulty' | 'date') => void,
	sortBy: 'priority' | 'xp' | 'difficulty' | 'date',
	handleModifyQuest: (quest: Quest) => void
}
