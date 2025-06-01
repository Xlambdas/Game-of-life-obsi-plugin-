import { Habit } from "constants/DEFAULT";

export function HabitSideView (props: {
	habits: Habit[],
	filteredHabits: Habit[],
	isOpen: boolean,
	filter: string,
	activeTab: 'active' | 'completed' | 'all',
	handleToggle: (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => void,
	handleCompleteHabit: (habit: Habit, completed: boolean) => void,
	setFilter: (value: string) => void,
	setActiveTab: (tab: 'active' | 'completed' | 'all') => void,
	setSortBy: (sortBy: 'priority' | 'xp' | 'difficulty' | 'date') => void,
	sortBy: 'priority' | 'xp' | 'difficulty' | 'date',
	handleModifyHabit: (habit: Habit) => void
}) {
	const {
	habits,
	filteredHabits,
	isOpen,
	filter,
	activeTab,
	handleToggle,
	handleCompleteHabit,
	setFilter,
	setActiveTab,
	setSortBy,
	sortBy,
	handleModifyHabit
} = props;

	return (
		<details
			className="habit-list" 
			open={isOpen}
			onToggle={handleToggle}
		>
			<summary className="accordion-title">Habits</summary>
			<div className="habit-controls">
				<input
					type="text"
					placeholder="Search habits..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					className="habit-search"
				/>
				<div className="habit-controls-row">
					<div className="habit-filter-dropdown">
						<button className="habit-filter-button">
							{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
						</button>
						<div className="habit-filter-options">
							<button
								className={`habit-filter-option ${activeTab === 'active' ? 'active' : ''}`}
								onClick={() => setActiveTab('active')}
							>
								Active
							</button>
							<button
								className={`habit-filter-option ${activeTab === 'completed' ? 'active' : ''}`}
								onClick={() => setActiveTab('completed')}
							>
								Completed
							</button>
							<button
								className={`habit-filter-option ${activeTab === 'all' ? 'active' : ''}`}
								onClick={() => setActiveTab('all')}
							>
								All
							</button>
						</div>
					</div>
				</div>
				<div className="habit-sort-dropdown">
					<button className="habit-sort-button">
						Sort By
					</button>
					<div className="habit-sort-options">
						<button onClick={() => setSortBy('priority')}>Priority</button>
						<button onClick={() => setSortBy('xp')}>XP</button>
						<button onClick={() => setSortBy('difficulty')}>Difficulty</button>
						<button onClick={() => setSortBy('date')}>Date</button>
					</div>
				</div>
			</div>
			{filteredHabits.length === 0 ? (
				<div className="no-quests-message">
					{filter ? "No quests match your search" : "No quests available"}
				</div>
			) : (
				<div className="quests-container">
					{filteredHabits.map((habit) => (
						<HabitItem
							key={habit.id}
							habit={habit}
							onComplete={handleCompleteHabit}
							onModify={handleModifyHabit}
						/>
					))}
				</div>
			)}
		</details>
	);
}

const HabitItem = ({ habit, onComplete, onModify }: { habit: Habit, onComplete: (habit: Habit, completed: boolean) => void, onModify: (habit: Habit) => void }) => {
	return (
		<div className="habit-item">
			<h3>{habit.title}</h3>
			<p>{habit.shortDescription}</p>
			<div className="habit-actions">
				<button onClick={() => onComplete(habit, !habit.streak.isCompleted)}>
					{habit.streak.isCompleted ? "Mark Incomplete" : "Mark Complete"}
				</button>
				<button onClick={() => onModify(habit)}>Modify</button>
			</div>
			<div className="habit-details">
				<p>Streak: {habit.streak.current} (Best: {habit.streak.best})</p>
				<p>Recurrence: Every {habit.recurrence.interval} {habit.recurrence.unit}</p>
			</div>
		</div>
	);
}

// export function HabitSideView_test (props: {
// 	habits: Habit[],
// 	filteredHabits: Habit[],
// 	isOpen: boolean,
// 	filter: string,
// 	activeTab: 'active' | 'completed' | 'all',
// 	handleToggle: (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => void,
// 	handleCompleteHabit: (habit: Habit, completed: boolean) => void,
// 	setFilter: (value: string) => void,
// 	setActiveTab: (tab: 'active' | 'completed' | 'all') => void,
// 	setSortBy: (sortBy: 'priority' | 'xp' | 'difficulty' | 'date') => void,
// 	sortBy: 'priority' | 'xp' | 'difficulty' | 'date',
// 	handleModifyHabit: (habit: Habit) => void
// }) {
// 	const {
// 		habits,
// 		filteredHabits,
// 		isOpen,
// 		filter,
// 		activeTab,
// 		handleToggle,
// 		handleCompleteHabit,
// 		setFilter,
// 		setActiveTab,
// 		setSortBy,
// 		sortBy,
// 		handleModifyHabit
// 	} = props;

// 	return (
// 		<details className="habit-list" open={isOpen} onToggle={handleToggle}>
// 			<summary>Habits</summary>
// 			<div className="habit-controls">
// 				<input
// 					type="text"
// 					value={filter}
// 					onChange={(e) => setFilter(e.target.value)}
// 					placeholder="Filter habits..."
// 				/>
// 				<button onClick={() => setActiveTab('active')}>Active</button>
// 				<button onClick={() => setActiveTab('completed')}>Completed</button>
// 				<button onClick={() => setActiveTab('all')}>All</button>
// 				<select onChange={(e) => setSortBy(e.target.value as any)} value={sortBy}>
// 					<option value="priority">Priority</option>
// 					<option value="xp">XP</option>
// 					<option value="difficulty">Difficulty</option>
// 					<option value="date">Date</option>
// 				</select>
// 			</div>
// 			<ul className="habit-list-items">
// 				{filteredHabits.map((habit) => (
// 					<li key={habit.id}>
// 						<span>{habit.title}</span>
// 						<button onClick={() => handleCompleteHabit(habit, !habit.isCompleted)}>
// 							{habit.isCompleted ? "
// 							Mark Incomplete" : "Mark Complete"}
// 							{habit.isCompleted ? " (Completed)" : " (Active)"}
// 						</button>
// 						<button onClick={() => handleModifyHabit(habit)}>Modify</button>
// 					</li>
// 				))}
// 			</ul>
// 		</details>
// 	);
// }
