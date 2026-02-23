import { normalize } from "path";
import { AppContextService } from "../appContextService";
// from files (default):
import { Habit, Quest, UserSettings, DIFFICULTY_RULES, MILESTONE_CURVES } from "data/DEFAULT";
import DataService from "./dataService";
import { GenericForm } from "components/forms/genericForm";
import { DateHelper, DateString } from "helpers/dateHelpers";
import { AttributeBlock } from "data/attributeDetails";
import { HabitModal } from "../../modal/habitDetailsModal";
import { Notice } from "obsidian";

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

	async deleteHabit(habitID: string, questService: any): Promise<void> {
		await this.appContext.dataService.deleteHabitAndCleanQuests(habitID, questService);
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

	public archiveHabit = async (habit: Habit): Promise<void> => {
		const history = habit.streak.history
			.filter(h => h.success)
			.map(h => ({ ...h, date: DateHelper.toDateString(h.date) }));
		let updatedHabit = {
			...habit,
			isArchived: true,
			streak: {
				...habit.streak,
				history: history
			}
		};
		await this.appContext.dataService.addHabit(updatedHabit);
	}

	public openHabitDetails = (habit: Habit) => {
		new HabitModal(this.appContext.getApp(), habit).open();
	};

	updateHistory(habit: Habit): Habit {
		/*
		Generate validatable dates
		*/

		const todayStr = DateHelper.today();
		const today = new Date(todayStr);

		const oneMonthAgo = new Date(today);
		oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

		const cutoffStr = DateHelper.toDateString(oneMonthAgo);

		const createdAt = DateHelper.toDateString(habit.created_at);

		// Generate all possible validatable dates (same as before)
		const completedDates = habit.streak.history
			.filter(h => h.success)
			.map(h => DateHelper.toDateString(h.date))
			.sort();

		const allDates: string[] = [];
		let currentDate = createdAt;

		while (currentDate <= todayStr) {
			allDates.push(currentDate);
			const date = new Date(currentDate);
			date.setDate(date.getDate() + 1);
			currentDate = DateHelper.toDateString(date);
		}

		const isInBlockedWindow = (dateToCheck: string, completedDate: string): boolean => {
			const checkDate = new Date(dateToCheck);
			const completeDate = new Date(completedDate);
			const diffInDays = Math.abs(
				Math.floor((checkDate.getTime() - completeDate.getTime()) / (1000 * 60 * 60 * 24))
			);
			const windowSize = habit.recurrence.interval - 1;
			return diffInDays > 0 && diffInDays <= windowSize;
		};

		const validatableDates = allDates.filter(date => {
			if (completedDates.includes(date)) return true;

			for (const completedDate of completedDates) {
				if (isInBlockedWindow(date, completedDate)) return false;
			}
			return true;
		});

		// Rebuild history with false entries
		const rebuiltHistory = validatableDates.map(date => {
			const existing = habit.streak.history.find(
				h => DateHelper.toDateString(h.date) === date
			);

			return existing || {
				date: date,
				success: false
			};
		});

		// Trim old false entries (but keep true forever)
		const trimmedHistory = rebuiltHistory.filter(entry => {
			const dateStr = DateHelper.toDateString(entry.date);

			if (entry.success) return true;

			return dateStr >= cutoffStr;
		});

		return {
			...habit,
			streak: {
				...habit.streak,
				history: trimmedHistory.sort((a, b) =>
					a.date.localeCompare(b.date)
				),
			},
		};
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

	isCompleted(habit: Habit, date: DateString): boolean {
		const historyEntry = habit.streak.history.find(
			h => DateHelper.toDateString(h.date) === date
		);
		return historyEntry?.success === true;
	}

	async updateHabitCompletion(
		habit: Habit,
		completed: boolean,
		date: Date | DateString = new Date()
	): Promise<Habit> {
		// Convert to DateString immediately
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
			const newEntry = { date: dateStr, success: true };
			history = existingEntry
				? history.map(entry => (entry.date === dateStr ? newEntry : entry))
				: [...history, newEntry];

		} else {
			const newEntry = { date: dateStr, success: false };
			history = existingEntry
				? history.map(entry => (entry.date === dateStr ? newEntry : entry))
				: [...history, newEntry];
		}

		// recalculate the possible check dates :
		const updatedHabitWithHistory = this.updateHistory({
			...habit,
			streak: {
				...habit.streak,
				history: history,
			},
		});

		history = updatedHabitWithHistory.streak.history;

		// calculate key dates
		const lastCompletedEntry = [...history]
			.filter(e => e.success)
			.sort((a, b) => b.date.localeCompare(a.date))[0];

		const lastDate = lastCompletedEntry?.date ?? habit.created_at;
		const nextDate = this.calculateNextDate(lastDate, habit.recurrence);

		const previousCurrent = habit.streak.current || 0;
		// const { current, best } = this.computeStreaks(history, habit.recurrence);
		let { current, best, freezeAvailable, freezeUsedDates } = this.computeStreaks(habit, history, habit.recurrence);
		const isCompleted = history.some(
			e => e.date === DateHelper.today() && e.success
		);


		freezeAvailable = this.regenerateFreeze(
			habit,
			previousCurrent,
			current,
			freezeAvailable
		);


		// ---- Milestones ----
		const difficulty = habit.settings.difficulty || 'normal';

		let { milestones, curve } =
			this.initializeMilestones(habit, difficulty);

		milestones =
			this.maybeGenerateNextMilestone(
				milestones,
				current,
				curve
			);

		const newLevel = milestones.filter(
			m => current >= m.target
		).length;

		let updatedRewardAttributes = {
			...(habit.reward.attributes || {})
		};

		updatedRewardAttributes =
			this.applyMilestoneUpgrade(
				milestones,
				previousCurrent,
				current,
				updatedRewardAttributes
			);

		updatedRewardAttributes =
			this.applyMilestoneDowngrade(
				milestones,
				previousCurrent,
				current,
				updatedRewardAttributes
			);

		const baseXP = 1;
		const difficultyMultiplier = DIFFICULTY_RULES[difficulty as keyof typeof DIFFICULTY_RULES].rewardMultiplier || 1;

		const xpGain =
			baseXP *
			newLevel *
			difficultyMultiplier;

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
				freeze: {
					available: freezeAvailable,
					history: freezeUsedDates,
				}
			},
			progress: {
				...habit.progress,
				level: newLevel,
				XP: xpGain,
				milestones: milestones,
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

	private calculateNextDate(
		fromDate: DateString,
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }
	): DateString {
		return DateHelper.addInterval(fromDate, recurrence.interval, recurrence.unit);
	}

	private computeStreaks_old(
		history: { date: DateString; success: boolean }[],
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }
	): { current: number; best: number } {
		const difficulty = this.appContext.dataService.getUser().settings.difficulty || 'medium';
		// Filter and sort using strings
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

	private computeStreaks(
		habit: Habit,
		history: { date: DateString; success: boolean }[],
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }
	): { current: number; best: number; freezeAvailable: number, freezeUsedDates: DateString[] } {

		const user = this.appContext.dataService.getUser();
		const difficulty = user.settings.difficulty || 'normal';

		const maxFreeze =
			DIFFICULTY_RULES[difficulty as keyof typeof DIFFICULTY_RULES]?.freeze ?? 0;

		let freezeAvailable =
			habit.streak.freeze?.available ?? maxFreeze;

		const successDates = history
			.filter(h => h.success)
			.map(h => h.date)
			.sort((a, b) => a.localeCompare(b));

		if (successDates.length === 0)
			return { current: 0, best: 0, freezeAvailable, freezeUsedDates: [] };

		let best = 1;
		let seq = 1;
		let freezeUsedDates: DateString[] = [];


		for (let i = 1; i < successDates.length; i++) {

			const prev = successDates[i - 1];
			const curr = successDates[i];
			const expected = DateHelper.addInterval(prev, recurrence.interval, recurrence.unit);

			if (curr === expected) {
				seq++;
			}
			else if (curr > expected) {

				let missingDate = expected;
				const missedDates: DateString[] = [];

				while (missingDate < curr) {
					missedDates.push(missingDate);
					missingDate = DateHelper.addInterval(
						missingDate,
						recurrence.interval,
						recurrence.unit
					);
				}

				const missedCount = missedDates.length;

				if (maxFreeze === Infinity) {
					seq++;
				}
				else if (freezeAvailable >= missedCount) {
					freezeAvailable -= missedCount;
					freezeUsedDates.push(...missedDates);
					seq++;
				}
				else {
					// partial consumption
					const usable = freezeAvailable;
					freezeUsedDates.push(...missedDates.slice(0, usable));
					freezeAvailable = 0;
					seq = 1;
				}
			}
			else {
				seq = 1;
			}

			if (seq > best) best = seq;
		}

		const today = DateHelper.today();
		const last = successDates[successDates.length - 1];

		const current = (last === today) ? seq : 0;

		return { current, best, freezeAvailable, freezeUsedDates };
	}

	private regenerateFreeze(
		habit: Habit,
		previousCurrent: number,
		current: number,
		freezeAvailable: number
	): number {
		const difficulty = this.appContext.dataService.getUser().settings.difficulty || "normal";

		const maxFreeze =
			DIFFICULTY_RULES[difficulty as keyof typeof DIFFICULTY_RULES]?.freeze ?? 0;

		if (maxFreeze === Infinity || maxFreeze === 0)
			return freezeAvailable;

		// gain 1 freeze every 7 streak
		const threshold = 7;

		if (
			current > previousCurrent &&
			current % threshold === 0
		) {
			freezeAvailable = Math.min(
				freezeAvailable + 1,
				maxFreeze
			);
		}

		return freezeAvailable;
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

		console.warn("[refreshHabits, habitService] isCompleted today for habit", habit.title, ":", isCompleted);
		const history = this.updateHistory(habit).streak.history;

		return {
			...habit,
			streak: {
			...habit.streak,
			history : history.map(h => ({ ...h, date: DateHelper.toDateString(h.date) })),
			isCompletedToday : isCompleted,
			nextDate: nextDate,
			lastCompletedDate: lastCompletedDate,
			},
		};
	}

	// ------------------------
	// Calendar related methods
	async pairDateHabit(date: DateString): Promise<{
		habitID: string;
		habitTitle: string;
		completed: boolean;
		couldBeCompleted: boolean;
	}[]> {
		const habits = await this.appContext.dataService.loadAllHabits();
		const habitsArray = Object.values(habits) as Habit[];

		return habitsArray
			.filter(habit => {
				// Vérifier si la date existe dans l'historique
				return habit.streak.history.some(
					entry => DateHelper.toDateString(entry.date) === date
				);
			})
			.map(habit => {
				const historyEntry = habit.streak.history.find(
					entry => DateHelper.toDateString(entry.date) === date
				);

				const freezeUsed =
					habit.streak.freeze?.history?.includes(date) ?? false;


				return {
					habitID: habit.id,
					habitTitle: habit.title,
					completed: historyEntry?.success === true,
					couldBeCompleted: !freezeUsed, // Si dans history, alors toujours validable
					freezeUsed // Si freeze utilisé, alors non validable
				};
			});
	}

	// Helper to determine if a habit could be completed on a specific date
	couldBeCompletedOnDate(habit: Habit, date: DateString): boolean {
		// Vérifier si la date existe dans l'historique
		const historyEntry = habit.streak.history.find(
			h => DateHelper.toDateString(h.date) === date
		);
		return historyEntry !== undefined;
	}

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

	private reorderHistory(habit: Habit): Habit {
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

	// -----------------
	// Milestone helpers

	private initializeMilestones(
		habit: Habit,
		difficulty: keyof typeof MILESTONE_CURVES
	): { milestones: Habit["progress"]["milestones"]; curve: number[] } {

		const curve = MILESTONE_CURVES[difficulty] || MILESTONE_CURVES.easy;
		let milestones = [...(habit.progress.milestones || [])];

		if (milestones.length === 0 && curve.length > 0) {
			milestones.push({
				target: curve[0],
				reward: { items: ["Milestone Badge"] }
			});
		}

		return { milestones, curve };
	}

	private maybeGenerateNextMilestone(
		milestones: Habit["progress"]["milestones"],
		current: number,
		curve: number[]
	) {
		const lastMilestone = milestones[milestones.length - 1];
		if (!lastMilestone || current < lastMilestone.target) return milestones;

		const existingTargets = milestones.map(m => m.target);
		const nextTarget = curve.find(t => !existingTargets.includes(t));

		if (!nextTarget) return milestones;

		return [
			...milestones,
			{
				target: nextTarget,
				reward: { attributes: { endurance: 1 } }
			}
		];
	}

	private applyMilestoneUpgrade(
		milestones: Habit["progress"]["milestones"],
		previousCurrent: number,
		current: number,
		rewardAttributes: AttributeBlock
	): AttributeBlock {

		const newlyReached = milestones.find(
			m => previousCurrent < m.target && current >= m.target
		);

		if (!newlyReached?.reward?.attributes) return rewardAttributes;

		const updated = { ...rewardAttributes };

		for (const [key, value] of Object.entries(newlyReached.reward.attributes)) {
			const attrKey = key as keyof AttributeBlock;
			updated[attrKey] = (updated[attrKey] || 0) + value;
		}

		return updated;
	}

	private applyMilestoneDowngrade(
		milestones: Habit["progress"]["milestones"],
		previousCurrent: number,
		current: number,
		rewardAttributes: AttributeBlock
	): AttributeBlock {

		const previousUnlocked = milestones.filter(
			m => previousCurrent >= m.target
		).length;

		const currentUnlocked = milestones.filter(
			m => current >= m.target
		).length;

		if (previousUnlocked <= currentUnlocked) return rewardAttributes;

		const lostMilestones = milestones
			.filter(m => previousCurrent >= m.target)
			.slice(currentUnlocked);

		const updated = { ...rewardAttributes };

		for (const milestone of lostMilestones) {

			if (!milestone.reward?.attributes) continue;

			for (const [key, value] of Object.entries(milestone.reward.attributes)) {

				let remaining = value;
				const attrKey = key as keyof AttributeBlock;

				const mainValue = updated[attrKey] || 0;
				const removed = Math.min(mainValue, remaining);

				updated[attrKey] = mainValue - removed;
				remaining -= removed;

				if (remaining > 0) {
					const sorted = Object.entries(updated)
						.sort((a, b) => b[1] - a[1]);

					for (const [otherKey, otherValue] of sorted) {

						if (otherValue <= 0) continue;

						const removeAmount = Math.min(otherValue, remaining);
						updated[otherKey as keyof AttributeBlock] =
							otherValue - removeAmount;

						remaining -= removeAmount;
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
