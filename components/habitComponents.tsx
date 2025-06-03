import { useState, useEffect, use } from 'react';
import { useAppContext } from '../context/appContext';
import { Notice } from 'obsidian';
import { Habit } from '../constants/DEFAULT';
import { HabitSideView } from './habitUI';
import { ModifyHabitModal } from '../modales/habitModal';

export const HabitList = () => {
	const { plugin, updateXP } = useAppContext();
	const [habits, setHabits] = useState<Habit[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState('');
	const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
	const [sortBy, setSortBy] = useState<'priority' | 'xp' | 'difficulty' | 'date'>('priority');
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
			await plugin.habitService.handleCompleteHabit(
				habit,
				plugin,
				setHabits,
				setError,
				updateXP,
				completed,
				date
			);
		} catch (error) {
			console.error("Error completing habit:", error);
			setError("Failed to update habit status");
		}
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
				habits={habits}
				filteredHabits={filteredHabits}
				isOpen={isOpen}
				filter={filter}
				activeTab={activeTab}
				handleToggle={handleToggle}
				handleCompleteHabit={handleCompleteHabit}
				setFilter={setFilter}
				setActiveTab={setActiveTab}
				setSortBy={setSortBy}
				sortBy={sortBy}
				handleModifyHabit={handleModifyHabit}
			/>
		</div>
	);
}
