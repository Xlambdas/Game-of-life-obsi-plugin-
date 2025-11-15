import { App, Modal, Notice } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { AppContextService } from "context/appContextService";
import { Habit } from "data/DEFAULT";


export class HabitListDateModal extends Modal {
	/* Modal to show habits for a specific date in the calendar */
	private context: AppContextService;
	private datestr: string;
	private dateHabit: { habitID: string; habitTitle: string; completed: boolean; couldBeCompleted: boolean }[];
	private habits: Habit[];
	private onHabitsUpdate: (updatedHabits: Habit[]) => void;

	constructor(
		app: App,
		context: AppContextService,
		datestr: string,
		dateHabit: { habitID: string; habitTitle: string; completed: boolean; couldBeCompleted: boolean }[],
		habits: Habit[],
		onHabitsUpdate: (updatedHabits: Habit[]) => void
	) {
		super(app);
		this.context = context;
		this.datestr = datestr;
		this.dateHabit = dateHabit;
		this.habits = habits;
		this.onHabitsUpdate = onHabitsUpdate;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('habit-list-date-modal-container');

		const root = ReactDOM.createRoot(contentEl);
		root.render(
			<HabitListDateContainer
				context={this.context}
				datestr={this.datestr}
				dateHabit={this.dateHabit}
				habits={this.habits}
				onHabitsUpdate={this.onHabitsUpdate}
				onClose={() => this.close()}
			/>
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

function toYMDLocal(input: string | Date): string {
	const d = input instanceof Date ? input : new Date(String(input));
	if (isNaN(d.getTime())) return ""; // invalid date guard
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}


interface HabitListDateContainerProps {
	context: AppContextService;
	datestr: string;
	dateHabit: { habitID: string; habitTitle: string; completed: boolean; couldBeCompleted: boolean }[];
	habits: Habit[];
	onHabitsUpdate: (updatedHabits: Habit[]) => void;
	onClose: () => void;
}

export const HabitListDateContainer: React.FC<HabitListDateContainerProps> = ({
	context,
	datestr,
	dateHabit,
	habits,
	onHabitsUpdate,
	onClose
}) => {
	/* Container component to display habits for a specific date */
	const habitService = context.habitService;
	const [displayHabits, setDisplayHabits] = React.useState(dateHabit);
	const [isLoading, setIsLoading] = React.useState<string | null>(null);

	React.useEffect(() => {
		setDisplayHabits(dateHabit);
	}, [dateHabit]);

	const toDate = (dateStr: string): Date => {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day); // Local timezone
	}

	const date = toDate(datestr);

	const handleToggleCompletion = async (habitID: string, currentlyCompleted: boolean) => {
		// console.log("Toggling habit completion:", habitID, currentlyCompleted);
		setIsLoading(habitID);
		try {
			const habit = await habitService.getHabitById(habitID);
			if (!habit) {
				new Notice('Habit not found');
				return;
			}

			const updatedHabit = await habitService.updateHabitCompletion(
				habit,
				!currentlyCompleted,
				date
			);

			// Save the updated habit
			await habitService.saveHabit(updatedHabit);

			if (!currentlyCompleted) {
				const updatedUser = await context.xpService.updateXPFromAttributes(
					habit.reward.attributes || {},
					true,
					'habit',
					habit.progress.level
				);
				await context.dataService.saveUser(updatedUser);
			}

			// Update all habits list
			const updatedHabits = habits.map(h =>
				h.id === updatedHabit.id ? updatedHabit : h
			);

			onHabitsUpdate(updatedHabits);

			// Update local display state
			setDisplayHabits(prev => prev.map(h =>
				h.habitID === habitID
					? { ...h, completed: !currentlyCompleted }
					: h
			));

			document.dispatchEvent(new CustomEvent("dbUpdated", {
				detail: {
					type: 'habit',
					action: !currentlyCompleted ? 'complete' : 'uncomplete',
					data: updatedHabit,
					date: date
				}
			}));

			new Notice(!currentlyCompleted
				? `✓ ${habit.title} completed`
				: `○ ${habit.title} unmarked`
			);

		} catch (error) {
			new Notice('Error updating habit completion');
			console.error("Error in handleToggleCompletion:", error);
		} finally {
			setIsLoading(null);
		}
	};

	const completedCount = displayHabits.filter(h => h.completed).length;
	const totalCount = displayHabits.length;

	return (
		<div className="habit-list-date-container">
			<div className="habit-modal-header">
				<div>
					<h2 className="habit-modal-title">{habitService.formatDate(date)}</h2>
					<p className="habit-modal-subtitle">
						{completedCount} of {totalCount} habits completed
					</p>
				</div>
			</div>

			{displayHabits.length === 0 ? (
				<div className="habit-empty-state">
					<p>No habits scheduled for this date</p>
				</div>
			) : (
				<ul className="habitList-list">
					{displayHabits.map((habit) => (
						<li
							key={habit.habitID}
							className={`habitList-item ${habit.completed ? 'habitList-completed' : ''} ${!habit.couldBeCompleted ? 'habitList-disabled' : ''}`}
						>
							<div className="habitList-item-content">
								<div className="habitList-checkbox-container">
									<input
										type="checkbox"
										checked={habit.completed}
										onChange={() => handleToggleCompletion(habit.habitID, habit.completed)}
										disabled={!habit.couldBeCompleted || isLoading === habit.habitID}
										className="habitList-checkbox"
										id={`habit-${habit.habitID}`}
									/>
									<label htmlFor={`habit-${habit.habitID}`} className="habitList-checkbox-label">
										<svg 
											className="habitList-checkbox-icon" 
											viewBox="0 0 24 24" 
											fill="none" 
											stroke="currentColor" 
											strokeWidth="3"
										>
											<polyline points="20 6 9 17 4 12"></polyline>
										</svg>
									</label>
								</div>
								<span className="habitList-title">{habit.habitTitle}</span>
								{!habit.couldBeCompleted && (
									<span className="habit-unavailable-badge">Unavailable</span>
								)}
							</div>
							{isLoading === habit.habitID && (
								<div className="habit-loading-spinner"></div>
							)}
						</li>
					))}
				</ul>
			)}

			<div className="habit-modal-footer">
				<button onClick={onClose} className="habitList-close-button">
					Done
				</button>
			</div>
		</div>
	);
};
