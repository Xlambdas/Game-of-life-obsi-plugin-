import { App, Modal, Notice } from 'obsidian';
import React from 'react';
import * as ReactDOM from 'react-dom/client';
// from files :
import { AppContextService } from '../context/appContextService';
import { AppProvider } from '../context/appContext';
import { QuestList } from '../components/questList';
import { CreateQuestModalUI, ModifyQuestModalUI } from '../UI/questUIHelpers';
import { Quest } from 'data/DEFAULT';

export class CreateQuestModal extends Modal {
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
				<CreateQuestModalUI onSuccess={handleSuccess} onCancel={() => this.close()} />
			</AppProvider>
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}

export class ModifyQuestModal extends Modal {
	private quest: Quest;
	constructor(app: App, quest: Quest) {
		super(app);
		this.quest = quest;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		const root = ReactDOM.createRoot(contentEl);
		const service = AppContextService.getInstance();
		const dataService = service['dataService'];
		const handleSuccess = () => {
			this.close();
			onQuestUpdate?.(this.quest);
		};
		const handleDelete = async () => {
			if (confirm('Are you sure you want to delete this quest? This action cannot be undone.')) {
				try {
					const quests: Quest[] = await dataService.loadAllQuests();
					const updatedQuests = quests.filter((q: Quest) => q.id !== this.quest.id);
					await dataService.saveAllQuests(updatedQuests);
					new Notice('Quest deleted successfully');

				} catch (error) {
					console.error('Error deleting quest:', error);
					new Notice('Failed to delete quest');
				}
			}
		};
		root.render(
			<AppProvider appService={service}>
				<ModifyQuestModalUI quest={this.quest} onSuccess={handleSuccess} onDelete={handleDelete} />
			</AppProvider>
		);
	}
	onClose() {
		this.contentEl.empty();
	}
}
let onQuestUpdate: ((quest: Quest) => void) | null = null;
export function openModifyQuestModal(app: App, quest: Quest, onUpdate: (quest: Quest) => void) {
	onQuestUpdate = onUpdate;
	new ModifyQuestModal(app, quest).open();
}
