import { Notice } from "obsidian";
// from file (services, default):
import { useAppContext } from "../../context/appContext";
import {
	DEFAULT_HABIT,
	DEFAULT_CATEGORIES,
	DefaultCategory,
	DEFAULT_DIFFICULTIES,
	DefaultDifficulty,
	DEFAULT_PRIORITIES,
	DefaultPriority,
	Habit,
	DefaultRecurrence,
	RecurrenceType,
	Weekday, Recurrence,
	DIFFICULTY_RULES,
	Nth,
	DEFAULT_RECURRENCE,
} from "../../data/DEFAULT";
import { AttributeBlock, DEFAULT_ATTRIBUTES } from "data/attributeDetails";
// from file (UI, components):
import { validateValue } from "../forms/UI/formHelpers";

type ValidateAndBuildParams = {
	existingHabit?: Habit;
	title: string;
	shortDescription: string;
	description: string;
	recurrenceType: RecurrenceType;
	interval: number;
	unit: string;
	weekdays: Weekday[];
	nth: Nth[] | undefined;
	category: string;
	priority: string;
	difficulty: string;
	attributeRewards: AttributeBlock;
	appContext: ReturnType<typeof useAppContext>;
};

function buildRecurrence(
	recurrenceType: RecurrenceType,
	interval: number,
	unit: string,
	weekdays: Weekday[],
	nth: Nth[] | undefined,
): Recurrence {
	switch (recurrenceType) {
		case 'interval':
			// Only interval fields (no days/nth leaking into the object)
			return {
				type: 'interval',
				interval,
				unit: unit as DefaultRecurrence,
			};
		case 'weekday':
			// Only weekday fields (no interval/unit leaking into the object)
			return {
				type: 'weekday',
				days: weekdays,
				nth,
			};
	}
}

function validateRecurrence(
	recurrenceType: RecurrenceType,
	interval: number,
	weekdays: Weekday[],
	errors: Record<string, string>,
): void {
	switch (recurrenceType) {
		case 'interval':
			if (!interval || isNaN(interval) || interval < 1) {
				errors.interval = 'Interval must be a positive number.';
			}
			break;
		case 'weekday':
			if (weekdays.length === 0) {
				errors.weekdays = 'Please select at least one day.';
			}
			break;
	}
}

export async function validateAndBuildHabit({
	existingHabit,
	title, shortDescription, description,
	recurrenceType,
	interval, unit,
	weekdays, nth,
	category, priority, difficulty,
	attributeRewards,
	appContext,
}: ValidateAndBuildParams): Promise<{ habit: Habit | null; errors: Record<string, string> }> {

	const errors: Record<string, string> = {};

	// --- Basic validation ---
	if (!title.trim()) {
		errors.title = 'Title is required.';
	}
	if (!shortDescription.trim()) {
		errors.shortDescription = 'Short description is required.';
	}

	validateRecurrence(recurrenceType, interval, weekdays, errors);

	// --- Update attributes if category chosen ---
	const user = appContext.getUser();

	let updatedAttributes = { ...attributeRewards };
	if (category && category !== (existingHabit?.settings.category ?? '')) {
		updatedAttributes = updateAttributesByCategory(category, updatedAttributes);
	}

	if (updatedAttributes) {
		const invalidAttributes = Object.entries(updatedAttributes).filter(([, xp]) => xp < 0);
		if (invalidAttributes.length > 0) {
			errors.attributeRewards = 'Attribute rewards cannot be negative.';
		}

		const sumAttributes = Object.values(updatedAttributes).reduce((sum, val) => sum + val, 0);
		const basePoints = 3;
		const habitXPBonus = existingHabit?.progress?.XP ?? 0;
		const baseMax = basePoints * (1 + (user.xpDetails.level ?? 1) / 10);
		const maxAllocation = Math.floor(baseMax + habitXPBonus);

		if (sumAttributes > maxAllocation) {
			errors.attributeRewards = `You can't allocate more than ${maxAllocation} points in total.`;
			if (category !== 'undefined') {
				errors.attributeRewards += '\nKeep in mind that selecting a category automatically allocates some points.';
			}
		}
	}

	// --- If errors, return early with error object ---
	if (Object.keys(errors).length > 0) {
		new Notice('Please fix the errors in the form.');
		if (errors.attributeRewards) new Notice(errors.attributeRewards);
		return { habit: null, errors };
	}

	// --- Build habit object ---
	const userDifficulty = (user.settings?.difficulty as keyof typeof DIFFICULTY_RULES) ?? 'normal';
	const defaultFreeze = DIFFICULTY_RULES[userDifficulty]?.freeze ?? 0;

	const newHabit: Habit = {
		...(existingHabit ?? DEFAULT_HABIT),
		title: title.trim(),
		shortDescription: shortDescription.trim(),
		description: description.trim() || '',
		settings: {
			...(existingHabit?.settings ?? DEFAULT_HABIT.settings),
			category: validateValue(category, DEFAULT_CATEGORIES, DEFAULT_HABIT.settings.category as DefaultCategory),
			priority: validateValue(priority, DEFAULT_PRIORITIES, DEFAULT_HABIT.settings.priority as DefaultPriority),
			difficulty: validateValue(difficulty, DEFAULT_DIFFICULTIES, DEFAULT_HABIT.settings.difficulty as DefaultDifficulty),
		},
		recurrence: buildRecurrence(recurrenceType, interval, unit, weekdays, nth),
		streak: {
			...(existingHabit?.streak ?? DEFAULT_HABIT.streak),
			freeze: existingHabit?.streak?.freeze ?? { available: defaultFreeze, history: [] },
		},
		reward: {
			...(existingHabit?.reward ?? DEFAULT_HABIT.reward),
			attributes: updatedAttributes,
		},
	};

	return { habit: newHabit, errors: {} };
}

export const updateAttributesByCategory = (category: string, attributes: AttributeBlock): AttributeBlock => {
	const updatedAttributes: AttributeBlock = { ...DEFAULT_ATTRIBUTES, ...attributes };

	switch (category) {
		case 'Physical':
			updatedAttributes.strength += 1;
			updatedAttributes.agility += 1;
			updatedAttributes.endurance += 1;
			break;
		case 'Mental':
			updatedAttributes.wisdom += 1;
			updatedAttributes.perception += 1;
			updatedAttributes.intelligence += 1;
			break;
		case 'Social':
			updatedAttributes.charisma += 1;
			updatedAttributes.intelligence += 1;
			break;
		case 'Creative':
			updatedAttributes.charisma += 1;
			updatedAttributes.perception += 1;
			break;
		case 'Emotional':
			updatedAttributes.wisdom += 1;
			updatedAttributes.charisma += 1;
			break;
		case 'Organizational':
			updatedAttributes.intelligence += 1;
			updatedAttributes.perception += 1;
			break;
		case 'Exploration':
			updatedAttributes.agility += 1;
			updatedAttributes.perception += 1;
			updatedAttributes.intelligence += 1;
			break;
		default:
			break; // No changes for undefined or other categories
	}

	console.log("Updated Attributes by Category:", updatedAttributes);
	return updatedAttributes;
}

// --- Habit Form Helpers ---

export function resolveRecurrenceType(existingHabit?: Habit): RecurrenceType {
	if (!existingHabit) return 'interval';
	return existingHabit.recurrence.type;
}

export function resolveInterval(existingHabit?: Habit): number {
	if (existingHabit?.recurrence.type === 'interval') {
		return existingHabit.recurrence.interval;
	}
	return DEFAULT_RECURRENCE.interval;
}

export function resolveUnit(existingHabit?: Habit) {
	if (existingHabit?.recurrence.type === 'interval') {
		return existingHabit.recurrence.unit;
	}
	return DEFAULT_RECURRENCE.unit;
}

export function resolveWeekdays(existingHabit?: Habit): Array<Weekday> {
	if (existingHabit?.recurrence.type === 'weekday') {
		return existingHabit.recurrence.days;
	}
	return [];
}

export function resolveNth(existingHabit?: Habit): Nth[] | undefined {
	if (existingHabit?.recurrence.type === 'weekday') {
		return existingHabit.recurrence.nth;
	}
	return undefined;
}
