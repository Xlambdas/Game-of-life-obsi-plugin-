import { Plugin } from 'obsidian';
// from files :
import { AppContextService } from './context/appContextService';
import { CreateQuestModal } from './modal/questModal';
import { selfSettingsTab } from './UI/settingsTab';
import { ViewService } from './context/services/viewService';


export default class GOL extends Plugin {
	private viewService!: ViewService;
	private appService!: AppContextService;

	async onload() {
		console.warn('Game of Life plugin loaded');
		await AppContextService.init(this.app.vault, this.app);
		const appContext = AppContextService.getInstance();
		this.viewService = new ViewService(this.app);
		this.viewService.registerViews(this);


		this.addRibbonIcon("dice", "Open sideView", () => {
			this.viewService.openSideView();
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
		this.addCommand({
			id: 'open-quest-view',
			name: 'Open Quest View',
			callback: () => {
				this.viewService.openSideView();
			}
		});

		this.addSettingTab(
			new selfSettingsTab(this.app, this)
		);
	}

	onunload() {
		this.viewService.closeSideView();
		console.warn('Game of Life plugin unloaded');
	}
}
