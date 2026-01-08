import { App, Modal } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
// from files (context):
import { AppContextService } from "context/appContextService";
// from files (Default, Helpers):
import { Habit } from "data/DEFAULT";
import { DateString } from "helpers/dateHelpers";

interface HabitListDateContainerProps {
	context: AppContextService;
	datestr: string;
	dateHabit: { habitID: string; habitTitle: string; completed: boolean; couldBeCompleted: boolean }[];
	toggleHabitCompletion: (habitID: string, dateStr: DateString) => Promise<void>;
	onClose: () => void;
}

export class HabitListDateModal extends Modal {
	/* Modal to show a list of habits for a specific date in the calendar */
	private context: AppContextService;
	private datestr: string;
	private dateHabit: { habitID: string; habitTitle: string; completed: boolean; couldBeCompleted: boolean }[];
	private toggleHabitCompletion: (habitID: string, dateStr: DateString) => Promise<void>;

	constructor(
		app: App,
		context: AppContextService,
		datestr: string,
		dateHabit: { habitID: string; habitTitle: string; completed: boolean; couldBeCompleted: boolean }[],
		toggleHabitCompletion: (habitID: string, dateStr: DateString) => Promise<void>,
	) {
		super(app);
		this.context = context;
		this.datestr = datestr;
		this.dateHabit = dateHabit;
		this.toggleHabitCompletion = toggleHabitCompletion;
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
				toggleHabitCompletion={this.toggleHabitCompletion}
				onClose={() => this.close()}
			/>
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export const HabitListDateContainer: React.FC<HabitListDateContainerProps> = ({
	context,
	datestr,
	dateHabit,
	toggleHabitCompletion,
	onClose
}) => {
	/* Container component to display habits for a specific date */
	const habitService = context.habitService;
	const [displayHabits, setDisplayHabits] = React.useState(dateHabit);
	const [isLoading, setIsLoading] = React.useState<string | null>(null);

	React.useEffect(() => {
		setDisplayHabits(dateHabit);
	}, [dateHabit]);

	// React.useEffect(() => {
	// 	const handleDbUpdate = async (event: CustomEvent) => {
	// 		console.log("Modal received dbUpdated event:", event.detail);
	// 		// const updatedDateHabits = await habitService.pairDateHabit(datestr);
	// 		// setDisplayHabits(updatedDateHabits);
	// 	};
	// 	document.addEventListener("dbUpdated", handleDbUpdate as EventListener);

	// 	return () => {
	// 		document.removeEventListener("dbUpdated", handleDbUpdate as EventListener);
	// 		console.error("HabitListDateContainer unmounted, removed dbUpdated listener");
	// 	};
	// }, [datestr, habitService]);

	// ------------------------------------
	// Complete Habit for a specific date :
	const handleToggleCompletion = async (habitId: string) => {
		// console.log("<>------------ in habit listDateContainer :", habitId, currentlyCompleted);
		if (!datestr) return;
		setIsLoading(habitId);
		try {
			// Update the database
			await toggleHabitCompletion(habitId, datestr);
			const updatedDateHabits = await habitService.pairDateHabit(datestr);
			setDisplayHabits(updatedDateHabits);
		} catch (error) {
			console.error("Error toggling habit:", error);
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
					<h2 className="habit-modal-title">{datestr}</h2>
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
										onChange={() => handleToggleCompletion(habit.habitID)}
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
