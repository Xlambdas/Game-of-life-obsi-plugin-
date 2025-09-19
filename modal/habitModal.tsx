import { App, Modal, Notice } from 'obsidian';
import React from 'react';
import * as ReactDOM from 'react-dom/client';
// from files :
import { AppContextService } from '../context/appContextService';
import { AppProvider } from '../context/appContext';
import { Habit, Quest } from 'data/DEFAULT';
import { ModifyQuestModal } from './questModal';
import { CreateHabitModalUI, ModifyHabitModalUI } from '../UI/habitUIHelpers';
import { ModifyQuestModalUI } from 'UI/questUIHelpers';
import { HabitService } from 'context/services/habitService';

export class CreateHabitModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		const root = ReactDOM.createRoot(contentEl);
		const service = AppContextService.getInstance();
		const handleSuccess = () => {
			this.close();
		};
		root.render(
			<AppProvider appService={service}>
				<CreateHabitModalUI onSuccess={handleSuccess} onCancel={() => this.close()} />
			</AppProvider>
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}

export class ModifyHabitModal extends Modal {
	private habit: Habit;
	constructor(app: App, habit: Habit) {
		super(app);
		this.habit = habit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		const root = ReactDOM.createRoot(contentEl);
		const service = AppContextService.getInstance();
		const dataService = service['dataService'];
		const handleSuccess = () => {
			this.close();
			onHabitUpdate?.(this.habit);
		};
		const handleDelete = async () => {
			if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
				try {
					const habits: Habit[] = await dataService.loadAllHabits();
					const updatedHabits = habits.filter((h: Habit) => h.id !== this.habit.id);
					await dataService.saveAllHabits(updatedHabits);
					new Notice('Habit deleted successfully');

				} catch (error) {
					console.error('Error deleting habit:', error);
					new Notice('Failed to delete habit');
				}
			}
		};
		root.render(
			<AppProvider appService={service}>
				<ModifyHabitModalUI habit={this.habit} onSuccess={handleSuccess} onDelete={handleDelete} />
			</AppProvider>
		);
	}
	onClose() {
		this.contentEl.empty();
	}
}
let onHabitUpdate: ((habit: Habit) => void) | null = null;
export function openModifyHabitModal(app: App, habit: Habit, onUpdate: (habit: Habit) => void) {
	onHabitUpdate = onUpdate;
	new ModifyHabitModal(app, habit).open();
}
