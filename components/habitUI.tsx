import { Habit } from "constants/DEFAULT";
import { CalendarView } from "./calendarView";
import { ButtonComponent, Notice } from "obsidian";
import { validateHabitFormData } from "components/habitFormHelpers";
import { HabitServices } from "services/habitService";
import React, {useState, useEffect} from "react";
import GOL from "plugin";
import {loadTodayHabits, getNextOccurrence, isDueToday, isCompletedToday, normalizeHabit} from "./habitComponents";
import { endButton } from "./uiHelpers";
import { HabitSideViewProps } from "./props";



// Utilitaire pour calculer le nombre de jours entre deux dates (en ignorant l'heure)
function getDaysUntil(today: Date, nextDate: Date): number {
	const a = new Date(today);
	a.setHours(0,0,0,0);
	const b = new Date(nextDate);
	b.setHours(0,0,0,0);
	return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}



// Fonction utilitaire pour trier les habitudes
const sortHabits = (habits: Habit[], sortBy: string): Habit[] => {
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



// ------------------------------------------------
// Composant principal pour afficher les habitudes
// ------------------------------------------------




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
		handleModifyHabit
	} = props;

	// États locaux pour gérer les habitudes
	const [allHabits, setAllHabits] = useState<Habit[]>([]);
	const [todayOnly, setTodayOnly] = useState<boolean>(true); // Ajout du filtre
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0); // Ajout d'une clé pour forcer le rechargement

	// Fonction pour charger les habitudes
	const loadHabits = async () => {
		try {
			setLoading(true);
			setError(null);
			
			// Utiliser notre nouvelle fonction
			const rawHabits: Habit[] = await plugin.dataService.loadHabitsFromFile();
			const normalizedHabits = rawHabits.map(normalizeHabit);
			const todayHabitsFiltered = normalizedHabits.filter(isDueToday);
			const completedTodayFiltered = todayHabitsFiltered.filter(habit => habit.streak.isCompletedToday);
			const pendingTodayFiltered = todayHabitsFiltered.filter(habit => !habit.streak.isCompletedToday);
			const statsCalculated = {
				total: normalizedHabits.length,
				dueToday: todayHabitsFiltered.length,
				completed: completedTodayFiltered.length,
				pending: pendingTodayFiltered.length,
				completionRate: todayHabitsFiltered.length > 0 
					? Math.round((completedTodayFiltered.length / todayHabitsFiltered.length) * 100) 
					: 0
			};
			// Mettre à jour tous les états
			setAllHabits(normalizedHabits);
			// setTodayHabits(todayHabitsFiltered);
			// setCompletedToday(completedTodayFiltered);
			// setPendingToday(pendingTodayFiltered);
			// setStats(statsCalculated);

		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur inconnue");
		} finally {
			setLoading(false);
		}
	};

	// Charger les habitudes au montage du composant et lors d'un refresh
	useEffect(() => {
		loadHabits();
	}, [plugin, refreshKey]);

	useEffect(() => {
		// Patch: pour chaque habit, si la date du jour == nextDate et pas d'entrée today dans history, ajouter {date: today, success: false}
		const today = new Date();
		today.setHours(0,0,0,0);
		let patched = false;
		const patchedHabits = allHabits.map(habit => {
			const nextDate = new Date(getNextOccurrence(habit));
			nextDate.setHours(0,0,0,0);
			const hasToday = Array.isArray(habit.streak.history) && habit.streak.history.some(h => {
				if (!h.date) return false;
				const histDate = new Date(h.date);
				histDate.setHours(0,0,0,0);
				return histDate.getTime() === today.getTime();
			});
			if (nextDate.getTime() === today.getTime() && !hasToday) {
				patched = true;
				return {
					...habit,
					streak: {
						...habit.streak,
						history: [...habit.streak.history, { date: new Date(today), success: false }]
					}
				};
			}
			return habit;
		});
		if (patched) {
			setAllHabits(patchedHabits);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [allHabits]);

	const filteredHabits_old = allHabits.filter(habit =>
		habit.title.toLowerCase().includes(filter.toLowerCase()) ||
		habit.shortDescription.toLowerCase().includes(filter.toLowerCase())
	);

	// Nouveau filtre : habits à faire aujourd'hui ou à venir
	const habitsToShow = todayOnly
		? filteredHabits.filter(isTodayHabit)
		: filteredHabits.filter(habit => !isTodayHabit(habit));

	// Sorting
	const sortedHabits = sortHabits(habitsToShow, sortBy);

	// Wrapper pour handleCompleteHabit qui recharge les données
	const handleCompleteHabitWithRefresh = async (habit: Habit, completed: boolean) => {
		try {
			await handleCompleteHabit(habit, completed);
			// Recharger les habitudes après la completion
			setRefreshKey(k => k + 1); // Force le rechargement
		} catch (error) {
			console.error("Error completing habit:", error);
		}
	};

	const getSortText = (sortType: string) => {
		switch (sortType) {
			case 'today': return 'Today\'s Habits';
			case 'upcoming': return 'Upcoming Habits';
			case 'priority': return 'Priority';
			case 'xp': return 'XP Reward';
			case 'difficulty': return 'Difficulty';
			case 'date': return 'Date';
			default: return 'Default';
		}
	};

	if (loading) {
		return (
			<details className="habit-list" open={isOpen} onToggle={handleToggle}>
				<summary className="accordion-title">Habits</summary>
				<div className="loading">Chargement des habitudes...</div>
			</details>
		);
	}

	if (error) {
		return (
			<details className="habit-list" open={isOpen} onToggle={handleToggle}>
				<summary className="accordion-title">Habits</summary>
				<div className="error">Erreur: {error}</div>
				<button onClick={loadHabits}>Réessayer</button>
			</details>
		);
	}

	return (
		<details
			className="habit-list"
			open={isOpen}
			onToggle={handleToggle}
		>
			<summary className="accordion-title">
				Habits ({sortedHabits.length})
			</summary>
			<div className="habit-controls">
				<input
					type="text"
					placeholder="Search habits..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					className="habit-search"
				/>
				<div className="habit-controls-row">
					<div className="habit-sort-dropdown">
						{/* <button className="habit-sort-button">
							Sort: {getSortText(sortBy)}
						</button>
						<div className="habit-sort-options">
							<button 
								className={`habit-sort-option ${sortBy === 'today' ? 'active' : ''}`}
								onClick={() => setSortBy('today')}
							>
								Today's Habits
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'upcoming' ? 'active' : ''}`}
								onClick={() => setSortBy('upcoming')}
							>
								Upcoming Habits
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'priority' ? 'active' : ''}`}
								onClick={() => setSortBy('priority')}
							>
								Priority
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'xp' ? 'active' : ''}`}
								onClick={() => setSortBy('xp')}
							>
								XP Reward
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'difficulty' ? 'active' : ''}`}
								onClick={() => setSortBy('difficulty')}
							>
								Difficulty
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'date' ? 'active' : ''}`}
								onClick={() => setSortBy('date')}
							>
								Date
							</button>
						</div> */}
					</div>
					<button
						className="habit-filter-toggle"
						onClick={() => setTodayOnly(v => !v)}
					>
						{todayOnly ? "Afficher à venir" : "Afficher aujourd'hui"}
					</button>
				</div>
			</div>

			{/* Bouton pour rafraîchir manuellement */}
			{/* <button onClick={loadHabits} className="refresh-button">
				🔄 Rafraîchir
			</button> */}

			{/* Indicateur du mode de tri actuel */}
			<div className="sort-indicator">
				{sortBy === 'today' && (
					<div className="sort-info">
						📅 Affichage des habitudes d'aujourd'hui ({sortedHabits.filter(isDueToday).length})
					</div>
				)}
				{sortBy === 'upcoming' && (
					<div className="sort-info">
						📆 Affichage des habitudes à venir ({sortedHabits.filter(h => !isDueToday(h)).length})
					</div>
				)}
			</div>

			{sortedHabits.length === 0 ? (
				<div className="no-habits-message">
					{filter ? "Aucune habitude ne correspond à votre recherche" : "Aucune habitude disponible"}
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

// Le composant HabitItem reste le même
const HabitItem = ({ 
	habit, 
	onComplete, 
	onModify,
	nextOccurrence 
}: { 
	habit: Habit, 
	onComplete: (habit: Habit, completed: boolean) => void, 
	onModify: (habit: Habit) => void,
	nextOccurrence: Date
}) => {
	const isEditable = !habit.isSystemHabit;
	const isDueTodayFlag = isDueToday(habit);
	const today = new Date();
	today.setHours(0,0,0,0);
	const nextDate = new Date(nextOccurrence);
	nextDate.setHours(0,0,0,0);
	const daysUntilNext = getDaysUntil(today, nextDate);

	// Vérifie si une date dans history correspond à aujourd'hui
	const hasHistoryToday = Array.isArray(habit.streak.history) && habit.streak.history.some(h => {
		if (!h.date) return false;
		const histDate = new Date(h.date);
		histDate.setHours(0,0,0,0);
		return histDate.getTime() === today.getTime();
	});

	// Désactive la checkbox si la prochaine occurrence est dans le futur ET qu'elle n'est pas cochée aujourd'hui ET qu'il n'y a pas d'entrée dans l'historique pour aujourd'hui
	const disableCheckbox = !isTodayHabit(habit);

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
					<span className={`habit-title ${habit.streak.isCompletedToday ? 'completed' : ''}`}> 
						{habit.title}
						{habit.isSystemHabit && <span className="habit-system-badge">System</span>}
					</span>
					{isEditable && (
						<button
							className="habit-edit-button"
							onClick={() => onModify(habit)}
							aria-label="Edit habit"
						>
							Edit
						</button>
					)}
				</div>
			</div>

			{habit.shortDescription && (
				<div className="habit-description">
					{habit.shortDescription}
				</div>
			)}

			<div className="habit-info-row">
				<div className="habit-streak">
					🔥 Streak: <b>{habit.streak.current}</b> (Best: {habit.streak.best})
				</div>
				<div className="habit-next-occurrence-text">
					{daysUntilNext === 0 || habit.streak.history.length === 0 || habit.streak.history.length === 1 && !habit.streak.history[0].success ? (
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

// -------------------------------------


function isHabitCompleted(habit: Habit): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const nextDate = new Date(getNextOccurrence(habit));
	nextDate.setHours(0, 0, 0, 0);

	if (nextDate.getTime() > today.getTime()) {


	}


	// Check if the habit is completed in the data (event if nextDate is in the future)
	if (habit.streak.isCompletedToday) {
		return true;
	}
	// check if there is a history entry and if today is in the history
	if (Array.isArray(habit.streak.history)) {
		
		today.setHours(0, 0, 0, 0);
		return habit.streak.history.some(h => {
			if (!h.date) return false;
			const histDate = new Date(h.date);
			histDate.setHours(0, 0, 0, 0);
			return histDate.getTime() === today.getTime() && !!h.success;
		}) ? true : false;
	}

	// check if there is recurrence and compare the last history entry with the habit.recurrence.unit and habit.recurrence.interval to know if the habit is completed
	if (
		habit.recurrence &&
		Array.isArray(habit.streak.history) &&
		(habit.streak.history as { date?: string | Date; success?: boolean }[]).length > 0
	) {
		// Find the latest date in history (not just the last entry)
		const historyArray = habit.streak.history as { date?: string | Date; success?: boolean }[];
		const historyDates = historyArray
			.filter(h => h.date)
			.map(h => new Date(h.date!));
		if (historyDates.length === 0) return false;
		const lastDate = new Date(Math.max(...historyDates.map(d => d.getTime())));
		lastDate.setHours(0, 0, 0, 0);

		// Calculate the expected next date by adding recurrence interval/unit to lastDate
		let expectedNextDate = new Date(lastDate);
		const { interval, unit } = habit.recurrence;
		switch (unit) {
			case 'days':
				expectedNextDate.setDate(expectedNextDate.getDate() + interval);
				break;
			case 'weeks':
				expectedNextDate.setDate(expectedNextDate.getDate() + interval * 7);
				break;
			case 'months':
				expectedNextDate.setMonth(expectedNextDate.getMonth() + interval);
				break;
			default:
				break;
		}
		expectedNextDate.setHours(0, 0, 0, 0);

		const nextDate = new Date(getNextOccurrence(habit));
		nextDate.setHours(0, 0, 0, 0);

		// Renvoie true si la prochaine occurrence attendue est aujourd'hui ou dans le passé (donc la tâche peut être considérée comme complétée)
		return lastDate.getTime() === nextDate.getTime();
	}
	return false;


}



// -------------------------------------

export function canEditHabit(habit: Habit): boolean {
    // Si c'est un habit système, il ne peut pas être modifié
    if (habit.isSystemHabit) {
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(habit.streak.nextDate);
    nextDate.setHours(0, 0, 0, 0);

    // Si nextDate est dans le futur, on ne peut pas modifier
    if (nextDate > today) {
        return false;
    }

    // Vérifier si l'entrée la plus ancienne dans l'historique respecte la récurrence
    if (habit.streak.history && habit.streak.history.length > 0) {
        // Trier l'historique par date (du plus ancien au plus récent)
        const sortedHistory = [...habit.streak.history].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        const oldestEntry = sortedHistory[0];
        const oldestDate = new Date(oldestEntry.date);
        oldestDate.setHours(0, 0, 0, 0);

        // Calculer la durée minimum requise selon la récurrence
        const minimumAgeInDays = getMinimumAgeInDays(habit.recurrence.interval, habit.recurrence.unit);
        
        // Calculer l'âge de l'entrée la plus ancienne en jours
        const ageInDays = Math.floor((today.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Si l'entrée la plus ancienne n'est pas assez ancienne, on ne peut pas modifier
        if (ageInDays < minimumAgeInDays) {
            return false;
        }
    }

    return true;
}
function getMinimumAgeInDays(interval: number, unit: 'days' | 'weeks' | 'months'): number {
    switch (unit) {
        case 'days':
            return interval;
        case 'weeks':
            return interval * 7;
        case 'months':
            return interval * 30; // Approximation de 30 jours par mois
        default:
            return interval;
    }
}


const getTodayHabitsOnly = async (plugin: any): Promise<Habit[]> => {
	const result = await loadTodayHabits(plugin);
	return result.todayHabits;
};

const normalizeAndSaveAllHabits = async (plugin: any): Promise<void> => {
	try {
		const rawHabits: Habit[] = await plugin.dataService.loadHabitsFromFile();
		const normalizedHabits = rawHabits.map(normalizeHabit);
		
		// Sauvegarder seulement si des changements ont été apportés
		const hasChanges = normalizedHabits.some((habit, index) => {
			const original = rawHabits[index];
			return (
				habit.streak.isCompletedToday !== original.streak.isCompletedToday ||
				habit.streak.nextDate.getTime() !== new Date(original.streak.nextDate).getTime()
			);
		});

		if (hasChanges) {
			await plugin.dataService.saveHabitsToFile(normalizedHabits);
			console.log("Habits normalized and saved");
		}
	} catch (error) {
		console.error("Error normalizing habits:", error);
		throw new Error("Failed to normalize habits");
	}
};

const useTodayHabits = (plugin: any, refreshInterval?: number) => {
	const [habitsData, setHabitsData] = React.useState<{
		allHabits: Habit[];
		todayHabits: Habit[];
		completedToday: Habit[];
		pendingToday: Habit[];
		stats: any;
	} | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	const loadHabits = React.useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await loadTodayHabits(plugin);
			setHabitsData(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	}, [plugin]);

	React.useEffect(() => {
		loadHabits();
		
		// Rafraîchissement automatique si spécifié
		if (refreshInterval && refreshInterval > 0) {
			const interval = setInterval(loadHabits, refreshInterval);
			return () => clearInterval(interval);
		}
	}, [loadHabits, refreshInterval]);

	return {
		...habitsData,
		loading,
		error,
		refresh: loadHabits
	};
};

// Helper to check if habit is due today or has a history entry for today
function isTodayHabit(habit: Habit): boolean {
    const today = new Date();
    today.setHours(0,0,0,0);
    // Check nextDate
    const nextDate = new Date(getNextOccurrence(habit));
    nextDate.setHours(0,0,0,0);
    if (nextDate.getTime() === today.getTime()) return true;
	if (habit.streak.history.length === 0) return true;
	if (habit.streak.history.length === 1 && !habit.streak.history[0].success ) return true;
    // Check history
    if (Array.isArray(habit.streak.history)) {
        for (const h of habit.streak.history) {
            if (!h.date) continue;
            const histDate = new Date(h.date);
            histDate.setHours(0,0,0,0);
            if (histDate.getTime() === today.getTime()) return true;
        }
    }
    return false;
}


export { 
	loadTodayHabits, 
	getTodayHabitsOnly, 
	normalizeAndSaveAllHabits,
	useTodayHabits,
	getNextOccurrence,
	isDueToday,
	isCompletedToday,
	normalizeHabit
};


export function HabitSideView_old (props: {
	habits: Habit[],
	filteredHabits: Habit[],
	isOpen: boolean,
	filter: string,
	activeTab: 'active' | 'completed' | 'all',
	handleToggle: (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => void,
	handleCompleteHabit: (habit: Habit, completed: boolean) => void,
	setFilter: (value: string) => void,
	setActiveTab: (tab: 'active' | 'completed' | 'all') => void,
	setSortBy: (sortBy: 'priority' | 'xp' | 'difficulty' | 'date') => void,
	sortBy: 'priority' | 'xp' | 'difficulty' | 'date',
	handleModifyHabit: (habit: Habit) => void
}) {
	const {
		habits,
		filteredHabits,
		isOpen,
		filter,
		activeTab,
		handleToggle,
		handleCompleteHabit,
		setFilter,
		setActiveTab,
		setSortBy,
		sortBy,
		handleModifyHabit
	} = props;

	// // Filtrer les habitudes en fonction de l'onglet actif
	// const getFilteredHabits = () => {
	// 	return filteredHabits.filter(habit => {
	// 		const isDue = isDueToday(habit);
	// 		switch (activeTab) {
	// 			case 'active':
	// 				return isDue && !habit.streak.isCompletedToday;
	// 			case 'completed':
	// 				return habit.streak.isCompletedToday;
	// 			case 'all':
	// 				return true;
	// 			default:
	// 				return true;
	// 		}
	// 	});
	// };

	// const displayHabits = getFilteredHabits();

	// Version simple
	// const todayHabits = await getTodayHabitsOnly(plugin);

	// // Version complète avec stats
	// const {
	// allHabits,
	// todayHabits,
	// completedToday,
	// pendingToday,
	// stats
	// } = await loadTodayHabits(plugin);

	// // Avec le hook React
	// const {
	// todayHabits,
	// stats,
	// loading,
	// error,
	// refresh
	// } = useTodayHabits(plugin, 60000); // Refresh toutes les minutes

	React.useEffect(() => {
		const initializeHabits = async () => {
			try {
			// Normaliser d'abord
			// await normalizeAndSaveAllHabits(plugin);
			
			// // Puis charger
			// const data = await loadTodayHabits(plugin);
			// setHabits(data.todayHabits);
			} catch (error) {
			console.error("Failed to load habits:", error);
			}
		};
		
		initializeHabits();
	}, []);
	return (
		<details
			className="habit-list" 
			open={isOpen}
			onToggle={handleToggle}
		>
			<summary className="accordion-title">Habits</summary>
			<div className="habit-controls">
				<input
					type="text"
					placeholder="Search habits..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					className="habit-search"
				/>
				<div className="habit-controls-row">
					<div className="habit-sort-dropdown">
						<button className="habit-sort-button">
							Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
						</button>
						<div className="habit-sort-options">
							<button 
								className={`habit-sort-option ${sortBy === 'priority' ? 'active' : ''}`}
								onClick={() => setSortBy('priority')}
							>
								Priority
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'xp' ? 'active' : ''}`}
								onClick={() => setSortBy('xp')}
							>
								XP Reward
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'difficulty' ? 'active' : ''}`}
								onClick={() => setSortBy('difficulty')}
							>
								Difficulty
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'date' ? 'active' : ''}`}
								onClick={() => setSortBy('date')}
							>
								Date
							</button>
						</div>
					</div>
				</div>
			</div>
			<CalendarView 
				habits={habits}
				onCompleteHabit={handleCompleteHabit}
			/>
			{habits.length === 0 ? (
				<div className="no-habits-message">
					{filter ? "No habits match your search" : "No habits available"}
				</div>
			) : (
				<div className="habits-container">
					{habits.map((habit) => (
						<HabitItem
							key={habit.id}
							habit={habit}
							onComplete={handleCompleteHabit}
							onModify={handleModifyHabit}
							nextOccurrence={getNextOccurrence(habit)}
						/>
					))}
				</div>
			)}
		</details>
	);
}

const HabitItem_old = ({ 
	habit, 
	onComplete, 
	onModify,
	nextOccurrence 
}: { 
	habit: Habit, 
	onComplete: (habit: Habit, completed: boolean) => void, 
	onModify: (habit: Habit) => void,
	nextOccurrence: Date
}) => {
	const isEditable = !habit.streak.isCompletedToday && !habit.isSystemHabit;
	const isDueToday = new Date().toDateString() === nextOccurrence.toDateString();

	return (
		<div className="habit-item">
			<div className="habit-header">
				<div className="habit-checkbox-section">
					<input
						type="checkbox"
						checked={habit.streak.isCompletedToday}
						onChange={() => onComplete(habit, !habit.streak.isCompletedToday)}
						className="habit-checkbox"
						// disabled={!isDueToday}
					/>
					<span className={`habit-title ${habit.streak.isCompletedToday ? 'completed' : ''}`}>
						{habit.title}
						{habit.isSystemHabit && <span className="habit-system-badge">System</span>}
					</span>
					{isEditable && (
						<button
							className="habit-edit-button"
							onClick={() => onModify(habit)}
							aria-label="Edit habit"
						>
							Edit
						</button>
					)}
				</div>
			</div>
			{habit.shortDescription && (
				<div className="habit-description">
					{habit.shortDescription}
				</div>
			)}
			{/* <div className="habit-info">
				<div className="habit-xp">
					XP: {habit.reward?.XP || 0}
				</div>
				<div className="habit-streak">
					Streak: {habit.streak.current}/{habit.streak.best}
				</div>
				{!isDueToday && (
					<div className="habit-next-occurrence">
						Next: {nextOccurrence.toLocaleDateString()}
					</div>
				)}
			</div> */}
		</div>
	);
}

// export function HabitSideView_test (props: {
// 	habits: Habit[],
// 	filteredHabits: Habit[],
// 	isOpen: boolean,
// 	filter: string,
// 	activeTab: 'active' | 'completed' | 'all',
// 	handleToggle: (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => void,
// 	handleCompleteHabit: (habit: Habit, completed: boolean) => void,
// 	setFilter: (value: string) => void,
// 	setActiveTab: (tab: 'active' | 'completed' | 'all') => void,
// 	setSortBy: (sortBy: 'priority' | 'xp' | 'difficulty' | 'date') => void,
// 	sortBy: 'priority' | 'xp' | 'difficulty' | 'date',
// 	handleModifyHabit: (habit: Habit) => void
// }) {
// 	const {
// 		habits,
// 		filteredHabits,
// 		isOpen,
// 		filter,
// 		activeTab,
// 		handleToggle,
// 		handleCompleteHabit,
// 		setFilter,
// 		setActiveTab,
// 		setSortBy,
// 		sortBy,
// 		handleModifyHabit
// 	} = props;

// 	return (
// 		<details className="habit-list" open={isOpen} onToggle={handleToggle}>
// 			<summary>Habits</summary>
// 			<div className="habit-controls">
// 				<input
// 					type="text"
// 					value={filter}
// 					onChange={(e) => setFilter(e.target.value)}
// 					placeholder="Filter habits..."
// 				/>
// 				<button onClick={() => setActiveTab('active')}>Active</button>
// 				<button onClick={() => setActiveTab('completed')}>Completed</button>
// 				<button onClick={() => setActiveTab('all')}>All</button>
// 				<select onChange={(e) => setSortBy(e.target.value as any)} value={sortBy}>
// 					<option value="priority">Priority</option>
// 					<option value="xp">XP</option>
// 					<option value="difficulty">Difficulty</option>
// 					<option value="date">Date</option>
// 				</select>
// 			</div>
// 			<ul className="habit-list-items">
// 				{filteredHabits.map((habit) => (
// 					<li key={habit.id}>
// 						<span>{habit.title}</span>
// 						<button onClick={() => handleCompleteHabit(habit, !habit.isCompleted)}>
// 							{habit.isCompleted ? "
// 							Mark Incomplete" : "Mark Complete"}
// 							{habit.isCompleted ? " (Completed)" : " (Active)"}
// 						</button>
// 						<button onClick={() => handleModifyHabit(habit)}>Modify</button>
// 					</li>
// 				))}
// 			</ul>
// 		</details>
// 	);
// }
