import React, { use, useCallback, useEffect, useState } from 'react';
import { AppContextService } from 'context/appContextService';
import { App, Modal, Notice } from 'obsidian';
import { ChevronLeft, ChevronRight, Circle, Check, Flame, Zap } from 'lucide-react';
// From file (Default, Helpers):
import { Habit } from 'data/DEFAULT';
import { DateHelper, DateString } from 'helpers/dateHelpers';
// From file UI :
import { HabitListDateModal } from 'modal/habitListModal';

interface SidebarCalendarProps {
	app: App;
	context: AppContextService;
	habits: Habit[];
	onHabitsUpdate: (updatedHabits: Habit[]) => void;
}

export const SidebarCalendar: React.FC<SidebarCalendarProps> = ({
	app,
	context,
	habits,
	onHabitsUpdate
}) => {
	const habitService = context.habitService;
	const [selectedDate, setSelectedDate] = useState<DateString | null>(null);
	const [dateHabit, setDateHabit] = useState<{
		habitID: string;
		habitTitle: string;
		completed: boolean;
		couldBeCompleted: boolean
	}[]>([]);
	const [habitState, setHabitState] = useState<Habit[]>(habits);
	const [currentDate, setCurrentDate] = useState<DateString>(DateHelper.today());

	useEffect(() => {
		const refreshAllHabits = async () => {
			/* Refresh all habits to update their streaks and next dates */
			const refreshedHabits = await Promise.all(habitState.map(habit => habitService.refreshHabits(habit)));
			setHabitState(refreshedHabits);
			await context.dataService.saveAllHabits(refreshedHabits);
		};
		refreshAllHabits();
	}, []);

	useEffect(() => {
		setHabitState(habits);
	}, [habits]);

	useEffect(() => {
		if (!selectedDate) return;
		(async () => {
			const result = await habitService.pairDateHabit(selectedDate);
			setDateHabit(result);
		})();
	}, [selectedDate, habitState]);

	// ------------------
	// Calendar Helpers :
	const getDaysInMonth = (dateStr: DateString): { daysInMonth: number; startingDayOfWeek: number } => {
		const date = new Date(dateStr);
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = firstDay.getDay();

		return { daysInMonth, startingDayOfWeek };
	};

	const isToday = (day: number): boolean => {
		const today = DateHelper.today();
		return (
			day === new Date(today).getDate() &&
			new Date(currentDate).getMonth() === new Date(today).getMonth() &&
			new Date(currentDate).getFullYear() === new Date(today).getFullYear()
		);
	};

	const isSelected = (day: number): boolean => {
		if (!selectedDate) return false;
		const selectedDateObj = new Date(selectedDate);
		return day === selectedDateObj.getDate() &&
			new Date(currentDate).getMonth() === selectedDateObj.getMonth() &&
			new Date(currentDate).getFullYear() === selectedDateObj.getFullYear();
	};

	const handlePrevMonth = () => {
		setCurrentDate(DateHelper.addInterval(currentDate, -1, 'months'));
	};

	const handleNextMonth = () => {
		setCurrentDate(DateHelper.addInterval(currentDate, 1, 'months'));
	};

	const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
	const monthName = new Date(currentDate).toLocaleString('default', { month: 'long' });
	const year = new Date(currentDate).getFullYear();

	const days = [];
	for (let i = 0; i < startingDayOfWeek; i++) {
		days.push(<div key={`empty-${i}`} className="h-7" />);
	}
	for (let day = 1; day <= daysInMonth; day++) {
		days.push(day);
	}

	const getCompletedCount = () => {
		if (!selectedDate) return 0;
		return dateHabit.filter(h => h.completed).length;
	};


	// ----------------------------------------
	// method for habit completion toggling :
	const toggleHabitCompletion = async (habitId: string, dateStr: DateString) => {
		if (!dateStr) return;
		// console.log("<><><><><><>Toggling habit completion for habitId:", habitId, "on date:", dateStr);
		const habit = habitState.find(h => h.id === habitId);
		if (!habit) {
			console.warn("Habit not found for id:", habitId);
			return;
		}
		await habitService.handleCheckbox(
			habit,
			habitState,
			habitService.isCompleted(habit, dateStr),
			dateStr,
			setHabitState,
			onHabitsUpdate
		);
		if (selectedDate === dateStr) {
			const updatedResult = await habitService.pairDateHabit(dateStr);
			setDateHabit(updatedResult);
		}
	};

	const handleDateClick = async (day: number) => {
		// console.log("<------> start, handleDateClick for day:", day);
		const newDate = DateHelper.formatDateString(new Date(currentDate).getFullYear(), new Date(currentDate).getMonth() + 1, day);
		setSelectedDate(newDate);
		console.log("newdate:", newDate);
		const result = await habitService.pairDateHabit(newDate);
		setDateHabit(result);
		console.log("result:", result);

		const modalToggleHabitCompletion = async (habitId: string, dateStr: DateString) => {
			// update on a deeper level to avoid stale state issues
			const freshHabits = await context.dataService.getHabits();
			const freshHabitsArray = Object.values(freshHabits) as Habit[];

			const habit = freshHabitsArray.find(h => h.id === habitId);
			if (!habit) {
				console.warn("❌ Habit not found for id:", habitId);
				return;
			}
			const currentStatus = habitService.isCompleted(habit, dateStr);
			// Be sure to update the local state as well
			await habitService.handleCheckbox(
				habit,
				freshHabitsArray,
				currentStatus,
				dateStr,
				setHabitState,
				onHabitsUpdate
			);
		};
		new HabitListDateModal(app, context, newDate, result, modalToggleHabitCompletion).open();
	};


	// For second version of the calendar with inline habit list :
	const isHabitCompleted = (habitID: string) => {
		if (!selectedDate) return false;
		const habitData = habitState.find(h => h.id === habitID);
		if (!habitData) return false;
		return habitService.isCompleted(habitData as Habit, selectedDate);
	};

	return (
		<div className="calendar-container">
			<div className="calendar-header">
				<button onClick={handlePrevMonth} className="calendar-nav-btn">
					<ChevronLeft size={14} />
				</button>
				<span className="calendar-month">
					{monthName} {year}
				</span>
				<button onClick={handleNextMonth} className="calendar-nav-btn">
					<ChevronRight size={14} />
				</button>
			</div>

			<div className="calendar-weekdays">
				{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
					<div key={i} className="calendar-weekday">{day}</div>
				))}
			</div>

			<div className="calendar-grid">
				{days.map((day, index) => {
					if (typeof day !== 'number') {
						return day;
					}
					const date = DateHelper.formatDateString(new Date(currentDate).getFullYear(), new Date(currentDate).getMonth() + 1, day);
					const isTodayDate = isToday(day);
					const isSelectedDate = isSelected(day);

					return (
						<button
							key={index}
							onClick={async () => {
								await handleDateClick(day)
							}}
							className={`
								calendar-day
								${isTodayDate ? 'today' : ''}
								${isSelectedDate ? 'selected' : ''}
							`}
						>
							{day}
						</button>
					);
				})}
			</div>

			{1>=2 && selectedDate && dateHabit.length > 0 && (
				<div className="calendar-habit-list">
					<h4 className="calendar-habit-list-title">
						Habits for {selectedDate}
					</h4>
					<ul className="calendar-habit-items">
						{dateHabit.map((habit) => (
							<li key={habit.habitID} className="calendar-habit-item">
								<button
									onClick={() => toggleHabitCompletion(habit.habitID, selectedDate)}
									className="habit-completion-btn"
								>
									{isHabitCompleted(habit.habitID) ? (
										<Check size={16} color="green" />
									) : (
										<Circle size={16} color="gray" />
									)}
								</button>
								<span className={habit.completed ? 'habit-completed' : ''}>
									{habit.habitTitle}
								</span>
							</li>
						))}
					</ul>
				</div>
			)}

			<div className="calendar-footer">
				<span>Click to mark</span>
				<span className="calendar-count">
					<div className="calendar-count-dot" />
					{getCompletedCount()} completed
				</span>
			</div>
		</div>
	);
}







