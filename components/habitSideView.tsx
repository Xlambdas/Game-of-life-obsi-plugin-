import React from "react";
import { Habit } from "../data/DEFAULT";

interface HabitSideViewProps {
	filteredHabits: Habit[];
	isOpen: boolean;
	filter: string;
	activeTab: "active" | "completed" | "all";
	sortBy: "priority" | "xp" | "difficulty" | "date";
	handleToggle: (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => void;
	handleCompleteHabit: (habit: Habit, completed: boolean) => void;
	setFilter: (filter: string) => void;
	setActiveTab: (tab: "active" | "completed" | "all") => void;
	setSortBy: (sort: "priority" | "xp" | "difficulty" | "date") => void;
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
		handleCompleteHabit,
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

			<div className="quest-controls-row">
			{/* Onglets : Active / Completed / All */}
			<div className="quest-filter-dropdown">
				<button className="quest-filter-button">
					{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
				</button>
				<div className="quest-filter-options">
				<button
					className={`quest-filter-option ${activeTab === "active" ? "active" : ""}`}
					onClick={() => setActiveTab("active")}
				>
					Active
				</button>
				<button
					className={`quest-filter-option ${activeTab === "completed" ? "active" : ""}`}
					onClick={() => setActiveTab("completed")}
				>
					Completed
				</button>
				<button
					className={`quest-filter-option ${activeTab === "all" ? "active" : ""}`}
					onClick={() => setActiveTab("all")}
				>
					All
				</button>
				</div>
			</div>

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
					className={`quest-sort-option ${sortBy === "date" ? "active" : ""}`}
					onClick={() => setSortBy("date")}
				>
					Date
				</button>
				</div>
			</div>
			</div>
		</div>

		{/* Liste des habits */}
		<div className="habit-list-container">
			{filteredHabits.length === 0 ? (
				<p className="no-habits">No habits found.</p>
			) : (
				filteredHabits.map((habit) => (
					<div key={habit.id} className="habit-item">
						<div className="habit-info" onClick={() => handleModifyHabit(habit)}>
							<h3 className="habit-title">{habit.title}</h3>
							<p className="habit-description">{habit.description}</p>
						</div>
						<div className="habit-actions">
							<button
								className={`complete-btn ${habit.streak.isCompletedToday ? "completed" : ""}`}
								onClick={() => handleCompleteHabit(habit, !habit.streak.isCompletedToday)}
							>
								{habit.streak.isCompletedToday ? "Undo" : "Complete"}
							</button>
						</div>
					</div>
				))
			)}
		</div>
		</details>
	);
}
