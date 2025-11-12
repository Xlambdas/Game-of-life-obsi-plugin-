import React, { use, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Circle, Check, Flame, Zap } from 'lucide-react';
import { Habit } from 'data/DEFAULT';
import { Notice } from 'obsidian';

interface PairDateHabit {
	date: Date;
	habits: { habitID: string, habitTitle: string, completed: boolean, couldBeCompleted: boolean }[];
}


export const SidebarCalendar: React.FC<{ habits: Habit[] }> = ({ habits }) => {
	const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
	const [dateHabit, setDateHabit] = useState<PairDateHabit[]>([]);

	const pairDateHabit = (date: string | Date): PairDateHabit['habits'] => {
		// create pair for one date the habits and their completion status.
		date = toYMDLocal(date);
		console.error(`Pairing habits for date: ${date}`);

		const filteredHabits = habits
			.map(habit => {
				const habitHistory = habit.streak?.history ?? [];
				console.log('habit history:', habitHistory);

				// Check if habit was completed on the given date
				const completed = habitHistory.some(entry => {
					const entryDate = toYMDLocal(entry.date);
					return entryDate === date && Boolean(entry.success);
				});
				console.warn(`Habit: ${habit.title}, Completed on ${date}: ${completed}`);

				return {
					habitID: habit.id,
					habitTitle: habit.title,
					completed: completed,
					couldBeCompleted: completed || couldBeCompletedOnDate(habit, date)
				};
			})
			.filter(habit => habit.couldBeCompleted);

		console.log(`For date ${date}, paired habits:`, filteredHabits);
		return filteredHabits;
	};

	// Fonction helper pour déterminer si un habit pouvait être complété à une date donnée
	const couldBeCompletedOnDate = (habit: Habit, targetDate: string): boolean => {
		console.info('Checking if habit', habit.title, 'could be completed on', targetDate);
		const normalizeDate = (d: Date | string) => {
			const dt = new Date(d);
			return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
		};

		const targetNormalized = normalizeDate(targetDate);
		const createdAt = normalizeDate(habit.created_at);

		// Si la date cible est avant la création de l'habit
		if (targetNormalized < createdAt || targetNormalized > normalizeDate(new Date())) {
			console.log('Date cible avant création ou dans le futur; target:', targetNormalized, 'createdAt:', createdAt);
			return false;
		}

		// Trouver la dernière complétion avant ou égale à la date cible
		const historyBeforeTarget = habit.streak.history
			.filter(entry => entry.success)
			.map(entry => normalizeDate(entry.date))
			.filter(d => d <= targetNormalized)
			.sort((a, b) => b.getTime() - a.getTime());

		const lastCompletedBefore = historyBeforeTarget[0] || null;
		console.log('Last completed before target:', lastCompletedBefore);

		// Calculer la prochaine date attendue basée sur la dernière complétion ou la création
		let baseDate = lastCompletedBefore || createdAt;
		const nextExpectedDate = baseDate != createdAt ? calculateNextDateHelper(baseDate, habit.recurrence) : createdAt;


		console.log('Next expected date for habit', habit.title, 'is', nextExpectedDate, 'and base is', baseDate);

		if (nextExpectedDate > targetNormalized) {
			console.log('----- Habit cannot be completed yet; next expected:', nextExpectedDate, 'target:', targetNormalized);
			return false;
		}

		const historyAfterTarget = habit.streak.history
			.map(entry => normalizeDate(entry.date))
			.filter(d => d > targetNormalized)
			.sort((a, b) => a.getTime() - b.getTime());

		if (historyAfterTarget.length > 0) {
			// check if history after target date has a completion, if so, check if it blocks completion
			const firstAfter = historyAfterTarget[0];
			const previousCompletions = calculatePreviousDateHelper(firstAfter, habit.recurrence);
			console.log('First history after target:', firstAfter, 'future completions date:', previousCompletions);
			if (targetNormalized > previousCompletions) {
				console.log('----- Habit completion blocked by future completion on', firstAfter);
				return false;
			}
		}

		return true;
	};

	// Helper pour calculer la prochaine date (similaire à calculateNextDate du HabitService)
	const calculateNextDateHelper = (
		fromDate: Date,
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }
	): Date => {
		const nextDate = new Date(fromDate);
		const { interval, unit } = recurrence;

		switch (unit) {
			case "days":
				nextDate.setDate(nextDate.getDate() + interval);
				break;
			case "weeks":
				nextDate.setDate(nextDate.getDate() + interval * 7);
				break;
			case "months":
				nextDate.setMonth(nextDate.getMonth() + interval);
				break;
			case "years":
				nextDate.setFullYear(nextDate.getFullYear() + interval);
				break;
		}

		return new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
	};

	const calculatePreviousDateHelper = (
		fromDate: Date,
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }
	): Date => {
		const prevDate = new Date(fromDate);
		const { interval, unit } = recurrence;

		switch (unit) {
			case "days":
				prevDate.setDate(prevDate.getDate() - interval);
				break;
			case "weeks":
				prevDate.setDate(prevDate.getDate() - interval * 7);
				break;
			case "months":
				prevDate.setMonth(prevDate.getMonth() - interval);
				break;
			case "years":
				prevDate.setFullYear(prevDate.getFullYear() - interval);
				break;
		}

		return new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
	};

	const [habitCompletions, setHabitCompletions] = useState<Set<string>>(new Set<string>());
	const [currentDate, setCurrentDate] = useState(new Date());
	const [today, setToday] = useState(new Date());

	const getDaysInMonth = (date: Date): { daysInMonth: number; startingDayOfWeek: number } => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = firstDay.getDay();

		return { daysInMonth, startingDayOfWeek };
	};

	const formatDate = (date: Date) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	};

	const isToday = (day: number): boolean => {
		const today = new Date();
		return day === today.getDate() &&
			currentDate.getMonth() === today.getMonth() &&
			currentDate.getFullYear() === today.getFullYear();
	};

	const isSelected = (day: number): boolean => {
		if (!selectedDate) return false;
		return day === selectedDate.getDate() && 
			currentDate.getMonth() === selectedDate.getMonth() && 
			currentDate.getFullYear() === selectedDate.getFullYear();
	};

	const handlePrevMonth = () => {
		setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
	};

	const handleNextMonth = () => {
		setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
	};

	const handleDateClick = (day: number): void => {
		const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
		setSelectedDate(newDate);
		const dateStr = formatDate(newDate);
	};

	const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
	const monthName = currentDate.toLocaleString('default', { month: 'long' });
	const year = currentDate.getFullYear();

	const days = [];
	for (let i = 0; i < startingDayOfWeek; i++) {
		days.push(<div key={`empty-${i}`} className="h-7" />);
	}
	for (let day = 1; day <= daysInMonth; day++) {
		days.push(day);
	}

	const getCompletedCount = () => {
		if (!selectedDate) return 0;
		const dateStr = formatDate(selectedDate);
		return Array.from(habitCompletions).filter(key => key.startsWith(dateStr)).length;
	};

	const toggleHabitCompletion = (habitId: string) => {
		if (!selectedDate) return;
		const dateStr = formatDate(selectedDate);
		const key = `${dateStr}-${habitId}`;

		setHabitCompletions(prev => {
			const newSet = new Set(prev);
			if (newSet.has(key)) {
				newSet.delete(key);
			} else {
				newSet.add(key);
			}
			return newSet;
		});
	};
	const isHabitCompleted = (habitId: string) => {
		if (!selectedDate) return false;
		const dateStr = formatDate(selectedDate);
		const key = `${dateStr}-${habitId}`;
		return habitCompletions.has(key);
	};

	// useEffect(() => {
	// 	setToday(new Date());
	// 	console.log('Date-Habit map updated:', today);
	// }, []);

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
					// setCurrentDate(new Date(currentDate ? currentDate.getFullYear() : today.getFullYear(), currentDate ? currentDate.getMonth() : today.getMonth(), day));
					// const date = new Date(blockDate ? blockDate.getFullYear() : blockDate.getFullYear(),);
					// const pairredDateHabit = pairDateHabit(currentDate)
					const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
					const isTodayDate = isToday(day);
					const isSelectedDate = isSelected(selectedDate.getDate());

					return (
						<button
							key={index}
							onClick={() => setSelectedDate(selectedDate)}
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

			{selectedDate && (
				<div>
					<h4 className="selected-date-header">
						Habits for {selectedDate.toLocaleDateString('en-US', {
							weekday: 'short',
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})}
					</h4>
					<div className="selected-date-habits">
						{pairDateHabit(formatDate(selectedDate)).map(habit => (
							<div key={habit.habitID}>
								<span>{habit.habitTitle}</span>
								<span>{habit.completed}</span>
							</div>
						))};
					</div>
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




function toYMDLocal(input: string | Date): string {
	const d = input instanceof Date ? input : new Date(String(input));
	if (isNaN(d.getTime())) return ""; // invalid date guard
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}
