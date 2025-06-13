import { Plugin } from 'obsidian';
// from files :
import { AppContextService } from './context/appContextService';
import { QuestModal, CreateQuestModal } from './modal/questModal';


export default class GOL extends Plugin {
	async onload() {
		console.warn('Game of Life plugin loaded');
		await AppContextService.init(this.app.vault);
		const appContext = AppContextService.getInstance();

		this.addRibbonIcon("dice", "Open Quest Panel", () => {
			new QuestModal(this.app, appContext).open();
		});
		this.addRibbonIcon("plus", "Create New Quest", () => {
			new CreateQuestModal(this.app, appContext).open();
		});
	}

	onunload() {
		console.warn('Game of Life plugin unloaded retouched');
	}
}
