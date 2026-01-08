import React, { use, useCallback, useEffect, useState } from 'react';
import { AppContextService } from 'context/appContextService';
import { App, Modal, Notice } from 'obsidian';
import { ChevronLeft, ChevronRight, Circle, Check, Flame, Zap } from 'lucide-react';
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

type DayStatus = {
    date: DateString;
    habits: Habit[];
    completedCount: number;
    totalCount: number;
};
type MonthData = Record<DateString, DayStatus>;

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
	const [monthData, setMonthData] = useState<MonthData>({});

	const [dateHabit, setDateHabit] = useState<{
		habitID: string;
		habitTitle: string;
		completed: boolean;
		couldBeCompleted: boolean
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

	const getFirstDayOfMonth = (date: DateString) => {
		const dateObj = new Date(date);
        return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getDay();
    };

	const getHabitsForDate_old = (date: DateString) => {
        return habits.filter(habit => habitService.couldBeCompletedOnDate(habit, date));
    };

	const getHabitsForDate = (date: DateString) => {
    return habitState.filter(habit => {
        // Vérifier si la date existe dans l'historique de l'habitude
        const historyEntry = habit.streak.history.find(
            h => DateHelper.toDateString(h.date) === date
        );
        // La date doit exister dans l'historique pour être considérée comme "validable"
        return historyEntry !== undefined;
    });
};


	const renderCalendar_old = async () => {
		const daysInMonth = getDaysInMonth(currentDate).daysInMonth;
		const firstDay = getFirstDayOfMonth(currentDate);
		const days = [];
		const today = DateHelper.today();

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
		}

		// Add day numbers
		for (let day = 1; day <= daysInMonth; day++) {
			const dateStr = DateHelper.formatDateString(
				new Date(currentDate).getFullYear(),
				new Date(currentDate).getMonth() + 1,
				day
			);

			const habitsForDay = getHabitsForDate(dateStr);

			days.push(day);
		}

		return days.map((day, index) => {
			if (typeof day !== 'number') {
				return day;
			}

			const newDate = DateHelper.formatDateString(new Date(currentDate).getFullYear(), new Date(currentDate).getMonth() + 1, day);
			setSelectedDate(newDate);
			// console.log("newdate:", newDate);
			// const result = habitService.pairDateHabit(newDate);
			// setDateHabit(result);
			// console.log("result:", result);

			const dateStr = DateHelper.formatDateString(
				new Date(currentDate).getFullYear(),
				new Date(currentDate).getMonth() + 1,
				day
			);
			
			const habitsForDay = getHabitsForDate(dateStr);
			const isSelected = selectedDate === dateStr;
			const isToday = dateStr === today;
			const isFuture = dateStr > today;

			// Calculate completion status for the day
			const completedCount = habitsForDay.filter(h => habitService.isCompleted(h, dateStr)).length;
			const totalCount = habitsForDay.length;
			const allCompleted = totalCount > 0 && completedCount === totalCount;
			const partiallyCompleted = completedCount > 0 && completedCount < totalCount;

			return (
				<button
					key={index}
					onClick={async () => {
						if (!isFuture) {
							await handleDateClick(day);
						}
					}}
					disabled={isFuture}
					className={`
						calendar-day
						${isSelected ? 'selected' : ''}
						${habitsForDay.length > 0 ? 'has-habits' : ''}
						${isToday ? 'today' : ''}
						${isFuture ? 'future' : ''}
						${allCompleted ? 'all-completed' : ''}
						${partiallyCompleted ? 'partial-completed' : ''}
					`}
					title={habitsForDay.length > 0 ? `${completedCount}/${totalCount} habits completed` : ''}
				>
					<span className="day-number">{day}</span>
					{/* {habitsForDay.length > 0 && (
						<span className="habits-indicator">
							{completedCount}/{totalCount}
						</span>
					)} */}
				</button>
			);
		});
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

	// const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
	// const monthName = new Date(currentDate).toLocaleString('default', { month: 'long' });
	// const year = new Date(currentDate).getFullYear();

	// const days = [];
	// for (let i = 0; i < startingDayOfWeek; i++) {
	// 	days.push(<div key={`empty-${i}`} className="h-7" />);
	// }
	// for (let day = 1; day <= daysInMonth; day++) {
	// 	days.push(day);
	// }

	const getCompletedCount = () => {
		if (!selectedDate) return 0;
		return habits.filter(h =>
        habitService.couldBeCompletedOnDate(h, selectedDate) &&
        habitService.isCompleted(h, selectedDate)
    ).length;
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
		console.error("<------> start, handleDateClick for day:", day);
		const newDate = DateHelper.formatDateString(new Date(currentDate).getFullYear(), new Date(currentDate).getMonth() + 1, day);
		setSelectedDate(newDate);
		console.log("newdate:", newDate);
		const result = await habitService.pairDateHabit(newDate);
		setDateHabit(result);
		console.log("result:", result);

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
				{/* {days.map((day, index) => {
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
				})} */}
			</div>

			{/* {selectedDate && dateHabit.length > 0 && (
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
			)} */}

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

interface SidebarCalendarProps_old {
	app: App;
	context: AppContextService;
	habits: Habit[];
	onHabitsUpdate: (updatedHabits: Habit[]) => void;
}

export const SidebarCalendar_new: React.FC<SidebarCalendarProps_old> = ({
  app,
  context,
  habits,
  onHabitsUpdate
}) => {
  const habitService = context.habitService;

  const [habitState, setHabitState] = useState<Habit[]>(habits);
  const [currentDate, setCurrentDate] = useState<DateString>(DateHelper.today());
  const [selectedDate, setSelectedDate] = useState<DateString | null>(null);
  const [monthData, setMonthData] = useState<MonthData>({});
  const [dateHabit, setDateHabit] = useState<{
    habitID: string;
    habitTitle: string;
    completed: boolean;
    couldBeCompleted: boolean;
  }[]>([]);

  // Sync avec props si le parent change les habits
  useEffect(() => {
    setHabitState(habits);
  }, [habits]);

  // Au montage : rafraîchir les habits (streaks, next dates, etc.)
  useEffect(() => {
    const refreshAllHabits = async () => {
      const refreshedHabits = await Promise.all(
        habits.map(habit => habitService.refreshHabits(habit))
      );
      setHabitState(refreshedHabits);
      await context.dataService.saveAllHabits(refreshedHabits);
    };
    refreshAllHabits();
  }, []);

  // Helpers calendrier
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

  const buildMonthData = () => {
    const result: MonthData = {};

    const dateObj = new Date(currentDate);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;

    const { daysInMonth } = getDaysInMonth(currentDate);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = DateHelper.formatDateString(year, month, day);

      const habitsForDay = habitState.filter(h =>
        habitService.couldBeCompletedOnDate(h, dateStr)
      );

      const completedCount = habitsForDay.filter(h =>
        habitService.isCompleted(h, dateStr)
      ).length;

      result[dateStr] = {
        date: dateStr,
        habits: habitsForDay,
        completedCount,
        totalCount: habitsForDay.length
      };
    }

    setMonthData(result);
  };

  // Recalculer le mois quand currentDate ou habitState change
  useEffect(() => {
    buildMonthData();
  }, [currentDate, habitState]);

  const handlePrevMonth = () => {
    setCurrentDate(DateHelper.addInterval(currentDate, -1, 'months'));
    setSelectedDate(null);
    setDateHabit([]);
  };

  const handleNextMonth = () => {
    setCurrentDate(DateHelper.addInterval(currentDate, 1, 'months'));
    setSelectedDate(null);
    setDateHabit([]);
  };

  // Cliquer sur un jour
  const handleDateClick = async (day: number) => {
    const dateObj = new Date(currentDate);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const newDate = DateHelper.formatDateString(year, month, day);

    setSelectedDate(newDate);

    const result = await habitService.pairDateHabit(newDate);
    setDateHabit(result);

    const modalToggleHabitCompletion = async (habitId: string, dateStr: DateString) => {
      const freshHabits = await context.dataService.getHabits();
      const freshHabitsArray = Object.values(freshHabits) as Habit[];

      const habit = freshHabitsArray.find(h => h.id === habitId);
      if (!habit) {
        console.warn("Habit not found for id:", habitId);
        return;
      }

      const currentStatus = habitService.isCompleted(habit, dateStr);
      await habitService.handleCheckbox(
        habit,
        freshHabitsArray,
        currentStatus,
        dateStr,
        setHabitState,
        onHabitsUpdate
      );

      // Recalcul du jour dans monthData
      const habitsForDay = freshHabitsArray.filter(h =>
        habitService.couldBeCompletedOnDate(h, dateStr)
      );
      const completedCount = habitsForDay.filter(h =>
        habitService.isCompleted(h, dateStr)
      ).length;

      setMonthData(prev => ({
        ...prev,
        [dateStr]: {
          date: dateStr,
          habits: habitsForDay,
          completedCount,
          totalCount: habitsForDay.length
        }
      }));

      if (selectedDate === dateStr) {
        const updatedResult = await habitService.pairDateHabit(dateStr);
        setDateHabit(updatedResult);
      }
    };

    new HabitListDateModal(app, context, newDate, result, modalToggleHabitCompletion).open();
  };

  const toggleHabitCompletionInline = async (habitId: string, dateStr: DateString) => {
    if (!dateStr) return;
    const habit = habitState.find(h => h.id === habitId);
    if (!habit) return;

    await habitService.handleCheckbox(
      habit,
      habitState,
      habitService.isCompleted(habit, dateStr),
      dateStr,
      setHabitState,
      onHabitsUpdate
    );

    // Recalculer le jour dans monthData
    const habitsForDay = habitState.filter(h =>
      habitService.couldBeCompletedOnDate(h, dateStr)
    );
    const completedCount = habitsForDay.filter(h =>
      habitService.isCompleted(h, dateStr)
    ).length;

    setMonthData(prev => ({
      ...prev,
      [dateStr]: {
        date: dateStr,
        habits: habitsForDay,
        completedCount,
        totalCount: habitsForDay.length
      }
    }));

    if (selectedDate === dateStr) {
      const updatedResult = await habitService.pairDateHabit(dateStr);
      setDateHabit(updatedResult);
    }
  };

  const isHabitCompleted = (habitID: string) => {
    if (!selectedDate) return false;
    const habitData = habitState.find(h => h.id === habitID);
    if (!habitData) return false;
    return habitService.isCompleted(habitData, selectedDate);
  };

  const getCompletedCount = () => {
    if (!selectedDate) return 0;
    const status = monthData[selectedDate];
    if (!status) return 0;
    return status.completedCount;
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek: firstDay } = getDaysInMonth(currentDate);
    const days: React.ReactNode[] = [];
    const today = DateHelper.today();

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days.map((day, index) => {
      if (typeof day !== 'number') return day;

      const year = new Date(currentDate).getFullYear();
      const month = new Date(currentDate).getMonth() + 1;
      const dateStr = DateHelper.formatDateString(year, month, day);
      const isTodayDay = dateStr === today;
      const isFuture = new Date(dateStr) > new Date(today);
      const isSelectedDay = selectedDate === dateStr;

      const status = monthData[dateStr];
      const hasHabits = status && status.totalCount > 0;
      const allCompleted = hasHabits && status.completedCount === status.totalCount;
      const partiallyCompleted =
        hasHabits &&
        status.completedCount > 0 &&
        status.completedCount < status.totalCount;

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
            ${isSelectedDay ? 'selected' : ''}
            ${hasHabits ? 'has-habits' : ''}
            ${isTodayDay ? 'today' : ''}
            ${isFuture ? 'future' : ''}
            ${allCompleted ? 'all-completed' : ''}
            ${partiallyCompleted ? 'partial-completed' : ''}
          `}
          title={
            hasHabits
              ? `${status.completedCount}/${status.totalCount} habits completed`
              : ''
          }
        >
          <span className="day-number">{day}</span>
        </button>
      );
    });
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="calendar-nav-btn">
          <ChevronLeft size={14} />
        </button>
        <span className="calendar-month">
          {currentDate &&
            new Date(currentDate).toLocaleString('default', {
              month: 'long',
              year: 'numeric'
            })}
        </span>
        <button onClick={handleNextMonth} className="calendar-nav-btn">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {renderCalendar()}
      </div>

      {selectedDate && dateHabit.length > 0 && (
        <div className="calendar-habit-list">
          <h4 className="calendar-habit-list-title">
            Habits for {selectedDate}
          </h4>
          <ul className="calendar-habit-items">
            {dateHabit.map(habit => (
              <li key={habit.habitID} className="calendar-habit-item">
                <button
                  onClick={() =>
                    toggleHabitCompletionInline(habit.habitID, selectedDate)
                  }
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
};






export const SidebarCalendar_save: React.FC<SidebarCalendarProps_old> = ({
	app,
	context,
	habits,
	onHabitsUpdate
}) => {
	const habitService = context.habitService;

	const [habitState, setHabitState] = useState<Habit[]>(habits);
	const [currentDate, setCurrentDate] = useState<DateString>(DateHelper.today());
	const [selectedDate, setSelectedDate] = useState<DateString | null>(null);
	const [monthData, setMonthData] = useState<MonthData>({});

	const [dateHabit, setDateHabit] = useState<{
		habitID: string;
		habitTitle: string;
		completed: boolean;
		couldBeCompleted: boolean
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
			await context.dataService.saveAllHabits(refreshedHabits);
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

	const getFirstDayOfMonth = (date: DateString) => {
		const dateObj = new Date(date);
        return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getDay();
    };

	const getHabitsForDate = (date: DateString) => {
        return habits.filter(habit => habitService.couldBeCompletedOnDate(habit, date));
    };


	const renderCalendar_old = async () => {
		const daysInMonth = getDaysInMonth(currentDate).daysInMonth;
		const firstDay = getFirstDayOfMonth(currentDate);
		const days = [];
		const today = DateHelper.today();

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
		}

		// Add day numbers
		for (let day = 1; day <= daysInMonth; day++) {
			const dateStr = DateHelper.formatDateString(
				new Date(currentDate).getFullYear(),
				new Date(currentDate).getMonth() + 1,
				day
			);

			const habitsForDay = getHabitsForDate(dateStr);

			days.push(day);
		}

		return days.map((day, index) => {
			if (typeof day !== 'number') {
				return day;
			}

			const newDate = DateHelper.formatDateString(new Date(currentDate).getFullYear(), new Date(currentDate).getMonth() + 1, day);
			setSelectedDate(newDate);
			// console.log("newdate:", newDate);
			// const result = habitService.pairDateHabit(newDate);
			// setDateHabit(result);
			// console.log("result:", result);

			const dateStr = DateHelper.formatDateString(
				new Date(currentDate).getFullYear(),
				new Date(currentDate).getMonth() + 1,
				day
			);
			
			const habitsForDay = getHabitsForDate(dateStr);
			const isSelected = selectedDate === dateStr;
			const isToday = dateStr === today;
			const isFuture = dateStr > today;

			// Calculate completion status for the day
			const completedCount = habitsForDay.filter(h => habitService.isCompleted(h, dateStr)).length;
			const totalCount = habitsForDay.length;
			const allCompleted = totalCount > 0 && completedCount === totalCount;
			const partiallyCompleted = completedCount > 0 && completedCount < totalCount;

			return (
				<button
					key={index}
					onClick={async () => {
						if (!isFuture) {
							await handleDateClick(day);
						}
					}}
					disabled={isFuture}
					className={`
						calendar-day
						${isSelected ? 'selected' : ''}
						${habitsForDay.length > 0 ? 'has-habits' : ''}
						${isToday ? 'today' : ''}
						${isFuture ? 'future' : ''}
						${allCompleted ? 'all-completed' : ''}
						${partiallyCompleted ? 'partial-completed' : ''}
					`}
					title={habitsForDay.length > 0 ? `${completedCount}/${totalCount} habits completed` : ''}
				>
					<span className="day-number">{day}</span>
					{/* {habitsForDay.length > 0 && (
						<span className="habits-indicator">
							{completedCount}/{totalCount}
						</span>
					)} */}
				</button>
			);
		});
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

	// const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
	// const monthName = new Date(currentDate).toLocaleString('default', { month: 'long' });
	// const year = new Date(currentDate).getFullYear();

	// const days = [];
	// for (let i = 0; i < startingDayOfWeek; i++) {
	// 	days.push(<div key={`empty-${i}`} className="h-7" />);
	// }
	// for (let day = 1; day <= daysInMonth; day++) {
	// 	days.push(day);
	// }

	const getCompletedCount = () => {
		if (!selectedDate) return 0;
		return habits.filter(h =>
        habitService.couldBeCompletedOnDate(h, selectedDate) &&
        habitService.isCompleted(h, selectedDate)
    ).length;
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
		console.error("<------> start, handleDateClick for day:", day);
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
				{/* {days.map((day, index) => {
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
				})} */}
			</div>

			{selectedDate && dateHabit.length > 0 && (
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
