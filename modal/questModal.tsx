import { App, Modal } from 'obsidian';
import React from 'react';
import * as ReactDOM from 'react-dom/client';
// from files :
import { AppContextService } from '../context/appContextService';
import { AppProvider } from '../context/appContext';
import { QuestList } from '../components/questList';
import { CreateQuestModalUI } from '../UI/questUIHelpers';

export class QuestModal extends Modal { //todo delete this one when no more used
	constructor(app: App, appContext: AppContextService) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Quest Modal Opened');
		// const root = ReactDOM.createRoot(contentEl);
		// root.render(
		// 	<AppProvider>
		// 		<QuestList quests={} />
		// 	</AppProvider>
		// );
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class CreateQuestModal extends Modal {
	constructor(app: App, appContext: AppContextService) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		const root = ReactDOM.createRoot(contentEl);
		const service = AppContextService.getInstance();
		root.render(
			<AppProvider appService={service}>
				<CreateQuestModalUI />
			</AppProvider>
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

