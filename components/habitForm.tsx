import { useState } from 'react';
import { Notice } from 'obsidian';
// from files (Service, DEFAULT):
import { useAppContext } from 'context/appContext';
import { DEFAULT_HABIT, Habit, DEFAULT_PRIORITIES, DefaultPriority, DEFAULT_CATEGORIES, DefaultCategory, DEFAULT_DIFFICULTIES, DefaultDifficulty, DEFAULT_RECURRENCES, DefaultRecurrence } from 'data/DEFAULT';


export const HabitForm = ({onSuccess, onCancel, onDelete, existingHabit}: {onSuccess: () => void, onCancel?: () => void, onDelete?: () => void, existingHabit?: Habit}) => {
	/* Form to create or modify a habit */
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

		// Generate a unique ID for the new habit // todo : delete algo id.
		const habitsObj = await appContext.getHabits();
		const habits = Object.values(habitsObj);
		const usedIds = habits.map((h: any) => h.id);
		let nextIdNum = 1;
		let nextId = `habit_${nextIdNum}`;
		while (usedIds.includes(nextId)) {
			nextIdNum++;
			nextId = `habit_${nextIdNum}`;
		}

		if (existingHabit) {
			// Update existing habit
			const updatedHabit = {
			...existingHabit,
			title: title.trim(),
			shortDescription: shortDescription.trim(),
			description: description.trim() || "",
			settings: {
				...existingHabit.settings,
				category: validateValue(category.trim(), DEFAULT_CATEGORIES, existingHabit.settings.category as DefaultCategory),
				priority: validateValue(priority.trim(), DEFAULT_PRIORITIES, existingHabit.settings.priority as DefaultPriority),
				difficulty: validateValue(difficulty.trim(), DEFAULT_DIFFICULTIES, existingHabit.settings.difficulty as DefaultDifficulty),
			},
			recurrence: {
				...existingHabit.recurrence,
				interval: interval,
				unit: unit as DefaultRecurrence,
			}
			};
			await appContext.updateHabit(updatedHabit);
			onSuccess();
			return;
		} else {
			// Create new habit
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
					category: validateValue(category.trim(), DEFAULT_CATEGORIES, DEFAULT_HABIT.settings.category as DefaultCategory),
					priority: validateValue(priority.trim(), DEFAULT_PRIORITIES, DEFAULT_HABIT.settings.priority as DefaultPriority),
					difficulty: validateValue(difficulty.trim(), DEFAULT_DIFFICULTIES, DEFAULT_HABIT.settings.difficulty as DefaultDifficulty),
				},
				recurrence: {
					...DEFAULT_HABIT.recurrence,
					interval: interval,
					unit: unit as DefaultRecurrence,
				},
			};

			await appContext.addHabit(newHabit);
			console.log("Habit created:", newHabit);
			new Notice(`Habit "${newHabit.title}" created successfully!`);
			onSuccess();
			return;
		};
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
						<option value="">-- Select Category --</option>
						{DEFAULT_CATEGORIES.map(cat => (
						<option key={cat} value={cat}>
							{cat}
						</option>
						))}
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
						onChange={e => setUnit(e.target.value as DefaultRecurrence)}
					>
						{DEFAULT_RECURRENCES.map(rec => (
							<option key={rec} value={rec}>
								{rec.charAt(0).toUpperCase() + rec.slice(1)}
							</option>
						))}
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
							{DEFAULT_PRIORITIES.map(pri => (
								<option key={pri} value={pri}>
									{pri.charAt(0).toUpperCase() + pri.slice(1)}
								</option>
							))}
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
							{DEFAULT_DIFFICULTIES.map(diff => (
								<option key={diff} value={diff}>
									{diff.charAt(0).toUpperCase() + diff.slice(1)}
								</option>
							))}
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


function validateValue<T extends readonly string[]>(
	value: string,
	validValues: T,
	fallback: T[number]
): T[number] {
	return (validValues.includes(value as any) ? value : fallback) as T[number];
}
