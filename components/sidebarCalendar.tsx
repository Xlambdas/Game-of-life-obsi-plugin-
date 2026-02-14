import React, { use, useCallback, useEffect, useState } from 'react';
import { AppContextService } from 'context/appContextService';
import { App, Modal, Notice } from 'obsidian';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// From file (Default, Helpers):
import { Habit, UserSettings } from 'data/DEFAULT';
import { DateHelper, DateString } from 'helpers/dateHelpers';
// From file UI :
import { HabitListDateModal } from 'modal/habitListModal';
import { useAppContext } from 'context/appContext';

interface SidebarCalendarProps {
	habits: Habit[];
	onUserUpdate: (updatedUser: UserSettings) => void;
	onHabitsUpdate: (updatedHabits: Habit[]) => void;
}

export const SidebarCalendar: React.FC<SidebarCalendarProps> = ({
	habits,
	onUserUpdate,
	onHabitsUpdate
}) => {
	const appService = useAppContext();
	const habitService = appService.habitService;

	const [habitState, setHabitState] = useState<Habit[]>(habits);
	const [currentDate, setCurrentDate] = useState<DateString>(DateHelper.today());
	const [selectedDate, setSelectedDate] = useState<DateString | null>(null);
	// const [monthData, setMonthData] = useState<MonthData>({});

	const [dateHabit, setDateHabit] = useState<{
		habitID: string;
		habitTitle: string;
		completed: boolean;
		couldBeCompleted: boolean;
		freezeUsed?: boolean;
	}[]>([]);

	useEffect(() => {
		setHabitState(habits);
	}, [habits]);

	useEffect(() => {
		const refreshAllHabits = async () => {
			/* Refresh all habits to update their streaks and next dates */
			const refreshedHabits = await Promise.all(
				habits.map(habit => habitService.refreshHabits(habit))
			);
			setHabitState(refreshedHabits);
			await appService.dataService.saveAllHabits(refreshedHabits);
		};
		refreshAllHabits();
	}, []);

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

	const handlePrevMonth = () => {
		setCurrentDate(DateHelper.addInterval(currentDate, -1, 'months'));
	};

	const handleNextMonth = () => {
		setCurrentDate(DateHelper.addInterval(currentDate, 1, 'months'));
	};

	const renderCalendar = () => {
		const { daysInMonth, startingDayOfWeek: firstDay } = getDaysInMonth(currentDate);
		const days: React.ReactNode[] = [];
		const today = DateHelper.today();

		// Add empty cells before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(
				<div key={`empty-${i}`} className="calendar-day empty"></div>
			);
		}

		// Add day numbers
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(day);
		}

		return days.map((day, index) => {
			if (typeof day !== "number") {
				return day;
			}

			const year = new Date(currentDate).getFullYear();
			const month = new Date(currentDate).getMonth() + 1;
			const dateStr = DateHelper.formatDateString(year, month, day);

			// if (day===14) console.error("dateStr:", dateStr);
			const habitsForDay = habitState.filter(h =>
				habitService.couldBeCompletedOnDate(h, dateStr)
			);
			// if (day===14) console.log("habitsForDay:", habitsForDay);

			const isSelectedDay = selectedDate === dateStr;
			const isTodayDay = dateStr === today;
			const isFuture = dateStr > today;

			const completedCount = habitsForDay.filter(h =>
				habitService.isCompleted(h, dateStr)
			).length;

			// if (day===14) console.log("completedCount:", completedCount);


			const totalCount = habitsForDay.length;
			const allCompleted = totalCount > 0 && completedCount === totalCount;
			const partiallyCompleted =
				completedCount > 0 && completedCount < totalCount;

			return (
				<button
					key={index}
					onClick={async () => {
						if (!isFuture) {
							await handleDateClick(day);
						}
					}}
					disabled={isFuture}
					className={`calendar-day
						${isSelectedDay ? "selected" : ""}
						${habitsForDay.length > 0 ? "has-habits" : ""}
						${isTodayDay ? "today" : ""}
						${isFuture ? "future" : ""}
						${allCompleted ? "all-completed" : ""}
						${partiallyCompleted ? "partial-completed" : ""}
					`}
					title={
						habitsForDay.length > 0
							? `${completedCount}/${totalCount} habits completed`
							: ""
					}
				>
					<span className="day-number">{day}</span>
				</button>
			);
		});
	};

	const getCompletedCount = () => {
		if (!selectedDate) return 0;
		return habits.filter(h =>
        habitService.couldBeCompletedOnDate(h, selectedDate) &&
        habitService.isCompleted(h, selectedDate)
    ).length;
	};

	const handleDateClick = async (day: number) => {
		// console.error("<------> start, handleDateClick for day:", day);
		const newDate = DateHelper.formatDateString(new Date(currentDate).getFullYear(), new Date(currentDate).getMonth() + 1, day);
		setSelectedDate(newDate);
		// console.log("newdate:", newDate);
		const result = await habitService.pairDateHabit(newDate);
		setDateHabit(result);
		// console.log("result:", result);

		const modalToggleHabitCompletion = async (habitId: string, dateStr: DateString) => {
			// update on a deeper level to avoid stale state issues
			const freshHabits = await appService.dataService.getHabits();
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
				onHabitsUpdate,
				onUserUpdate
			);

		};
		new HabitListDateModal(appService.getApp(), appService, newDate, result, modalToggleHabitCompletion).open();
	};

	return (
		<div className="calendar-container">
			<div className="calendar-header">
				<button onClick={handlePrevMonth} className="calendar-nav-btn">
					<ChevronLeft size={14} />
				</button>
				<span className="calendar-month">
					{currentDate && new Date(currentDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
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
				{renderCalendar()}
			</div>

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
