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
			const refreshedHabits = habitState.map(habit => habitService.refreshHabits(habit));
			setHabitState(refreshedHabits);
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
		const handleReload = async () => {
			const habits = await appService.getAllHabit();
			setHabitState(habits);
		};

		document.addEventListener("habitsUpdated", handleReload);
		return () => document.removeEventListener("habitsUpdated", handleReload);
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
	};

	const filteredHabits = useMemo(() => {
		return habitState
			.filter((habit) => {const matchesSearch =
					!filter ||
					habit.title.toLowerCase().includes(filter.toLowerCase()) ||
					habit.description.toLowerCase().includes(filter.toLowerCase());
				const matchesTab =
					activeTab === "today" ||
					(activeTab === "upcoming" && !habit.streak.isCompletedToday);
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


interface HabitItemProps {
	habit: Habit;
	onComplete: (habit: Habit, completed: boolean) => void;
	onModify: (habit: Habit) => void;
}

const HabitItem_test: React.FC<HabitItemProps> = ({ habit, onComplete, onModify }) => {
	const isEditable = !habit.isSystemHabit;

	// Toggle pour compléter / annuler l'habitude pour aujourd'hui
	const handleToggle = () => {
		onComplete(habit, !habit.streak.isCompletedToday);
	};

	return (
		<div className="quest-item">
			<div className="quest-header">
				<div className="quest-checkbox-section">
					<input
						type="checkbox"
						checked={habit.streak.isCompletedToday}
						onChange={handleToggle}
						className="quest-checkbox"
					/>
					<span className={`quest-title ${habit.streak.isCompletedToday ? "completed" : ""}`}>
						{habit.title}
						{habit.isSystemHabit && <span className="quest-system-badge">System</span>}
					</span>
					{isEditable && (
						<button
							className="quest-edit-button"
							onClick={() => onModify(habit)}
							aria-label="Edit habit"
						>
							Edit
						</button>
					)}
				</div>
			</div>

			{habit.shortDescription && (
				<div className="quest-description">{habit.shortDescription}</div>
			)}

			<div className="quest-xp">XP: {habit.reward.XP}</div>
		</div>
	);
};

