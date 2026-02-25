import React, { useState, useEffect, useCallback, useMemo } from "react";
// from file (Default):
import { Habit } from "../../data/DEFAULT";
import { DateString } from "helpers/dateHelpers";

interface HabitSideViewProps {
	filteredHabits: Habit[];
	isOpen: boolean;
	filter: string;
	activeTab: "today" | "upcoming";
	sortBy: "priority" | "xp" | "difficulty" | "recurrence";
	handleToggle: (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => void;
	handleComplete: (habit: Habit, completed: boolean) => void;
	setFilter: (filter: string) => void;
	setActiveTab: (tab: "today" | "upcoming") => void;
	setSortBy: (sort: "priority" | "xp" | "difficulty" | "recurrence") => void;
	handleModifyHabit: (habit: Habit) => void;
	getDaysUntil: (startDate: DateString, targetDate: DateString) => string;
	handleOpenDetails: (habit: Habit) => void;
	handleStartTimer?: (habit: Habit) => void;
}

interface HabitItemProps {
	habit: Habit;
	activeTab: "today" | "upcoming";
	onComplete: (habit: Habit, completed: boolean) => void;
	onModify: (habit: Habit) => void;
	getDaysUntil: (startDate: DateString, targetDate: DateString) => string;
	openDetails: (habit: Habit) => void;
	onStartTimer?: (habit: Habit) => void;
}


export const HabitSideView: React.FC<HabitSideViewProps> = (props) => {
	/* Side view to display and manage habits */
	const {
		filteredHabits,
		isOpen,
		filter,
		activeTab,
		sortBy,
		handleToggle,
		handleComplete,
		setFilter,
		setActiveTab,
		setSortBy,
		handleModifyHabit,
		getDaysUntil,
		handleOpenDetails,
		handleStartTimer,
	} = props;

	// UI feedback on completion rate
	const completionStats = useMemo(() => {
		const totalCount = filteredHabits.length;
		const completedCount = filteredHabits.filter((h) => h.streak.isCompletedToday).length;
		const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
		return { totalCount, completedCount, percent };
	}, [filteredHabits]);

	return (
		<div className="habits-container">
			<details
				className="sideview-list"
				open={isOpen}
				onToggle={handleToggle}
			>
				<summary className="accordion-title">
					Habits ({completionStats.completedCount} / {completionStats.totalCount} - {completionStats.percent}%)
				</summary>

				{/* Barre de recherche + filtres */}
				<div className="habit-controls">
					<input
						type="text"
						placeholder="Search habits..."
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
						className="list-search"
					/>

					<div className="habit-controls-row">
						{/* today / upcoming */}
						<button
							className="list-filter-button"
							onClick={() => setActiveTab(activeTab === "today" ? "upcoming" : "today")}
						>
							{activeTab === "today" ? "Today" : "Upcoming"}
						</button>

						{/* Sort By */}
						<div className="list-sort-dropdown">
							<button className="list-sort-button">
								Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
							</button>
							<div className="list-sort-options">
								<button
									className={`list-sort-option ${sortBy === "priority" ? "active" : ""}`}
									onClick={() => setSortBy("priority")}
								>
									Priority
								</button>
								<button
									className={`list-sort-option ${sortBy === "difficulty" ? "active" : ""}`}
									onClick={() => setSortBy("difficulty")}
								>
									Difficulty
								</button>
								<button
									className={`list-sort-option ${sortBy === "recurrence" ? "active" : ""}`}
									onClick={() => setSortBy("recurrence")}
								>
									Recurrence
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Liste des Habits */}
				{filteredHabits.length === 0 ? (
					<div className="no-habits-message">
						{filter ? "No habits match your search" : "No habits available"}
					</div>
				) : (
					<div className="habits-container">
						{filteredHabits.map((habit) => (
							<HabitItem
								key={habit.id}
								habit={habit}
								activeTab={activeTab}
								onComplete={handleComplete}
								onModify={handleModifyHabit}
								getDaysUntil={getDaysUntil}
								openDetails={handleOpenDetails}
								onStartTimer={handleStartTimer}
							/>
						))}
					</div>
				)}
			</details>
		</div>
	);
}


const HabitItem: React.FC<HabitItemProps> = React.memo(({
	habit, activeTab, onComplete, onModify, getDaysUntil, openDetails, onStartTimer
}) => {
	const isEditable = !habit.isSystemHabit;
	const hasTimerUnit = habit.progress.goal && habit.progress.goalUnit && ['minutes', 'hours'].includes(habit.progress.goalUnit ?? "");

	const initialSeconds = useMemo(() => {
		if (!habit.progress.goal || !habit.progress.goalUnit) return 0;
		return habit.progress.goalUnit === 'hours'
			? habit.progress.goal * 3600
			: habit.progress.goal * 60;
	}, [habit.progress.goal, habit.progress.goalUnit]);

	const [timerRunning, setTimerRunning] = useState(false);
	const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);

	useEffect(() => {
		if (!timerRunning || remainingSeconds <= 0) {
			if (remainingSeconds <= 0 && timerRunning) {
				setTimerRunning(false);
				// This will trigger the dbUpdated event which refreshes the list
				onComplete(habit, habit.streak.isCompletedToday);
			}
			return;
		}

		const interval = setInterval(() => {
			setRemainingSeconds(prev => {
				if (prev <= 1) {
					setTimerRunning(false);
					onComplete(habit, habit.streak.isCompletedToday);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [timerRunning, remainingSeconds, habit, onComplete]);

	const toggleTimer = useCallback(() => {
		setTimerRunning(prev => !prev);
		if (!timerRunning) onStartTimer?.(habit);
	}, [timerRunning, habit, onStartTimer]);


	const handleToggle = useCallback(() => {
		onComplete(habit, habit.streak.isCompletedToday);
	}, [habit, onComplete]);

	const handleModifyClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		onModify(habit);
	}, [habit, onModify]);

	const handleTimerClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (hasTimerUnit) toggleTimer();
	}, [hasTimerUnit, toggleTimer]);

	const formattedTime = useMemo(() => {
		const mins = Math.floor(remainingSeconds / 60);
		const secs = remainingSeconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}, [remainingSeconds]);

	return (
		<div
			className="habit-item"
			role="button"
			tabIndex={0}
			onClick={() => openDetails(habit)}
			onKeyDown={(e) => {
				if (e.key === "Enter") openDetails(habit);
			}}
		>
			<div className="habit-header">
				<div className="habit-checkbox-section">
					<input
						type="checkbox"
						checked={habit.streak.isCompletedToday}
						onClick={(e) => e.stopPropagation()}
						onChange={handleToggle}
						disabled={activeTab === "upcoming"}
						className={`habit-checkbox ${habit.streak.isCompletedToday ? "completed" : ""}`}
					/>
					<span className={
						`habit-title ${habit.streak.isCompletedToday ? "completed" : ""} ${habit.title.length > 12 ? "scrollable" : ""}`}
					>
						<span>{habit.title}</span>
					</span>
					{isEditable ? (
						<button
							className="list-edit-button"
							onClick={handleModifyClick}
							aria-label="Edit habit"
						>
							Edit
						</button>
					) : habit.isSystemHabit ? (
						<span className="list-system-badge">System</span>
					) : null}
				</div>
			</div>

			{habit.shortDescription && (
				<div className="habit-description">{habit.shortDescription}</div>
			)}
			<div className="habit-footer">
				<div className="habit-xp">
					{activeTab === "today" && habit.reward.attributes ? (
						Object.entries(habit.reward.attributes)
							.filter(([_, v]) => v !== 0 && v !== null && v !== undefined)
							.map(([key, value]) => (
								<span key={key} className="flex items-center gap-1">
									<span className="text-amber-300 font-medium">{key}: </span>
									<span className="text-amber-100">{value}</span> <br />
								</span>
							))
					) : (
						<span><strong>{habit.streak.nextDate ? getDaysUntil(new Date().toISOString(), habit.streak.nextDate) : ""}</strong><br /></span>
					)}
					Streak: {habit.streak.current} (Best: {habit.streak.best})
				</div>

				{hasTimerUnit && (
					<div className="habit-timer-section">
						<button
							className={`list-play-button ${timerRunning ? 'playing' : ''}`}
							onClick={handleTimerClick}
							aria-label={timerRunning ? "Stop timer" : "Start timer"}
							title={timerRunning ? 'Stop timer' : 'Start timer'}
						>
							{timerRunning ? '⏸' : '▶'}
						</button>
						<span className={`habit-timer ${timerRunning ? 'running' : ''}`}>
							{formattedTime}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}, (prevProps, nextProps) => {
	// Custom comparison for memo - return true if props are equal (don't re-render)
	return (
		prevProps.habit.id === nextProps.habit.id &&
		prevProps.habit.streak.isCompletedToday === nextProps.habit.streak.isCompletedToday &&
		prevProps.habit.title === nextProps.habit.title &&
		prevProps.habit.shortDescription === nextProps.habit.shortDescription &&
		prevProps.activeTab === nextProps.activeTab &&
		JSON.stringify(prevProps.habit.reward) === JSON.stringify(nextProps.habit.reward)
	);
});

HabitItem.displayName = 'HabitItem';
