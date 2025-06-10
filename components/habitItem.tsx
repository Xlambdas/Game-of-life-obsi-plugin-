import React from "react";
import { Habit } from "constants/DEFAULT";
import { getDaysUntil, isTodayHabit, normalizeHabit } from "./habitComponents";

interface HabitItemProps {
	habit: Habit;
	onComplete: (habit: Habit, completed: boolean) => void;
	onModify: (habit: Habit) => void;
	normalizeHabit: (habit: Habit) => Habit;
}

export const HabitItem: React.FC<HabitItemProps> = ({
	habit,
	onComplete,
	onModify,
	normalizeHabit,
}) => {
	const isEditable = !habit.isSystemHabit;
	const disableCheckbox = !isTodayHabit(habit) && isEditable;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	habit = normalizeHabit(habit);
	const nextDate = new Date(habit.streak.nextDate);
	nextDate.setHours(0, 0, 0, 0);
	const daysUntilNext = getDaysUntil(today, nextDate);

	return (
		<div className="habit-item">
			<div className="habit-header">
				<div className="habit-checkbox-section">
					<input
						type="checkbox"
						checked={habit.streak.isCompletedToday}
						// checked={isHabitCompleted(habit)}
						onChange={() => onComplete(habit, !habit.streak.isCompletedToday)}
						className="habit-checkbox"
						disabled={disableCheckbox}
					/>
					<span className={`habit-title ${habit.streak.isCompletedToday ? "completed" : ""}`}>
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
				<div className="habit-description">{habit.shortDescription}</div>
			)}
			<div className="habit-info-row">
				<div className="habit-streak">
					🔥 Streak: <b>{habit.streak.current}</b> (Best: {habit.streak.best})
				</div>
				<div className="habit-next-occurrence-text">
					{daysUntilNext === 0 ||
					habit.streak.history.length === 0 ||
					(habit.streak.history.length === 1 && !habit.streak.history[0].success) || daysUntilNext < 0 ? (
						<span className="habit-timing-badge">📅 Today</span>
					) : daysUntilNext === 1 ? (
						<span className="habit-timing-badge">📆 Tomorrow</span>
					) : daysUntilNext > 1 ? (
						<span className="habit-timing-badge">📆 In {daysUntilNext} days</span>
					// ) : daysUntilNext < 0 ? (
					// 	<span className="habit-timing-badge">⏳ Overdue</span>
					) : null}
				</div>
			</div>
		</div>
	);
};

// Helper function to check if a habit is due today
const isTodayHabit_old = (habit: Habit): boolean => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const nextDate = new Date(habit.streak.nextDate);
	nextDate.setHours(0, 0, 0, 0);
	
	if (nextDate.getTime() === today.getTime()) return true;
	if (habit.streak.history.length === 0) return true;
	if (habit.streak.history.length === 1 && !habit.streak.history[0].success) return true;
	
	return habit.streak.history.some((h) => {
		if (!h.date) return false;
		const histDate = new Date(h.date);
		histDate.setHours(0, 0, 0, 0);
		return histDate.getTime() === today.getTime();
	});
};
