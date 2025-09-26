import React, { use, useEffect, useMemo, useState } from "react";
import { ModifyHabitModal } from "modal/habitModal";
import { DEFAULT_HABIT, Habit, UserSettings } from "data/DEFAULT";
import { useAppContext } from "context/appContext";
import { HabitService } from "context/services/habitService";
import { HabitSideView } from "./habitSideView";
import { Notice } from "obsidian";

interface HabitListProps {
	habits: Habit[];
	onHabitUpdate?: (updatedHabits: Habit[]) => void;
	onUserUpdate?: (updatedUser: UserSettings) => void;
}

export const HabitList: React.FC<HabitListProps> = ({ habits, onHabitUpdate, onUserUpdate }) => {
	const appService = useAppContext();
	const habitService = new HabitService(appService);

	const [habitState, setHabitState] = useState<Habit[]>(habits);

	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today");
	const [sortBy, setSortBy] = useState<"priority" | "xp" | "difficulty" | "recurrence">("priority");
	const [habit, setHabits] = useState<Habit[]>([DEFAULT_HABIT]);

	useEffect(() => {
		const refreshAllHabits = async () => {
			const refreshedHabits = await Promise.all(habitState.map(habit => habitService.refreshHabits(habit)));
			setHabitState(refreshedHabits);
			await appService.saveAllHabits(refreshedHabits); // Met à jour la database avec les habits à jour
		};
		
		refreshAllHabits();
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		// const handleReload = async () => {
		// 	const habits = await appService.getAllHabit();
		// 	setHabitState(habits);
		// };

		// document.addEventListener("habitsUpdated", handleReload);
		// return () => document.removeEventListener("habitsUpdated", handleReload);
	}, []);


	useEffect(() => {
		setHabitState(habits); // sync quand props changent
	}, [habits]);

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

	const handleCheckbox = async (habit: Habit, completed: boolean) => {
		console.log(`Toggling habit ${habit.id} to ${completed}`);
		const updatedHabit = await habitService.updateHabitCompletion(habit, completed);
		await habitService.saveHabit(updatedHabit);
		const updatedHabits = habitState.map(h => h.id === updatedHabit.id ? updatedHabit : h);
		setHabitState(updatedHabits);
		if (onHabitUpdate) onHabitUpdate(updatedHabits);
	};

	const handleModify = (habit: Habit) => {
		console.log("Modifying habit:", habit);
		new Notice("Opening modify habit modal");
		new ModifyHabitModal(appService.getApp(), habit).open();
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
		/>
	);
};

