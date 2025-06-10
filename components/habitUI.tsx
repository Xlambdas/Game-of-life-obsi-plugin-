import React, { useState, useEffect } from "react";
import { Habit } from "constants/DEFAULT";
import { Notice } from "obsidian";
import { HabitSideViewProps } from "./props";
import { getNextOccurrence, normalizeHabit, sortHabits, isTodayHabit } from "./habitComponents";
import { HabitItem } from "./habitItem";


export function HabitSideView({
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
}: HabitSideViewProps) {
	const [allHabits, setAllHabits] = useState<Habit[]>([]);
	const [todayOnly, setTodayOnly] = useState(true);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	// Load habits from storage
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

	// Load habits on mount and when refreshKey changes
	useEffect(() => {
		loadHabits();
	}, [plugin, refreshKey]);

	// Update habits with today's entries if needed
	useEffect(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const patchedHabits = allHabits.map((habit) => {
			const nextDate = new Date(getNextOccurrence(habit));
			nextDate.setHours(0, 0, 0, 0);
			
			const hasToday = habit.streak.history.some((h) => {
				if (!h.date) return false;
				const histDate = new Date(h.date);
				histDate.setHours(0, 0, 0, 0);
				return histDate.getTime() === today.getTime();
			});

			if (nextDate.getTime() === today.getTime() && !hasToday) {
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

		const hasChanges = patchedHabits.some((h, i) => h !== allHabits[i]);
		if (hasChanges) {
			setAllHabits(patchedHabits);
		}
	}, [allHabits]);

	// Filter and sort habits based on current settings
	const habitsToShow = todayOnly
		? filteredHabits.filter(isTodayHabit)
		: filteredHabits.filter((habit) => !isTodayHabit(habit));
	const sortedHabits = sortHabits(habitsToShow, sortBy);

	// Handle habit completion with UI refresh
	const handleCompleteHabitWithRefresh = async (habit: Habit, completed: boolean) => {
		try {
			await handleCompleteHabit(habit, completed);
			setRefreshKey((k) => k + 1);
		} catch (error) {
			console.error("Error completing habit:", error);
		}
	};

	// Loading state
	if (loading) {
		return (
			<details className="habit-list" open={isOpen} onToggle={handleToggle}>
				<summary className="accordion-title">Habits</summary>
				<div className="loading">Loading habits...</div>
			</details>
		);
	}

	// Error state
	if (error) {
		return (
			<details className="habit-list" open={isOpen} onToggle={handleToggle}>
				<summary className="accordion-title">Habits</summary>
				<div className="error">Error: {error}</div>
				<button onClick={loadHabits}>Retry</button>
			</details>
		);
	}

	// Main view
	return (
		<details className="habit-list" open={isOpen} onToggle={handleToggle}>
			<summary className="accordion-title">Habits ({sortedHabits.filter(h => h.streak.isCompletedToday).length} / {sortedHabits.length}) - {Math.round((sortedHabits.filter(h => h.streak.isCompletedToday).length / sortedHabits.length) * 100)}%</summary>

			<div className="habit-controls">
				<input
					type="text"
					placeholder="Search habits..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					className="habit-search"
				/>
				<div className="habit-controls-row">
					<button
						className="habit-filter-toggle"
						onClick={() => setTodayOnly((v) => !v)}
					>
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
							normalizeHabit={normalizeHabit}
						/>
					))}
				</div>
			)}
		</details>
	);
}
