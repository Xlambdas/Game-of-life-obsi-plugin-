import { error } from "console";
import React, { useState, useEffect } from "react";
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
	initialValues: QuestRequirement[];
	setReqQuest: (quests: QuestRequirement[]) => void;
	allQuests: QuestRequirement[];
}


export const RequirementsQuestInput: React.FC<RequirementsQuestInputProps> = ({
	initialValues,
	setReqQuest,
	allQuests,
}) => {



	return (
		<div>
			<label>
				<span>Other quest before this one:</span>
				<select
					name="prerequisiteQuest"
					className="input"
					multiple={true}
					value={initialValues.map(q => q.id)}
					onChange={(e) => {
						const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
						const selectedQuests = allQuests.filter(q => selectedIds.includes(q.id));
						setReqQuest(selectedQuests);
					}}
					style={{ height: "6em" }}
				>
					{/* <option value="">-- Select prerequisite quest --</option> */}
					{allQuests.map(quest => (
						<option key={quest.id} value={quest.id}>
							{quest.title}
						</option>
					))}
				</select>
			</label>
		</div>
	)
};




interface RequirementsQuestInputProps_old {
	initialValue?: QuestRequirement[];
	setReqQuest: (quests: QuestRequirement[]) => void;
	allQuests: QuestRequirement[];
	error: { [key: string]: string };
	setError: (error: { [key: string]: string }) => void;
}

export const RequirementsQuestInput_new_old: React.FC<RequirementsQuestInputProps_old> = ({
	initialValue,
	setReqQuest,
	allQuests,
	error,
	setError
}) => {
	// Initialize with existing requirements or one empty row
	const [requirements, setRequirements] = useState<QuestRequirement[]>(() => {
		return initialValue && initialValue.length > 0 ? initialValue : [{ id: "", title: "" }];
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
		setReqQuest(validRequirements);
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
		setReqQuest(validRequirements);
	};

	// Get already selected quest IDs to disable them in other dropdowns
	const selectedQuestIds = requirements.map(req => req.id).filter(Boolean);

	return (
		<div>
		<hr className="separator" />
		<h4>Other quest prerequisite</h4>
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
					className={error.prerequisiteQuests ? "input-error" : "input"}
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



interface Quest {
	id: string;
	title: string;
}


export const RequirementsQuestInput_old_old: React.FC<RequirementsQuestInputProps> = ({
	initialValues,
	setReqQuest,
	allQuests,
}) => {


  const handleChange = (index: number, questId: string) => {
		const quest = allQuests.find((q) => q.id === questId);
		const updated = initialValues.map((q, i) =>
			i === index ? quest || { id: "", title: "" } : q
		);
		setReqQuest(updated.filter((q) => q.id));
	};

	const handleAdd = () => {
		setReqQuest([...initialValues, { id: "", title: "" }]);
	};

	const handleRemove = (index: number) => {
		const updated = initialValues.filter((_, i) => i !== index);
		setReqQuest(updated.length > 0 ? updated : [{ id: "", title: "" }]);
	};

	const selectedIds = initialValues.map((q) => q.id).filter(Boolean);

	return (
		<div className="form-group">
			<label>Quest Prerequisites:</label>
			<p className="helper-text">
				Select other quests that must be completed before this one.
			</p>

			{initialValues.map((quest, index) => (
				<div
					key={index}
					style={{
						display: "flex",
						alignItems: "center",
						marginBottom: "8px",
					}}
				>
					<select
						value={quest.id}
						onChange={(e) => handleChange(index, e.target.value)}
						className="input"
						style={{ width: "85%", marginRight: "8px" }}
					>
						<option value="">Select prerequisite quest...</option>
						{allQuests.map((q) => {
							const isAlreadySelected = selectedIds.includes(q.id);
							return (
								<option
									key={q.id}
									value={q.id}
									disabled={isAlreadySelected && q.id !== quest.id}
								>
									{q.title}
									{isAlreadySelected && q.id !== quest.id
										? " ✅ (Already selected)"
										: ""}
								</option>
							);
						})}
					</select>

					<button
						type="button"
						onClick={() => handleRemove(index)}
						className="mod-warning"
						style={{
							width: "24px",
							height: "24px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							padding: 0,
						}}
					>
						×
					</button>
				</div>
			))}

			<button type="button" className="mod-cta" onClick={handleAdd}>
				+ Add prerequisite quest
			</button>

		</div>
	);
};


interface RequirementsQuestInputProps_old {
	initialValue?: Quest[];
	setQuest: (quests: Quest[]) => void;
	onChange: (quests: Quest[]) => void;
	allQuests: Quest[];
	error: { [key: string]: string };
	setError: (error: { [key: string]: string }) => void;
	currentQuestId?: string; // optionnel, pour éviter de se sélectionner soi-même
}

export const RequirementsQuestInput_newer: React.FC<RequirementsQuestInputProps_old> = ({
	initialValue = [],
	onChange,

	allQuests,
	error,
	setError,
	currentQuestId,
}) => {
	// 🔑 Initialise avec les quêtes valides ou une ligne vide
	const [pairs, setPairs] = useState<Quest[]>(() =>
		initialValue.length > 0 ? initialValue : [{ id: "", title: "" }]
	);


	// 🧩 Gestion du changement d’une quête dans la liste
	const handleChange = (index: number, questId: string) => {
		const quest = allQuests.find((q) => q.id === questId);
		const updated = pairs.map((p, i) =>
			i === index ? quest || { id: "", title: "" } : p
		);
		setPairs(updated);
		onChange(updated.filter((q) => q.id));
	};

	// ➕ Ajouter une ligne
	const handleAdd = () => {
		setPairs([...pairs, { id: "", title: "" }]);
	};

	// ❌ Supprimer une ligne
	const handleRemove = (index: number) => {
		const updated = pairs.filter((_, i) => i !== index);
		setPairs(updated.length > 0 ? updated : [{ id: "", title: "" }]);
		onChange(updated.filter((q) => q.id));
	};

	// 🔍 Empêche la sélection de doublons et de la quête actuelle
	const selectedIds = pairs.map((p) => p.id).filter(Boolean);

	return (
		<div className="form-group">
			<label>Quest Prerequisites:</label>
			<p className="helper-text">
				Select other quests that must be completed before this one.
			</p>

			<div className="quest-pairs-container">
				{pairs.map((pair, index) => (
					<div
						key={index}
						className="quest-pair"
						style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}
					>
						<select
							value={pair.id}
							onChange={(e) => handleChange(index, e.target.value)}
							className="input"
							style={{ width: "85%", marginRight: "8px" }}
						>
							<option value="">Select prerequisite quest...</option>
							{allQuests.map((q) => {
								const isDisabled =
									(selectedIds.includes(q.id) && q.id !== pair.id) ||
									q.id === currentQuestId;
								return (
									<option key={q.id} value={q.id} disabled={isDisabled}>
										{q.title}
										{isDisabled ? " ✅" : ""}
									</option>
								);
							})}
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
								justifyContent: "center",
							}}
						>
							×
						</button>
					</div>
				))}
			</div>

			<button type="button" className="mod-cta" onClick={handleAdd}>
				+ Add prerequisite quest
			</button>

			{/* 🔹 Liste actuelle */}
			{pairs.filter((q) => q.id).length > 0 && (
				<div style={{ marginTop: "12px" }}>
					<strong>Current prerequisites:</strong>
					<ul style={{ margin: "6px 0 0 16px" }}>
						{pairs
							.filter((q) => q.id)
							.map((q) => (
								<li key={q.id}>{q.title}</li>
							))}
					</ul>
				</div>
			)}

		</div>
	);
};
