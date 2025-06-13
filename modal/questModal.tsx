import { App, Modal } from 'obsidian';
import React from 'react';
import * as ReactDOM from 'react-dom/client';
// from files :
import { AppContextService } from '../context/appContextService';
import { AppProvider } from '../context/appContext';
import { QuestList } from '../components/questList';

export class QuestModal extends Modal {
	constructor(app: App, appContext: AppContextService) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Quest Modal Opened');
		const root = ReactDOM.createRoot(contentEl);
		root.render(
			<AppProvider>{/* AppProvider injecte context automatiquement */}<QuestList /></AppProvider>
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
