import { Plugin } from 'obsidian';
// from files :
import { AppContextService } from './context/appContextService';
import { CreateQuestModal } from './modal/questModal';
import { selfSettingsTab } from './UI/settingsTab';


export default class GOL extends Plugin {
	async onload() {
		console.warn('Game of Life plugin loaded');
		await AppContextService.init(this.app.vault);
		const appContext = AppContextService.getInstance();

		this.addRibbonIcon("dice", "Open Quest Panel", () => {
			console.log("Opening Quest Panel");
		});
		this.addRibbonIcon("plus", "Create New Quest", () => {
			new CreateQuestModal(this.app).open();
		});
		this.addCommand({
			id: 'create-new-quest',
			name: 'Create New Quest',
			callback: () => {
				new CreateQuestModal(this.app).open();
			}
		});
		this.addCommand({
			id: 'show-user-data',
			name: 'Show User Data',
			callback: () => {
				const userData = appContext.getUser();
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
		this.addSettingTab(
			new selfSettingsTab(this.app, this)
		);
	}

	onunload() {
		console.warn('Game of Life plugin unloaded retouched');
	}
}
