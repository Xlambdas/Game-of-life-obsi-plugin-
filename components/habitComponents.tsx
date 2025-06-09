import { useState, useEffect, use } from 'react';
import { useAppContext } from '../context/appContext';
import { Notice } from 'obsidian';
import { Habit } from '../constants/DEFAULT';
import { HabitSideView } from './habitUI';
import { ModifyHabitModal } from '../modales/habitModal';
import GOL from '../plugin';

export const HabitList = () => {
	const { plugin, updateXP } = useAppContext();
	const [habits, setHabits] = useState<Habit[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState('');
	const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
	const [sortBy, setSortBy] = useState<'priority' | 'xp' | 'difficulty' | 'date'| 'today' | 'upcoming'>('today');
	const [error, setError] = useState<string | null>(null);

	const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => {
		const details = e.currentTarget;
		setIsOpen(details.open);
		localStorage.setItem('habitListOpen', details.open ? 'true' : 'false');
	};

	useEffect(() => {
		const savedState = localStorage.getItem('habitListOpen');
		if (savedState !== null) {
			setIsOpen(savedState === 'true');
		}
	}, []);

	useEffect(() => {
		const loadHabits = async () => {
			try {
				const habitsData = await plugin.dataService.loadHabitsFromFile();
				setHabits(habitsData);
				setError(null)
			} catch (error) {
				console.error("Error loading habits:", error);
				setError("Failed to load habits");
			}
		};
		if (plugin && plugin.app) {
			loadHabits();
		}
	}, [plugin]);

	/* * Handle habit completion logic
	* This function handles marking an habit as completed or uncompleted
	* It updates the habit's progression, and saves changes to the file.
	*/
	const handleCompleteHabit = async (habit: Habit, completed: boolean, date?: Date) => {
		try {
			const habits = await plugin.dataService.loadHabitsFromFile();
			const habitIndex = habits.findIndex(h => h.id === habit.id);
			if (habitIndex === -1) {
				throw new Error("Habit not found");
			}
			const originalHabit = habits[habitIndex];
			const updatedHabit = updateHabitHistory(originalHabit, completed, date);
			habits[habitIndex] = updatedHabit;
			await plugin.dataService.saveHabitsToFile(habits);
			setHabits(prevHabits =>
				prevHabits.map(h => (h.id === habit.id ? updatedHabit : h))
			);
			const action = completed ? 'completed' : 'uncompleted';
			const xpChange = completed ? habit.reward.XP : -habit.reward.XP;
			if (completed) {
				updateXP(habit.reward.XP);
			} else {
				updateXP(-habit.reward.XP);
			}
			new Notice(`Habit ${action}, ${completed ? 'Added' : 'Removed'} ${Math.abs(xpChange)} XP`);
		} catch (error) {
			console.error("Error completing habit:", error);
			setError("Failed to update habit status");
		}
	};

	/** update habit history
	 * This function updates the habit's history with the completion status for today or a specified date.
	 * It also calculates the current and best streaks, and updates the next occurrence date.
	 */
	// Note: This function assumes that the habit object is already normalized and has a valid streak history.
	const updateHabitHistory = (habit: Habit, completed: boolean, targetDate?: Date): Habit => {
		const dateToUpdate = targetDate || new Date();
		const normalizeDate = (date: Date): string => {
			return new Date(date).toDateString();
		};
		const targetDateString = normalizeDate(dateToUpdate);
		const existingEntryIndex = habit.streak.history.findIndex(entry => {
			const entryDate = new Date(entry.date);
			return normalizeDate(entryDate) === targetDateString;
		});

		let updatedHistory = [...habit.streak.history];
		if (existingEntryIndex !== -1) { // update existing entry
			updatedHistory[existingEntryIndex] = {
				...updatedHistory[existingEntryIndex],
				success: completed
			};
		} else { // add new entry if it doesn't exist
			updatedHistory.push({
				date: dateToUpdate,
				success: completed
			});
		}

		updatedHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const calculateCurrentStreak = (history: typeof updatedHistory): number => {
			if (history.length === 0) return 0;
			let currentStreak = 0;
			for (let i = history.length - 1; i >= 0; i--) {
				if (history[i].success) {
					currentStreak++;
				} else {
					break;
				}
			}
			return currentStreak;
		};

		// Calculate the best streak
		const calculateBestStreak = (history: typeof updatedHistory): number => {
			if (history.length === 0) return 0;

			let bestStreak = 0;
			let currentStreak = 0;

			for (const entry of history) {
				if (entry.success) {
					currentStreak++;
					bestStreak = Math.max(bestStreak, currentStreak);
			} else {
					currentStreak = 0;
				}
			}
			return bestStreak;
		};

		// Calculate the next occurrence date based on the habit's recurrence settings
		const calculateNextDate = (): Date => {
			if (!completed) {
				// If the habit is not completed, return today at midnight
				const now = new Date();
				now.setHours(0,0,0,0);
				return now;
			}
			const now = new Date();
			const { interval, unit } = habit.recurrence;
			const multiplier = {
				'days': 1,
				'weeks': 7,
				'months': 30 // Approximation
			}[unit];
			return new Date(now.getTime() + interval * multiplier * 24 * 60 * 60 * 1000);
		};

		// Check if the habit is completed today
		const isCompletedToday = (): boolean => {
			const today = normalizeDate(new Date());
			const todayEntry = updatedHistory.find(entry => 
				normalizeDate(new Date(entry.date)) === today
			);
			return todayEntry?.success || false;
		};

		const currentStreak = calculateCurrentStreak(updatedHistory);
		const bestStreak = Math.max(calculateBestStreak(updatedHistory), habit.streak.best);

		return {
			...habit,
						streak: {
				...habit.streak,
				current: currentStreak,
				best: bestStreak,
				history: updatedHistory,
				isCompletedToday: isCompletedToday(),
				nextDate: calculateNextDate()
			}
		};
	};

	const handleModifyHabit = async (habit: Habit) => {
		if (plugin) {
			try {
				const modal = new ModifyHabitModal(plugin.app, plugin);
				modal.habit = habit;
				modal.open();
			} catch (error) {
				console.error("Error modifying habit:", error);
				new Notice("Failed to modify habit. Check console for details.");
			}
		};
	};

	const filteredHabits = habits
		.filter(habit => {

			const today = new Date();
			const lastCompleted = habit.streak.history[habit.streak.history.length - 1]?.date;

			if (!lastCompleted || !(lastCompleted instanceof Date) || isNaN(lastCompleted.getTime())) {
				return true;
			}

			const lastCompletedDate = new Date(lastCompleted);
			return !lastCompletedDate || (
				lastCompletedDate.getDate() !== today.getDate() ||
				lastCompletedDate.getMonth() !== today.getMonth() ||
				lastCompletedDate.getFullYear() !== today.getFullYear()
			);
		})
		.sort((a, b) => {
			// Trier par complétion aujourd'hui
			if (a.streak.isCompletedToday !== b.streak.isCompletedToday) {
				return a.streak.isCompletedToday ? 1 : -1;
			}

			switch (sortBy) {
				// case 'priority': {
				// 	const priorityOrder = { high: 0, medium: 1, low: 2 };
				// 	return priorityOrder[a.settings.priority || 'low'] - priorityOrder[b.settings.priority || 'low'];
				// }
				// case 'xp':
				// 	return b.reward.XP - a.reward.XP;
				// case 'difficulty': {
				// 	const difficultyOrder = { easy: 0, medium: 1, hard: 2, expert: 3 };
				// 	return difficultyOrder[a.settings.difficulty || 'easy'] - difficultyOrder[b.settings.difficulty || 'easy'];
				// }
				// case 'date':
				// 	return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
				default:
					return 0;
			}
		});

	if (error) {
		return <div className="quest-error">{error}</div>;
	}

	if (habits.length === 0) {
		return <div className="empty-quests">No habits available</div>;
	}

	return (
		<div>
			<HabitSideView
				plugin={plugin}
				filteredHabits={filteredHabits}
				isOpen={isOpen}
				filter={filter}
				handleToggle={handleToggle}
				handleCompleteHabit={handleCompleteHabit}
				setFilter={setFilter}
				setSortBy={setSortBy}
				sortBy={sortBy}
				handleModifyHabit={handleModifyHabit}
			/>
		</div>
	);
}


// ------------------------------------------------

/**
 * Obtient la prochaine occurrence d'une habitude
 */
export const getNextOccurrence = (habit: Habit): Date => {
	const now = new Date(Date.now());
	// console.log(`Calculating next occurrence for habit: ${now}`);
	now.setHours(0,0,0,0);

	let lastCompleted: Date | null = null;
	if (!habit.streak.history || habit.streak.history.length === 0 || habit.streak.history.length === 1 && !habit.streak.history[0].success) {
		lastCompleted = now;
	} else {
		// Find the most recent successful completion in the history
		for (let i = habit.streak.history.length - 1; i >= 0; i--) {
			if (habit.streak.history[i].success) {
				lastCompleted = new Date(habit.streak.history[i].date);
				lastCompleted.setHours(0, 0, 0, 0);
				break;
			}
		}
		if (!lastCompleted) {
			lastCompleted = now;
		}
		// console.log(`Last completed date: ${lastCompleted}`);
	}

	if (!habit.recurrence || !habit.recurrence.interval || !habit.recurrence.unit) {
		console.warn("Habit recurrence is not defined, defaulting to daily recurrence.");
		habit.recurrence = { interval: 1, unit: 'days' }; // Default to daily if not set
	}

	let intervalMs: number;
	switch (habit.recurrence.unit) {
		case 'days':
			intervalMs = habit.recurrence.interval * 24 * 60 * 60 * 1000;
			break;
		case 'weeks':
			intervalMs = habit.recurrence.interval * 7 * 24 * 60 * 60 * 1000;
			break;
		case 'months':
			intervalMs = habit.recurrence.interval * 30 * 24 * 60 * 60 * 1000;
			break;
		default:
			intervalMs = 24 * 60 * 60 * 1000;
	}

	let nextDate = new Date(lastCompleted.getTime() + intervalMs) ;
	if (nextDate < now) {
		nextDate = now;
	} if (habit.streak.history.length === 1 && !habit.streak.history[0].success) {
		nextDate = now;
	}
	habit.streak.nextDate = nextDate;

	return nextDate;
};


/**
 * Vérifie si une habitude a été complétée aujourd'hui
 */
export const isCompletedToday = (habit: Habit): boolean => {
	if (!habit.streak.history || habit.streak.history.length === 0) {
		return false;
	}

	const today = new Date();
	const todayString = today.toDateString();
	
	return habit.streak.history.some(entry => {
		const entryDate = new Date(entry.date);
		return entryDate.toDateString() === todayString && entry.success;
	});
};

/**
 * Normalise une habitude (met à jour les champs calculés)
 */
export const normalizeHabit = (habit: Habit): Habit => {
	let nextDate = getNextOccurrence(habit);
	nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), 0, 0, 0, 0); // force minuit
	const completedToday = isCompletedToday(habit);
	return {
		...habit,
		streak: {
			...habit.streak,
			isCompletedToday: completedToday,
			nextDate: nextDate
		}
	};
};



// Utilitaire pour calculer le nombre de jours entre deux dates (en ignorant l'heure)
export function getDaysUntil(today: Date, nextDate: Date): number {
	const a = new Date(today);
	a.setHours(0,0,0,0);
	const b = new Date(nextDate);
	b.setHours(0,0,0,0);
	return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}



// Fonction utilitaire pour trier les habitudes
export const sortHabits = (habits: Habit[], sortBy: string): Habit[] => {
	const sorted = [...habits];
	
	switch (sortBy) {
		case 'priority':
			return sorted.sort((a, b) => {
				const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
				const aPriority = priorityOrder[String(a.settings.priority) as keyof typeof priorityOrder] || 0;
				const bPriority = priorityOrder[String(b.settings.priority) as keyof typeof priorityOrder] || 0;
				return bPriority - aPriority;
			});
		case 'xp':
			return sorted.sort((a, b) => (b.reward?.XP || 0) - (a.reward?.XP || 0));
		case 'difficulty':
			return sorted.sort((a, b) => {
				const difficultyOrder: Record<string, number> = { 'expert': 4, 'hard': 3, 'medium': 2, 'easy': 1 };
				const aDifficulty = a.settings.difficulty ?? '';
				const bDifficulty = b.settings.difficulty ?? '';
				return (difficultyOrder[bDifficulty] || 0) - (difficultyOrder[aDifficulty] || 0);
			});
		case 'date':
			return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
		default:
			return sorted;
	}
};
