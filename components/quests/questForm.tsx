import React, { useState, useEffect } from "react";
// from file (services, default):
import { useAppContext } from "../../context/appContext";
import { DEFAULT_QUEST, Quest } from "../../data/DEFAULT";
// from file (UI, components):
import { FormHeader, FormFooter } from "../forms/UI/formHelpers";
import { validateAndBuildQuest } from "./questHelpers";
import { TitleInput, ShortDescription_CategoryInput, SupplementaryInput, DueDateInput, RequirementsInput, RewardsInput, ProgressConditionInput } from "components/forms/UI/formInputs";

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
	const [reqQuests, setReqQuests] = useState<{ id: string; title: string }[]>(existingQuest?.requirements.previousQuests || []);
	const [attributeRewards, setAttributeRewards] = useState(existingQuest?.reward.attributes || DEFAULT_QUEST.reward.attributes);
	const [allQuests, setAllQuests] = useState<{id: string, title: string; targetProgress: number}[]>([]);
	const [allHabits, setAllHabits] = useState<{id: string, title: string; targetStreak: number}[]>([]);

	const [condQuests, setCondQuests] = useState<{ id: string; title: string; targetProgress: number }[]>(existingQuest?.progression.subtasks?.conditionQuests || []);
	const [condHabits, setCondHabits] = useState<{ id: string; title: string; targetStreak: number }[]>(existingQuest?.progression.subtasks?.conditionHabits || []);

	const [error, setError] = useState<{[key: string]: string}>({}); // Initialize error state
	const appContext = useAppContext();

	// Load all quests on component mount
	useEffect(() => {
		const loadQuests = async () => {
			try {
				const quests = await appContext.dataService.loadAllQuests();
				setAllQuests(quests.map((q: any) => ({ id: q.id, title: q.title, targetProgress: q.progression.progress || 0 })));
			} catch (error) {
				console.error("Error loading quests:", error);
			}
		};
		const loadHabits = async () => {
			try {
				const habits = await appContext.dataService.loadAllHabits();
				setAllHabits(habits.map((h: any) => ({ id: h.id, title: h.title, targetStreak: h.streak.best || 0 })));
			} catch (error) {
				console.error("Error loading habits:", error);
			}
		};
		loadQuests();
		loadHabits();
	}, [appContext.dataService]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const { quest, errors } = await validateAndBuildQuest({
			existingQuest,
			title, shortDescription, description,
			category, priority, difficulty,
			dueDate: dueDate ? new Date(dueDate) : undefined,
			levelMin, reqQuests, condQuests, condHabits,
			attributeRewards,
			appContext
		});
		if (quest) {
			onSuccess(quest);
		}
		if (Object.keys(errors).length > 0) {
			setError(errors);
		}
	};

	const player = appContext.dataService.getUser();

	const isUnlocked = (feature: string): boolean => {
		const unlockedFeatures = appContext.unlocksService.unlocksQuestForm(player.xpDetails.level || 1);
		return unlockedFeatures.includes(feature);
	}

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
				isUnlocked={isUnlocked}
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
						isUnlocked={isUnlocked}
						description={description}
						setDescription={setDescription}
						priority={priority}
						setPriority={setPriority}
						difficulty={difficulty}
						setDifficulty={setDifficulty}
					/>
					{isUnlocked("dueDate") && (
						<DueDateInput
							dueDate={dueDate}
							setDueDate={setDueDate}
							error={error}
							setError={setError}
						/>
					)}
					{isUnlocked("requirements") && (
						<RequirementsInput
							existingQuest={existingQuest}
							levelMin={levelMin}
							setLevelMin={setLevelMin}
							reqQuests={reqQuests}
							setReqQuests={setReqQuests}
							allQuests={allQuests}
							error={error}
							setError={setError}
						/>
					)}
					{isUnlocked("attributeRewards") && (
						<RewardsInput
							attributeRewards={attributeRewards}
							setAttributeRewards={setAttributeRewards}
							error={error}
							setError={setError}
						/>
					)}
					{isUnlocked("progressConditions") && (
						<ProgressConditionInput
							existingQuest={existingQuest}
							allQuests={allQuests}
							condQuests={condQuests}
							setCondQuests={setCondQuests}
							allHabits={allHabits}
							condHabits={condHabits}
							setCondHabits={setCondHabits}
							error={error}
							setError={setError}
						/>
					)}
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
