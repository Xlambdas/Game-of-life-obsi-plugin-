import { AppContextService } from "../appContextService";
import { Habit, DEFAULT_HABIT } from "data/DEFAULT";
import { addXP } from "./xpService";
import { App } from "obsidian";
import { CreateHabitModal } from "modal/habitModal";
import { normalize } from "path";

export class HabitService {
	private appContext: AppContextService;

	constructor(contextService: AppContextService) {
		this.appContext = contextService;
	}

	async saveHabit(habit: Habit): Promise<void> {
		console.log("Saving habit :", habit);
		await this.appContext.addHabit(habit);
	}

	async updateHabitCompletion_old(habit: Habit, completed: boolean, date?: Date): Promise<Habit> {
		const history = habit.streak.history.map(h => ({ ...h, date: new Date(h.date) }));
		const dateToCheck = date || new Date();
		const normalizeDate = (d: Date | string) =>{
			return new Date(d).toDateString();
		}
		console.log(`Completing ${completed ? "✅" : "❌"} habit ${habit.id} for today (${dateToCheck.toDateString()})`);

		// Vérifier si la date est déjà dans l'historique (pour éviter les doublons)
		const dateStr = normalizeDate(dateToCheck);
		const existingEntry = habit.streak.history.find((entry: any) =>
			normalizeDate(entry.date) === dateStr
		);

		const calculateLastDate = (): Date | null => {
			const hist = [...habit.streak.history];
			if (hist.length === 0) return new Date(0);

			// Retourner la dernière date de succès
			for (const entry of hist.reverse()) {
				if (entry.success) return new Date(entry.date);
			}
			return new Date(0);
		};

		const calculateNextDate = (lastDate: Date): number => {
			if (lastDate === new Date(0)) return habit.created_at.getTime();
			const nextDate = new Date(lastDate);
			const { interval, unit } = habit.recurrence;
			const multiplier = { days: 1, weeks: 7, months: 30, years: 365 }[unit] || 1;
			nextDate.setTime(nextDate.getTime() + interval * multiplier * 24 * 60 * 60 * 1000);
			console.log("Next date calculated as:", nextDate, nextDate.getTime());
			return nextDate.getTime();
		};

		if (completed) {
			// Si on coche une date déjà cochée, ne rien faire
			if (existingEntry && existingEntry.success) {
				console.log("Date already completed, no changes made.");
				return habit;
			}
			// Ajouter ou mettre à jour l'entrée
			const newEntry = { date: dateToCheck, success: true };
			if (existingEntry) {
				Object.assign(existingEntry, newEntry);
				// Mettre à jour l'historique
				let newHistory = habit.streak.history.map(entry =>
					normalizeDate(entry.date) === dateStr ? newEntry : entry
				);
				habit.streak.history = newHistory;
			} else {
				habit.streak.history.push(newEntry);
			}
		} else {
			// supprimer l'entrée si elle existe
			if (existingEntry) {
				let newHistory = habit.streak.history.filter(entry =>
					normalizeDate(entry.date) !== dateStr
				);
				habit.streak.history = newHistory;
			} else {
				console.log("Date not found in history, no changes made.");
				return habit;
			}
		}
		const lastDate = calculateLastDate();
		const nextDate = lastDate ? calculateNextDate(lastDate) : Date.now();
		console.log("Last date:", lastDate, "Next date:", new Date(nextDate));

		const updatedHabit: Habit = {
			...habit,
			streak: {
				...habit.streak,
				history: habit.streak.history.map(h => ({ ...h, date: new Date(h.date) })),
				isCompletedToday: completed,
				nextDate: new Date(nextDate),
				lastCompletedDate: lastDate ?? new Date(0),
			},
		};
		return updatedHabit

	}
	private calculateNextDate_old(fromDate: Date, recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }): Date {
		const nextDate = new Date(fromDate);
		switch (recurrence.unit) {
			case "days":
				nextDate.setDate(nextDate.getDate() + recurrence.interval);
				break;
			case "weeks":
				nextDate.setDate(nextDate.getDate() + recurrence.interval * 7);
				break;
			case "months":
				nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
				break;
			case "years":
				nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
				break;
		}
		return nextDate;
	}
	async updateHabitCompletion(
		habit: Habit,
		completed: boolean,
		date: Date = new Date()
	): Promise<Habit> {
		const normalizeDate = (d: Date | string) => new Date(d).toDateString();
		const dateStr = normalizeDate(date);

		console.log(
			`Completing ${completed ? "✅" : "❌"} habit ${habit.id} for ${date.toDateString()}`
		);

		// Cloner l’historique pour éviter des side-effects
		let history = habit.streak.history.map(h => ({ ...h, date: new Date(h.date) }));
		const existingEntry = history.find(entry => normalizeDate(entry.date) === dateStr);

		// Cas erreur : aucune action possible
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

		// Recalculer les dates clés
		const lastDate =
			[...history].reverse().find(entry => entry.success)?.date ?? new Date(0);
		const nextDate = this.calculateNextDate(lastDate, habit.recurrence);

		if (habit.streak.isCompletedToday !== isCompletedToday) {
		console.warn(
				`[Incohérence corrigée] Habit ${habit.id} avait isCompletedToday=${habit.streak.isCompletedToday} mais l’historique dit ${isCompletedToday}.`
			);
		}

		console.log("Last date:", lastDate, "Next date:", nextDate);

		const updatedHabit: Habit = {
			...habit,
			streak: {
				...habit.streak,
				history,
				isCompletedToday,
				nextDate,
				lastCompletedDate: lastDate,
			},
		};

		return updatedHabit;
	}

	private calculateNextDate(
		fromDate: Date,
		recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }
	): Date {
		const nextDate = new Date(fromDate);
		switch (recurrence.unit) {
			case "days":
				nextDate.setDate(nextDate.getDate() + recurrence.interval);
				break;
			case "weeks":
				nextDate.setDate(nextDate.getDate() + recurrence.interval * 7);
				break;
			case "months":
				nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
				break;
			case "years":
				nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
				break;
		}
		return nextDate;
	}
}
