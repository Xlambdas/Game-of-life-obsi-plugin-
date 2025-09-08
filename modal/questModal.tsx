import { App, Modal } from 'obsidian';
import React from 'react';
import * as ReactDOM from 'react-dom/client';
// from files :
import { AppContextService } from '../context/appContextService';
import { AppProvider } from '../context/appContext';
import { QuestList } from '../components/questList';
import { CreateQuestModalUI } from '../UI/questUIHelpers';

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

