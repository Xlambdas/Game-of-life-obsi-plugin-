// from file (Default):
import { DEFAULT_CATEGORIES, DEFAULT_DIFFICULTIES, DEFAULT_PRIORITIES, DEFAULT_RECURRENCES, DefaultRecurrence } from "data/DEFAULT";
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
	shortDescription, setShortDescription,
	category, setCategory,
	error,
	setError
}: {
	type?: string; // "quest" or "habit"
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
		</div>
	)
};

export const SupplementaryInput = ({
	type = "Quest",
	description, setDescription,
	priority, setPriority,
	difficulty, setDifficulty,
}: {
	type?: string; // "Quest" or "Habit"
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
			<h3>{type} Parameters</h3>
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
	console.log("formInputs:", existingQuest);
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
	condQuests, setCondQuests,
	condHabits, setCondHabits,
	allQuests, allHabits,
	error, setError
}: {
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
				condQuests={condQuests}
				setCondQuests={setCondQuests}
				allQuests={allQuests}
				error={error}
				setError={setError}
			/>
			{/* <ConditionHabitInput
				condHabits={condHabits}
				setCondHabits={setCondHabits}
				allHabits={allHabits}
			/> */}
		</div>
	)
};

export const RecurrenceInput = ({
	interval, setInterval,
	unit, setUnit,
	error, setError
}: {
	interval: number;
	setInterval: (interval: number) => void;
	unit: string;
	setUnit: (unit: string) => void;
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}) => {
	return (
		<div className="form-section">
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
							setError({ ...error, interval: "" });
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
	)
};
