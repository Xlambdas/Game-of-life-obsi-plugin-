import { normalize } from "path";
import { AppContextService } from "../appContextService";
// from files (default):
import { Habit, Quest, UserSettings } from "data/DEFAULT";
import DataService from "./dataService";
import { GenericForm } from "components/forms/genericForm";
import { DateHelper, DateString } from "helpers/dateHelpers";

interface HabitCompletionResult {
	updatedHabit: Habit;
	updatedUser: UserSettings;
	updatedQuests: Quest[];
	affectedQuestIds: string[];
}

export default class HabitService {
	/* Handles all habit-related operations: create, update, delete, mark complete/incomplete.
		Uses AppContextService for data persistence.
		Contains logic to manage habit streaks and recurrences.
	*/
	private appContext: AppContextService;

	constructor(contextService: AppContextService) {
		this.appContext = contextService;
	}

	// -----------------
	// CRUD operations :
	async saveHabit(habit: Habit): Promise<void> {
		await this.appContext.dataService.addHabit(habit);
	}
	async saveAllHabits(habits: Habit[]): Promise<void> {
		await this.appContext.dataService.saveAllHabits(habits);
	}
	async getHabitById(habitID: string): Promise<Habit | null> {
		return this.appContext.dataService.getHabitbyID(habitID).then(habit => habit || null);
	}

	// -------------------
	// general functions :
	public handleGetDaysUntil = (StartDate: DateString, targetDate: DateString): string => {
		// get days until target date for habit
		return this.appContext.xpService.getDaysUntil(StartDate, targetDate, 'habit');
	}

	// -----------------------------
	// Habit Modal related methods :
	public handleModify = (habit: Habit) => {
		new GenericForm(this.appContext.getApp(), 'habit-modify', habit).open();
	};


	// ------------------------
	// Habit logic methods :
	async completeHabit(
		habit: Habit,
		completed: boolean,
		date: DateString | DateString = DateHelper.today()
	): Promise<HabitCompletionResult> {
		/* Complete or uncomplete a habit and update all related data:
		- Habit completion status and streaks
		- User XP and attributes
		- Dependent quests progression
		Returns all updated entities for the UI to handle
		*/

		// Update the habit
		const updatedHabit = await this.updateHabitCompletion(habit, completed);
		await this.saveHabit(updatedHabit);

		// Update user XP based on habit completion
		const updatedUser = await this.appContext.xpService.updateXPFromAttributes(
			habit.reward.attributes || {},
			completed,
			'habit',
			habit.progress.level
		);
		await this.appContext.dataService.saveUser(updatedUser);

		// Find and update all affected quests
		let allQuests = await this.appContext.dataService.loadAllQuests();
		let questsArray = Object.values(allQuests);

		// Find all quests that depend on this habit (directly)
		const directlyAffectedQuestIds = new Set<string>();
		questsArray.forEach(quest => {
			if (quest.progression.subtasks?.conditionHabits?.some(ch => ch.id === habit.id)) {
				directlyAffectedQuestIds.add(quest.id);
			}
		});

		let updatedQuests: Quest[] = [];
		let affectedQuestIds: string[] = [];

		if (directlyAffectedQuestIds.size > 0) {
			// Build complete dependency chain
			const allAffectedQuestIds = this.buildQuestDependencyChain(
				questsArray,
				directlyAffectedQuestIds
			);

			// Sort quests by dependency order
			const sortedQuestIds = this.topologicalSortQuests(questsArray, allAffectedQuestIds);

			// Refresh in dependency order
			for (const questId of sortedQuestIds) {
				const questIndex = questsArray.findIndex(q => q.id === questId);
				if (questIndex !== -1) {
					const quest = questsArray[questIndex];
					const refreshedQuest = await this.appContext.questService.refreshQuestsWithContext(
						quest,
						questsArray
					);
					questsArray[questIndex] = refreshedQuest;
				}
			}

			await this.appContext.dataService.saveAllQuests(questsArray);
			updatedQuests = questsArray.filter(q => allAffectedQuestIds.has(q.id));
			affectedQuestIds = Array.from(allAffectedQuestIds);
		}

		return {
			updatedHabit,
			updatedUser,
			updatedQuests,
			affectedQuestIds
		};
	}

	// Helper: Build the complete dependency chain for affected quests
	private buildQuestDependencyChain(
		questsArray: Quest[],
		directlyAffectedQuestIds: Set<string>
	): Set<string> {
		const allAffectedQuestIds = new Set<string>(directlyAffectedQuestIds);
		let foundNewDependents = true;

		while (foundNewDependents) {
			foundNewDependents = false;
			questsArray.forEach(quest => {
				if (allAffectedQuestIds.has(quest.id)) return;

				const dependsOnAffectedQuest = quest.progression.subtasks?.conditionQuests?.some(
					cq => allAffectedQuestIds.has(cq.id)
				);
				const dependsOnAffectedInRequirements = quest.requirements.previousQuests?.some(
					pq => {
						const pqId = typeof pq === 'string' ? pq : pq.id;
						return allAffectedQuestIds.has(pqId);
					}
				);

				if (dependsOnAffectedQuest || dependsOnAffectedInRequirements) {
					allAffectedQuestIds.add(quest.id);
					foundNewDependents = true;
				}
			});
		}

		return allAffectedQuestIds;
	}

	// Helper: Topological sort for quest dependencies
	private topologicalSortQuests(allQuests: Quest[], affectedIds: Set<string>): string[] {
		const graph = new Map<string, string[]>();
		const inDegree = new Map<string, number>();

		// Initialize for all affected quests
		affectedIds.forEach(id => {
			graph.set(id, []);
			inDegree.set(id, 0);
		});

		// Build the dependency graph
		affectedIds.forEach(questId => {
			const quest = allQuests.find(q => q.id === questId);
			if (!quest) return;

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
				if (!graph.has(depId)) {
					graph.set(depId, []);
					inDegree.set(depId, 0);
				}
				graph.get(depId)!.push(questId);
			});

			inDegree.set(questId, (inDegree.get(questId) || 0) + dependencies.length);
		});

		// Kahn's algorithm for topological sort
		const queue: string[] = [];
		const result: string[] = [];

		inDegree.forEach((degree, questId) => {
			if (degree === 0) {
				queue.push(questId);
			}
		});

		while (queue.length > 0) {
			const current = queue.shift()!;
			result.push(current);

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












	updateDates(habit: Habit, date: DateString): Habit {
		/* Update the lastCompletedDate of a habit and recalculate nextDate */
		const history = habit.streak.history.map(h => ({ ...h, date: DateHelper.toDateString(h.date) }));
		const lastDate = [...history].reverse().find(entry => entry.success)?.date ?? habit.created_at;
		const nextDate = this.calculateNextDate(lastDate, habit.recurrence);

		return {
			...habit,
			streak: {
				...habit.streak,
				lastCompletedDate: lastDate,
				nextDate: nextDate,
			},
		};
	}

	isCompleted(habit: Habit, date: Date | DateString = new Date()): boolean {
		const dateStr = DateHelper.toDateString(date);
		return habit.streak.history.some(
			entry => entry.date === dateStr && entry.success
		);
	}

	// isCompleted_old(habit: Habit, inputDate?: Date): boolean {
	// 	/* Check if a habit is completed for a given date (default: today). */
	// 	let date = DateHelper.toDateString(new Date(inputDate ?? new Date()));

	// 	this.updateDates(habit, date); // ensure dates are up to date
	// 	const todayStr = new Date().toDateString();
	// 	const lastDate = habit.streak.lastCompletedDate
	// 		? new Date(habit.streak.lastCompletedDate)
	// 		: new Date(0);
	// 	const nextDate = habit.streak.nextDate ? new Date(habit.streak.nextDate) : new Date();

	// 	const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
	// 	const dateStr = normalizeDate(date);
	// 	let isCompleted = false;
	// 	if (normalizeDate(lastDate).getTime() === dateStr.getTime()) {
	// 		isCompleted = true;
	// 	} else if (normalizeDate(nextDate).getTime() > normalizeDate(date).getTime()) {
	// 		isCompleted = true;
	// 	} else if (normalizeDate(nextDate).getTime() <= normalizeDate(date).getTime()) {
	// 		isCompleted = false;
	// 	}
	// 	// console.log(
	// 	// 	`Checking completion for habit ${habit.id} on ${dateStr}: lastCompletedDate=${lastDate.toDateString()}, nextDate=${nextDate.toDateString()}, isCompleted=${isCompleted}`
	// 	// );

	// 	return isCompleted;
	// }

	async updateHabitCompletion(
		habit: Habit,
		completed: boolean,
		date: Date | DateString = new Date()
	): Promise<Habit> {
		// ✅ Convert to DateString immediately
		const dateStr = DateHelper.toDateString(date);

		// console.log(`Updating habit ${habit.id} for date: ${dateStr}`);

		let history = [...habit.streak.history]; // Already DateString[]
		const existingEntry = history.find(entry => entry.date === dateStr);

		// error cases
		if (completed && existingEntry?.success) {
			throw new Error(`Habit already completed for ${dateStr}`);
		}
		if (!completed && !existingEntry) {
			console.warn(`No entry to uncheck for ${dateStr}`);
			completed = false;
		}

		if (completed) {
			// ✅ Store as DateString
			const newEntry = { date: dateStr, success: true };
			history = existingEntry
				? history.map(entry => (entry.date === dateStr ? newEntry : entry))
				: [...history, newEntry];
		} else {
			history = history.filter(entry => entry.date !== dateStr);
		}

		// calculate key dates
		const lastCompletedEntry = [...history]
			.filter(e => e.success)
			.sort((a, b) => b.date.localeCompare(a.date))[0];

		const lastDate = lastCompletedEntry?.date ?? habit.created_at;
		const nextDate = this.calculateNextDate(lastDate, habit.recurrence);

		const { current, best } = this.computeStreaks(history, habit.recurrence);
		const isCompleted = DateHelper.today() < nextDate ? true : false;

		const updatedHabit: Habit = {
			...habit,
			streak: {
				...habit.streak,
				current,
				best,
				history,
				isCompletedToday: isCompleted,
				nextDate,
				lastCompletedDate: lastDate,
			},
		};

		return updatedHabit;
	}


	async updateHabitCompletion_old(
		habit: Habit,
		completed: boolean,
		dateN: Date = new Date()
	): Promise<Habit> {
		/* Marks a habit as completed or not for a specific date (default today).
			Updates the habit's streak, history, nextDate, and lastCompletedDate accordingly.
			Throws error if trying to complete an already completed date or uncomplete a non-completed date.
		*/
		const date = DateHelper.toDateString(dateN);
		this.updateDates(habit, date); // ensure dates are up to date
		const normalizeDate = (d: Date | string) => new Date(d).toDateString();
		const dateStr = normalizeDate(date);

		let history = habit.streak.history.map(h => ({ ...h, date: new Date(h.date) }));
		const existingEntry = history.find(entry => normalizeDate(entry.date) === dateStr);

		// error cases
		if (completed && existingEntry?.success) {
			throw new Error(`Habit ${habit.id} already completed for ${dateStr}. No further action possible.`);
		}
		if (!completed && !existingEntry) {
			console.warn(
				`[Correction] Habit ${habit.id} n’avait pas d’entrée à décocher pour ${dateStr}, forçage de isCompletedToday=false`
			);
			completed = false;
		}

		if (completed) {
			const newEntry = { date, success: true };
			// history = existingEntry
			// 	? history.map(entry => (normalizeDate(entry.date) === dateStr ? newEntry : entry))
			// 	: [...history, newEntry];
		} else {
			history = history.filter(entry => normalizeDate(entry.date) !== dateStr);
		}

		// calculate key dates
		const lastDate =
			[...history].reverse().find(entry => entry.success)?.date ?? new Date(0);
		// const nextDate = this.calculateNextDate(lastDate, habit.recurrence, habit.created_at);

		// const isCompleted = this.isCompleted({ ...habit, streak: { ...habit.streak, history, nextDate: nextDate, lastCompletedDate: lastDate } });
		// const { current, best } = this.computeStreaks(history, habit.recurrence);

		const progress = this.calculateProgress(habit);

		const updatedHabit: Habit = {
			...habit,
			streak: {
				...habit.streak,
				// current: current,
				// best: best,
				// history,
				// isCompletedToday: isCompleted,
				// nextDate: new Date(nextDate),
				// lastCompletedDate: lastDate,
			},
		};
		return updatedHabit;
	}

	private calculateNextDate(
		fromDate: DateString,
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }
	): DateString {
		return DateHelper.addInterval(fromDate, recurrence.interval, recurrence.unit);
	}

	private calculateNextDate_old(
		fromDate: Date,
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" },
		fallbackCreatedAt?: Date
	): Date {
		// Defensive : fromDate invalid -> fallback or epoch
		if (!fromDate || isNaN(fromDate.getTime())) {
			if (fallbackCreatedAt) return new Date(fallbackCreatedAt);
			return new Date(0);
		}

		// if fromDate is epoch (0), return created_at or epoch
		if (fromDate.getTime() === 0) {
			if (fallbackCreatedAt) return new Date(fallbackCreatedAt);
			return new Date(0);
		}

		const nextDate = new Date(fromDate); // clone
		const { interval, unit } = recurrence;

		switch (unit) {
			case "days":
				nextDate.setDate(nextDate.getDate() + interval);
				break;
			case "weeks":
				nextDate.setDate(nextDate.getDate() + interval * 7);
				break;
			case "months":
				nextDate.setMonth(nextDate.getMonth() + interval);
				break;
			case "years":
				nextDate.setFullYear(nextDate.getFullYear() + interval);
				break;
			default:
				nextDate.setDate(nextDate.getDate() + interval);
				break;
		}

		// console.log("[calculateNextDate] from:", fromDate.toISOString(), "-> next:", nextDate.toISOString());
		return nextDate;
	}

	private computeStreaks(
		history: { date: DateString; success: boolean }[],
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }
	): { current: number; best: number } {
		// ✅ Filter and sort using strings
		const successDates = history
			.filter(h => h.success)
			.map(h => h.date)
			.sort((a, b) => a.localeCompare(b)); // String sort works perfectly!

		if (successDates.length === 0) return { current: 0, best: 0 };

		// Calculate best streak
		let best = 1;
		let seq = 1;
		for (let i = 1; i < successDates.length; i++) {
			const prev = successDates[i - 1];
			const curr = successDates[i];
			const expected = DateHelper.addInterval(prev, recurrence.interval, recurrence.unit);

			if (expected === curr) {
				seq++;
			} else {
				seq = 1;
			}
			if (seq > best) best = seq;
		}

		// Calculate current streak (must end today)
		const today = DateHelper.today();
		let current = 0;
		const last = successDates[successDates.length - 1];

		if (last === today) {
			current = 1;
			let lastDate = last;
			for (let i = successDates.length - 2; i >= 0; i--) {
				const prev = successDates[i];
				const expectedNext = DateHelper.addInterval(
					prev,
					recurrence.interval,
					recurrence.unit
				);
				if (expectedNext === lastDate) {
					current++;
					lastDate = prev;
				} else {
					break;
				}
			}
		}

		return { current, best };
	}


	private computeStreaks_old(
		history: { date: Date | string; success: boolean }[],
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }
	): { current: number; best: number } {
		const normalizeDateOnly = (d: Date | string) => {
			const dt = new Date(d);
			return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); // 00:00 local
		};

		const addInterval = (d: Date, interval: number, unit: string) => {
			const r = new Date(d);
			switch (unit) {
			case "days":
				r.setDate(r.getDate() + interval);
				break;
			case "weeks":
				r.setDate(r.getDate() + interval * 7);
				break;
			case "months":
				r.setMonth(r.getMonth() + interval);
				break;
			case "years":
				r.setFullYear(r.getFullYear() + interval);
				break;
			default:
				r.setDate(r.getDate() + interval);
			}
			return new Date(r.getFullYear(), r.getMonth(), r.getDate());
		};

		// only keep successful entries, one per day
		const map = new Map<string, Date>();
		for (const h of history) {
			if (!h.success) continue;
			const d = normalizeDateOnly(h.date);
			map.set(d.toDateString(), d); // the key = date string ensures one entry per day
		}

		const dates = Array.from(map.values()).sort((a, b) => a.getTime() - b.getTime());
		if (dates.length === 0) return { current: 0, best: 0 };

		// calculate best (longest streak anywhere in history)
		let best = 1;
		let seq = 1;
		for (let i = 1; i < dates.length; i++) {
			const prev = dates[i - 1];
			const curr = dates[i];
			const expected = addInterval(prev, recurrence.interval, recurrence.unit);
			if (expected.getTime() === curr.getTime()) {
			seq++;
			} else {
			seq = 1;
			}
			if (seq > best) best = seq;
		}

		// calculate current : streak that ends today (otherwise current = 0)
		const today = normalizeDateOnly(new Date());
		let current = 0;
		const last = dates[dates.length - 1];
		if (last.getTime() === today.getTime()) {
			current = 1;
			let lastDate = last;
			for (let i = dates.length - 2; i >= 0; i--) {
			const prev = dates[i];
			const expectedNext = addInterval(prev, recurrence.interval, recurrence.unit);
			if (expectedNext.getTime() === lastDate.getTime()) {
				current++;
				lastDate = prev;
			} else {
				break;
			}
			}
		} else {
			current = 0;
		}

		return { current, best };
	}

	calculateProgress(habit: Habit): Habit {
		// Calculate the progress part of the habit : milestones, level (adding attributes, xp)
		if (habit.progress.milestones.length > 0) {
			const nextMilestone = habit.progress.milestones.find(m => m.target > habit.streak.current);
			if (nextMilestone) {
			}
			return habit;
		}
		return habit;
	}

	refreshHabits(habit: Habit): Habit {
		const today = DateHelper.today();
		// console.log("Refreshing habit:", habit.id, today);

		const lastCompletedDate = habit.streak.lastCompletedDate
			? DateHelper.toDateString(habit.streak.lastCompletedDate)
			: today;

		const nextDate = habit.streak.nextDate
			? DateHelper.toDateString(habit.streak.nextDate)
			: today;

		habit = this.updateDates(habit, today);
		let isCompleted = this.isCompleted(habit, today) ? true : (today<nextDate) ? true : false;

		return {
			...habit,
			streak: {
			...habit.streak,
			history : habit.streak.history.map(h => ({ ...h, date: DateHelper.toDateString(h.date) })),
			isCompletedToday : isCompleted,
			nextDate: nextDate,
			lastCompletedDate: lastCompletedDate,
			},
		};
	}

	// ------------------------
	// Calendar related methods
	pairDateHabit = async (date: string | Date): Promise<PairDateHabit['habits']> => {
		// create pair for one date the habits and their completion status.
		date = toYMDLocal(date);
		// console.error(`Pairing habits for date: ${date}`);

		const allHabits = await this.appContext.dataService.loadAllHabits();
		const filteredHabits = allHabits
			.map(habit => {
				const habitHistory = habit.streak?.history ?? [];
				// console.log('habit history:', habitHistory);

				// Check if habit was completed on the given date
				const completed = habitHistory.some(entry => {
					const entryDate = toYMDLocal(entry.date);
					return entryDate === date && Boolean(entry.success);
				});
				// console.warn(`Habit: ${habit.title}, Completed on ${date}: ${completed}`);

				return {
					habitID: habit.id,
					habitTitle: habit.title,
					completed: completed,
					couldBeCompleted: completed || this.couldBeCompletedOnDate(habit, date)
				};
			})
			.filter(habit => habit.couldBeCompleted);

		// console.log(`For date ${date}, paired habits:`, filteredHabits);
		return filteredHabits;
	};

	// Helper to determine if a habit could be completed on a specific date
	couldBeCompletedOnDate = (habit: Habit, targetDate: string): boolean => {
		// console.info('Checking if habit', habit.title, 'could be completed on', targetDate);
		const normalizeDate = (d: Date | string) => {
			const dt = new Date(d);
			return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
		};

		const targetNormalized = normalizeDate(targetDate);
		const createdAt = normalizeDate(habit.created_at);

		// Si la date cible est avant la création de l'habit
		if (targetNormalized < createdAt || targetNormalized > normalizeDate(new Date())) {
			// console.log('Date cible avant création ou dans le futur; target:', targetNormalized, 'createdAt:', createdAt);
			return false;
		}

		// Trouver la dernière complétion avant ou égale à la date cible
		const historyBeforeTarget = habit.streak.history
			.filter(entry => entry.success)
			.map(entry => normalizeDate(entry.date))
			.filter(d => d <= targetNormalized)
			.sort((a, b) => b.getTime() - a.getTime());

		const lastCompletedBefore = historyBeforeTarget[0] || null;
		// console.log('Last completed before target:', lastCompletedBefore);

		// Calculer la prochaine date attendue basée sur la dernière complétion ou la création
		let baseDate = lastCompletedBefore || createdAt;
		const nextExpectedDate = baseDate != createdAt ? this.calculateNextDateHelper(baseDate, habit.recurrence) : createdAt;


		// console.log('Next expected date for habit', habit.title, 'is', nextExpectedDate, 'and base is', baseDate);

		if (nextExpectedDate > targetNormalized) {
			// console.log('----- Habit cannot be completed yet; next expected:', nextExpectedDate, 'target:', targetNormalized);
			return false;
		}

		const historyAfterTarget = habit.streak.history
			.map(entry => normalizeDate(entry.date))
			.filter(d => d > targetNormalized)
			.sort((a, b) => a.getTime() - b.getTime());

		if (historyAfterTarget.length > 0) {
			// check if history after target date has a completion, if so, check if it blocks completion
			const firstAfter = historyAfterTarget[0];
			const previousCompletions = this.calculateNextDateHelper(firstAfter, { interval: -habit.recurrence.interval, unit: habit.recurrence.unit });
			// console.log('First history after target:', firstAfter, 'future completions date:', previousCompletions);
			if (targetNormalized > previousCompletions) {
				// console.log('----- Habit completion blocked by future completion on', firstAfter);
				return false;
			}
		}
		return true;
	};

	// Helper to calculate the next date (similar to calculateNextDate from HabitService)
	calculateNextDateHelper = (
		fromDate: Date,
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }
	): Date => {
		const nextDate = new Date(fromDate);
		const { interval, unit } = recurrence;

		switch (unit) {
			case "days":
				nextDate.setDate(nextDate.getDate() + interval);
				break;
			case "weeks":
				nextDate.setDate(nextDate.getDate() + interval * 7);
				break;
			case "months":
				nextDate.setMonth(nextDate.getMonth() + interval);
				break;
			case "years":
				nextDate.setFullYear(nextDate.getFullYear() + interval);
				break;
		}

		return new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
	};

	public formatDate = (date: Date) => {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		
		if (date.toDateString() === today.toDateString()) {
			return 'Today';
		} else if (date.toDateString() === yesterday.toDateString()) {
			return 'Yesterday';
		}
		return date.toLocaleDateString('en-US', { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	};

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

			const newUser = await this.appContext.xpService.updateXPFromAttributes(habit.reward.attributes || {}, newCompleted, 'habit', habit.progress.level);
			await this.appContext.dataService.saveUser(newUser);

			let allQuests = await this.appContext.dataService.loadAllQuests();
			let questsArray = Object.values(allQuests);

			// Find all quests that depend on this habit (directly)
			const directlyAffectedQuestIds = new Set<string>();
			questsArray.forEach(quest => {
				if (quest.progression.subtasks?.conditionHabits?.some(ch => ch.id === habit.id)) {
					directlyAffectedQuestIds.add(quest.id);
				}
			});
			if (directlyAffectedQuestIds.size > 0) {
				// Build complete dependency chain
				const allAffectedQuestIds = new Set<string>(directlyAffectedQuestIds);
				let foundNewDependents = true;

				while (foundNewDependents) {
					foundNewDependents = false;
					questsArray.forEach(quest => {
						if (allAffectedQuestIds.has(quest.id)) return;
						const dependsOnAffectedQuest = quest.progression.subtasks?.conditionQuests?.some(
							cq => allAffectedQuestIds.has(cq.id)
						);
						const dependsOnAffectedInRequirements = quest.requirements.previousQuests?.some(
							pq => {
								const pqId = typeof pq === 'string' ? pq : pq.id;
								return allAffectedQuestIds.has(pqId);
							}
						);
						if (dependsOnAffectedQuest || dependsOnAffectedInRequirements) {
							allAffectedQuestIds.add(quest.id);
							foundNewDependents = true;
						}
					});
				}
				// Sort quests by dependency order
				const sortedQuestIds = topologicalSort(questsArray, allAffectedQuestIds);
				// Refresh in dependency order, passing the current quest state
				for (const questId of sortedQuestIds) {
					const questIndex = questsArray.findIndex(q => q.id === questId);
					if (questIndex !== -1) {
						const quest = questsArray[questIndex];
						const refreshedQuest = await this.appContext.questService.refreshQuestsWithContext(quest, questsArray);
						questsArray[questIndex] = refreshedQuest;
					}
				}
				await this.appContext.dataService.saveAllQuests(questsArray);

				document.dispatchEvent(new CustomEvent("dbUpdated", {
					detail: {
						type: 'habit',
						action: 'complete',
						data: habit
					}
				}));
			}
			if (onHabitUpdate) onHabitUpdate(updatedHabits);
			if (onUserUpdate) onUserUpdate(newUser);
		} catch (error) {
			console.error("Error updating habit:", error);
		}
	};

	reorderHistory(habit: Habit): Habit {
		// Reorder the habit history by date ascending
		const reorderedHistory = [...habit.streak.history].sort((a, b) => {
			const dateA = new Date(a.date).getTime();
			const dateB = new Date(b.date).getTime();
			return dateA - dateB;
		});
		return {
			...habit,
			streak: {
				...habit.streak,
				history: reorderedHistory
			}
		};
	}
}


interface PairDateHabit {
	date: Date;
	habits: { habitID: string, habitTitle: string, completed: boolean, couldBeCompleted: boolean }[];
}

function toYMDLocal(input: string | Date): string {
	const d = input instanceof Date ? input : new Date(String(input));
	if (isNaN(d.getTime())) return ""; // invalid date guard
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
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
