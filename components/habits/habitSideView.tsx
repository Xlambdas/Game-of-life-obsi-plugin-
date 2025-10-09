import React from "react";
// from file (Default):
import { Habit } from "../../data/DEFAULT";

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
	} = props;

	// UI feedback on completion rate
	const totalCount = filteredHabits.length;
	const completedCount = filteredHabits.filter((h) => h.streak.isCompletedToday).length;
	const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

	return (
		<details
			className="quest-list"
			open={isOpen}
			onToggle={handleToggle}
		>
		<summary className="accordion-title">
			Habits ({completedCount} / {totalCount} - {percent}%)
		</summary>

		{/* Barre de recherche + filtres */}
		<div className="quest-controls">
			<input
				type="text"
				placeholder="Search habits..."
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				className="quest-search"
			/>

			<div className="habit-controls-row">
			{/* today / upcoming */}
				<button
					className="habit-filter-button"
					onClick={() => setActiveTab(activeTab === "today" ? "upcoming" : "today")}
				>
					{activeTab === "today" ? "Today" : "Upcoming"}
				</button>

			{/* Sort By */}
			<div className="quest-sort-dropdown">
				<button className="quest-sort-button">
					Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
				</button>
				<div className="quest-sort-options">
				<button
					className={`quest-sort-option ${sortBy === "priority" ? "active" : ""}`}
					onClick={() => setSortBy("priority")}
				>
					Priority
				</button>
				<button
					className={`quest-sort-option ${sortBy === "xp" ? "active" : ""}`}
					onClick={() => setSortBy("xp")}
				>
					XP
				</button>
				<button
					className={`quest-sort-option ${sortBy === "difficulty" ? "active" : ""}`}
					onClick={() => setSortBy("difficulty")}
				>
					Difficulty
				</button>
				<button
					className={`quest-sort-option ${sortBy === "recurrence" ? "active" : ""}`}
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
				/>
			))}
			</div>
		)}
		</details>
	);
}

interface HabitItemProps {
	habit: Habit;
	activeTab: "today" | "upcoming";
	onComplete: (habit: Habit, completed: boolean) => void;
	onModify: (habit: Habit) => void;
}



const HabitItem: React.FC<HabitItemProps> = ({ habit, activeTab, onComplete, onModify }) => {
	/* Individual habit item with completion and edit options */
	const isEditable = !habit.isSystemHabit;

	const handleToggle = () => {
		onComplete(habit, !habit.streak.isCompletedToday);
	};

	return (
		<div className="quest-item">
			<div className="quest-header">
				<div className="quest-checkbox-section">
					<input
						type="checkbox"
						checked={habit.streak.isCompletedToday}
						onChange={handleToggle}
						disabled={activeTab === "upcoming"}
						className="quest-checkbox"
					/>
					<span className={`quest-title ${habit.streak.isCompletedToday ? "completed" : ""}`}>
						{habit.title}
						{habit.isSystemHabit && <span className="quest-system-badge">System</span>}
					</span>
					{isEditable && (
						<button
							className="quest-edit-button"
							onClick={() => onModify(habit)}
							aria-label="Edit quest"
						>
							Edit
						</button>
					)}
				</div>
			</div>

			{habit.shortDescription && (
				<div className="quest-description">{habit.shortDescription}</div>
			)}
			<div className="quest-xp">
				{habit.reward.attributes && (Object.entries(habit.reward.attributes)
				.filter(([_, v]) => v !== 0 && v !== null && v !== undefined)
				.map(([key, value]) => (
					<span key={key} className="flex items-center gap-1">
						<span className="text-amber-300 font-medium">{key}: </span>
						<span className="text-amber-100">{value}</span> <br />
					</span>
				)))}
				Streak: {habit.streak.current} (Best: {habit.streak.best})
			</div>
		</div>
	);
};
