import { DEFAULT_HABIT, Habit } from 'data/DEFAULT';
import { useState } from 'react';
import { useAppContext } from 'context/appContext';
import { Notice } from 'obsidian';

export const HabitForm = ({onSuccess, onCancel, onDelete, existingHabit}: {onSuccess: () => void, onCancel?: () => void, onDelete?: () => void, existingHabit?: Habit}) => {
	const [title, setTitle] = useState(existingHabit?.title || "");
	const [shortDescription, setShortDescription] = useState(existingHabit?.shortDescription || "");
	const [interval, setInterval] = useState(existingHabit?.recurrence.interval || DEFAULT_HABIT.recurrence.interval);
	const [unit, setUnit] = useState(existingHabit?.recurrence.unit || DEFAULT_HABIT.recurrence.unit);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [description, setDescription] = useState(existingHabit?.description || "");
	const [category, setCategory] = useState(existingHabit?.settings.category || "");
	const [priority, setPriority] = useState(existingHabit?.settings.priority || "");
	const [difficulty, setDifficulty] = useState(existingHabit?.settings.difficulty || "");

	const [error, setError] = useState<{[key: string]: string}>({}); // Initialize error state
	const appContext = useAppContext();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const newError: {[key: string]: string} = {};
		if (!title.trim()) {
			newError.title = "Title is required.";
		}
		if (!shortDescription.trim()) {
			newError.shortDescription = "Short description is required.";
		}
		if (!interval || isNaN(interval) || interval < 1) {
			newError.interval = "Interval must be a positive number.";
		}
		if (Object.keys(newError).length > 0) {
			setError(newError);
			new Notice("Please fix the errors in the form.");
			return;
		}
		setError({}); // Clear errors if validation passes

		const habitsObj = await appContext.getHabits();
		const habits = Object.values(habitsObj);
		const usedIds = habits.map((h: any) => h.id);
		let nextIdNum = 1;
		let nextId = `habit_${nextIdNum}`;
		while (usedIds.includes(nextId)) {
			nextIdNum++;
			nextId = `habit_${nextIdNum}`;
		}

        const newHabit = {
			...DEFAULT_HABIT,
			id: nextId,
			title: title.trim(),
			shortDescription: shortDescription.trim(),
			description: description.trim() || "",
			settings: {
				...DEFAULT_HABIT.settings,
				category: category.trim() || DEFAULT_HABIT.settings.category,
				priority: (["low","medium","high"].includes(priority.trim())
				? priority.trim()
				: DEFAULT_HABIT.settings.priority) as "low" | "medium" | "high",
				difficulty: (["easy", "medium", "hard", "expert"].includes(difficulty.trim())
					? difficulty.trim()
					: DEFAULT_HABIT.settings.difficulty) as "easy" | "medium" | "hard" | "expert",
			},
			recurrence: {
				...DEFAULT_HABIT.recurrence,
				interval: interval,
				unit: unit as "days" | "weeks" | "months" | "years",
			}
		};

		await appContext.addHabit(newHabit);
		setTitle(""); // reset le champ
		console.log("Habit created:", newHabit);
		new Notice(`Habit "${newHabit.title}" created successfully!`);

		onSuccess();
	};

	return (
		<form onSubmit={handleSubmit} className="quest-form">
			{/* Header */}
			<div className="form-header">
				<h1>Create a new Habit</h1>
				<label className="switch" title="Afficher/Masquer les paramètres supplémentaires">
					<input
						type="checkbox"
						checked={showAdvanced}
						onChange={(e) => setShowAdvanced(e.target.checked)}
					/>
					<span className="slider round"></span>
				</label>
			</div>
			{/* Title */}
			<div className="form-section">
				<label>
					Title *
					<input
						type="text"
						name="title"
						placeholder="Enter quest title..."
						className={error.title ? "input-error" : "input"}
						value={title}
						onChange={e => {
							setTitle(e.target.value);
							if (error.title) {
								setError((prev) => ({ ...prev, title: "" }));
							}
						}}
					/>
				</label>
				<p className="helper-text">
                    A clear and concise title helps you stay focused on your main objective.
                </p>
			</div>
			{/* Short Description */}
			<div className="form-section">
				<label>
					Short Description *
					<input
						type="text"
						name="shortDescription"
						className={error.shortDescription ? "input-error" : "input"}
						placeholder="Enter a brief overview..."
						value={shortDescription}
						onChange={e => {
							setShortDescription(e.target.value);
							if (error.shortDescription) {
								setError((prev) => ({ ...prev, shortDescription: "" }));
							}
						}}
					/>
				</label>
				<p className="helper-text">
					A brief overview of the quest's objectives. Keep it concise yet informative !
				</p>
				<label className="label-select">
					<span>Category</span>
					<select
						name="category"
						className="input"
						value={category}
						onChange={e => setCategory(e.target.value)}
					>
						<option value="Undefined">Select category</option>
						<option value="Physical">Physical</option>
						<option value="Mental">Mental</option>
						<option value="Social">Social</option>
						<option value="Creative">Creative</option>
						<option value="Emotional">Emotional</option>
						<option value="Organizational">Organizational</option>
						<option value="Exploration">Exploration</option>
					</select>
				</label>
				<hr className='separator'></hr>
				<h3>Recurrence</h3>
				<label className="label-select">
					<span>Interval</span>
					<input
						type="number"
						name="recurrence"
						placeholder="1, 2, 3..."
						className="input"
						value={interval}
						onChange={(e) => {
							setInterval(Number(e.target.value))
							if (error.interval) {
								setError((prev) => ({ ...prev, interval: "" }));
							}
						}}
						min={1}
					/>
				</label>
				<label className="label-select">
					<span>Unit</span>
					<select
						name="recurrenceUnit"
						className="input"
						value={unit}
						onChange={e => setUnit(e.target.value as "days" | "weeks" | "months" | "years")}
					>
						<option value="days">Day(s)</option>
						<option value="weeks">Week(s)</option>
						<option value="months">Month(s)</option>
						<option value="years">Year(s)</option>
					</select>
	 			</label>
				<p className="helper-text">
					Set how often you want to perform this habit. Consistency is key to building lasting habits!
				</p>
			</div>
			
			{/* Advanced Settings */}
			{showAdvanced && (
				<div className="form-section">
					<hr className="separator"></hr>
					<h2>Supplementary Settings</h2>
					<label>
						Full description
						<textarea
							placeholder="Enter quest description..."
							value={description}
							onChange={e => setDescription(e.target.value)}
						/>
					</label>
					<p className="helper-text">
						The more vivid and detailed your description is, the more powerful and motivating it becomes. Add purpose, emotion, and clarity!
					</p>
					<hr className="separator"></hr>
					<h3>Habit Parameters</h3>
					<label className="label-select">
						<span>Priority</span>
						<select
							name="priority"
							className="input"
							value={priority}
							onChange={e => setPriority(e.target.value)}
						>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
						</select>
					</label>
					<label className="label-select">
						<span>Difficulty</span>
						<select
							name="difficulty"
							className="input"
							value={difficulty}
							onChange={e => setDifficulty(e.target.value)}
						>
							<option value="easy">Easy</option>
							<option value="medium">Medium</option>
							<option value="hard">Hard</option>
							<option value="expert">Expert</option>
						</select>
					</label>
				</div>
			)}
			{/* Footer */}
			<div className="form-footer">
				<span className="required-note">* Required fields</span>
                <div className="button-group">
                    {onCancel && (
						<button type="button" onClick={onCancel}>Cancel</button>
					)}
					{onDelete && (
						<button type="button" className="delete-btn" onClick={onDelete}>Delete</button>
					)}
                    <button type="submit" className="save-btn">Save Quest</button>
                </div>
			</div>
        </form>
	)
};
