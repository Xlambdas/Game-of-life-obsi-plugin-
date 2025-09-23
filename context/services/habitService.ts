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
		// notifier l'UI que les habits ont changé
		document.dispatchEvent(new CustomEvent("habitsUpdated"));
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
		return updatedHabit;
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
		const nextDate = this.calculateNextDate(lastDate, habit.recurrence, habit.created_at);


		if (habit.streak.isCompletedToday !== isCompletedToday) {
		console.warn(
				`[Incohérence corrigée] Habit ${habit.id} avait isCompletedToday=${habit.streak.isCompletedToday} mais l’historique dit ${isCompletedToday}.`
			);
		}

		// const currentStreak = (() => {
		// 	if (history.length === 0) return 0;

		// 	const sortedHistory = [...history].sort(
		// 		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		// 	);

		// 	const { interval, unit } = habit.recurrence; // ex: { interval: 2, unit: "day" }
		// 	let streak = 0;
		// 	let lastDate = new Date();

		// 	// Fonction pour calculer l’écart selon l’unité choisie
		// 	const getDiff = (d1: Date, d2: Date) => {
		// 		const diffMs = d1.getTime() - d2.getTime();
		// 		switch (unit) {
		// 		case "days":
		// 			return Math.floor(diffMs / (1000 * 60 * 60 * 24));
		// 		case "weeks":
		// 			return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
		// 		case "months":
		// 			return (
		// 			d1.getFullYear() * 12 + d1.getMonth() -
		// 			(d2.getFullYear() * 12 + d2.getMonth())
		// 			);
		// 		default:
		// 			return Math.floor(diffMs / (1000 * 60 * 60 * 24)); // fallback en jours
		// 		}
		// 	};

		// 	for (const entry of sortedHistory) {
		// 		const entryDate = new Date(entry.date);
		// 		if (entry.success) {
		// 		const diff = getDiff(lastDate, entryDate);

		// 		// On accepte si l’écart correspond exactement à l’intervalle
		// 		// ou si on est "dans la fenêtre" (par ex. 0 si fait le même jour)
		// 		if (diff === 0 || diff === interval) {
		// 			streak++;
		// 			lastDate = entryDate;
		// 		} else {
		// 			break; // streak cassé
		// 		}
		// 		} else {
		// 		break; // streak cassé par un échec
		// 		}
		// 	}

		// 	return streak;
		// })();

		// const bestStreak = Math.max(habit.streak.best, currentStreak);
		// if (bestStreak > habit.streak.best) {
		// 	console.log(`New best streak for habit ${habit.id}: ${bestStreak}`);
		// 	// Récompenser le joueur		}
		// }

		const { current, best } = this.computeStreaks(history, habit.recurrence);


		console.log(`Updated habit ${habit.id}: currentStreak=${current}, bestStreak=${best}, isCompletedToday=${isCompletedToday}`);


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
		fallbackCreatedAt?: Date // facultatif : si fromDate est la "sentinelle" epoch (0), retourne created_at
	): Date {
		// Défensive : fromDate invalide -> fallback ou epoch
		if (!fromDate || isNaN(fromDate.getTime())) {
			if (fallbackCreatedAt) return new Date(fallbackCreatedAt);
			return new Date(0);
		}

		// Si on utilise la sentinelle new Date(0) pour dire "pas encore de lastDate"
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
				// setMonth gère correctement les longueurs de mois (31/30/28/29)
				nextDate.setMonth(nextDate.getMonth() + interval);
				break;
			case "years":
				nextDate.setFullYear(nextDate.getFullYear() + interval);
				break;
			default:
				// fallback conservateur : ajouter jours
				nextDate.setDate(nextDate.getDate() + interval);
				break;
		}

		console.log("[calculateNextDate] from:", fromDate.toISOString(), "-> next:", nextDate.toISOString());
		return nextDate;
	}

	private isToday(date: Date): boolean {
		const today = new Date();
		return (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		);
	}

	// ajouter dans HabitService
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

		// garder uniquement les succès et dédupliquer par date
		const map = new Map<string, Date>();
		for (const h of history) {
			if (!h.success) continue;
			const d = normalizeDateOnly(h.date);
			map.set(d.toDateString(), d); // la clé = date string garantit une entrée par jour
		}

		const dates = Array.from(map.values()).sort((a, b) => a.getTime() - b.getTime());
		if (dates.length === 0) return { current: 0, best: 0 };

		// calcule best (meilleure séquence consécutive n'importe où)
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

		// calcule current : séquence qui se termine aujourd'hui (sinon current = 0)
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
		const todayStr = new Date().toDateString();
		const history = habit.streak.history.map(h => ({ ...h, date: new Date(h.date) }));
		const isCompletedToday = history.some(
			entry => new Date(entry.date).toDateString() === todayStr && entry.success
		);

		return {
			...habit,
			streak: {
				...habit.streak,
				history,
				isCompletedToday,
			}
		};
	};
}
