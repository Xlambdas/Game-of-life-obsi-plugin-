import { Habit } from "constants/DEFAULT";
import { CalendarView } from "./calendarView";
import { ButtonComponent, Notice } from "obsidian";

export const endHabitButton = ({
	version = 'create',
	contentEl,
	onSubmit,
	onCancel,
	onDelete
}: {
	version?: 'create' | 'edit',
	contentEl: HTMLElement,
	onSubmit: () => void,
	onCancel?: () => void,
	onDelete?: () => void
}) => {
	const buttonContainer = contentEl.createDiv({ cls: "buttons-container" });

	const flexContainer = buttonContainer.createDiv({ cls: "buttons-flex-container" });
	const noteContainer = flexContainer.createDiv({ cls: "required-note-container" });
	noteContainer.createEl("p", { text: '* Required fields', cls: 'required-note' });
	const buttonGroup = flexContainer.createDiv({ cls: "buttons-group" });

	// cancel button
	if (version === 'create' && onCancel) {
		new ButtonComponent(buttonGroup)
			.setButtonText("Cancel")
			.onClick(() => onCancel());
	} else if (version === 'edit' && onCancel) {
		new ButtonComponent(buttonGroup)
			.setButtonText("Delete")
			.setWarning()
			.onClick(async () => {
				onCancel();
			});
	}
	
	new ButtonComponent(buttonGroup)
		.setButtonText("Save Habit")
		.setCta()
		.onClick(async () => {
			try {
				await onSubmit();
			} catch (error) {
				console.error("Error saving habit:", error);
				new Notice("Failed to save habit. Check console for details.");
			}
		});
}




// Fonction utilitaire pour calculer la prochaine occurrence
const getNextOccurrence = (habit: Habit): Date => {
	const now = new Date();
	const lastCompletion = habit.streak.history.length > 0 
		? new Date(habit.streak.history[habit.streak.history.length - 1].date)
		: new Date(0);

		
	// Convertir l'intervalle en millisecondes
	let intervalMs = habit.recurrence.interval * 24 * 60 * 60 * 1000; // default to days
	if (habit.recurrence.unit === 'day') {
		intervalMs = habit.recurrence.interval * 24 * 60 * 60 * 1000;
	} else if (habit.recurrence.unit === 'week') {
		intervalMs = habit.recurrence.interval * 7 * 24 * 60 * 60 * 1000;
	} else if (habit.recurrence.unit === 'month') {
		// Approximate a month as 30 days
		intervalMs = habit.recurrence.interval * 30 * 24 * 60 * 60 * 1000;
	}

	// Calculer la prochaine occurrence
	let nextOccurrence = new Date(lastCompletion.getTime() + intervalMs);
	
	// Si la prochaine occurrence est dans le passé, calculer la prochaine occurrence à partir de maintenant
	if (nextOccurrence < now) {
		const timeSinceLast = now.getTime() - lastCompletion.getTime();
		const intervalsPassed = Math.floor(timeSinceLast / intervalMs);
		nextOccurrence = new Date(lastCompletion.getTime() + (intervalsPassed + 1) * intervalMs);
	}

	return nextOccurrence;
};

// Fonction pour vérifier si une habitude doit être faite aujourd'hui
const isDueToday = (habit: Habit): boolean => {
	const nextOccurrence = getNextOccurrence(habit);
	const today = new Date();
	return (
		nextOccurrence.getDate() === today.getDate() &&
		nextOccurrence.getMonth() === today.getMonth() &&
		nextOccurrence.getFullYear() === today.getFullYear()
	);
};

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

	// Filtrer les habitudes en fonction de l'onglet actif
	const getFilteredHabits = () => {
		return filteredHabits.filter(habit => {
			const isDue = isDueToday(habit);
			switch (activeTab) {
				case 'active':
					return isDue && !habit.streak.isCompletedToday;
				case 'completed':
					return habit.streak.isCompletedToday;
				case 'all':
					return true;
				default:
					return true;
			}
		});
	};

	const displayHabits = getFilteredHabits();

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
					<div className="habit-sort-dropdown">
						<button className="habit-sort-button">
							Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
						</button>
						<div className="habit-sort-options">
							<button 
								className={`habit-sort-option ${sortBy === 'priority' ? 'active' : ''}`}
								onClick={() => setSortBy('priority')}
							>
								Priority
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'xp' ? 'active' : ''}`}
								onClick={() => setSortBy('xp')}
							>
								XP Reward
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'difficulty' ? 'active' : ''}`}
								onClick={() => setSortBy('difficulty')}
							>
								Difficulty
							</button>
							<button 
								className={`habit-sort-option ${sortBy === 'date' ? 'active' : ''}`}
								onClick={() => setSortBy('date')}
							>
								Date
							</button>
						</div>
					</div>
				</div>
			</div>
			<CalendarView 
				habits={habits}
				onCompleteHabit={handleCompleteHabit}
			/>
			{displayHabits.length === 0 ? (
				<div className="no-habits-message">
					{filter ? "No habits match your search" : "No habits available"}
				</div>
			) : (
				<div className="habits-container">
					{displayHabits.map((habit) => (
						<HabitItem
							key={habit.id}
							habit={habit}
							onComplete={handleCompleteHabit}
							onModify={handleModifyHabit}
							nextOccurrence={getNextOccurrence(habit)}
						/>
					))}
				</div>
			)}
		</details>
	);
}

const HabitItem = ({ 
	habit, 
	onComplete, 
	onModify,
	nextOccurrence 
}: { 
	habit: Habit, 
	onComplete: (habit: Habit, completed: boolean) => void, 
	onModify: (habit: Habit) => void,
	nextOccurrence: Date
}) => {
	const isEditable = !habit.streak.isCompletedToday && !habit.isSystemHabit;
	const isDueToday = new Date().toDateString() === nextOccurrence.toDateString();

	return (
		<div className="habit-item">
			<div className="habit-header">
				<div className="habit-checkbox-section">
					<input
						type="checkbox"
						checked={habit.streak.isCompletedToday}
						onChange={() => onComplete(habit, !habit.streak.isCompletedToday)}
						className="habit-checkbox"
						disabled={!isDueToday}
					/>
					<span className={`habit-title ${habit.streak.isCompletedToday ? 'completed' : ''}`}>
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
				<div className="habit-description">
					{habit.shortDescription}
				</div>
			)}
			<div className="habit-info">
				<div className="habit-xp">
					XP: {habit.reward?.XP || 0}
				</div>
				<div className="habit-streak">
					Streak: {habit.streak.current}/{habit.streak.best}
				</div>
				{!isDueToday && (
					<div className="habit-next-occurrence">
						Next: {nextOccurrence.toLocaleDateString()}
					</div>
				)}
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
