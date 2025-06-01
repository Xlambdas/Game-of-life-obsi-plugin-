import { App, Notice } from 'obsidian';
import { Habit, StatBlock, DEFAULT_HABIT } from '../constants/DEFAULT';
import { viewSyncService } from './syncService';
import { DataService } from './dataService';
import GOL from '../plugin';

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
		this.dataService = this.plugin.dataService;
		this.initializeHabitCounter();
	}

	private async initializeHabitCounter(): Promise<void> {
		try {
			const habits = await this.plugin.dataService.loadHabitsFromFile();
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

	async saveHabitToJSON(formData: any): Promise<Habit> {
		try {
			let habits = await this.dataService.loadHabitsFromFile();
			let habit: Habit;
			const existingHabitIndex = habits.findIndex(h => h.id === formData.habitId);

			if (existingHabitIndex !== -1) {
				// Update existing habit
				habit = habits[existingHabitIndex];
				habit.title = formData.title;
				habit.shortDescription = formData.shortDescription;
				habit.description = formData.description;
				habit.settings.priority = formData.priority;
				habit.settings.difficulty = formData.difficulty;
				habit.settings.category = formData.category;
				if (habit.reward) {
					habit.reward.XP = formData.reward_XP;
					if (formData.attributeRewards) {
						habit.reward.attributes = {
							...(DEFAULT_HABIT.reward?.attributes || {}),
							...formData.attributeRewards
						};
					}
				}
				habit.recurrence.interval = formData.interval || 1;
				habit.recurrence.unit = formData.unit || 'days';
			} else {
				const newId = this.generateHabitId();
				
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
						interval: formData.interval || 1,
						unit: formData.unit || 'days',
					},
					streak: {
						current: 0,
						best: 0,
						history: [],
					},
					reward: {
						...(DEFAULT_HABIT.reward || { XP: 0, attributes: {}, items: [] }),
						XP: formData.reward_XP || (DEFAULT_HABIT.reward?.XP || 0),
						attributes: formData.attributeRewards || (DEFAULT_HABIT.reward?.attributes || {}),
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

	async handleCompleteHabit(habit: Habit, plugin: GOL, setHabits: any, setError: any, updateXP: any) {
		try {
			const habits = await plugin.dataService.loadHabitsFromFile();
			const userData = await plugin.dataService.loadUser();
			
			if (!userData || typeof userData !== 'object' || !('user1' in userData)) {
				throw new Error("User data is missing or malformed");
			}

			// Update local state for immediate UI feedback
			setHabits((prevHabits: Habit[]) =>
				prevHabits.map(h =>
					h.id === habit.id ? { 
						...h, 
						streak: {
							...h.streak,
							current: h.streak.current + 1,
							best: Math.max(h.streak.current + 1, h.streak.best),
							history: [...h.streak.history, { date: new Date(), success: true }]
						}
					} : h
				)
			);

			// Update user data and save
			if (userData.user1?.persona?.xp !== undefined && habit.reward) {
				userData.user1.persona.xp += habit.reward.XP;
			}

			const updatedHabits = habits.map(h => 
				h.id === habit.id ? { 
					...h, 
					streak: {
						...h.streak,
						current: h.streak.current + 1,
						best: Math.max(h.streak.current + 1, h.streak.best),
						history: [...h.streak.history, { date: new Date(), success: true }]
					}
				} : h
			);

			await plugin.dataService.saveHabitsToFile(updatedHabits);
			await plugin.dataService.saveSettings();
			if (habit.reward) {
				updateXP(habit.reward.XP);
				new Notice(`Habit completed! Earned ${habit.reward.XP} XP`);
			}
			setError(null);
		} catch (error) {
			console.error("Error handling habit completion:", error);
			setError("Failed to update habit status");
			new Notice("Failed to update habit status");
			throw error;
		}
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

	getAllHabits(): Habit[] {
		return this.habits;
	}

	getHabitById(id: string): Habit | undefined {
		return this.habits.find(h => h.id === id);
	}
}
