import React from "react";
import { Habit } from "../data/DEFAULT";

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
	

	return (
		<details
			className="quest-list"
			open={isOpen}
			onToggle={handleToggle}
		>
		<summary className="accordion-title">Habits</summary>

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
			{/* Onglets : today / upcoming */}

				<button
					className="habit-filter-button"
					onClick={() => setActiveTab(activeTab === "today" ? "upcoming" : "today")}
				>
					{activeTab === "today" ? "Today" : "Upcoming"}
				</button>
				{/* <div className="quest-filter-options">
				<button
					className={`quest-filter-option ${activeTab === "today" ? "today" : ""}`}
					onClick={() => setActiveTab("today")}
				>
					Today
				</button>
				<button
					className={`quest-filter-option ${activeTab === "upcoming" ? "active" : ""}`}
					onClick={() => setActiveTab("upcoming")}
				>
					Upcoming
				</button> */}
				{/* </div> */}


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
	onComplete: (habit: Habit, completed: boolean) => void;
	onModify: (habit: Habit) => void;
}

const HabitItem_old: React.FC<HabitItemProps> = ({ habit, onComplete, onModify }) => {
	const isEditable = !habit.isSystemHabit;

	return (
		<div className="quest-item">
			<div className="quest-header">
				<div className="quest-checkbox-section">
				<input
					type="checkbox"
					checked={habit.streak.isCompletedToday}
					onChange={() => onComplete(habit, !habit.streak.isCompletedToday)}
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
				<div className="quest-description">
					{habit.shortDescription}
				</div>
			)}

			<div className="quest-xp">
				XP: {habit.reward.XP}
			</div>
		</div>
	);
};


const HabitItem: React.FC<HabitItemProps> = ({ habit, onComplete, onModify }) => {
	const isEditable = !habit.isSystemHabit;

	const handleToggle = () => {
		if (habit.streak.isCompletedToday) {
			onComplete(habit, false); // uncheck
		} else {
			onComplete(habit, true); // complete
		}
	};

	return (
		<div className="quest-item">
			<div className="quest-header">
				<div className="quest-checkbox-section">
					<input
						type="checkbox"
						checked={habit.streak.isCompletedToday}
						onChange={handleToggle}
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

			<div className="quest-xp">XP: {habit.reward.XP}</div>
		</div>
	);
};
