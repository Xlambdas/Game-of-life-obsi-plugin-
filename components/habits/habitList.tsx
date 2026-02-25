import React, { useEffect, useMemo, useState, useCallback } from "react";
// from files (Service, DEFAULT):
import { useAppContext } from "context/appContext";
import { Habit, Quest, UserSettings, DEFAULT_DIFFICULTIES } from "data/DEFAULT";
// from files (UI):
import { HabitSideView } from "./habitSideView";
import { Notice } from "obsidian";


interface HabitListProps {
	habits: Habit[];
	onHabitUpdate?: (updatedHabits: Habit[]) => void;
	onUserUpdate?: (updatedUser: UserSettings) => void;
}

export const HabitList: React.FC<HabitListProps> = ({ habits, onHabitUpdate, onUserUpdate }) => {
	const appService = useAppContext();
	const habitService = appService.habitService;

	const [habitState, setHabitState] = useState<Habit[]>(habits);
	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today");
	const [sortBy, setSortBy] = useState<"priority" | "xp" | "difficulty" | "recurrence">("priority");

	// Load habits on mount
	useEffect(() => {
		const refreshAllHabits = async () => {
			const allHabits = await appService.dataService.getHabits();
			const activeHabits = Object.values(allHabits).filter(h => !h.isArchived);

			const refreshed = await Promise.all(
				activeHabits.map(habit => appService.habitService.refreshHabits(habit))
			);

			const merged = { ...allHabits };
			refreshed.forEach(h => { merged[h.id] = h; });

			await appService.dataService.setHabits(merged);
			setHabitState(refreshed);
		};
		refreshAllHabits();
	}, [appService]);

	// Load from localStorage
	useEffect(() => {
		const savedOpen = localStorage.getItem("habitListOpen");
		const savedFilter = localStorage.getItem("habitListFilter");
		const savedTab = localStorage.getItem("habitListActiveTab");
		const savedSort = localStorage.getItem("habitListSortBy");

		if (savedOpen) setIsOpen(savedOpen === "true");
		if (savedFilter) setFilter(savedFilter);
		if (savedTab === "today" || savedTab === "upcoming") setActiveTab(savedTab);
		if (savedSort === "priority" || savedSort === "xp" || savedSort === "difficulty" || savedSort === "recurrence") {
			setSortBy(savedSort);
		}
	}, []);

	// Sync when props change
	useEffect(() => {
		setHabitState(habits);
	}, [habits]);

	useEffect(() => {
		const handleDbUpdate = async (e: any) => {
			if (e.detail?.type === 'habit' && e.detail?.action === 'complete') {
				// Refresh all habits when any habit is completed
				const allHabits = await appService.dataService.getHabits();
				const activeHabits = Object.values(allHabits).filter(h => !h.isArchived);

				const refreshed = await Promise.all(
					activeHabits.map(habit => appService.habitService.refreshHabits(habit))
				);

				setHabitState(refreshed);
			}
		};

		document.addEventListener('dbUpdated', handleDbUpdate);
		return () => document.removeEventListener('dbUpdated', handleDbUpdate);
	}, [appService]);

	// Memoized handlers with localStorage persistence
	const handleToggle = useCallback((e: React.SyntheticEvent<HTMLDetailsElement, Event>) => {
		const details = e.currentTarget;
		setIsOpen(details.open);
		localStorage.setItem("habitListOpen", details.open ? "true" : "false");
	}, []);

	const handleSetFilter = useCallback((value: string) => {
		setFilter(value);
		localStorage.setItem("habitListFilter", value);
	}, []);

	const handleSetActiveTab = useCallback((tab: "today" | "upcoming") => {
		setActiveTab(tab);
		localStorage.setItem("habitListActiveTab", tab);
	}, []);

	const handleSetSortBy = useCallback((sort: "priority" | "xp" | "difficulty" | "recurrence") => {
		setSortBy(sort);
		localStorage.setItem("habitListSortBy", sort);
	}, []);

	const handleCheckbox = useCallback(async (habit: Habit, completed: boolean) => {
		await habitService.handleCheckbox(habit, habitState, completed, undefined, setHabitState, onHabitUpdate, onUserUpdate);
	}, [habitService, habitState, onHabitUpdate, onUserUpdate]);

	// Memoized filtered and sorted habits
	const filteredHabits = useMemo(() => {
		return habitState
			.filter((habit) => {
				if (habit.isArchived) return false;

				const search = filter.trim().toLowerCase();
				const matchesSearch =
					!search ||
					habit.title.toLowerCase().includes(search) ||
					(habit.description && habit.description.toLowerCase().includes(search)) ||
					(habit.shortDescription && habit.shortDescription.toLowerCase().includes(search));

				const today = new Date();
				const todayStr = today.toISOString().slice(0, 10);

				const lastCompletedDateStr = habit.streak.lastCompletedDate
					? new Date(habit.streak.lastCompletedDate).toISOString().slice(0, 10)
					: "";
				const nextDateStr = habit.streak.nextDate
					? new Date(habit.streak.nextDate).toISOString().slice(0, 10)
					: "";

				let matchesTab = false;
				if (activeTab === "today") {
					matchesTab = lastCompletedDateStr === todayStr || nextDateStr <= todayStr;
				} else {
					matchesTab = nextDateStr > todayStr && lastCompletedDateStr !== todayStr;
				}

				return matchesSearch && matchesTab;
			})
			.sort((a, b) => {
				switch (sortBy) {
					case "priority": {
						const priorityOrder = { high: 0, medium: 1, low: 2 };
						return priorityOrder[a.settings.priority || "low"] - priorityOrder[b.settings.priority || "low"];
					}
					case "xp":
						return b.reward.XP - a.reward.XP;
					case "difficulty": {
						const difficultyOrder = DEFAULT_DIFFICULTIES.reduce(
							(acc, diff, index) => ({ ...acc, [diff]: index }),
							{} as Record<string, number>
						);
						return difficultyOrder[a.settings.difficulty || "easy"] - difficultyOrder[b.settings.difficulty || "easy"];
					}
					case "recurrence":
						return new Date(b.streak.nextDate).getTime() - new Date(a.streak.nextDate).getTime();
					default:
						return 0;
				}
			});
	}, [habitState, filter, activeTab, sortBy]);

	const handleStartHabitTimer = useCallback((habit: Habit) => {
		new Notice("Timer started for habit: " + habit.title);
	}, []);

	if (!habitState.length) return <div>No habits available</div>;

	return (
		<HabitSideView
			filteredHabits={filteredHabits}
			isOpen={isOpen}
			filter={filter}
			activeTab={activeTab}
			sortBy={sortBy}
			handleToggle={handleToggle}
			handleComplete={handleCheckbox}
			setFilter={handleSetFilter}
			setActiveTab={handleSetActiveTab}
			setSortBy={handleSetSortBy}
			handleModifyHabit={habitService.handleModify}
			getDaysUntil={habitService.handleGetDaysUntil}
			handleOpenDetails={habitService.openHabitDetails}
			handleStartTimer={handleStartHabitTimer}
		/>
	);
};
