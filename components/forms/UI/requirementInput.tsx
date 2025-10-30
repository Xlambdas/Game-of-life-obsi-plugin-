import { error } from "console";
import React, { useState, useEffect, useMemo } from "react";
// from file (Default):

export const RequirementsLevelInput = ({
	levelMin,
	setLevelMin,
	error, setError
}: {
	levelMin: number;
	setLevelMin: (v: number) => void;
	error: { levelMin?: string };
	setError: (e: { levelMin?: string }) => void;
}) => {

	return (
		<div>
			<label className="label-select">
				<span>Level min</span>
				<input
					type="number"
					name="levelMin"
					className="input"
					value={levelMin}
					onChange={e => {
						setLevelMin(Number(e.target.value))
						if (error.levelMin) {
							setError({ ...error, levelMin: "" });
						}
					}}
					min={1}
				/>
			</label>
		</div>
	);
};

interface QuestRequirement {
	id: string;
	title: string;
}

interface RequirementsQuestInputProps {
	existingQuest?: any;
	reqQuests: QuestRequirement[];
	setReqQuests: (quests: QuestRequirement[]) => void;
	allQuests: QuestRequirement[];
}

export const RequirementsQuestInput: React.FC<RequirementsQuestInputProps> = ({
	existingQuest,
	reqQuests,
	setReqQuests,
	allQuests,
}) => {
	// Initialize with existing requirements or one empty row
	const [requirements, setRequirements] = useState<QuestRequirement[]>(() => {
		return reqQuests && reqQuests.length > 0 ? reqQuests : [{ id: "", title: "" }];
	});

	const handleChange = (index: number, selectedId: string) => {
		const selectedQuest = allQuests.find(q => q.id === selectedId);

		const updated = requirements.map((req, i) =>
		i === index && selectedQuest
			? { id: selectedQuest.id, title: selectedQuest.title }
			: req
		);

		setRequirements(updated);
		// Only pass non-empty requirements to parent
		const validRequirements = updated.filter(req => req.id !== "");
		setReqQuests(validRequirements);
	};

	const handleAdd = () => {
		setRequirements([...requirements, { id: "", title: "" }]);
	};

	const handleRemove = (index: number) => {
		const updated = requirements.filter((_, i) => i !== index);
		const newRequirements = updated.length > 0 ? updated : [{ id: "", title: "" }];
		setRequirements(newRequirements);

		// Only pass non-empty requirements to parent
		const validRequirements = newRequirements.filter(req => req.id !== "");
		setReqQuests(validRequirements);
	};

	// Get already selected quest IDs to disable them in other dropdowns
	const selectedQuestIds = requirements.map(req => req.id).filter(Boolean);

	return (
		<div>
			<div className="form-group">
				<label>Prerequisite Quests:</label>
				<p className="helper-text">
					Select quests that must be completed before this one.
				</p>
				<div className="quest-requirements-container">
				{requirements.map((requirement, index) => (
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
						value={requirement.id}
						onChange={(e) => handleChange(index, e.target.value)}
						className={"input"}
						style={{ flex: 1, marginRight: "8px" }}
					>
						<option value="" disabled={!!requirement.id}>
						-- Select prerequisite quest --
						</option>
						{allQuests.map(quest => (
						<option
							key={quest.id}
							value={quest.id}
							disabled={
								selectedQuestIds.includes(quest.id) &&
								requirement.id !== quest.id ||
								existingQuest?.id === quest.id
							}
						>
							{quest.title}
						</option>
						))}
					</select>

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
					+ Add Prerequisite Quest
				</button>
			</div>
		</div>
	);
};

