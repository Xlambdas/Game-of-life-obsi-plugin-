import { normalize } from "path";
import { AppContextService } from "../appContextService";
// from files (default):
import { Habit } from "data/DEFAULT";


export default class HabitService {
	/* Handles all habit-related operations: create, update, delete, mark complete/incomplete.
		Uses AppContextService for data persistence.
		Contains logic to manage habit streaks and recurrences.
	*/
	private appContext: AppContextService;

	constructor(contextService: AppContextService) {
		this.appContext = contextService;
	}

	async saveHabit(habit: Habit): Promise<void> {
		await this.appContext.dataService.addHabit(habit);
	}

	updateDates(habit: Habit, date: Date): Habit {
		/* Update the lastCompletedDate of a habit and recalculate nextDate */
		const history = habit.streak.history.map(h => ({ ...h, date: new Date(h.date) }));
		const lastDate = [...history].reverse().find(entry => entry.success)?.date ?? new Date(0);
		const nextDate = this.calculateNextDate(lastDate, habit.recurrence, habit.created_at);
		// console.log(
		// 	`Updating dates for habit ${habit.id}: lastCompletedDate=${lastDate.toDateString()}, nextDate=${nextDate.toDateString()}`
		// );

		return {
			...habit,
			streak: {
				...habit.streak,
				lastCompletedDate: lastDate,
				nextDate: new Date(nextDate),
			},
		};
	}

	isCompleted(habit: Habit, date: Date = new Date()): boolean {
		/* Check if a habit is completed for a given date (default: today). */
		this.updateDates(habit, date); // ensure dates are up to date
		const todayStr = new Date().toDateString();
		const lastDate = habit.streak.lastCompletedDate
			? new Date(habit.streak.lastCompletedDate)
			: new Date(0);
		const nextDate = habit.streak.nextDate ? new Date(habit.streak.nextDate) : new Date();

		const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
		const dateStr = normalizeDate(date);
		let isCompleted = false;
		if (normalizeDate(lastDate).getTime() === dateStr.getTime()) {
			isCompleted = true;
		} else if (normalizeDate(nextDate).getTime() > normalizeDate(date).getTime()) {
			isCompleted = true;
		} else if (normalizeDate(nextDate).getTime() <= normalizeDate(date).getTime()) {
			isCompleted = false;
		}
		// console.log(
		// 	`Checking completion for habit ${habit.id} on ${dateStr}: lastCompletedDate=${lastDate.toDateString()}, nextDate=${nextDate.toDateString()}, isCompleted=${isCompleted}`
		// );

		return isCompleted;
	}

	async updateHabitCompletion(
		habit: Habit,
		completed: boolean,
		date: Date = new Date()
	): Promise<Habit> {
		/* Marks a habit as completed or not for a specific date (default today).
			Updates the habit's streak, history, nextDate, and lastCompletedDate accordingly.
			Throws error if trying to complete an already completed date or uncomplete a non-completed date.
		*/
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
			history = existingEntry
				? history.map(entry => (normalizeDate(entry.date) === dateStr ? newEntry : entry))
				: [...history, newEntry];
		} else {
			history = history.filter(entry => normalizeDate(entry.date) !== dateStr);
		}

		// calculate key dates
		const lastDate =
			[...history].reverse().find(entry => entry.success)?.date ?? new Date(0);
		const nextDate = this.calculateNextDate(lastDate, habit.recurrence, habit.created_at);

		const isCompleted = this.isCompleted({ ...habit, streak: { ...habit.streak, history, nextDate: nextDate, lastCompletedDate: lastDate } });
		const { current, best } = this.computeStreaks(history, habit.recurrence);

		const progress = this.calculateProgress(habit);

		const updatedHabit: Habit = {
			...habit,
			streak: {
				...habit.streak,
				current: current,
				best: best,
				history,
				isCompletedToday: isCompleted,
				nextDate: new Date(nextDate),
				lastCompletedDate: lastDate,
			},
		};
		return updatedHabit;
	}

	private calculateNextDate(
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
		const today = new Date();
		const todayStr = today.toDateString();
		// console.log("Refreshing habit:", habit.id, todayStr);

		const lastCompletedDate = habit.streak.lastCompletedDate
			? new Date(habit.streak.lastCompletedDate): new Date(0);

		const nextDate = habit.streak.nextDate
			? new Date(habit.streak.nextDate)
			: new Date(0);

		habit = this.updateDates(habit, today); // ensure dates are up to date
		const isCompleted = this.isCompleted(habit, today); // ensure completion status is up to date

		return {
			...habit,
			streak: {
			...habit.streak,
			history : habit.streak.history.map(h => ({ ...h, date: new Date(h.date) })),
			isCompletedToday : isCompleted,
			nextDate: nextDate,
			lastCompletedDate: lastCompletedDate,
			},
		};
	}
}
