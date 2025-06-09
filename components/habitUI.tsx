import React, { useState, useEffect, useCallback } from "react";
import { Habit } from "constants/DEFAULT";
import { CalendarView } from "./calendarView";
import { ButtonComponent, Notice } from "obsidian";
import { validateHabitFormData } from "components/habitFormHelpers";
import { HabitServices } from "services/habitService";
import GOL from "plugin";
import {
	getNextOccurrence,
	normalizeHabit,
	getDaysUntil,
	sortHabits,
} from "./habitComponents";
import { HabitSideViewProps } from "./props";

// -------------------------------------
// Helper Functions
// -------------------------------------

function isTodayHabit(habit: Habit): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const nextDate = new Date(getNextOccurrence(habit));
	nextDate.setHours(0, 0, 0, 0);
	if (nextDate.getTime() === today.getTime()) return true;
	if (habit.streak.history.length === 0) return true;
	if (habit.streak.history.length === 1 && !habit.streak.history[0].success) return true;
	if (Array.isArray(habit.streak.history)) {
		return habit.streak.history.some((h) => {
			if (!h.date) return false;
			const histDate = new Date(h.date);
			histDate.setHours(0, 0, 0, 0);
			return histDate.getTime() === today.getTime();
		});
	}
	return false;
}

function isHabitCompleted(habit: Habit): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	if (habit.streak.isCompletedToday) return true;
	if (Array.isArray(habit.streak.history)) {
		return habit.streak.history.some((h) => {
			if (!h.date) return false;
			const histDate = new Date(h.date);
			histDate.setHours(0, 0, 0, 0);
			return histDate.getTime() === today.getTime() && !!h.success;
		});
	}
	return false;
}

// -------------------------------------
// Main Components
// -------------------------------------

export function HabitSideView(props: HabitSideViewProps) {
	const {
		plugin,
		filteredHabits,
		isOpen,
		filter,
		handleToggle,
		handleCompleteHabit,
		setFilter,
		setSortBy,
		sortBy,
		handleModifyHabit,
	} = props;

	const [allHabits, setAllHabits] = useState<Habit[]>([]);
	const [todayOnly, setTodayOnly] = useState(true);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const loadHabits = async () => {
		try {
			setLoading(true);
			setError(null);
			const rawHabits: Habit[] = await plugin.dataService.loadHabitsFromFile();
			const normalizedHabits = rawHabits.map(normalizeHabit);
			setAllHabits(normalizedHabits);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadHabits();
	}, [plugin, refreshKey]);

	useEffect(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		let patched = false;
		const patchedHabits = allHabits.map((habit) => {
			const nextDate = new Date(getNextOccurrence(habit));
			nextDate.setHours(0, 0, 0, 0);
			const hasToday =
				Array.isArray(habit.streak.history) &&
				habit.streak.history.some((h) => {
					if (!h.date) return false;
					const histDate = new Date(h.date);
					histDate.setHours(0, 0, 0, 0);
					return histDate.getTime() === today.getTime();
				});
			if (nextDate.getTime() === today.getTime() && !hasToday) {
				patched = true;
				return {
					...habit,
					streak: {
						...habit.streak,
						history: [...habit.streak.history, { date: new Date(today), success: false }],
					},
				};
			}
			return habit;
		});
		if (patched) setAllHabits(patchedHabits);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [allHabits]);

	const habitsToShow = todayOnly
		? filteredHabits.filter(isTodayHabit)
		: filteredHabits.filter((habit) => !isTodayHabit(habit));
	const sortedHabits = sortHabits(habitsToShow, sortBy);

	const handleCompleteHabitWithRefresh = async (habit: Habit, completed: boolean) => {
		try {
			await handleCompleteHabit(habit, completed);
			setRefreshKey((k) => k + 1);
		} catch (error) {
			console.error("Error completing habit:", error);
		}
	};

	if (loading) {
		return (
			<details className="habit-list" open={isOpen} onToggle={handleToggle}>
				<summary className="accordion-title">Habits</summary>
				<div className="loading">Loading habits...</div>
			</details>
		);
	}

	if (error) {
		return (
			<details className="habit-list" open={isOpen} onToggle={handleToggle}>
				<summary className="accordion-title">Habits</summary>
				<div className="error">Error: {error}</div>
				<button onClick={loadHabits}>Retry</button>
			</details>
		);
	}

	return (
		<details className="habit-list" open={isOpen} onToggle={handleToggle}>
			<summary className="accordion-title">Habits ({sortedHabits.length})</summary>
			<div className="habit-controls">
				<input
					type="text"
					placeholder="Search habits..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					className="habit-search"
				/>
				<div className="habit-controls-row">
					<button className="habit-filter-toggle" onClick={() => setTodayOnly((v) => !v)}>
						{todayOnly ? "Show next" : "Show today's"}
					</button>
				</div>
			</div>
			{sortedHabits.length === 0 ? (
				<div className="no-habits-message">
					{filter ? "You have no habits matching your search" : "No habits available"}
				</div>
			) : (
				<div className="habits-container">
					{sortedHabits.map((habit) => (
						<HabitItem
							key={habit.id}
							habit={habit}
							onComplete={handleCompleteHabitWithRefresh}
							onModify={handleModifyHabit}
							nextOccurrence={getNextOccurrence(habit)}
						/>
					))}
				</div>
			)}
		</details>
	);
}

const HabitItem = ({
	habit,
	onComplete,
	onModify,
	nextOccurrence,
}: {
	habit: Habit;
	onComplete: (habit: Habit, completed: boolean) => void;
	onModify: (habit: Habit) => void;
	nextOccurrence: Date;
}) => {
	const isEditable = !habit.isSystemHabit;
	const disableCheckbox = !isTodayHabit(habit) && isEditable;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const nextDate = new Date(nextOccurrence);
	nextDate.setHours(0, 0, 0, 0);
	const daysUntilNext = getDaysUntil(today, nextDate);

	return (
		<div className="habit-item">
			<div className="habit-header">
				<div className="habit-checkbox-section">
					<input
						type="checkbox"
						checked={isHabitCompleted(habit)}
						onChange={() => onComplete(habit, !habit.streak.isCompletedToday)}
						className="habit-checkbox"
						disabled={disableCheckbox}
					/>
					<span className={`habit-title ${habit.streak.isCompletedToday ? "completed" : ""}`}>
						{habit.title}
						{habit.isSystemHabit && <span className="habit-system-badge">System</span>}
					</span>
					{isEditable && (
						<button className="habit-edit-button" onClick={() => onModify(habit)} aria-label="Edit habit">
							Edit
						</button>
					)}
				</div>
			</div>
			{habit.shortDescription && <div className="habit-description">{habit.shortDescription}</div>}
			<div className="habit-info-row">
				<div className="habit-streak">
					🔥 Streak: <b>{habit.streak.current}</b> (Best: {habit.streak.best})
				</div>
				<div className="habit-next-occurrence-text">
					{daysUntilNext === 0 ||
					habit.streak.history.length === 0 ||
					(habit.streak.history.length === 1 && !habit.streak.history[0].success) ? (
						<span className="habit-timing-badge">📅 Today</span>
					) : daysUntilNext === 1 ? (
						<span className="habit-timing-badge">📆 Tomorrow</span>
					) : daysUntilNext > 1 ? (
						<span className="habit-timing-badge">📆 In {daysUntilNext} days</span>
					) : daysUntilNext < 0 ? (
						<span className="habit-timing-badge">⏳ Overdue</span>
					) : null}
				</div>
			</div>
		</div>
	);
};
