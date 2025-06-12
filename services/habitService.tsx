import { App, Notice } from 'obsidian';
import { Habit, StatBlock, DEFAULT_HABIT, DefaultPriority, DefaultDifficulty, DefaultCategory, DefaultRecurrence } from '../constants/DEFAULT';
import { viewSyncService } from './syncService';
import { DataService } from './dataService';
import GOL from '../plugin';
import { updateAttributesByCategory } from 'components/formHelpers';
import { validateHabitFormData, HabitFormData } from 'components/habitFormHelpers';
import { appContextService } from 'context/appContextService';

export class HabitServices {
	private app: App;
	private plugin: GOL;
	private dataService: DataService;
	private habits: Habit[] = [];
	private completedHabitIds: string[] = [];
	private habitCounter: number = 0;
	private usedIds: Set<number> = new Set();

	constructor(app: App, plugin: any) {
		this.app = app;
		this.plugin = plugin;
		this.dataService = appContextService.dataService;
		this.initializeHabitCounter();
	}

	getAllHabits(): Habit[] {
		return this.habits;
	}

	getHabitById(id: string): Habit | undefined {
		return this.habits.find(h => h.id === id);
	}

	async handleDelete(habitId: string): Promise<void> {
		if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
			try {
				const habits = await this.dataService.loadHabitsFromFile();
				const updatedHabits = habits.filter((h: Habit) => h.id !== habitId);
				await this.dataService.saveHabitsToFile(updatedHabits);
				new Notice('Habit deleted successfully');
				viewSyncService.emitStateChange({ habitsUpdated: true });
			} catch (error) {
				console.error('Error deleting habit:', error);
				new Notice('Failed to delete habit');
			}
		}
	}

	async handleSave(habit: Habit, formData: HabitFormData): Promise<void> {
		try {
			const validationError = validateHabitFormData(formData);
			if (validationError) {
				new Notice(validationError);
				return;
			}
			formData.habitId = habit.id;
			await this.saveHabitToJSON(formData);
			new Notice('Habit saved successfully');
			viewSyncService.emitStateChange({ habitsUpdated: true });
		} catch (error) {
			console.error('Error saving habit:', error);
			new Notice('Failed to save habit');
		}
	}

	private async initializeHabitCounter(): Promise<void> {
		try {
			const habits = await this.dataService.loadHabitsFromFile();
			if (!Array.isArray(habits)) {
				console.error("Habits data is not an array:", habits);
				this.habitCounter = 0;
				return;
			}
			// Track all used IDs
			habits.forEach((habit: Habit) => {
				const idNum = parseInt(habit.id.replace('habit_', ''));
				if (!isNaN(idNum)) {
					this.usedIds.add(idNum);
				}
			});
		} catch (error) {
			console.error("Error initializing habit counter:", error);
			this.habitCounter = 0;
		}
	}

	private generateHabitId(): string {
		// Find first available ID
		let newId = 1;
		while (this.usedIds.has(newId)) {
			newId++;
		}
		this.usedIds.add(newId);
		return `habit_${newId}`;
	}

	async saveHabitToJSON(formData: HabitFormData): Promise<Habit> {
		try {
			let habits = await this.dataService.loadHabitsFromFile();
			let habit: Habit;
			const existingHabitIndex = habits.findIndex(h => h.id === formData.habitId);

			// Valeurs par défaut pour les attributs
            const defaultAttributes = updateAttributesByCategory(
                formData.category,
				DEFAULT_HABIT.reward.attributes ?? {} as StatBlock
            ) || (DEFAULT_HABIT.reward.attributes ?? {} as StatBlock);

			const defaultHabitAttributes = DEFAULT_HABIT.reward?.attributes || defaultAttributes;

			if (existingHabitIndex !== -1) {
				// Update existing habit
				habit = habits[existingHabitIndex];
				habit.title = formData.title;
				habit.shortDescription = formData.shortDescription;
				habit.description = formData.description;
				habit.settings.priority = formData.priority as DefaultPriority;
				habit.settings.difficulty = formData.difficulty as DefaultDifficulty;
				habit.settings.category = formData.category as DefaultCategory | string;

				habit.recurrence.interval = formData.recurrence_interval;
				habit.recurrence.unit = formData.recurrence_unit as DefaultRecurrence;

                // if attributes are provided manually, use them
                if (formData.attributeRewards) {
                    habit.reward.attributes = {
                        ...defaultAttributes,
                        ...formData.attributeRewards
                    };
                } else {
                    const currentAttributes: StatBlock = {
                        ...defaultAttributes,
                        ...defaultHabitAttributes
                    };
                    const updatedAttributes = updateAttributesByCategory(formData.category, currentAttributes);
                    habit.reward.attributes = updatedAttributes;
                }
			} else {
				// Create new habit
				const newId = this.generateHabitId();
				let finalAttributes: StatBlock;
				if (formData.attributeRewards) {
                    finalAttributes = {
                        ...defaultAttributes,
                        ...formData.attributeRewards
                    };
                } else {
                    // Sinon, mettre à jour les attributs en fonction de la catégorie
                    const baseAttributes: StatBlock = {
                        ...defaultAttributes
                    };
                    finalAttributes = updateAttributesByCategory(formData.category, baseAttributes);
                }

				habit = {
					...DEFAULT_HABIT,
					id: newId,
					title: formData.title,
					shortDescription: formData.shortDescription || "",
					description: formData.description || "",
					created_at: new Date(),
					settings: {
						...DEFAULT_HABIT.settings,
						priority: formData.priority,
						difficulty: formData.difficulty,
						category: formData.category || DEFAULT_HABIT.settings.category,
					},
					recurrence: {
						interval: formData.recurrence_interval,
						unit: formData.recurrence_unit as DefaultRecurrence,
					},
					streak: {
						current: 0,
						best: 0,
						history: [],
						isCompletedToday: false,
						nextDate: new Date(),
					},
					reward: {
						XP: formData.reward_XP || 0,
						attributes: finalAttributes,
						items: []
					},
					isSystemHabit: false
				};
				habits.push(habit);
			}

			await this.dataService.saveHabitsToFile(habits);
			new Notice('Habit saved successfully');
			return habit;
		} catch (error) {
			console.error('Error saving habit:', error);
			new Notice('Failed to save habit');
			throw error;
		}
	}

	async handleCompleteHabit(habit: Habit, plugin: GOL, setHabits: any, setError: any, updateXP: any, completed: boolean, date?: Date) {
		try {
			const habits = await this.dataService.loadHabitsFromFile();
			const userData = await this.dataService.loadUser();
			
			if (!userData || typeof userData !== 'object' || !('user1' in userData)) {
				throw new Error("User data is missing or malformed");
			}

			const targetDate = date ? new Date(date) : new Date();
			const historyEntry = { 
				date: targetDate,
				success: completed 
			};

			// S'assurer que toutes les dates dans l'historique sont des objets Date valides
			const sanitizeHistory = (history: { date: Date; success: boolean }[]) => {
				return history.map(entry => ({
					...entry,
					date: new Date(entry.date)
				}));
			};

			// Update local state for immediate UI feedback
			setHabits((prevHabits: Habit[]) =>
				prevHabits.map(h =>
					h.id === habit.id ? { 
						...h, 
						streak: {
							...h.streak,
							current: completed ? h.streak.current + 1 : Math.max(0, h.streak.current - 1),
							best: Math.max(h.streak.best, completed ? h.streak.current + 1 : h.streak.current - 1),
							history: completed 
								? sanitizeHistory([...h.streak.history, historyEntry])
								: sanitizeHistory(h.streak.history.filter(entry => 
									new Date(entry.date).toDateString() !== targetDate.toDateString()
								))
						}
					} : h
				)
			);

			// Update user data and save
			if (userData.user1?.persona?.xp !== undefined && habit.reward) {
				userData.user1.persona.xp += completed ? habit.reward.XP : -habit.reward.XP;
			}

			const updatedHabits = habits.map(h => 
				h.id === habit.id ? { 
					...h, 
					streak: {
						...h.streak,
						current: completed ? h.streak.current + 1 : Math.max(0, h.streak.current - 1),
						best: Math.max(h.streak.best, completed ? h.streak.current + 1 : h.streak.current - 1),
						history: completed 
							? sanitizeHistory([...h.streak.history, historyEntry])
							: sanitizeHistory(h.streak.history.filter(entry => 
								new Date(entry.date).toDateString() !== targetDate.toDateString()
							))
					}
				} : h
			);

			await this.dataService.saveHabitsToFile(updatedHabits);
			await this.dataService.saveSettings();
			if (habit.reward) {
				updateXP(completed ? habit.reward.XP : -habit.reward.XP);
				new Notice(completed 
					? `Habit completed! Earned ${habit.reward.XP} XP`
					: `Habit uncompleted! Lost ${habit.reward.XP} XP`
				);
			}
			setError(null);
		} catch (error) {
			console.error("Error handling habit completion:", error);
			setError("Failed to update habit status");
			new Notice("Failed to update habit status");
			throw error;
		}
	}


	async validateHabit(habitId: string): Promise<void> {
		const habits = await this.dataService.loadHabitsFromFile();
        const habit = habits.find(h => h.id === habitId);
		if (!habit) return;

		const today = new Date();
		const todayISO = today.toISOString().split('T')[0];

		habit.streak.isCompletedToday = true;

		if (!habit.streak.history) habit.streak.history = [];
		if (!habit.streak.history.some(entry => entry.date.toISOString().split('T')[0] === todayISO)) {
			habit.streak.history.push({
				date: today,
				success: true
			});
			habit.streak.nextDate = await this.calculateNextDate(habit.recurrence, today);
			habit.streak.current += 1;
			habit.streak.best = Math.max(habit.streak.best, habit.streak.current);
		
		await this.dataService.saveHabitsToFile(habits);
		}

	}

	async calculateNextDate(recurrence: { interval: number; unit: DefaultRecurrence }, currentDate: Date): Promise<Date> {
		let nextDate = new Date(currentDate);
		switch (recurrence.unit) {
			case "days":
				nextDate.setDate(currentDate.getDate() + recurrence.interval);
				break;
			case "weeks":
				nextDate.setDate(currentDate.getDate() + (recurrence.interval * 7));
				break;
			case "months":
				nextDate.setMonth(currentDate.getMonth() + recurrence.interval);
				break;
			default:
				throw new Error("Invalid recurrence unit");
		}
		return nextDate;
	}

}
