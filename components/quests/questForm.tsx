import { Notice } from "obsidian";
import React, { useState } from "react";
// from file (services, default):
import { useAppContext } from "../../context/appContext";
import { DEFAULT_QUEST, DEFAULT_CATEGORIES, DefaultCategory, DEFAULT_DIFFICULTIES, DefaultDifficulty, DEFAULT_PRIORITIES, DefaultPriority, Quest } from "../../data/DEFAULT";
// from file (UI, components):
import { RewardAttributeInput } from "../forms/UI/rewardAttributeInput";
import { validateValue, FormHeader, FormFooter } from "../forms/UI/formHelpers";
import { validateAndBuildQuest } from "./questHelpers";
import { TitleInput, ShortDescription_CategoryInput, SupplementaryInput, DueDateInput, RequirementsInput, RewardsInput } from "components/forms/UI/formInputs";

export const QuestFormUI = ({
	existingQuest,
	onSuccess,
	onCancel,
	onDelete,
}: {
	existingQuest?: any,
	onSuccess: (quest: Quest) => void,
	onCancel?: () => void,
	onDelete?: () => void,
}) => {
	/* Form to create or modify a quest */
    const [title, setTitle] = useState(existingQuest?.title || "");
	const [shortDescription, setShortDescription] = useState(existingQuest?.shortDescription || "");
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [description, setDescription] = useState(existingQuest?.description || "");
	const [category, setCategory] = useState(existingQuest?.settings.category || "");
	const [priority, setPriority] = useState(existingQuest?.settings.priority || "");
	const [difficulty, setDifficulty] = useState(existingQuest?.settings.difficulty || "");
	const [dueDate, setDueDate] = useState(existingQuest?.progression.dueDate ? new Date(existingQuest?.progression.dueDate).toISOString().split('T')[0] : "");
	const [levelMin, setLevelMin] = useState(existingQuest?.requirements.level || 1);
	const [attributeRewards, setAttributeRewards] = useState(existingQuest?.reward.attributes || DEFAULT_QUEST.reward.attributes);

	const [error, setError] = useState<{[key: string]: string}>({}); // Initialize error state
	const appContext = useAppContext();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const { quest, errors } = await validateAndBuildQuest({
			existingQuest,
			title, shortDescription, description,
			category, priority, difficulty,
			dueDate: dueDate ? new Date(dueDate) : undefined, levelMin, attributeRewards,
			appContext
		});
		if (quest) {
			onSuccess(quest);
		}
		if (Object.keys(errors).length > 0) {
			setError(errors);
		}
	};

    return (
        <form onSubmit={handleSubmit} className="quest-form">
			{/* Header */}
			<FormHeader
				title={existingQuest ? "Modify Quest" : "Create New Quest"}
				showAdvanced={showAdvanced}
				setShowAdvanced={() => setShowAdvanced(!showAdvanced)}
			/>
			{/* Title */}
			<TitleInput
				title={title}
				setTitle={setTitle}
				error={error}
				setError={setError}
			/>
			{/* Short Description */}
			<ShortDescription_CategoryInput
				type="quest"
				shortDescription={shortDescription}
				setShortDescription={setShortDescription}
				category={category}
				setCategory={setCategory}
				error={error}
				setError={setError}
			/>

			{/* Advanced Settings */}
			{showAdvanced && (
				<div className="form-section">
					<SupplementaryInput
						type="Quest"
						description={description}
						setDescription={setDescription}
						priority={priority}
						setPriority={setPriority}
						difficulty={difficulty}
						setDifficulty={setDifficulty}
					/>
					<DueDateInput
						dueDate={dueDate}
						setDueDate={setDueDate}
						error={error}
						setError={setError}
					/>
					<RequirementsInput
						levelMin={levelMin}
						setLevelMin={setLevelMin}
						error={error}
						setError={setError}
					/>
					<RewardsInput
						attributeRewards={attributeRewards}
						setAttributeRewards={setAttributeRewards}
					/>
				</div>
			)}
			{/* Footer */}
			<FormFooter
				onCancel={onCancel}
				onDelete={onDelete}
				submitLabel={existingQuest ? "Save Changes" : "Create Quest"}
			/>
		</form>
	);
}
