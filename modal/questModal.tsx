import { App, Modal } from 'obsidian';
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
		const handleSuccess = () => {
			this.close();
			onQuestUpdate?.(this.quest);
		};
		root.render(
			<AppProvider appService={service}>
				<ModifyQuestModalUI quest={this.quest} onSuccess={handleSuccess} onCancel={() => this.close()} />
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
