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
				<label>Quests :</label>
				<p className="helper-text">
					Select quests that contribute to the progress of this quest.
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
							-- Select prerequisite quest --
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
							className={error.attributeRewards ? "input-error" : "attribute-xp-input"}
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



interface habitCondition {
	id: string;
	title: string;
}

interface ConditionHabitInputProps {
	existingHabit?: any;
	condHabits: habitCondition[];
	setCondHabits: (habits: habitCondition[]) => void;
	allHabits: habitCondition[];
}

export const ConditionHabitInput: React.FC<ConditionHabitInputProps> = ({
	existingHabit,
	condHabits,
	setCondHabits,
	allHabits,
}) => {
		// Initialize with existing requirements or one empty row
		
		return (
			<div>
				<div className="form-group">
					<label>Prerequisite Quests:</label>
					<p className="helper-text">
						Select quests that must be completed before this one.
					</p>
					</div>
			</div>
		);
	};
