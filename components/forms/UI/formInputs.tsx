// from file (Default):
import {
	DEFAULT_CATEGORIES,
	DEFAULT_DIFFICULTIES,
	DEFAULT_PRIORITIES,
	DEFAULT_RECURRENCES,
	RECURRENCE_TYPES,
	DefaultRecurrence,
	RecurrenceType,
	Weekday,
	Nth,
	WEEKDAY_LABELS,
	NTH_LABELS,
	DEFAULT_GOAL_UNITS
} from "data/DEFAULT";
// from file (UI, components):
import { RewardAttributeInput, AttributeReward } from "./rewardAttributeInput";
import { RequirementsLevelInput, RequirementsQuestInput } from "./requirementInput";
import { ConditionQuestInput, ConditionHabitInput } from "./progressCondInput";


export const TitleInput = ({
	title,
	setTitle,
	error,
	setError
}: {
	title: string;
	setTitle: (title: string) => void;
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}) => {
	return (
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
								setError({ ...error, title: "" });
							}
						}}
					/>
				</label>
				<p className="helper-text">
                    A clear and concise title helps you stay focused on your main objective.
                </p>
			</div>
	)
};

export const ShortDescription_CategoryInput = ({
	type = "quest",
	isUnlocked,
	shortDescription, setShortDescription,
	category, setCategory,
	error,
	setError
}: {
	type?: string; // "quest" or "habit"
	isUnlocked: (feature: string) => boolean;
	shortDescription: string;
	setShortDescription: (desc: string) => void;
	category: string;
	setCategory: (cat: string) => void;
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}) => {
	return (
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
							setError({ ...error, shortDescription: "" });
						}
					}}
				/>
			</label>
			<p className="helper-text">
				A brief overview of the {type}'s objectives. Keep it concise yet informative !
			</p>
			{isUnlocked("category") && (
				<label className="label-select">
					<span>Category</span>
					<select
						name="category"
						className="input"
						value={category}
						onChange={e => setCategory(e.target.value)}
					>
						<option value="">-- Select Category --</option>
						{DEFAULT_CATEGORIES.map((cat) => (
							<option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
						))}
					</select>
				</label>
			)}
		</div>
	)
};

export const SupplementaryInput = ({
	type = "Quest",
	isUnlocked,
	description, setDescription,
	priority, setPriority,
	difficulty, setDifficulty,
}: {
	type?: string; // "Quest" or "Habit"
	isUnlocked: (feature: string) => boolean;
	description: string;
	setDescription: (desc: string) => void;
	priority: string;
	setPriority: (priority: string) => void;
	difficulty: string;
	setDifficulty: (difficulty: string) => void;
}) => {
	return (
		<div>
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
			{(isUnlocked("priority") || isUnlocked("difficulty")) && (
				<h3>{type} Parameters</h3>
			)}
			{isUnlocked("priority") && (
				<label className="label-select">
					<span>Priority</span>
					<select
						name="priority"
						className="input"
						value={priority}
						onChange={e => setPriority(e.target.value)}
					>
						{DEFAULT_PRIORITIES.map(pri => (
							<option key={pri} value={pri}>{pri.charAt(0).toUpperCase() + pri.slice(1)}</option>
						))}
					</select>
				</label>
			)}
			{isUnlocked("difficulty") && (
			<label className="label-select">
				<span>Difficulty</span>
				<select
					name="difficulty"
					className="input"
					value={difficulty}
					onChange={e => setDifficulty(e.target.value)}
				>
					{DEFAULT_DIFFICULTIES.map(diff => (
						<option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
					))}
				</select>
			</label>
			)}
		</div>
	)
};

export const DueDateInput = ({
	dueDate, setDueDate,
	error,
	setError
}: {
	dueDate: string;
	setDueDate: (date: string) => void;
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}) => {
	return (
		<div>
			<label className="label-select">
				<span>Due Date</span>
				<input
					type="date"
					name="dueDate"
					className={error.dueDate ? "input-error" : "date-input"}
					value={dueDate}
					onChange={e => {
						setDueDate(e.target.value);
						if (error.dueDate) {
							setError({ ...error, dueDate: "" });
						}
					}}
				/>
			</label>
			<p className="helper-text">
				Set a deadline to keep your quest on track. A clear end date helps you stay focused and motivated!
			</p>
		</div>
	)
};

export const RequirementsInput = ({
	existingQuest,
	levelMin, setLevelMin,
	reqQuests, setReqQuests,
	allQuests,
	error, setError
}: {
	existingQuest?: any;
	levelMin: number;
	setLevelMin: (level: number) => void;
	reqQuests: { id: string; title: string }[];
	setReqQuests: (quests: { id: string; title: string }[]) => void;
	allQuests: { id: string; title: string }[];
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}) => {
	// console.log("formInputs:", existingQuest);
	//input: a list of all (quests: {id, title}), and a level requirment
	return (
		<div>
			<hr className="separator"></hr>
			<h3>Requirements</h3>
			<RequirementsLevelInput
				levelMin={levelMin}
				setLevelMin={setLevelMin}
				error={error}
				setError={setError}
			/>
			<RequirementsQuestInput
				existingQuest={existingQuest}
				reqQuests={reqQuests}
				setReqQuests={setReqQuests}
				allQuests={allQuests}
			/>
		</div>
	)
};


export const RewardsInput = ({
	attributeRewards, setAttributeRewards,
	error, setError
}: {
	attributeRewards: AttributeReward;
	setAttributeRewards: (rewards: AttributeReward) => void;
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}) => {
	return (
		<div>
			<hr className="separator"></hr>
			<h3>Rewards</h3>
			<RewardAttributeInput
				initialValue={attributeRewards}
				onChange={setAttributeRewards}
				error={error}
				setError={setError}
			/>
		</div>
	)
};

export const ProgressConditionInput = ({
	existingQuest,
	condQuests, setCondQuests,
	condHabits, setCondHabits,
	allQuests, allHabits,
	error, setError
}: {
	existingQuest?: any;
	condQuests: { id: string; title: string; targetProgress: number }[];
	setCondQuests: (quests: { id: string; title: string; targetProgress: number }[]) => void;
	condHabits: { id: string; title: string; targetStreak: number }[];
	setCondHabits: (habits: { id: string; title: string; targetStreak: number }[]) => void;
	allQuests: { id: string; title: string; targetProgress: number }[];
	allHabits: { id: string; title: string; targetStreak: number }[];
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}) => {
	return (
		<div>
			<hr className="separator"></hr>
			<h3>Progress Conditions</h3>
			<ConditionQuestInput
				existingQuest={existingQuest}
				condQuests={condQuests}
				setCondQuests={setCondQuests}
				allQuests={allQuests}
				error={error}
				setError={setError}
			/>
			<br/>
			<ConditionHabitInput
				condHabits={condHabits}
				setCondHabits={setCondHabits}
				allHabits={allHabits}
				error={error}
				setError={setError}
			/>
		</div>
	)
};

export const RecurrenceInput = ({
	isUnlocked,
	recurrenceType, setRecurrenceType,
	interval, setInterval,
	unit, setUnit,
	weekdays, setWeekdays,
	nthWeekday, setNthWeekday,
	error, setError,
}: {
	isUnlocked: boolean;
	recurrenceType: RecurrenceType;
	setRecurrenceType: (type: RecurrenceType) => void;
	interval: number;
	setInterval: (interval: number) => void;
	unit: string;
	setUnit: (unit: DefaultRecurrence) => void;
	weekdays: Weekday[];
	setWeekdays: (days: Weekday[]) => void;
	nthWeekday: Nth[] | undefined;
	setNthWeekday: (nth: Nth[] | undefined) => void;
	error: Record<string, string>;
	setError: (error: Record<string, string>) => void;
}) => {

	// --- handlers ---

	const handleTypeChange = (type: RecurrenceType) => {
		setRecurrenceType(type);
		const { interval: _, weekdays: __, ...rest } = error;
		setError(rest);
	};

	const toggleWeekday = (day: Weekday) => {
		const next = weekdays.includes(day)
			? weekdays.filter(d => d !== day)
			: [...weekdays, day].sort((a, b) => a - b);
		setWeekdays(next);
		if (error.weekdays) setError({ ...error, weekdays: '' });
	};

	const handleNthChange = (value: string) => {
		setNthWeekday(value === 'every' ? undefined : [Number(value) as Nth]);
	};

	if (!isUnlocked) {
		return (
			<div className="form-section">
				<hr className="separator" />
				<h3>Recurrence</h3>
				<label className="label-select">
					<span>Every</span>
					<input
						type="number"
						name="recurrence"
						placeholder="1, 2, 3..."
						className={`input ${error.interval ? 'input-error' : ''}`}
						value={interval}
						onChange={e => {
							setInterval(Number(e.target.value));
							if (error.interval) setError({ ...error, interval: '' });
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
				{error.interval && <p className="error-text">{error.interval}</p>}
				<p className="helper-text">Consistency is key!</p>
			</div>
		);
	} else {
		return (
			<div className="form-section">
				<hr className="separator" />
				<h3>Recurrence</h3>

				{/* ── Type selector ── */}
				<label className="label-select">
					<span>Type</span>
					<div className="segmented-control">
						{RECURRENCE_TYPES.map(type => (
							<button
								key={type}
								type="button"
								className={`segment ${recurrenceType === type ? 'active' : ''}`}
								onClick={() => handleTypeChange(type)}
							>
								{type === 'interval' ? 'Interval' : 'Weekdays'}
							</button>
						))}
					</div>
				</label>

				{/* ── Interval mode ── */}
				{recurrenceType === 'interval' && (
					<>
						<label className="label-select">
							<span>Every</span>
							<input
								type="number"
								name="recurrence"
								placeholder="1, 2, 3..."
								className={`input ${error.interval ? 'input-error' : ''}`}
								value={interval}
								onChange={e => {
									setInterval(Number(e.target.value));
									if (error.interval) setError({ ...error, interval: '' });
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
						{error.interval && <p className="error-text">{error.interval}</p>}
						<p className="helper-text">
							Set how often you want to perform this habit. Consistency is key!
						</p>
					</>
				)}

				{/* ── Weekday mode ── */}
				{recurrenceType === 'weekday' && (
					<>
						<label className="label-select">
							<span>Days</span>
							<div className="weekday-picker">
								{WEEKDAY_LABELS.map(({ short, label, value }) => (
									<button
										key={value}
										type="button"
										title={label}
										className={`weekday-btn ${weekdays.includes(value) ? 'active' : ''}`}
										onClick={() => toggleWeekday(value)}
									>
										{short}
									</button>
								))}
							</div>
						</label>
						{error.weekdays && <p className="error-text">{error.weekdays}</p>}

						{weekdays.length > 0 && (
							<label className="label-select">
								<span>Occurrence</span>
								<select
									className="input"
									value={nthWeekday !== undefined ? String(nthWeekday) : 'every'}
									onChange={e => handleNthChange(e.target.value)}
								>
									<option value="every">Every week</option>
									{NTH_LABELS.map(({ label, value }) => (
										<option key={value} value={value}>
											{label} of the month
										</option>
									))}
								</select>
							</label>
						)}

						<p className="helper-text">
							{weekdays.length === 0
								? 'Select at least one day to continue.'
								: nthWeekday !== undefined
									? `Every ${NTH_LABELS.find(n => n.value === nthWeekday[0])?.label} ${weekdays.map(d => WEEKDAY_LABELS.find(w => w.value === d)?.label).join(', ')} of the month.`
									: `Every ${weekdays.map(d => WEEKDAY_LABELS.find(w => w.value === d)?.label).join(', ')}.`
							}
						</p>
					</>
				)}
			</div>
		);
	}
};


export const GoalInput = ({
	goal, setGoal,
	goalUnit, setGoalUnit,
	error, setError
}: {
	goal: number;
	setGoal: (goal: number) => void;
	goalUnit: string | undefined;
	setGoalUnit: (unit: string | undefined) => void;
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}) => {
	return (
		<div>
			<label className="label-select">
				<span>Goal</span>
				<input
					type="number"
					name="goal"
					placeholder="e.g. 2000"
					className={error.goal ? 'input-error' : 'input'}
					value={goal === 0 ? '' : goal}
					onChange={e => {
						setGoal(Number(e.target.value));
						if (error.goal) {
							setError({ ...error, goal: '' });
						}
					}}
				/>
			</label>
			<label className="label-select">
				<span>Unit</span>
				<select
					name="goalUnit"
					className={`input ${error.goalUnit ? 'input-error' : 'input'}`}
					value={goalUnit || 'undefined'}
					onChange={e => {
						const value = e.target.value === 'undefined' ? undefined : e.target.value;
						setGoalUnit(value);
						if (error.goalUnit) setError({ ...error, goalUnit: '' });
					}}
				>
					<option value="undefined">Select or define unit...</option>
					{DEFAULT_GOAL_UNITS.map(unit => (
						<option key={unit} value={unit}>{unit}</option>
					))}
					<option value="custom">+ Add custom unit</option>
				</select>
			</label>
			{goalUnit === 'custom' && (
				<label className="label-select">
					<input
						type="text"
						name="customGoalUnit"
						placeholder="e.g. pages, reps, laps..."
						className={error.goalUnit ? 'input-error' : 'inputs'}
						onChange={e => {
							setGoalUnit(e.target.value || undefined);
							// if (error.goalUnit) setError({ ...error, goalUnit: '' });
						}}
					/>
				</label>
			)}
			<p className="helper-text">
				Define a clear goal and unit to track your progress effectively. It adds purpose and motivation to your habit!
			</p>
		</div>
	)
};
