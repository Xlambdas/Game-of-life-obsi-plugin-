import React, { use, useEffect, useMemo, useState } from "react";
import { ModifyHabitModal } from "modal/habitModal";
import { Habit, UserSettings } from "data/DEFAULT";
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
	const [activeTab, setActiveTab] = useState<"active" | "completed" | "all">("all");
	const [sortBy, setSortBy] = useState<"priority" | "xp" | "difficulty" | "date">("priority");

	useEffect(() => {
		const savedOpen = localStorage.getItem("habitListOpen");
		const savedFilter = localStorage.getItem("habitListFilter");
		const savedTab = localStorage.getItem("habitListActiveTab");
		const savedSort = localStorage.getItem("habitListSortBy");
		if (savedOpen) setIsOpen(savedOpen === "true");
		if (savedFilter) setFilter(savedFilter);
		if (savedTab === "active" || savedTab === "completed" || savedTab === "all") {
			setActiveTab(savedTab);
		}
		if (savedSort === "priority" || savedSort === "xp" || savedSort === "difficulty" || savedSort === "date") {
			setSortBy(savedSort);
		}
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

	const handleSetActiveTab = (tab: "active" | "completed" | "all") => {
		setActiveTab(tab);
		localStorage.setItem("habitListActiveTab", tab);
	};

	const handleSetSortBy = (sort: "priority" | "xp" | "difficulty" | "date") => {
		setSortBy(sort);
		localStorage.setItem("habitListSortBy", sort);
	};

	const handleCompleteHabit = async (habit: Habit, completed: boolean) => {
		try {
			const updatedHabit = await habitService.toggleHabitCompletion(habit);
			const updatedHabits = habitState.map((h) => (h.id === updatedHabit.id ? updatedHabit : h));
			setHabitState(updatedHabits);
			if (onHabitUpdate) onHabitUpdate(updatedHabits);

			// Met à jour les données utilisateur si nécessaire
			if (updatedHabit.reward.XP > 0 || (updatedHabit.progress && updatedHabit.progress.XP > 0)) {
				const user = await appService.getUser();
				let newXP = user.xpDetails.xp + (updatedHabit.reward.XP || 0);
				if (updatedHabit.progress) {
					newXP += updatedHabit.progress.XP || 0;
				}
				const updatedUser = { ...user, xpDetails: { ...user.xpDetails, xp: newXP } };
				await appService.saveUser(updatedUser);
				if (onUserUpdate) onUserUpdate(updatedUser);
			}
		} catch (error) {
			console.error("Error completing habit:", error);
			new Notice("An error occurred while completing the habit.");
		}
	};

	const handleModifyHabit = (habit: Habit) => {
		new Notice("Modify habit feature coming soon!");
		new ModifyHabitModal(appService.getApp(), habit).open();
	};

	const filteredHabits = useMemo(() => {
		return habitState
			.filter((habit) => {const matchesSearch =
					!filter ||
					habit.title.toLowerCase().includes(filter.toLowerCase()) ||
					habit.description.toLowerCase().includes(filter.toLowerCase());
				const matchesTab =
					activeTab === "all" ||
					(activeTab === "active" && !habit.streak.isCompletedToday) ||
					(activeTab === "completed" && habit.streak.isCompletedToday);
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
					case "date":
						return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
			handleCompleteHabit={handleCompleteHabit}
			setFilter={handleSetFilter}
			setActiveTab={handleSetActiveTab}
			setSortBy={handleSetSortBy}
			handleModifyHabit={handleModifyHabit}
		/>
	);
};

