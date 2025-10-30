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


interface RequirementsQuestInputProps_test {
	reqQuests: QuestRequirement[];
	setReqQuests: (quests: QuestRequirement[]) => void;
	allQuests: QuestRequirement[];
	error: { [key: string]: string };
	setError: (error: { [key: string]: string }) => void;
}

export const RequirementsQuestInput_test: React.FC<RequirementsQuestInputProps_test> = ({
	reqQuests,
	setReqQuests,
	allQuests,
	error,
	setError
}) => {
	// Detect if we’re modifying an existing quest
	const isEditing = reqQuests.length > 0;

	// If editing, try to guess the current quest (it’s excluded from the dropdown)
	const [filteredAllQuests, setFilteredAllQuests] = React.useState(allQuests);

	React.useEffect(() => {
		// We assume the current quest is the one that’s not in allQuests as a prerequisite
		// and has at least one of its requirements already present.
		let currentQuestId: string | null = null;

		// Try to find the current quest by looking for a match in existing data (best-effort)
		if (isEditing && allQuests.length > 0) {
			// If allQuests includes all quests (including current), we can exclude one
			// that has same title/id as an edited one (it will be detected later in parent)
			const possibleCurrent = allQuests.find(
				q => reqQuests.some(rq => rq.id === q.id)
			);
			currentQuestId = possibleCurrent ? possibleCurrent.id : null;
		}

		if (currentQuestId) {
			setFilteredAllQuests(allQuests.filter(q => q.id !== currentQuestId));
		} else {
			setFilteredAllQuests(allQuests);
		}
	}, [allQuests, reqQuests, isEditing]);

	// Initialize with existing requirements or one empty row
	const [requirements, setRequirements] = React.useState<QuestRequirement[]>(() =>
		reqQuests.length > 0 ? reqQuests : [{ id: "", title: "" }]
	);

	const handleChange = (index: number, selectedId: string) => {
		const selectedQuest = filteredAllQuests.find(q => q.id === selectedId);
		const updated = requirements.map((req, i) =>
			i === index && selectedQuest
				? { id: selectedQuest.id, title: selectedQuest.title }
				: req
		);

		setRequirements(updated);
		setReqQuests(updated.filter(req => req.id !== ""));
	};

	const handleAdd = () => {
		setRequirements([...requirements, { id: "", title: "" }]);
	};

	const handleRemove = (index: number) => {
		const updated = requirements.filter((_, i) => i !== index);
		const newRequirements = updated.length > 0 ? updated : [{ id: "", title: "" }];
		setRequirements(newRequirements);
		setReqQuests(newRequirements.filter(req => req.id !== ""));
	};

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
							style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}
						>
							<select
								value={requirement.id}
								onChange={e => handleChange(index, e.target.value)}
								className={error.prerequisiteQuests ? "input-error" : "input"}
								style={{ flex: 1, marginRight: "8px" }}
							>
								<option value="" disabled={!!requirement.id}>
									-- Select prerequisite quest --
								</option>
								{filteredAllQuests.map(quest => (
									<option
										key={quest.id}
										value={quest.id}
										disabled={
											selectedQuestIds.includes(quest.id) &&
											requirement.id !== quest.id
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

				<button type="button" className="mod-cta" onClick={handleAdd}>
					+ Add Prerequisite Quest
				</button>
			</div>
		</div>
	);
};
