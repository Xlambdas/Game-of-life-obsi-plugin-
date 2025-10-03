import React, { useState } from "react";
import { Notice } from "obsidian";
// from file (services, default):
import { useAppContext } from "../../../context/appContext";
import { DEFAULT_QUEST, DEFAULT_CATEGORIES, DefaultCategory, DEFAULT_DIFFICULTIES, DefaultDifficulty, DEFAULT_PRIORITIES, DefaultPriority, DEFAULT_ATTRIBUTES } from "../../../data/DEFAULT";

export const QuestForm = ({onSuccess, onCancel, onDelete, existingQuest}: {onSuccess: () => void, onCancel?: () => void, onDelete?: () => void, existingQuest?: any}) => {
    const [title, setTitle] = useState(existingQuest?.title || "");
	const [shortDescription, setShortDescription] = useState(existingQuest?.shortDescription || "");
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [description, setDescription] = useState(existingQuest?.description || "");
	const [category, setCategory] = useState(existingQuest?.settings.category || "");
	const [priority, setPriority] = useState(existingQuest?.settings.priority || "");
	const [difficulty, setDifficulty] = useState(existingQuest?.settings.difficulty || "");
	const [dueDate, setDueDate] = useState(existingQuest?.progression.dueDate || "");
	const [levelMin, setLevelMin] = useState(existingQuest?.requirements.level || 1);
	const [attributeRewards, setAttributeRewards] = useState(existingQuest?.reward.attributes || DEFAULT_QUEST.reward.attributes);

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
					category: validateValue(category.trim(), DEFAULT_CATEGORIES, existingQuest.settings.category as DefaultCategory),
					priority: validateValue(priority.trim(), DEFAULT_PRIORITIES, existingQuest.settings.priority as DefaultPriority),
					difficulty: validateValue(difficulty.trim(), DEFAULT_DIFFICULTIES, existingQuest.settings.difficulty as DefaultDifficulty),
					isTimeSensitive: !!dueDate,
				},
				progression: {
					...existingQuest.progression,
					dueDate: dueDate ? new Date(dueDate) : undefined,
					lastUpdated: new Date(),
				},
				requirements: {
					...existingQuest.requirements,
					level: levelMin >= 1 ? levelMin : 1,
				},
				reward: {
					...existingQuest.reward,
					attributes: attributeRewards,
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
					category: validateValue(category.trim(), DEFAULT_CATEGORIES, DEFAULT_QUEST.settings.category as DefaultCategory),
					priority: validateValue(priority.trim(), DEFAULT_PRIORITIES, DEFAULT_QUEST.settings.priority as DefaultPriority),
					difficulty: validateValue(difficulty.trim(), DEFAULT_DIFFICULTIES, DEFAULT_QUEST.settings.difficulty as DefaultDifficulty),
					isTimeSensitive: dueDate ? true : false,
				},
				progression: {
					...DEFAULT_QUEST.progression,
					dueDate: dueDate ? new Date(dueDate) : undefined,
					lastUpdated: new Date(),
				},
				requirements: {
					...DEFAULT_QUEST.requirements,
					level: levelMin >= 1 ? levelMin : 1,
				},
				reward: {
					...DEFAULT_QUEST.reward,
					attributes: attributeRewards,
				},
			};

			await appContext.addQuest(newQuest);
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
						{DEFAULT_CATEGORIES.map((cat) => (
							<option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
						))}
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
					<hr className="separator"></hr>
					<h3>Requirements</h3>
					<label className="label-select">
						<span>Level min</span>
						<input
							type="number"
							name="levelMin"
							placeholder="1, 2, 3..."
							className="input"
							value={levelMin}
							onChange={(e) => {
								setLevelMin(Number(e.target.value))
								if (error.levelMin) {
									setError((prev) => ({ ...prev, levelMin: "" }));
								}
							}}
							min={1}
						/>
					</label>
					<hr className="separator"></hr>
					<h3>Rewards</h3>
					<RewardAttributeInput
						initialValue={attributeRewards}
						onChange={setAttributeRewards}
					/>
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


function validateValue<T extends readonly string[]>(
	value: string,
	validValues: T,
	fallback: T[number]
): T[number] {
	return (validValues.includes(value as any) ? value : fallback) as T[number];
}



export interface AttributeReward {
  [key: string]: number;
}

export interface AttributeRewardPair {
  attribute: string;
  xp: number;
}

interface RewardAttributeInputProps {
  initialValue?: AttributeReward;
  onChange: (rewards: AttributeReward) => void;
}

export const RewardAttributeInput: React.FC<RewardAttributeInputProps> = ({
  initialValue = {},
  onChange,
}) => {
  // 🔑 initialise UNIQUEMENT les paires non nulles
  const [pairs, setPairs] = useState<AttributeRewardPair[]>(() => {
    const initPairs = Object.entries(initialValue)
      .filter(([_, xp]) => xp && xp > 0)
      .map(([attr, xp]) => ({
        attribute: attr,
        xp: xp as number,
      }));
    return initPairs.length > 0 ? initPairs : [{ attribute: "", xp: 0 }];
  });

  // Conversion des paires -> objet statBlock complet
  const pairsToAttributes = (pairs: AttributeRewardPair[]) => {
    const result: Record<string, number> = {};
    DEFAULT_ATTRIBUTES.forEach(attr => {
      result[attr] = 0;
    });
    pairs.forEach(p => {
      if (p.attribute && p.xp > 0) {
        result[p.attribute] = p.xp;
      }
    });
    return result;
  };

  const handleChange = (index: number, field: "attribute" | "xp", value: string) => {
    const updated = pairs.map((p, i) =>
      i === index ? { ...p, [field]: field === "xp" ? Number(value) : value } : p
    );
    setPairs(updated);
    onChange(pairsToAttributes(updated));
  };

  const handleAdd = () => {
    setPairs([...pairs, { attribute: "", xp: 0 }]);
  };

  const handleRemove = (index: number) => {
    const updated = pairs.filter((_, i) => i !== index);
    setPairs(updated.length > 0 ? updated : [{ attribute: "", xp: 0 }]);
    onChange(pairsToAttributes(updated));
  };

  // Récupère les attributs déjà sélectionnés (pour désactiver les options doublons)
  const selectedAttributes = pairs.map(p => p.attribute).filter(Boolean);

  return (
    <div className="form-group">
      <label>Attribute XP Rewards:</label>
      <p className="helper-text">Assign XP rewards to specific attributes for this quest.</p>
      <div className="attribute-pairs-container">
        {pairs.map((pair, index) => (
          <div
            key={index}
            className="attribute-pair"
            style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}
          >
            <select
              value={pair.attribute}
              onChange={(e) => handleChange(index, "attribute", e.target.value)}
              className="attribute-select"
              style={{ width: "50%", marginRight: "8px" }}
            >
              <option value="" disabled={!!pair.attribute}>
                Select attribute...
              </option>
              {DEFAULT_ATTRIBUTES.map(attr => (
                <option
                  key={attr}
                  value={attr}
                  disabled={selectedAttributes.includes(attr) && pair.attribute !== attr}
                >
                  {attr.charAt(0).toUpperCase() + attr.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="XP amount..."
              value={pair.xp || ""}
              onChange={(e) => handleChange(index, "xp", e.target.value)}
              className="attribute-xp-input"
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
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="mod-cta" onClick={handleAdd}>
        + Add Attribute Reward
      </button>
    </div>
  );
};
