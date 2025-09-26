import { AppContextService } from "../appContextService";
// from files (default):
import { Habit } from "data/DEFAULT";


export class HabitService {
	/* Handles all habit-related operations: create, update, delete, mark complete/incomplete.
		Uses AppContextService for data persistence.
		Contains logic to manage habit streaks and recurrences.
	*/
	private appContext: AppContextService;

	constructor(contextService: AppContextService) {
		this.appContext = contextService;
	}

	async saveHabit(habit: Habit): Promise<void> {
		console.log("Saving habit :", habit);
		await this.appContext.addHabit(habit);
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
		const normalizeDate = (d: Date | string) => new Date(d).toDateString();
		const dateStr = normalizeDate(date);

		console.log(
			`Completing ${completed ? "✅" : "❌"} habit ${habit.id} for ${date.toDateString()}`
		);

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
		const todayStr = new Date().toDateString();
		const isCompletedToday = history.some(
			entry => normalizeDate(entry.date) === todayStr && entry.success
		);

		// calculate key dates
		const lastDate =
			[...history].reverse().find(entry => entry.success)?.date ?? new Date(0);
		const nextDate = this.calculateNextDate(lastDate, habit.recurrence, habit.created_at);


		if (habit.streak.isCompletedToday !== isCompletedToday) {
		console.warn(
				`[Incohérence corrigée] Habit ${habit.id} avait isCompletedToday=${habit.streak.isCompletedToday} mais l’historique dit ${isCompletedToday}.`
			);
		}
		const { current, best } = this.computeStreaks(history, habit.recurrence);

		const updatedHabit: Habit = {
			...habit,
			streak: {
				...habit.streak,
				current: current,
				best: best,
				history,
				isCompletedToday,
				nextDate: new Date(nextDate),
				lastCompletedDate: lastDate,
			},
		};
		return updatedHabit;
	}

	private calculateNextDate(
		fromDate: Date,
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" },
		fallbackCreatedAt?: Date // optional : if fromDate is the "sentinel" epoch (0), return created_at
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

	refreshHabits(habit: Habit): Habit {
		const today = new Date();
		const todayStr = today.toDateString();
		// console.log("Refreshing habit:", habit.id, todayStr);

		const history = habit.streak.history.map(h => ({
			...h,
			date: new Date(h.date),
		}));

		// last success
		const lastCompleted = [...history]
			.reverse()
			.find(entry => entry.success);

		let isCompletedToday = false;
		let nextDate: Date | null = null;

		if (lastCompleted) {
			const lastDate = new Date(lastCompleted.date);
			const { interval, unit } = habit.recurrence;

			// Calculate the next due date
			nextDate = (() => {
			const d = new Date(lastDate);
			switch (unit) {
				case "days":
				d.setDate(d.getDate() + interval);
				break;
				case "weeks":
				d.setDate(d.getDate() + interval * 7);
				break;
				case "months":
				d.setMonth(d.getMonth() + interval);
				break;
				case "years":
				d.setFullYear(d.getFullYear() + interval);
				break;
				default:
				d.setDate(d.getDate() + interval);
			}
			return d;
			})();

			isCompletedToday = today.getTime() <= nextDate.getTime();

			isCompletedToday = isCompletedToday && history.some(
			entry => new Date(entry.date).toDateString() === todayStr && entry.success
		);
		}

		return {
			...habit,
			streak: {
			...habit.streak,
			history,
			isCompletedToday,
			nextDate: nextDate ?? habit.streak.nextDate,
			lastCompletedDate: lastCompleted
				? new Date(lastCompleted.date)
				: habit.streak.lastCompletedDate,
			},
		};
	}
}
