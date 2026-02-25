import { AppContextService } from "../appContextService";
import { Notice } from "obsidian";
// from files (default):
import {
	Habit,
	Quest,
	UserSettings,
	DIFFICULTY_RULES,
	MILESTONE_CURVES,
	Recurrence,
	IntervalRecurrence,
	WeekdayRecurrence,
	Weekday,
} from "data/DEFAULT";
// from files (helpers):
import { DateHelper, DateString } from "helpers/dateHelpers";
import { AttributeBlock } from "data/attributeDetails";
// from files (UI, components):
import { GenericForm } from "components/forms/genericForm";
import { HabitModal } from "../../modal/habitDetailsModal";




/**
 * Is this specific date a valid completion date for this recurrence?
 * For interval habits this is always true (blocking window handled in updateHistory).
 * For weekday habits this is the primary gate.
 */
function isValidRecurrenceDate(date: DateString, recurrence: Recurrence): boolean {
	switch (recurrence.type) {
		case 'interval':
			return true;
		case 'weekday': {
			const d = DateHelper.toDate(date);
			const weekday = d.getDay() as Weekday;
			const idx = recurrence.days.indexOf(weekday);
			if (idx === -1) return false;

			// nth filter: undefined = every occurrence, 1–5 = specific week
			if (recurrence.nth) {
				const nth = recurrence.nth[idx];
				if (nth !== undefined) {
					const occurrence = Math.ceil(d.getDate() / 7);
					return occurrence === nth;
				}
			}
			return true;
		}
	}
}

/**
 * Next valid completion date after `from` (exclusive).
 */
function getNextValidDate(from: DateString, recurrence: Recurrence): DateString {
	switch (recurrence.type) {
		case 'interval':
			return DateHelper.addInterval(from, recurrence.interval, recurrence.unit);
		case 'weekday': {
			const d = DateHelper.toDate(from);
			d.setDate(d.getDate() + 1);
			for (let i = 0; i < 40; i++) {
				const candidate = DateHelper.toDateString(d);
				if (isValidRecurrenceDate(candidate, recurrence)) return candidate;
				d.setDate(d.getDate() + 1);
			}
			return from; // fallback — unreachable for valid recurrences
		}
	}
}

/**
 * Previous valid completion date before `from` (exclusive).
 * Returns null if none found within 40 days (covers any nth-weekday gap).
 */
function getPreviousValidDate(from: DateString, recurrence: Recurrence): DateString | null {
	switch (recurrence.type) {
		case 'interval':
			return DateHelper.addInterval(from, -recurrence.interval, recurrence.unit);
		case 'weekday': {
			const d = DateHelper.toDate(from);
			d.setDate(d.getDate() - 1);
			for (let i = 0; i < 40; i++) {
				const candidate = DateHelper.toDateString(d);
				if (isValidRecurrenceDate(candidate, recurrence)) return candidate;
				d.setDate(d.getDate() - 1);
			}
			return null;
		}
	}
}

/**
 * All valid completion dates between `from` and `to` inclusive.
 * Interval: every calendar day (blocking window applied later in updateHistory).
 * Weekday:  only days matching the recurrence pattern.
 */
function generateValidDates(
	from: DateString,
	to: DateString,
	recurrence: Recurrence,
): DateString[] {
	const dates: DateString[] = [];
	const d = DateHelper.toDate(from);
	const toDate = DateHelper.toDate(to);

	while (d <= toDate) {
		const candidate = DateHelper.toDateString(d);
		if (recurrence.type === 'interval' || isValidRecurrenceDate(candidate, recurrence)) {
			dates.push(candidate);
		}
		d.setDate(d.getDate() + 1);
	}
	return dates;
}

export default class HabitService {
	private appContext: AppContextService;

	constructor(contextService: AppContextService) {
		this.appContext = contextService;
	}

	// --- CRUD operations ---
	async saveHabit(habit: Habit): Promise<void> {
		await this.appContext.dataService.addHabit(habit);
	}
	async saveAllHabits(habits: Habit[]): Promise<void> {
		await this.appContext.dataService.saveAllHabits(habits);
	}
	async getHabitById(habitID: string): Promise<Habit | null> {
		return this.appContext.dataService.getHabitbyID(habitID).then(h => h || null);
	}
	async deleteHabit(habitID: string, questService: any): Promise<void> {
		await this.appContext.dataService.deleteHabitAndCleanQuests(habitID, questService);
	}

	// --- General helpers ---

	public handleGetDaysUntil = (StartDate: DateString, targetDate: DateString): string => {
		return this.appContext.xpService.getDaysUntil(StartDate, targetDate, 'habit');
	}

	// --- UI handlers ---

	public handleModify = (habit: Habit) => {
		new GenericForm(this.appContext.getApp(), 'habit-modify', habit).open();
	};

	public archiveHabit = async (habit: Habit): Promise<void> => {
		const history = habit.streak.history
			.filter(h => h.success)
			.map(h => ({ ...h, date: DateHelper.toDateString(h.date) }));
		await this.appContext.dataService.addHabit({
			...habit,
			isArchived: true,
			streak: { ...habit.streak, history },
		});
	}

	public openHabitDetails = (habit: Habit) => {
		new HabitModal(this.appContext.getApp(), habit).open();
	};

	// --- updateHistory ---
	// Builds the full validatable history for a habit.
	// The two recurrence branches are kept completely separate —
	// interval logic is verbatim from the original, weekday is additive.

	updateHistory(habit: Habit): Habit {
		const recurrence = habit.recurrence;

		const todayStr = DateHelper.today();
		const oneMonthAgo = new Date(DateHelper.toDate(todayStr));
		oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
		const cutoffStr = DateHelper.toDateString(oneMonthAgo);
		const createdAt = DateHelper.toDateString(habit.created_at);

		const completedDates = habit.streak.history
			.filter(h => h.success)
			.map(h => DateHelper.toDateString(h.date))
			.sort();

		// --- INTERVAL: original blocking-window logic, untouched ---
		if (recurrence.type === 'interval') {
			const allDates: DateString[] = [];
			let current = createdAt;
			while (current <= todayStr) {
				allDates.push(current);
				const d = DateHelper.toDate(current);
				d.setDate(d.getDate() + 1);
				current = DateHelper.toDateString(d);
			}

			const isInBlockedWindow = (check: string, completed: string): boolean => {
				const diff = Math.abs(Math.floor(
					(DateHelper.toDate(check).getTime() - DateHelper.toDate(completed).getTime())
					/ (1000 * 60 * 60 * 24)
				));
				return diff > 0 && diff <= (recurrence.interval - 1);
			};

			const validatableDates = allDates.filter(date => {
				if (completedDates.includes(date)) return true;
				return !completedDates.some(cd => isInBlockedWindow(date, cd));
			});

			const rebuiltHistory = validatableDates.map(date => {
				const found = habit.streak.history.find(h => DateHelper.toDateString(h.date) === date);
				if (found) {
					return { ...found, success: Number(found.success) };
				}
				return { date, success: 0 };
			});

			const trimmedHistory = rebuiltHistory.filter(entry =>
				entry.success || DateHelper.toDateString(entry.date) >= cutoffStr
			);

			return {
				...habit,
				recurrence, // write back normalized recurrence
				streak: {
					...habit.streak,
					history: trimmedHistory.sort((a, b) => a.date.localeCompare(b.date)),
				},
			};
		}

		// --- WEEKDAY: only valid weekday dates are included ---
		// No blocking window — the pattern itself is the gate.
		// Completed dates outside the pattern are preserved (user may have had
		// a different recurrence before) but new false entries are only added
		// for valid weekday dates.
		const validDates = generateValidDates(createdAt, todayStr, recurrence);

		// Merge: keep all existing successes + add false entries for valid dates
		const dateSet = new Set(validDates);

		// Preserve any existing successes even if they fall outside current pattern
		const outsideSuccesses = habit.streak.history.filter(h =>
			h.success && !dateSet.has(DateHelper.toDateString(h.date))
		);

		const rebuiltHistory = [
			...outsideSuccesses,
			...validDates.map(date => {
				const found = habit.streak.history.find(h => DateHelper.toDateString(h.date) === date);
				if (found) {
					return { ...found, success: Number(found.success) };
				}
				return { date, success: 0 };
			}),
		];

		const trimmedHistory = rebuiltHistory.filter(entry =>
			entry.success || DateHelper.toDateString(entry.date) >= cutoffStr
		);

		return {
			...habit,
			recurrence,
			streak: {
				...habit.streak,
				history: trimmedHistory.sort((a, b) => a.date.localeCompare(b.date)),
			},
		};
	}

	// --- updateDates ---
	// For interval habits this is a no-op (next expected date is purely a function of the last completion and the interval).

	updateDates(habit: Habit, date: DateString): Habit {
		const recurrence = habit.recurrence;
		const history = habit.streak.history.map(h => ({ ...h, date: DateHelper.toDateString(h.date) }));
		const lastDate = [...history].reverse().find(e => e.success)?.date ?? habit.created_at;
		const nextDate = getNextValidDate(lastDate, recurrence);

		return {
			...habit,
			recurrence,
			streak: {
				...habit.streak,
				lastCompletedDate: lastDate,
				nextDate,
			},
		};
	}

	isCompleted(habit: Habit, date: DateString): boolean {
		return habit.streak.history.some(
			h => DateHelper.toDateString(h.date) === date && h.success
		);
	}

	// --- updateHabitCompletion ---

	async updateHabitCompletion(
		habit: Habit,
		completed: boolean,
		date: Date | DateString = new Date()
	): Promise<Habit> {
		const recurrence = habit.recurrence;
		const dateStr = DateHelper.toDateString(date);

		let history = [...habit.streak.history];
		const existingEntry = history.find(entry => entry.date === dateStr);

		if (completed && existingEntry?.success) {
			throw new Error(`Habit already completed for ${dateStr}`);
		}
		if (!completed && !existingEntry) {
			console.warn(`No entry to uncheck for ${dateStr}`);
			completed = false;
		}

		const newEntry = { date: dateStr, success: completed ? 100 : 0 };
		history = existingEntry
			? history.map(entry => entry.date === dateStr ? newEntry : entry)
			: [...history, newEntry];

		const updatedWithHistory = this.updateHistory({
			...habit,
			recurrence,
			streak: { ...habit.streak, history },
		});
		history = updatedWithHistory.streak.history;

		const lastDate = [...history]
			.filter(e => e.success)
			.sort((a, b) => b.date.localeCompare(a.date))[0]?.date
			?? habit.created_at;

		const nextDate = getNextValidDate(lastDate, recurrence);
		const previousCurrent = habit.streak.current || 0;

		let { current, best, freezeAvailable, freezeUsedDates } =
			this.computeStreaks(
				habit,
				history.map(h => ({ ...h, success: Boolean(h.success) })),
				recurrence
			);

		const isCompletedToday = history.some(
			e => e.date === DateHelper.today() && e.success
		);

		freezeAvailable = this.regenerateFreeze(habit, previousCurrent, current, freezeAvailable);

		const difficulty = habit.settings.difficulty || 'normal';
		let { milestones, curve } = this.initializeMilestones(habit, difficulty);
		milestones = this.maybeGenerateNextMilestone(milestones, current, curve);

		const newLevel = milestones.filter(m => current >= m.target).length;
		let updatedRewardAttributes = { ...(habit.reward.attributes || {}) };
		updatedRewardAttributes = this.applyMilestoneUpgrade(milestones, previousCurrent, current, updatedRewardAttributes);
		updatedRewardAttributes = this.applyMilestoneDowngrade(milestones, previousCurrent, current, updatedRewardAttributes);

		const difficultyMultiplier = DIFFICULTY_RULES[difficulty as keyof typeof DIFFICULTY_RULES].rewardMultiplier || 1;
		const xpGain = 1 * newLevel * difficultyMultiplier;

		const updatedHabit: Habit = {
			...habit,
			recurrence,
			streak: {
				...habit.streak,
				current, best, history,
				isCompletedToday,
				nextDate,
				lastCompletedDate: lastDate,
				freeze: { available: freezeAvailable, history: freezeUsedDates },
			},
			progress: {
				...habit.progress,
				level: newLevel,
				XP: xpGain,
				milestones,
			},
			reward: {
				...habit.reward,
				attributes: updatedRewardAttributes,
			},
		};

		if (habit.progress.level !== updatedHabit.progress.level) {
			new Notice(`Milestone reached! Habit "${habit.title}" is now level ${updatedHabit.progress.level} and grants ${xpGain} XP!`);
		}

		return updatedHabit;
	}

	// --- computeStreaks ---
	// Interval: original logic verbatim.
	// Weekday:  mirrors interval but uses getPreviousValidDate to find expected dates.

	private computeStreaks(
		habit: Habit,
		history: { date: DateString; success: boolean }[],
		recurrence: Recurrence,
	): { current: number; best: number; freezeAvailable: number; freezeUsedDates: DateString[] } {

		const user = this.appContext.dataService.getUser();
		const difficulty = user.settings.difficulty || 'normal';
		const maxFreeze = DIFFICULTY_RULES[difficulty as keyof typeof DIFFICULTY_RULES]?.freeze ?? 0;

		let freezeAvailable = habit.streak.freeze?.available ?? maxFreeze;
		let freezeUsedDates: DateString[] = [];

		const successDates = history
			.filter(h => h.success)
			.map(h => h.date)
			.sort((a, b) => a.localeCompare(b));

		if (successDates.length === 0)
			return { current: 0, best: 0, freezeAvailable, freezeUsedDates: [] };

		// --- INTERVAL: verbatim original ---
		if (recurrence.type === 'interval') {
			let best = 1;
			let seq = 1;

			for (let i = 1; i < successDates.length; i++) {
				const prev = successDates[i - 1];
				const curr = successDates[i];
				const expected = DateHelper.addInterval(prev, recurrence.interval, recurrence.unit);

				if (curr === expected) {
					seq++;
				} else if (curr > expected) {
					const missedDates: DateString[] = [];
					let missingDate = expected;
					while (missingDate < curr) {
						missedDates.push(missingDate);
						missingDate = DateHelper.addInterval(missingDate, recurrence.interval, recurrence.unit);
					}
					const missedCount = missedDates.length;
					if (maxFreeze === Infinity) {
						seq++;
					} else if (freezeAvailable >= missedCount) {
						freezeAvailable -= missedCount;
						freezeUsedDates.push(...missedDates);
						seq++;
					} else {
						freezeUsedDates.push(...missedDates.slice(0, freezeAvailable));
						freezeAvailable = 0;
						seq = 1;
					}
				} else {
					seq = 1;
				}
				if (seq > best) best = seq;
			}

			const today = DateHelper.today();
			const last = successDates[successDates.length - 1];
			const current = (last === today) ? seq : 0;
			return { current, best, freezeAvailable, freezeUsedDates };
		}

		// --- WEEKDAY: walk expected dates using getPreviousValidDate ---
		// For each pair of consecutive successes, check what the expected previous
		// valid date was. If it was skipped, count as missed (freeze eligible).
		{
			let best = 1;
			let seq = 1;

			for (let i = 1; i < successDates.length; i++) {
				const prev = successDates[i - 1];
				const curr = successDates[i];
				const expected = getPreviousValidDate(curr, recurrence);

				if (!expected) { seq = 1; continue; }

				if (prev === expected) {
					// No gap — perfect consecutive valid dates
					seq++;
				} else if (prev < expected) {
					// Gap: collect all missed valid dates strictly between prev and curr
					const missedDates: DateString[] = [];
					let cursor: DateString | null = expected;
					while (cursor && cursor > prev) {
						missedDates.push(cursor);
						cursor = getPreviousValidDate(cursor, recurrence);
					}

					const missedCount = missedDates.length;
					if (maxFreeze === Infinity) {
						seq++;
					} else if (freezeAvailable >= missedCount) {
						freezeAvailable -= missedCount;
						freezeUsedDates.push(...missedDates);
						seq++;
					} else {
						freezeUsedDates.push(...missedDates.slice(0, freezeAvailable));
						freezeAvailable = 0;
						seq = 1;
					}
				} else {
					seq = 1;
				}
				if (seq > best) best = seq;
			}

			const today = DateHelper.today();
			const last = successDates[successDates.length - 1];
			// For weekday habits: streak is also alive if today is not a valid day
			// (you can't be expected to complete it today if today isn't a valid day)
			const todayIsValid = isValidRecurrenceDate(today, recurrence);
			const lastExpected = todayIsValid ? today : (getPreviousValidDate(today, recurrence) ?? today);
			const current = (last === lastExpected) ? seq : 0;

			return { current, best, freezeAvailable, freezeUsedDates };
		}
	}

	private regenerateFreeze(
		habit: Habit,
		previousCurrent: number,
		current: number,
		freezeAvailable: number,
	): number {
		const difficulty = this.appContext.dataService.getUser().settings.difficulty || 'normal';
		const maxFreeze = DIFFICULTY_RULES[difficulty as keyof typeof DIFFICULTY_RULES]?.freeze ?? 0;
		if (maxFreeze === Infinity || maxFreeze === 0) return freezeAvailable;
		if (current > previousCurrent && current % 7 === 0) {
			freezeAvailable = Math.min(freezeAvailable + 1, maxFreeze);
		}
		return freezeAvailable;
	}

	// --- refreshHabits ---

	refreshHabits(habit: Habit): Habit {
		const recurrence = habit.recurrence;
		const today = DateHelper.today();

		const lastCompletedDate = habit.streak.lastCompletedDate
			? DateHelper.toDateString(habit.streak.lastCompletedDate)
			: today;

		const nextDate = habit.streak.nextDate
			? DateHelper.toDateString(habit.streak.nextDate)
			: today;

		habit = this.updateDates({ ...habit, recurrence }, today);

		// isCompleted: true if completed today, OR if the next expected date is
		// still in the future (so the user isn't overdue yet)
		const isCompleted = this.isCompleted(habit, today) || today < nextDate;

		console.warn('[refreshHabits] isCompleted for', habit.title, ':', isCompleted);

		const history = this.updateHistory(habit).streak.history;

		return {
			...habit,
			recurrence,
			streak: {
				...habit.streak,
				history: history.map(h => ({ ...h, date: DateHelper.toDateString(h.date) })),
				isCompletedToday: isCompleted,
				nextDate,
				lastCompletedDate,
			},
		};
	}

	// --- Calendar pairing ---

	async pairDateHabit(date: DateString): Promise<{
		habitID: string;
		habitTitle: string;
		completed: boolean;
		couldBeCompleted: boolean;
		freezeUsed: boolean;
	}[]> {
		const habits = await this.appContext.dataService.loadAllHabits();
		const habitsArray = Object.values(habits) as Habit[];

		return habitsArray
			.filter(habit =>
				habit.streak.history.some(e => DateHelper.toDateString(e.date) === date)
			)
			.map(habit => {
				const historyEntry = habit.streak.history.find(
					e => DateHelper.toDateString(e.date) === date
				);
				const freezeUsed = habit.streak.freeze?.history?.includes(date) ?? false;
				return {
					habitID: habit.id,
					habitTitle: habit.title,
					completed: Boolean(historyEntry?.success),
					couldBeCompleted: !freezeUsed,
					freezeUsed,
				};
			});
	}

	couldBeCompletedOnDate(habit: Habit, date: DateString): boolean {
		return habit.streak.history.some(h => DateHelper.toDateString(h.date) === date);
	}

	// --- handleCheckbox ---

	handleCheckbox = async (
		habit: Habit,
		habitState: Habit[],
		completed: boolean,
		date: DateString | undefined = DateHelper.today(),
		setHabitState: (habits: Habit[]) => void,
		onHabitUpdate?: (updatedHabits: Habit[]) => void,
		onUserUpdate?: (updatedUser: UserSettings) => void,
	) => {
		try {
			const newCompleted = !completed;
			let updatedHabit = await this.updateHabitCompletion(habit, newCompleted, date);
			updatedHabit = this.reorderHistory(updatedHabit);
			await this.saveHabit(updatedHabit);

			const updatedHabits = habitState.map(h => h.id === updatedHabit.id ? updatedHabit : h);
			setHabitState(updatedHabits);

			const newUser = await this.appContext.xpService.updateXPFromAttributes(
				habit.reward.attributes || {}, newCompleted, 'habit', habit.progress.level
			);
			await this.appContext.dataService.saveUser(newUser);

			let questsArray = Object.values(await this.appContext.dataService.loadAllQuests());

			const directlyAffected = new Set<string>();
			questsArray.forEach(quest => {
				if (quest.progression.subtasks?.conditionHabits?.some(ch => ch.id === habit.id)) {
					directlyAffected.add(quest.id);
				}
			});

			if (directlyAffected.size > 0) {
				const allAffected = new Set<string>(directlyAffected);
				let foundNew = true;

				while (foundNew) {
					foundNew = false;
					questsArray.forEach(quest => {
						if (allAffected.has(quest.id)) return;
						const dep1 = quest.progression.subtasks?.conditionQuests?.some(cq => allAffected.has(cq.id));
						const dep2 = quest.requirements.previousQuests?.some(
							pq => allAffected.has(typeof pq === 'string' ? pq : pq.id)
						);
						if (dep1 || dep2) { allAffected.add(quest.id); foundNew = true; }
					});
				}

				const sorted = topologicalSort(questsArray, allAffected);
				for (const questId of sorted) {
					const idx = questsArray.findIndex(q => q.id === questId);
					if (idx !== -1) {
						questsArray[idx] = await this.appContext.questService.refreshQuestsWithContext(
							questsArray[idx], questsArray
						);
					}
				}
				await this.appContext.dataService.saveAllQuests(questsArray);

				document.dispatchEvent(new CustomEvent('dbUpdated', {
					detail: { type: 'habit', action: 'complete', data: habit },
				}));
			}

			if (onHabitUpdate) onHabitUpdate(updatedHabits);
			if (onUserUpdate) onUserUpdate(newUser);
		} catch (error) {
			console.error('Error updating habit:', error);
		}
	};

	private reorderHistory(habit: Habit): Habit {
		return {
			...habit,
			streak: {
				...habit.streak,
				history: [...habit.streak.history].sort((a, b) => a.date.localeCompare(b.date)),
			},
		};
	}

	// --- Milestone helpers ---

	private initializeMilestones(
		habit: Habit,
		difficulty: keyof typeof MILESTONE_CURVES,
	): { milestones: Habit['progress']['milestones']; curve: number[] } {
		const curve = MILESTONE_CURVES[difficulty] || MILESTONE_CURVES.easy;
		let milestones = [...(habit.progress.milestones || [])];
		if (milestones.length === 0 && curve.length > 0) {
			milestones.push({ target: curve[0], reward: { items: ['Milestone Badge'] } });
		}
		return { milestones, curve };
	}

	private maybeGenerateNextMilestone(
		milestones: Habit['progress']['milestones'],
		current: number,
		curve: number[],
	): Habit['progress']['milestones'] {
		const last = milestones[milestones.length - 1];
		if (!last || current < last.target) return milestones;
		const existing = new Set(milestones.map(m => m.target));
		const nextTarget = curve.find(t => !existing.has(t));
		if (!nextTarget) return milestones;
		return [...milestones, { target: nextTarget, reward: { attributes: { endurance: 1 } } }];
	}

	private applyMilestoneUpgrade(
		milestones: Habit['progress']['milestones'],
		previousCurrent: number,
		current: number,
		rewardAttributes: AttributeBlock,
	): AttributeBlock {
		const newlyReached = milestones.find(
			m => previousCurrent < m.target && current >= m.target
		);
		if (!newlyReached?.reward?.attributes) return rewardAttributes;
		const updated = { ...rewardAttributes };
		for (const [key, value] of Object.entries(newlyReached.reward.attributes)) {
			const k = key as keyof AttributeBlock;
			updated[k] = (updated[k] || 0) + value;
		}
		return updated;
	}

	private applyMilestoneDowngrade(
		milestones: Habit['progress']['milestones'],
		previousCurrent: number,
		current: number,
		rewardAttributes: AttributeBlock,
	): AttributeBlock {
		const prevUnlocked = milestones.filter(m => previousCurrent >= m.target).length;
		const currUnlocked = milestones.filter(m => current >= m.target).length;
		if (prevUnlocked <= currUnlocked) return rewardAttributes;

		const lost = milestones.filter(m => previousCurrent >= m.target).slice(currUnlocked);
		const updated = { ...rewardAttributes };

		for (const milestone of lost) {
			if (!milestone.reward?.attributes) continue;
			for (const [key, value] of Object.entries(milestone.reward.attributes)) {
				let remaining = value;
				const k = key as keyof AttributeBlock;
				const main = updated[k] || 0;
				const removed = Math.min(main, remaining);
				updated[k] = main - removed;
				remaining -= removed;
				if (remaining > 0) {
					for (const [ok, ov] of Object.entries(updated).sort((a, b) => b[1] - a[1])) {
						if (ov <= 0) continue;
						const rm = Math.min(ov, remaining);
						updated[ok as keyof AttributeBlock] = ov - rm;
						remaining -= rm;
						if (remaining <= 0) break;
					}
				}
			}
		}
		return updated;
	}
}


// Helper function: Topological sort
function topologicalSort(allQuests: Quest[], affectedIds: Set<string>): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    // Initialize for all affected quests
    affectedIds.forEach(id => {
        graph.set(id, []);
        inDegree.set(id, 0);
    });

    // Build the dependency graph for ALL affected quests
    affectedIds.forEach(questId => {
        const quest = allQuests.find(q => q.id === questId);
        if (!quest) return;

        // Find dependencies (what this quest depends ON)
        const dependencies: string[] = [];

        // Check conditionQuests
        quest.progression.subtasks?.conditionQuests?.forEach(cq => {
            if (affectedIds.has(cq.id)) {
                dependencies.push(cq.id);
            }
        });
        // Check previousQuests
        quest.requirements.previousQuests?.forEach(pq => {
            const pqId = typeof pq === 'string' ? pq : pq.id;
            if (affectedIds.has(pqId)) {
                dependencies.push(pqId);
            }
        });
        // Update the graph
        dependencies.forEach(depId => {
            // depId -> questId (depId must be done before questId)
            if (!graph.has(depId)) {
                graph.set(depId, []);
                inDegree.set(depId, 0);
            }
            graph.get(depId)!.push(questId);
        });
        // Set in-degree
        inDegree.set(questId, (inDegree.get(questId) || 0) + dependencies.length);
    });
	// Kahn's algorithm for topological sort
    const queue: string[] = [];
    const result: string[] = [];

    // Start with quests that have no dependencies (in-degree = 0)
    inDegree.forEach((degree, questId) => {
        if (degree === 0) {
            queue.push(questId);
        }
    });
    while (queue.length > 0) {
        const current = queue.shift()!;
        result.push(current);

        // Process all quests that depend on current
        const dependents = graph.get(current) || [];
        dependents.forEach(dependent => {
            const newDegree = (inDegree.get(dependent) || 0) - 1;
            inDegree.set(dependent, newDegree);

            if (newDegree === 0) {
                queue.push(dependent);
            }
        });
    }
    return result;
}
