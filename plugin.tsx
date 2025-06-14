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
		this.addCommand({
			id: 'show-user-data',
			name: 'Show User Data',
			callback: () => {
				const userData = appContext.getUserData();
				console.log(`User Data: ${JSON.stringify(userData, null, 2)}`);
			}
		});
		this.addCommand({
			id: 'reload-user-data',
			name: 'Reload User Data',
			callback: () => {
				appContext.reloadUserData();
				console.log('User data reloaded');
			}
		});
	}

	onunload() {
		console.warn('Game of Life plugin unloaded retouched');
	}
}
