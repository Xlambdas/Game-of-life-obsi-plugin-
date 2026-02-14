import { useState, useEffect } from 'react';
import { Notice } from 'obsidian';
// from files (Service, DEFAULT):
import { useAppContext } from 'context/appContext';
import { DEFAULT_HABIT, Habit } from 'data/DEFAULT';
import { attributeDetails } from 'data/attributeDetails';
// from file (UI, components):
import { FormHeader, FormFooter } from 'components/forms/UI/formHelpers';
import { validateAndBuildHabit } from './habitHelpers';
import { TitleInput, ShortDescription_CategoryInput, SupplementaryInput, RewardsInput, RecurrenceInput } from 'components/forms/UI/formInputs';


export const HabitFormUI = ({
	existingHabit,
	onSuccess,
	onCancel,
	onDelete,
}: {
	existingHabit?: any,
	onSuccess: (habit: Habit) => void,
	onCancel?: () => void,
	onDelete?: () => void,
}) => {
	/* Form to create or modify a habit */
	const [title, setTitle] = useState(existingHabit?.title || "");
	const [shortDescription, setShortDescription] = useState(existingHabit?.shortDescription || "");
	const [interval, setInterval] = useState(existingHabit?.recurrence.interval || DEFAULT_HABIT.recurrence.interval);
	const [unit, setUnit] = useState(existingHabit?.recurrence.unit || DEFAULT_HABIT.recurrence.unit);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [description, setDescription] = useState(existingHabit?.description || "");
	const [category, setCategory] = useState(existingHabit?.settings.category || "");
	const [priority, setPriority] = useState(existingHabit?.settings.priority || "");
	const [difficulty, setDifficulty] = useState(existingHabit?.settings.difficulty || "");
	const [attributeRewards, setAttributeRewards] = useState(existingHabit?.reward.attributes || DEFAULT_HABIT.reward.attributes);

	const [error, setError] = useState<{[key: string]: string}>({}); // Initialize error state
	const appContext = useAppContext();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const { habit, errors } = await validateAndBuildHabit({
			existingHabit,
			title, shortDescription, description,
			interval, unit,
			category, priority, difficulty,
			attributeRewards,
			appContext
		});
		if (habit) {
			onSuccess(habit);
		}
		if (Object.keys(errors).length > 0) {
			setError(errors);
		}
	};

	const player = appContext.dataService.getUser();

	const isUnlocked = (feature: string): boolean => {
		const unlockedFeatures = appContext.unlocksService.unlocksHabitForm(player.xpDetails.level || 1);
		return unlockedFeatures.includes(feature);
	}

	return (
		<form onSubmit={handleSubmit} className="quest-form">
			{/* Header */}
			<FormHeader
				title={existingHabit ? "Modify Habit" : "Create New Habit"}
				showAdvanced={showAdvanced}
				setShowAdvanced={setShowAdvanced}
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
				type="habit"
				isUnlocked={isUnlocked}
				shortDescription={shortDescription}
				setShortDescription={setShortDescription}
				category={category}
				setCategory={setCategory}
				error={error}
				setError={setError}
			/>
			{/* Recurrence */}
			{isUnlocked("recurrence") && !existingHabit && (
				<RecurrenceInput
					interval={interval}
					setInterval={setInterval}
					unit={unit}
					setUnit={setUnit}
					error={error}
					setError={setError}
				/>
			)}

			{/* Advanced Settings */}
			{showAdvanced && (
				<div className="form-section">
					<SupplementaryInput
						type="Habit"
						isUnlocked={isUnlocked}
						description={description}
						setDescription={setDescription}
						priority={priority}
						setPriority={setPriority}
						difficulty={difficulty}
						setDifficulty={setDifficulty}
					/>
					{isUnlocked("rewards") && (
						<RewardsInput
							attributeRewards={attributeRewards}
							setAttributeRewards={setAttributeRewards}
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
				submitLabel={existingHabit ? "Save Changes" : "Create Habit"}
			/>
		</form>
	);
};

