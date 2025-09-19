import { AppContextService } from "../appContextService";
import { Habit, DEFAULT_HABIT } from "data/DEFAULT";
import { addXP } from "./xpService";
import { App } from "obsidian";
import { CreateHabitModal } from "modal/habitModal";

export class HabitService {
	private appContext: AppContextService;

	constructor(contextService: AppContextService) {
		this.appContext = contextService;
	}

	// async createHabit(habitData: Partial<Habit>): Promise<Habit> {
	// 	const habit: Habit = {
	// 		...structuredClone(DEFAULT_HABIT),
	// 		...habitData,
	// 		id: habitData.id || `habit_${Date.now()}`,
	// 		created_at: habitData.created_at || new Date(),
	// 		streak: {
	// 			...DEFAULT_HABIT.streak,
	// 			nextDate: this.calculateNextDate(new Date(), habitData.recurrence || DEFAULT_HABIT.recurrence),
	// 		},
	// 	};

	// 	await this.appContext.addHabit(habit);
	// 	return habit;
	// }

	async saveHabit(habit: Habit): Promise<void> {
		console.log("Saving habit :", habit);
		await this.appContext.addHabit(habit);
	}

	async addCategory(newCategory: string): Promise<void> {
		const user = this.appContext.getUser();
		const categories = user.settings.addedCategories || [];

		if (!categories.includes(newCategory)) {
			const updatedCategories = [...categories, newCategory];
			await this.appContext.updateUserData({
				settings: { ...user.settings, addedCategories: updatedCategories }
			});
		}
	}

	async toggleHabitCompletion(habit: Habit): Promise<Habit> {
		const user = this.appContext.getUser();
		const today = new Date();

		// Si la tâche est déjà complétée aujourd'hui, ne rien faire
		if (habit.streak.isCompletedToday && isSameDay(habit.streak.lastCompletedDate, today)) {
			return habit;
		}

		const updatedHabit: Habit = {
			...habit,
			streak: {
				...habit.streak,
				isCompletedToday: true,
				lastCompletedDate: today,
				current: habit.streak.current + 1,
				best: Math.max(habit.streak.best, habit.streak.current + 1),
				nextDate: this.calculateNextDate(today, habit.recurrence),
			},
			progress: {
				...habit.progress,
				XP: (habit.progress?.XP || 0) + (habit.reward?.XP || 0),
				currentValue: (habit.progress?.currentValue || 0) + 1, // Increment current value by 1
			},
		};

		await this.appContext.updateHabit(updatedHabit);

		// Ajouter l'XP à l'utilisateur
		if (habit.reward.XP > 0) {
			await addXP(this.appContext, user, habit.reward.XP);
		}

		return updatedHabit;
	}

	private calculateNextDate(fromDate: Date, recurrence: { interval: number; unit: "days" | "weeks" | "months" | "years" }): Date {
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

function isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = (date1 instanceof Date) ? date1 : new Date(date1);
    const d2 = (date2 instanceof Date) ? date2 : new Date(date2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

