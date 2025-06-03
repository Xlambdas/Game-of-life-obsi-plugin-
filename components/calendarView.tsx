import React, { useState } from 'react';
import { Habit } from 'constants/DEFAULT';

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

    const isHabitAvailableForDate = (habit: Habit, date: Date): boolean => {
        const habitDate = new Date(habit.created_at);
        const today = new Date();
        
        if (date > today) return false;
        if (date < habitDate) return false;

        const diffTime = Math.abs(date.getTime() - habitDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (habit.recurrence.unit) {
            case 'day':
                return diffDays % habit.recurrence.interval === 0;
            case 'week':
                return diffDays % (habit.recurrence.interval * 7) === 0;
            case 'month':
                const monthsDiff = (date.getFullYear() - habitDate.getFullYear()) * 12 + 
                                 (date.getMonth() - habitDate.getMonth());
                return monthsDiff % habit.recurrence.interval === 0 && 
                       date.getDate() === habitDate.getDate();
            default:
                return false;
        }
    };

    const getHabitsForDate = (date: Date) => {
        return habits.filter(habit => isHabitAvailableForDate(habit, date));
    };

    const isHabitCompletedForDate = (habit: Habit, date: Date): boolean => {
        return habit.streak.history.some(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.toDateString() === date.toDateString();
        });
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];
        const today = new Date();

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const habitsForDay = getHabitsForDate(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const isToday = date.toDateString() === today.toDateString();

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${habitsForDay.length > 0 ? 'has-habits' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDate(date)}
                >
                    <span className="day-number">{day}</span>
                    {habitsForDay.length > 0 && (
                        <div className="habits-dot" title={`${habitsForDay.length} habits available`} />
                    )}
                </div>
            );
        }

        return days;
    };

    const renderSelectedDateHabits = () => {
        if (!selectedDate) return null;

        const habitsForSelectedDate = getHabitsForDate(selectedDate);
        const today = new Date();

        return (
            <div className="selected-date-habits">
                <div className="selected-date-header">
                    <h3>{selectedDate.toLocaleDateString()}</h3>
                    <button 
                        className="close-selection"
                        onClick={() => setSelectedDate(null)}
                    >
                        ×
                    </button>
                </div>
                {habitsForSelectedDate.length > 0 ? (
                    <ul className="habits-checklist">
                        {habitsForSelectedDate.map(habit => {
                            const isCompleted = isHabitCompletedForDate(habit, selectedDate);
                            const canComplete = selectedDate <= today;

                            return (
                                <li key={habit.id} className={`habit-item ${isCompleted ? 'completed' : ''}`}>
                                    <label className="habit-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={isCompleted}
                                            onChange={() => onCompleteHabit(habit, !isCompleted, selectedDate)}
                                            disabled={!canComplete}
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
                    <p>No habits available for this day</p>
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
                >
                    ←
                </button>
                <h2>{currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</h2>
                <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="calendar-nav-button"
                >
                    →
                </button>
            </div>
            <div className="calendar-grid">
                <div className="calendar-weekdays">
                    <div>S</div>
                    <div>M</div>
                    <div>T</div>
                    <div>W</div>
                    <div>T</div>
                    <div>F</div>
                    <div>S</div>
                </div>
                <div className="calendar-days">
                    {renderCalendar()}
                </div>
            </div>
            {renderSelectedDateHabits()}
        </div>
    );
}; 
