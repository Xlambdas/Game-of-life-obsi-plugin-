import React, { useEffect, useMemo, useState } from "react";
// from files (Service, DEFAULT):
import { useAppContext } from "context/appContext";
import { Habit, UserSettings } from "data/DEFAULT";
// from files (UI):
import { HabitSideView } from "./habitSideView";
import { GenericForm } from "../forms/genericForm";


interface HabitListProps {
	habits: Habit[];
	onHabitUpdate?: (updatedHabits: Habit[]) => void;
	onUserUpdate?: (updatedUser: UserSettings) => void;
}

export const HabitList: React.FC<HabitListProps> = ({ habits, onHabitUpdate, onUserUpdate }) => {
	/* Side view to display and manage habits */
	const appService = useAppContext();

	const [habitState, setHabitState] = useState<Habit[]>(habits);

	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today");
	const [sortBy, setSortBy] = useState<"priority" | "xp" | "difficulty" | "recurrence">("priority");

	useEffect(() => {
		const refreshAllHabits = async () => {
			/* Refresh all habits to update their streaks and next dates */
			const refreshedHabits = await Promise.all(habitState.map(habit => appService.habitService.refreshHabits(habit)));
			setHabitState(refreshedHabits);
			await appService.dataService.saveAllHabits(refreshedHabits);
		};
		refreshAllHabits();
	}, []);

	useEffect(() => {
		const savedOpen = localStorage.getItem("habitListOpen");
		const savedFilter = localStorage.getItem("habitListFilter");
		const savedTab = localStorage.getItem("habitListActiveTab");
		const savedSort = localStorage.getItem("habitListSortBy");
		if (savedOpen) setIsOpen(savedOpen === "true");
		if (savedFilter) setFilter(savedFilter);
		if (savedTab === "today" || savedTab === "upcoming") {
			setActiveTab(savedTab);
		}
		if (savedSort === "priority" || savedSort === "xp" || savedSort === "difficulty" || savedSort === "recurrence") {
			setSortBy(savedSort);
		}
	}, []);

	useEffect(() => {
		setHabitState(habits); // sync quand props changent
	}, [habits]);

	// Handlers for UI interactions (and localStorage persistence)
	const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => {
		const details = e.currentTarget;
		setIsOpen(details.open);
		localStorage.setItem("habitListOpen", details.open ? "true" : "false");
	}
	const handleSetFilter = (value: string) => {
		setFilter(value);
		localStorage.setItem("habitListFilter", value);
	};

	const handleSetActiveTab = (tab: "today" | "upcoming") => {
		setActiveTab(tab);
		localStorage.setItem("habitListActiveTab", tab);
	};

	const handleSetSortBy = (sort: "priority" | "xp" | "difficulty" | "recurrence") => {
		setSortBy(sort);
		localStorage.setItem("habitListSortBy", sort);
	};

	const handleGetDaysUntil = (targetDate: Date): string => {
		// console.log("Calculating days until:", new Date(), targetDate);
		return appService.xpService.getDaysUntil(new Date(), targetDate, 'habit');
	}

	const handleCheckbox = async (habit: Habit, completed: boolean) => {
		const updatedHabit = await appService.habitService.updateHabitCompletion(habit, completed);
		await appService.habitService.saveHabit(updatedHabit);
		const updatedHabits = habitState.map(h => h.id === updatedHabit.id ? updatedHabit : h);
		setHabitState(updatedHabits);
		const newUser = await appService.xpService.updateXPFromAttributes(habit.reward.attributes || {}, completed);
		await appService.dataService.saveUser(newUser);
		// Notify parent component of updates
		if (onHabitUpdate) onHabitUpdate(updatedHabits);
		if (onUserUpdate) onUserUpdate(newUser);
	};

	const handleModify = (habit: Habit) => {
		// console.log("Modifying habit:", habit);
		new GenericForm(appService.getApp(), 'habit-modify', habit).open();
	};

	const filteredHabits = useMemo(() => {
		return habitState
			.filter((habit) => {
				const search = filter.trim().toLowerCase();
				const matchesSearch =
					!search ||
					habit.title.toLowerCase().includes(search) ||
					(habit.description && habit.description.toLowerCase().includes(search)) ||
					(habit.shortDescription && habit.shortDescription.toLowerCase().includes(search));

				const today = new Date();
				const todayStr = today.toISOString().slice(0, 10); // format YYYY-MM-DD

				const lastCompletedDateStr = habit.streak.lastCompletedDate
					? new Date(habit.streak.lastCompletedDate).toISOString().slice(0, 10)
					: "";
				const nextDateStr = habit.streak.nextDate
					? new Date(habit.streak.nextDate).toISOString().slice(0, 10)
					: "";

				let matchesTab = false;
				if (activeTab === "today") {
					// lastCompletedDate is today OR nextDate is today or in the future
					matchesTab =
						lastCompletedDateStr === todayStr ||
						nextDateStr <= todayStr;
				} else {
					// upcoming: nextDate is after today
					matchesTab = nextDateStr > todayStr && lastCompletedDateStr !== todayStr;
				}
				return matchesSearch && matchesTab;
			})
			.sort((a, b) => {
				switch (sortBy) {
					case "priority":
						const priorityOrder = { high: 0, medium: 1, low: 2 };
						return priorityOrder[a.settings.priority || "low"] - priorityOrder[b.settings.priority || "low"];
					case "xp":
						return b.reward.XP - a.reward.XP;
					case "difficulty":
						const difficultyOrder = { easy: 0, medium: 1, hard: 2, expert: 3 };
						return difficultyOrder[a.settings.difficulty || "easy"] - difficultyOrder[b.settings.difficulty || "easy"];
					case "recurrence":
						return new Date(b.streak.nextDate).getTime() - new Date(a.streak.nextDate).getTime();
					default:
						return 0;
				}
			});
	}, [habitState, filter, activeTab, sortBy]);

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
			handleModifyHabit={handleModify}
			getDaysUntil={handleGetDaysUntil}
		/>
	);
};

