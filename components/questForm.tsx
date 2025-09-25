// this is the form to create a new quest.
import React, { useState } from "react";
import { useAppContext } from "../context/appContext";
import { v4 as uuid } from "uuid";
import { DEFAULT_QUEST } from "../data/DEFAULT";
import { Notice } from "obsidian";

export const QuestForm = ({onSuccess, onCancel, onDelete, existingQuest}: {onSuccess: () => void, onCancel?: () => void, onDelete?: () => void, existingQuest?: any}) => {
    const [title, setTitle] = useState(existingQuest?.title || "");
	const [shortDescription, setShortDescription] = useState(existingQuest?.shortDescription || "");
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [description, setDescription] = useState(existingQuest?.description || "");
	const [category, setCategory] = useState(existingQuest?.category || "");
	const [priority, setPriority] = useState(existingQuest?.priority || "");
	const [difficulty, setDifficulty] = useState(existingQuest?.difficulty || "");
	const [dueDate, setDueDate] = useState(existingQuest?.dueDate || "");

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

		if (dueDate) {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const dueDateObj = new Date(dueDate);
			dueDateObj.setHours(0, 0, 0, 0);
			if (dueDateObj < today) {
				newError.dueDate = "Due date must be today or in the future.";
			}
		}
		if (Object.keys(newError).length > 0) {
			setError(newError);
			new Notice("Please fix the errors in the form.");
			return;
		}
		setError({}); // Clear errors if validation passes

		if (existingQuest) {
			const updatedQuest = {
			...existingQuest,
			title: title.trim(),
			shortDescription: shortDescription.trim(),
			description: description.trim() || "",
			settings: {
				...existingQuest.settings,
				category: category.trim() || existingQuest.settings.category,
				priority: (["low","medium","high"].includes(priority.trim())
				? priority.trim()
				: existingQuest.settings.priority) as "low" | "medium" | "high",
				difficulty: (["easy", "medium", "hard", "expert"].includes(difficulty.trim())
					? difficulty.trim()
					: existingQuest.settings.difficulty) as "easy" | "medium" | "hard" | "expert",
				isTimeSensitive: !!dueDate,
			},
			progression: {
				...existingQuest.progression,
				dueDate: dueDate ? new Date(dueDate) : undefined,
				lastUpdated: new Date(),
			},
			};
			await appContext.updateQuest(updatedQuest);
			onSuccess();
			return;
		} else {

			const questsObj = await appContext.getQuests();
			const quests = Object.values(questsObj);
			const usedIds = quests.map((q: any) => q.id);
			let nextIdNum = 1;
			let nextId = `quest_${nextIdNum}`;
			while (usedIds.includes(nextId)) {
				nextIdNum++;
				nextId = `quest_${nextIdNum}`;
			}

			const newQuest = {
				...DEFAULT_QUEST,
				id: nextId,
				title: title.trim(),
				shortDescription: shortDescription.trim(),
				description: description.trim() || "",
				created_at: new Date(),
				settings: {
					...DEFAULT_QUEST.settings,
					category: category.trim() || DEFAULT_QUEST.settings.category,
					priority: (["low", "medium", "high"].includes(priority.trim()) ? priority.trim() : DEFAULT_QUEST.settings.priority) as "low" | "medium" | "high",
					difficulty: (["easy", "medium", "hard", "expert"].includes(difficulty.trim()) ? difficulty.trim() : DEFAULT_QUEST.settings.difficulty) as "easy" | "medium" | "hard" | "expert",
					isTimeSensitive: dueDate ? true : false,
				},
				progression: {
					...DEFAULT_QUEST.progression,
					dueDate: dueDate ? new Date(dueDate) : undefined,
					lastUpdated: new Date(),
				},
			};

			await appContext.addQuest(newQuest);
			setTitle(""); // reset le champ
			console.log("Quest created:", newQuest);
			new Notice(`Quest "${newQuest.title}" created successfully!`);
			onSuccess();
			return;
		};
	};
    return (
        <form onSubmit={handleSubmit} className="quest-form">
			{/* Header */}
			<div className="form-header">
				<h1>Create a New Quest</h1>
				<label className="switch" title="Afficher/Masquer les paramètres supplémentaires">
					<input
						type="checkbox"
						checked={showAdvanced}
						onChange={(e) => setShowAdvanced(e.target.checked)}
					/>
					<span className="slider round"></span>
					{/* <span className="tooltip-text" style={{ visibility: "hidden", position: "absolute" }}>
						Show/hide supplementary settings
					</span> */}
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
					<h3>Quest Parameters</h3>
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
									setError((prev) => ({ ...prev, dueDate: "" }));
								}
							}}
						/>
					</label>
					<p className="helper-text">
						Set a deadline to keep your quest on track. A clear end date helps you stay focused and motivated!
					</p>

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
    );
};
