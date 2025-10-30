import React, { useState } from "react";


interface ConditionQuest {
	id: string;
	title: string;
	targetProgress: number;
}

interface ConditionQuestInputProps {
	existingQuest?: any;
	condQuests: ConditionQuest[];
	setCondQuests: (quests: ConditionQuest[]) => void;
	allQuests: ConditionQuest[];
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}

export const ConditionQuestInput: React.FC<ConditionQuestInputProps> = ({
	existingQuest,
	condQuests,
	setCondQuests,
	allQuests,
	error, setError,
}) => {
	// Initialize with existing requirements or one empty row
	const [conditionQuestsLocal, setConditionQuestsLocal] = useState<ConditionQuest[]>(() => {
		return condQuests && condQuests.length > 0 ? condQuests : [{ id: "", title: "", targetProgress: 100 }];
	});

	const handleChange = (index: number, selectedId: string, progress: number) => {
		const selectedQuest = allQuests.find(q => q.id === selectedId);

		const updated = conditionQuestsLocal.map((req, i) =>
		i === index && selectedQuest
			? { id: selectedQuest.id, title: selectedQuest.title, targetProgress: progress }
			: req
		);

		setConditionQuestsLocal(updated);
		// Only pass non-empty requirements to parent
		const validRequirements = updated.filter(req => req.id !== "");
		setCondQuests(validRequirements);
	};

	const handleAdd = () => {
		setConditionQuestsLocal([...conditionQuestsLocal, { id: "", title: "", targetProgress: 100 }]);
	};

	const handleRemove = (index: number) => {
		const updated = conditionQuestsLocal.filter((_, i) => i !== index);
		const newRequirements = updated.length > 0 ? updated : [{ id: "", title: "", targetProgress: 100 }];
		setConditionQuestsLocal(newRequirements);

		// Only pass non-empty requirements to parent
		const validRequirements = newRequirements.filter(req => req.id !== "");
		setCondQuests(validRequirements);
	};

	// Get already selected quest IDs to disable them in other dropdowns
	const selectedQuestIds = conditionQuestsLocal.map(req => req.id).filter(Boolean);

	return (
		<div>
			<div className="form-group">
				<label>Quests:</label>
				<p className="helper-text">
					Select quests that contribute to the progress of this quest. Enter a percentage (0–100) for each selected quest:
					<br />
					0% = quest has no contribution yet, 100% = quest must be fully completed to count.
				</p>
				<div className="quest-requirements-container">
					{conditionQuestsLocal.map((condition, index) => (
						<div
							key={index}
							className="quest-requirement-row"
							style={{
								display: "flex",
								alignItems: "center",
								marginBottom: "8px"
							}}
						>
						<select
							value={condition.id}
							onChange={(e) => handleChange(index, e.target.value, condition.targetProgress)}
							className={"input"}
							style={{ flex: 1, marginRight: "8px" }}
						>
							<option value="" disabled={!!condition.id}>
								-- Select quest --
							</option>
							{allQuests.map(quest => (
							<option
								key={quest.id}
								value={quest.id}
								disabled={
									selectedQuestIds.includes(quest.id) &&
									condition.id !== quest.id ||
									existingQuest?.id === quest.id
								}
							>
								{quest.title}
							</option>
							))}
						</select>
						<input
							type="number"
							placeholder="XP amount..."
							value={condition.targetProgress || ""}
							onChange={(e) => handleChange(index, condition.id, Number(e.target.value))}
							className={error.condQuests ? "input-error" : "attribute-xp-input"}
							style={{ width: "35%", marginRight: "8px" }}
						/>

						<button
							type="button"
							onClick={() => handleRemove(index)}
							className="mod-warning"
							style={{
							width: "24px",
							height: "24px",
							padding: 0,
							display: "flex",
							alignItems: "center",
							justifyContent: "center"
							}}
						>
							×
						</button>
					</div>
					))}
				</div>
				<button
					type="button"
					className="mod-cta"
					onClick={handleAdd}
				>
					+ Add Quest condition
				</button>
			</div>
		</div>
	);
};


interface ConditionHabit {
	id: string;
	title: string;
	targetStreak: number;
}

interface ConditionHabitInputProps {
	existingHabit?: any;
	condHabits: ConditionHabit[];
	setCondHabits: (habits: ConditionHabit[]) => void;
	allHabits: ConditionHabit[];
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}

export const ConditionHabitInput: React.FC<ConditionHabitInputProps> = ({
	condHabits,
	setCondHabits,
	allHabits,
	error, setError,
}) => {
	// Initialize with existing requirements or one empty row
	const [conditionHabitsLocal, setConditionHabitsLocal] = useState<ConditionHabit[]>(() => {
		return condHabits && condHabits.length > 0 ? condHabits : [{ id: "", title: "", targetStreak: 21 }];
	});

	const handleChange = (index: number, selectedId: string, streak: number) => {
		const selectedHabit = allHabits.find(h => h.id === selectedId);

		const updated = conditionHabitsLocal.map((req, i) =>
		i === index && selectedHabit
			? { id: selectedHabit.id, title: selectedHabit.title, targetStreak: streak }
			: req
		);

		setConditionHabitsLocal(updated);
		// Only pass non-empty requirements to parent
		const validRequirements = updated.filter(req => req.id !== "");
		setCondHabits(validRequirements);
	};

	const handleAdd = () => {
		setConditionHabitsLocal([...conditionHabitsLocal, { id: "", title: "", targetStreak: 21 }]);
	};

	const handleRemove = (index: number) => {
		const updated = conditionHabitsLocal.filter((_, i) => i !== index);
		const newRequirements = updated.length > 0 ? updated : [{ id: "", title: "", targetStreak: 21 }];
		setConditionHabitsLocal(newRequirements);

		// Only pass non-empty requirements to parent
		const validRequirements = newRequirements.filter(req => req.id !== "");
		setCondHabits(validRequirements);
	};

	// Get already selected habit IDs to disable them in other dropdowns
	const selectedHabitIds = conditionHabitsLocal.map(req => req.id).filter(Boolean);

	return (
		<div>
			<div className="form-group">
				<label>Habits:</label>
				<p className="helper-text">
					Select habits that contribute to the progress of this quest.
					<br />
					Enter a number of streaks for each selected habit.
				</p>
				<div className="quest-requirements-container">
					{conditionHabitsLocal.map((condition, index) => (
						<div
							key={index}
							className="quest-requirement-row"
							style={{
								display: "flex",
								alignItems: "center",
								marginBottom: "8px"
							}}
						>
						<select
							value={condition.id}
							onChange={(e) => handleChange(index, e.target.value, condition.targetStreak)}
							className={"input"}
							style={{ flex: 1, marginRight: "8px" }}
						>
							<option value="" disabled={!!condition.id}>
								-- Select habit --
							</option>
							{allHabits.map(habit => (
							<option
								key={habit.id}
								value={habit.id}
								disabled={
									selectedHabitIds.includes(habit.id) &&
									condition.id !== habit.id
								}
							>
								{habit.title}
							</option>
							))}
						</select>
						<input
							type="number"
							placeholder="XP amount..."
							value={condition.targetStreak || ""}
							onChange={(e) => handleChange(index, condition.id, Number(e.target.value))}
							className={error.condHabits ? "input-error" : "attribute-xp-input"}
							style={{ width: "35%", marginRight: "8px" }}
						/>

						<button
							type="button"
							onClick={() => handleRemove(index)}
							className="mod-warning"
							style={{
							width: "24px",
							height: "24px",
							padding: 0,
							display: "flex",
							alignItems: "center",
							justifyContent: "center"
							}}
						>
							×
						</button>
					</div>
					))}
				</div>
				<button
					type="button"
					className="mod-cta"
					onClick={handleAdd}
				>
					+ Add Habit condition
				</button>
			</div>
		</div>
	);
};
