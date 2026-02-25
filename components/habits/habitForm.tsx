import { useState } from 'react';
// from files (Service, DEFAULT):
import { useAppContext } from 'context/appContext';
import {
	DEFAULT_HABIT,
	Habit,
	RECURRENCE_TYPES,
	RecurrenceType,
	DEFAULT_RECURRENCE,
	Weekday,
	Nth
} from 'data/DEFAULT';
// from file (UI, components):
import { FormHeader, FormFooter } from 'components/forms/UI/formHelpers';
import {
	validateAndBuildHabit,
	resolveInterval,
	resolveNth,
	resolveRecurrenceType,
	resolveUnit,
	resolveWeekdays
} from './habitHelpers';
import {
	TitleInput,
	ShortDescription_CategoryInput, SupplementaryInput,
	RewardsInput,
	RecurrenceInput,
	GoalInput
} from 'components/forms/UI/formInputs';


export const HabitFormUI = ({
	existingHabit,
	onSuccess,
	onCancel,
	onDelete,
}: {
	existingHabit?: Habit;
	onSuccess: (habit: Habit) => void;
	onCancel?: () => void;
	onDelete?: () => void;
}) => {
	const [title, setTitle] = useState(existingHabit?.title ?? '');
	const [shortDescription, setShortDescription] = useState(existingHabit?.shortDescription ?? '');

	const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(resolveRecurrenceType(existingHabit));
	const [interval, setInterval] = useState<number>(resolveInterval(existingHabit));
	const [unit, setUnit] = useState(resolveUnit(existingHabit));
	const [weekdays, setWeekdays] = useState<Array<Weekday>>(resolveWeekdays(existingHabit));
	const [nth, setNth] = useState<Nth[] | undefined>(resolveNth(existingHabit));

	const [showAdvanced, setShowAdvanced] = useState(false);
	const [description, setDescription] = useState(existingHabit?.description ?? '');
	const [category, setCategory] = useState(existingHabit?.settings.category ?? '');
	const [priority, setPriority] = useState(existingHabit?.settings.priority ?? '');
	const [difficulty, setDifficulty] = useState(existingHabit?.settings.difficulty ?? '');
	const [attributeRewards, setAttributeRewards] = useState(existingHabit?.reward.attributes || DEFAULT_HABIT.reward.attributes);
	const [goal, setGoal] = useState(existingHabit?.progress.goal ?? 0);
	const [goalUnit, setGoalUnit] = useState(existingHabit?.progress.goalUnit ?? undefined);

	const [error, setError] = useState<Record<string, string>>({});

	const appContext = useAppContext();

	// --- handlers ---

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const { habit, errors } = await validateAndBuildHabit({
			existingHabit,
			title, shortDescription, description,
			recurrenceType,
			interval, unit,
			weekdays, nth,
			category, priority, difficulty,
			attributeRewards,
			goal, goalUnit,
			appContext,
		});
		if (habit) onSuccess(habit);
		if (Object.keys(errors).length) setError(errors);
	};

	// --- unlock heplers ---

	const player = appContext.dataService.getUser();
	const isUnlocked = (feature: string): boolean => {
		const unlocked = appContext.unlocksService.unlocksHabitForm(player.xpDetails.level ?? 1);
		return unlocked.includes(feature);
	};


	// --- render ---
	return (
		<form onSubmit={handleSubmit} className="quest-form">
			{/* Header */}
			<FormHeader
				title={existingHabit ? 'Modify Habit' : 'Create New Habit'}
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

			{/* Short Description + Category */}
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
			{isUnlocked('recurrence') && !existingHabit && (
				<RecurrenceInput
					isUnlocked={isUnlocked('recurrenceWeekdays')}
					recurrenceType={recurrenceType}
					setRecurrenceType={setRecurrenceType}
					interval={interval}
					setInterval={setInterval}
					unit={unit}
					setUnit={setUnit}

					weekdays={weekdays}
					setWeekdays={setWeekdays}
					nthWeekday={nth}
					setNthWeekday={setNth}
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
					{/* {isUnlocked("rewards") && (
						<RewardsInput
							attributeRewards={attributeRewards}
							setAttributeRewards={setAttributeRewards}
							error={error}
							setError={setError}
						/>
					)} */}
					{isUnlocked("goal") && (
						<GoalInput
							goal={goal}
							setGoal={setGoal}
							goalUnit={goalUnit}
							setGoalUnit={setGoalUnit}
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
				submitLabel={existingHabit ? 'Save Changes' : 'Create Habit'}
			/>
		</form>
	);
};
