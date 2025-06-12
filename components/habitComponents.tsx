import { useState, useEffect, use } from 'react';
import { useAppContext } from '../context/appContext';
import { Notice } from 'obsidian';
import { Habit } from '../constants/DEFAULT';
import { HabitSideView } from './habitUI';
import { ModifyHabitModal } from '../modales/habitModal';
import GOL from '../plugin';
import { appContextService } from 'context/appContextService';

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
				const habitsData = await appContextService.dataService.loadHabitsFromFile();
				setHabits(habitsData);
			} catch (error) {
				console.error("Error loading habits:", error);
			}
		};
		if (plugin && plugin.app) {
			loadHabits();
		}
	}, [plugin]);

	const handleCompleteHabit = async (habit: Habit, completed: boolean, date?: Date) => {
		try {
			const result = await updateHabitHistoryAndSave(
			habit.id, 
			completed, 
			plugin, 
			date
		);
		
		if (result.success) {
			// Mettre à jour l'état local
			setHabits(prevHabits =>
				prevHabits.map(h =>
					h.id === habit.id ? result.updatedHabit! : h
				)
			);
			
			// Mettre à jour l'XP
			const xpChange = completed ? habit.reward.XP : -habit.reward.XP;
			updateXP(xpChange);
			
			new Notice(result.message);
		} else {
			new Notice(result.message);
		}
	} catch (error) {
		console.error("Error:", error);
		setError("Failed to update habit");
	}
			// const habits = await plugin.dataService.loadHabitsFromFile();
			// const userData = await plugin.dataService.loadUser();
			// if (!userData || typeof userData !== 'object' || !('user1' in userData)) {
			// 	throw new Error("User data is missing or malformed");
			// }

			// const targetDate = date || new Date();

			// // Vérifier si la date existe déjà dans l'historique
			// const isDateInHistory = (history: { date: Date; success: boolean }[], date: Date) => {
			// 	return history.some(entry => {
			// 		const entryDate = new Date(entry.date);
			// 		return entryDate.toDateString() === date.toDateString();
			// 	});
			// };

			// const calculateNextDate = (recurrence: any) => {
			// 	const now = new Date();
			// 	const multiplier = recurrence.unit === 'day' ? 1 : recurrence.unit === 'week' ? 7 : 30;
			// 	return new Date(now.getTime() + recurrence.interval * multiplier * 24 * 60 * 60 * 1000);
			// };

			// const newHistoryEntry = {date: targetDate, success: completed};
			// const nextDate = calculateNextDate(habit.recurrence);

			// const updatedHabit = {
			// 	...habit,
			// 	streak: {
			// 		...habit.streak,
			// 		isCompletedToday: completed,
			// 		history: [...habit.streak.history, newHistoryEntry],
			// 		nextDate: nextDate
			// 	}
			// };

			// const updatedHabits = habits.map(h =>
			// 	h.id === habit.id ? updatedHabit : h
			// );

			// const xpChange = completed ? habit.reward.XP : -habit.reward.XP;
			// if (userData.user1?.persona?.xp !== undefined) {
			// 	userData.user1.persona.xp += xpChange;
			// }

			// setHabits(prevHabits =>
			// 	prevHabits.map(h =>
			// 		h.id === habit.id ? updatedHabit : h
			// 	)
			// );

			// await Promise.all([
			// 	plugin.dataService.saveHabitsToFile(updatedHabits),
			// 	plugin.dataService.saveSettings()
			// ]);

			// const action = completed ? 'completed' : 'uncompleted';
			// const xpAction = completed ? 'Added' : 'Removed';
			// new Notice(`Habit ${action}, ${xpAction} ${Math.abs(xpChange)} XP`);

			// if (completed) {
			// 	updateXP(habit.reward.XP);
			// } else {
			// 	updateXP(-habit.reward.XP);
			// }

			// if (!completed) {
			// 	habit.streak.isCompletedToday = false;
			// 	userData.user1.persona.xp -= habit.reward.XP;
			
			// 	const updatedHabits = habits.map(h =>
			// 		h.id === habit.id ? {
			// 			...h,
			// 			streak: {
			// 				...h.streak,
			// 				isCompletedToday: false,
			// 				history: [...h.streak.history, { date: targetDate, success: completed }],
			// 				nextDate: new Date(new Date().getTime() + h.recurrence.interval * (h.recurrence.unit === 'day' ? 24 * 60 * 60 * 1000 : h.recurrence.unit === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000))
			// 			}
			// 		} : h
			// 	);

			// 	await plugin.dataService.saveHabitsToFile(updatedHabits);
			// 	await plugin.dataService.saveSettings();
			// 	new Notice(`Habit uncompleted, Remove ${habit.reward.XP} XP`);
			// } else {
			// 	if (userData.user1?.persona?.xp !== undefined) {
			// 		userData.user1.persona.xp += habit.reward.XP;
			// 	}
			// 	const updatedHabits = habits.map(h =>
			// 		h.id === habit.id ? {
			// 			...h,
			// 			streak: {
			// 				...h.streak,
			// 				isCompletedToday: true,
			// 				history: [...h.streak.history, { date: targetDate, success: completed }],
			// 				nextDate: new Date(new Date().getTime() + h.recurrence.interval * (h.recurrence.unit === 'day' ? 24 * 60 * 60 * 1000 : h.recurrence.unit === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000))
			// 			}
			// 		} : h
			// 	);

			// 	await plugin.dataService.saveHabitsToFile(updatedHabits);
			// 	await plugin.dataService.saveSettings();
			// 	updateXP(habit.reward.XP);
			// 	new Notice(`Habit completed, Added ${habit.reward.XP} XP`);
			// }

		// } catch (error) {
		// 	console.error("Error completing habit:", error);
		// 	setError("Failed to update habit status");
		// }
	};

	const updateHabitHistory = (habit: Habit, completed: boolean, targetDate?: Date): Habit => {
		const dateToUpdate = targetDate || new Date();

		// Normaliser la date pour éviter les problèmes de comparaison d'heures
		const normalizeDate = (date: Date): string => {
			return new Date(date).toDateString();
		};

		const targetDateString = normalizeDate(dateToUpdate);

		// Vérifier si une entrée existe déjà pour cette date
		const existingEntryIndex = habit.streak.history.findIndex(entry => {
			const entryDate = new Date(entry.date);
			return normalizeDate(entryDate) === targetDateString;
		});

		let updatedHistory = [...habit.streak.history];

		if (existingEntryIndex !== -1) {
			// Mettre à jour l'entrée existante
			updatedHistory[existingEntryIndex] = {
				...updatedHistory[existingEntryIndex],
				success: completed
			};
		} else {
			// Ajouter une nouvelle entrée
			updatedHistory.push({
				date: dateToUpdate,
				success: completed
			});
		}

		// Trier l'historique par date (plus ancien au plus récent)
		updatedHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		// Calculer la streak actuelle
		const calculateCurrentStreak = (history: typeof updatedHistory): number => {
			if (history.length === 0) return 0;

			let currentStreak = 0;
			// Parcourir l'historique à l'envers pour calculer la streak actuelle
			for (let i = history.length - 1; i >= 0; i--) {
				if (history[i].success) {
					currentStreak++;
				} else {
					break;
				}
			}
			return currentStreak;
		};

		// Calculer la meilleure streak
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

		// Calculer la prochaine date selon la récurrence
		const calculateNextDate = (): Date => {
			const now = new Date();
			const { interval, unit } = habit.recurrence;
			
			const multiplier = {
				'days': 1,
				'weeks': 7,
				'months': 30 // Approximation
			}[unit];

			return new Date(now.getTime() + interval * multiplier * 24 * 60 * 60 * 1000);
		};

		// Vérifier si l'habitude est complétée aujourd'hui
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

	const updateHabitHistoryAndSave = async (
		habitId: string, 
		completed: boolean,
		plugin: GOL, // Remplacer par le type approprié du plugin

		targetDate?: Date,
	): Promise<{ success: boolean; message: string; updatedHabit?: Habit }> => {
		try {
			// Charger les habitudes
			const habits = await appContextService.dataService.loadHabitsFromFile();
			const habitIndex = habits.findIndex((h: Habit) => h.id === habitId);
			
			if (habitIndex === -1) {
				return { success: false, message: "Habit not found" };
			}

			const originalHabit = habits[habitIndex];
			
			// Vérifier si la date est déjà dans l'historique (pour éviter les doublons)
			const dateToCheck = targetDate || new Date();
			const dateString = new Date(dateToCheck).toDateString();
			const existingEntry = originalHabit.streak.history.find((entry: any) => 
				new Date(entry.date).toDateString() === dateString
			);

			// Mettre à jour l'habitude
			const updatedHabit = updateHabitHistory(originalHabit, completed, targetDate);
			habits[habitIndex] = updatedHabit;

			// Sauvegarder
			await appContextService.dataService.saveHabitsToFile(habits);

			const action = completed ? "completed" : "uncompleted";
			const isUpdate = existingEntry ? "updated" : "recorded";
			
			return { 
				success: true, 
				message: `Habit ${action} and ${isUpdate} successfully`,
				updatedHabit 
			};

		} catch (error) {
			console.error("Error updating habit history:", error);
			return { 
				success: false, 
				message: "Failed to update habit history" 
			};
		}
	};

	// Fonction utilitaire pour obtenir les statistiques d'une habitude
	const getHabitStats = (habit: Habit) => {
		const { history } = habit.streak;
		const totalDays = history.length;
		const completedDays = history.filter(entry => entry.success).length;
		const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
		
		// Calculer la streak de cette semaine
		const thisWeek = new Date();
		thisWeek.setDate(thisWeek.getDate() - 7);
		const thisWeekEntries = history.filter(entry => 
			new Date(entry.date) >= thisWeek
		);
		const thisWeekCompleted = thisWeekEntries.filter(entry => entry.success).length;
		
		return {
			totalDays,
			completedDays,
			completionRate: Math.round(completionRate * 100) / 100,
			currentStreak: habit.streak.current,
			bestStreak: habit.streak.best,
			thisWeekCompleted,
			isCompletedToday: habit.streak.isCompletedToday
		};
	};

	const handleModifyHabit = async (habit: Habit) => {
		try {
			const modal = new ModifyHabitModal(plugin.app, plugin);
			modal.habit = habit;
			modal.open();
		} catch (error) {
			console.error("Error modifying habit:", error);
			new Notice("Failed to modify habit. Check console for details.");
		}
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
				isOpen={isOpen}
				filter={filter}
				handleToggle={handleToggle}
				handleCompleteHabit={handleCompleteHabit}
				setFilter={setFilter}
				setSortBy={setSortBy}
				sortBy={sortBy}
				handleModifyHabit={handleModifyHabit}
				filteredHabits={filteredHabits}
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
	}

	if (!habit.recurrence || !habit.recurrence.interval || !habit.recurrence.unit) {
		console.warn("Habit recurrence is not defined, defaulting to daily recurrence.");
		habit.recurrence = { interval: 1, unit: 'days' };
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
	// if (nextDate < now) {
	// 	nextDate = now;
	// } if (habit.streak.history.length === 1 && !habit.streak.history[0].success) {
	// 	nextDate = now;
	// }
	// habit.streak.nextDate = nextDate;

	return nextDate;
};

/**
 * Vérifie si une habitude est due aujourd'hui
 */
export const isDueToday = (habit: Habit): boolean => {
	const nextOccurrence = getNextOccurrence(habit);
	const today = new Date(Date.now());
	
	return (
		nextOccurrence.getDate() === today.getDate() &&
		nextOccurrence.getMonth() === today.getMonth() &&
		nextOccurrence.getFullYear() === today.getFullYear()
	);
};

/**
 * Vérifie si une habitude a été complétée aujourd'hui
 */
export const isCompletedToday = (habit: Habit): boolean => {
	if (!habit.streak.history || habit.streak.history.length === 0) {
		return false;
	}

	const today = new Date(Date.now());
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
	const today = new Date(Date.now());
	today.setHours(0, 0, 0, 0); // force midnight
	let nextDate = getNextOccurrence(habit);
	nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate(), 0, 0, 0, 0); // force midnight
	// console.log("Next date for habit", habit.title, "is", nextDate);

	// Calculate current streak
	const calculateCurrentStreak = (habit: Habit): number => {
		if (!habit.streak.history || habit.streak.history.length === 0) return 0;
		let currentStreak = 0;
		for (let i = habit.streak.history.length - 1; i >= 0; i--) {
			if (habit.streak.history[i].success) {
				currentStreak++;
			} else {
				break;
			}
		}
		return currentStreak;
	};
	const currentStreak = calculateCurrentStreak(habit);

	// Calculate best streak
	const calculateBestStreak = (habit: Habit): number => {
		if (!habit.streak.history || habit.streak.history.length === 0) return 0;

		const { interval = 1, unit = 'days' } = habit.recurrence || {};
		const unitToDays = { days: 1, weeks: 7, months: 30 };
		const intervalMs = interval * (unitToDays[unit] || 1) * 24 * 60 * 60 * 1000;

		const sortedHistory = [...habit.streak.history].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);

		let bestStreak = 0;
		let currentStreakCount = 0;
		let lastSuccessDate: Date | null = null;

		for (const entry of sortedHistory) {
			const entryDate = new Date(entry.date);
			entryDate.setHours(0, 0, 0, 0);

			if (entry.success) {
				if (lastSuccessDate === null) {
					currentStreakCount = 1;
					lastSuccessDate = entryDate;
				} else {
					const expectedNextDate = new Date(lastSuccessDate.getTime() + intervalMs);
					const tolerance = 24 * 60 * 60 * 1000;
					if (Math.abs(entryDate.getTime() - expectedNextDate.getTime()) <= tolerance) {
						currentStreakCount++;
						lastSuccessDate = entryDate;
					} else {
						bestStreak = Math.max(bestStreak, currentStreakCount);
						currentStreakCount = 1;
						lastSuccessDate = entryDate;
					}
				}
			} else if (lastSuccessDate !== null) {
				const expectedNextDate = new Date(lastSuccessDate.getTime() + intervalMs);
				const tolerance = 24 * 60 * 60 * 1000;
				if (Math.abs(entryDate.getTime() - expectedNextDate.getTime()) <= tolerance) {
					bestStreak = Math.max(bestStreak, currentStreakCount);
					currentStreakCount = 0;
					lastSuccessDate = null;
				}
			}
		}
		bestStreak = Math.max(bestStreak, currentStreakCount);
		return bestStreak;
	};

	const bestStreak = calculateBestStreak(habit);
	let completedToday = isCompletedToday(habit);

	if (!completedToday && nextDate > today) {
		// Vérifier s'il y a une completion récente
		const lastSuccessfulEntry = habit.streak.history
			.filter(entry => entry.success)
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
		
		if (lastSuccessfulEntry) {
			const lastSuccessDate = new Date(lastSuccessfulEntry.date);
			lastSuccessDate.setHours(0, 0, 0, 0);
			
			// Si la dernière completion + l'intervalle de récurrence est dans le futur par rapport à aujourd'hui
			// alors l'habitude est considérée comme "complétée" pour aujourd'hui
			const { interval, unit } = habit.recurrence || { interval: 1, unit: 'days' };
			const multiplier = {
				'days': 1,
				'weeks': 7,
				'months': 30
			}[unit] || 1;
			
			const nextDueDate = new Date(lastSuccessDate.getTime() + interval * multiplier * 24 * 60 * 60 * 1000);
			
			if (nextDueDate > today) {
				completedToday = true;
			}
		}
	}

	if (nextDate < today) {
		nextDate = today;
		completedToday = false;
	}

	return {
		...habit,
		streak: {
			...habit.streak,
			current: calculateCurrentStreak(habit),
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
	if (a.getTime() > b.getTime()) {
		return 0; // Si la date de début est après la date de fin, retourne 0
	}
	return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}



// Helper function to check if a habit is due today
// export const isTodayHabit = (habit: Habit): boolean => {
// 	const today = new Date();
// 	today.setHours(0, 0, 0, 0);
// 	// const nextDate = new Date(getNextOccurrence(habit));
// 	// nextDate.setHours(0, 0, 0, 0);
// 	const normalizedHabit = normalizeHabit(habit);
// 	if (normalizedHabit.streak.nextDate.getTime() <= today.getTime()) return true;
// 	if (normalizedHabit.streak.history.length === 0) return true;
// 	if (normalizedHabit.streak.history.length === 1 && !normalizedHabit.streak.history[0].success) return true;
	
// 	if (normalizedHabit.streak.isCompletedToday && normalizedHabit.streak.history.length > 0 ) {
// 		return normalizedHabit.streak.history.some((h) => {
// 			if (!h.date) return false;
// 			const histDate = new Date(h.date);
// 			histDate.setHours(0, 0, 0, 0);
// 			return histDate.getTime() === today.getTime();
// 		});
// 	};

// 	return normalizedHabit.streak.history.some((h) => {
// 		if (!h.date) return false;
// 		const histDate = new Date(h.date);
// 		histDate.setHours(0, 0, 0, 0);
// 		return histDate.getTime() === today.getTime();
// 	});
// };


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


// Helper function to check if a habit is due today
export const isTodayHabit = (habit: Habit): boolean => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	// const nextDate = new Date(getNextOccurrence(habit));
	// nextDate.setHours(0, 0, 0, 0);
	const normalizedHabit = normalizeHabit(habit);
	if (normalizedHabit.streak.nextDate.getTime() <= today.getTime()) return true;
	if (normalizedHabit.streak.history.length === 0) return true;
	if (normalizedHabit.streak.history.length === 1 && !normalizedHabit.streak.history[0].success) return true;
	
	if (normalizedHabit.streak.isCompletedToday && normalizedHabit.streak.history.length > 0 ) {
		return normalizedHabit.streak.history.some((h) => {
			if (!h.date) return false;
			const histDate = new Date(h.date);
			histDate.setHours(0, 0, 0, 0);
			return histDate.getTime() === today.getTime();
		});
	};

	return normalizedHabit.streak.history.some((h) => {
		if (!h.date) return false;
		const histDate = new Date(h.date);
		histDate.setHours(0, 0, 0, 0);
		return histDate.getTime() === today.getTime();
	});
};
