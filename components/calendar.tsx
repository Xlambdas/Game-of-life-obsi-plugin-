import React, { useState } from 'react';
import { Habit } from '../data/DEFAULT';

interface CalendarViewProps {
    habits: Habit[];
    onCompleteHabit: (habit: Habit, completed: boolean, date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ habits, onCompleteHabit }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const normalizeDateToMidnight = (date: Date): Date => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    };

    const isHabitAvailableForDate = (habit: Habit, date: Date): boolean => {
        const habitDate = normalizeDateToMidnight(new Date(habit.created_at));
        const checkDate = normalizeDateToMidnight(date);
        const today = normalizeDateToMidnight(new Date());
        
        // Can't complete habits in the future
        if (checkDate > today) return false;
        
        // Can't complete habits before they were created
        if (checkDate < habitDate) return false;

        const diffTime = checkDate.getTime() - habitDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        switch (habit.recurrence.unit) {
            case 'days':
                return diffDays % habit.recurrence.interval === 0;
            case 'weeks':
                return diffDays % (habit.recurrence.interval * 7) === 0;
            case 'months':
                const monthsDiff = (checkDate.getFullYear() - habitDate.getFullYear()) * 12 + 
                                 (checkDate.getMonth() - habitDate.getMonth());
                return monthsDiff % habit.recurrence.interval === 0 && 
                       checkDate.getDate() === habitDate.getDate();
            default:
                return false;
        }
    };

    const getHabitsForDate = (date: Date) => {
        return habits.filter(habit => isHabitAvailableForDate(habit, date));
    };

    const isHabitCompletedForDate = (habit: Habit, date: Date): boolean => {
        const checkDate = normalizeDateToMidnight(date);
        return habit.streak.history.some(entry => {
            const entryDate = normalizeDateToMidnight(new Date(entry.date));
            return entryDate.getTime() === checkDate.getTime() && entry.success;
        });
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];
        const today = normalizeDateToMidnight(new Date());

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const normalizedDate = normalizeDateToMidnight(date);
            const habitsForDay = getHabitsForDate(date);
            const isSelected = selectedDate && normalizeDateToMidnight(selectedDate).getTime() === normalizedDate.getTime();
            const isToday = normalizedDate.getTime() === today.getTime();
            const isFuture = normalizedDate > today;

            // Calculate completion status for the day
            const completedCount = habitsForDay.filter(h => isHabitCompletedForDate(h, date)).length;
            const totalCount = habitsForDay.length;
            const allCompleted = totalCount > 0 && completedCount === totalCount;
            const partiallyCompleted = completedCount > 0 && completedCount < totalCount;

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${habitsForDay.length > 0 ? 'has-habits' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} ${allCompleted ? 'all-completed' : ''} ${partiallyCompleted ? 'partial-completed' : ''}`}
                    onClick={() => !isFuture && setSelectedDate(date)}
                >
                    <span className="day-number">{day}</span>
                    {habitsForDay.length > 0 && (
                        <div className="habits-indicator">
                            <span className="habits-count" title={`${completedCount}/${totalCount} habits completed`}>
                                {completedCount}/{totalCount}
                            </span>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    const renderSelectedDateHabits = () => {
        if (!selectedDate) return null;

        const habitsForSelectedDate = getHabitsForDate(selectedDate);
        const today = normalizeDateToMidnight(new Date());
        const selectedNormalized = normalizeDateToMidnight(selectedDate);
        const canModify = selectedNormalized <= today;

        return (
            <div className="selected-date-habits">
                <div className="selected-date-header">
                    <h3>{selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    })}</h3>
                    <button 
                        className="close-selection"
                        onClick={() => setSelectedDate(null)}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                {!canModify && (
                    <div className="future-date-notice">
                        Cannot modify habits for future dates
                    </div>
                )}
                {habitsForSelectedDate.length > 0 ? (
                    <ul className="habits-checklist">
                        {habitsForSelectedDate.map(habit => {
                            const isCompleted = isHabitCompletedForDate(habit, selectedDate);

                            return (
                                <li key={habit.id} className={`habit-item ${isCompleted ? 'completed' : ''}`}>
                                    <label className="habit-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={isCompleted}
                                            onChange={() => onCompleteHabit(habit, !isCompleted, selectedDate)}
                                            disabled={!canModify}
                                        />
                                        <div className="habit-info">
                                            <span className="habit-title">{habit.title}</span>
                                            <span className="habit-description">{habit.shortDescription}</span>
                                        </div>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="no-habits-message">No habits scheduled for this day</p>
                )}
            </div>
        );
    };

    return (
        <div className="calendar-view">
            <div className="calendar-header">
                <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className="calendar-nav-button"
                    aria-label="Previous month"
                >
                    ←
                </button>
                <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="calendar-nav-button"
                    aria-label="Next month"
                >
                    →
                </button>
            </div>
            <div className="calendar-grid">
                <div className="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
                <div className="calendar-days">
                    {renderCalendar()}
                </div>
            </div>
            {renderSelectedDateHabits()}
        </div>
    );
};
