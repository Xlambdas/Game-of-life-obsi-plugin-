import { Plugin } from 'obsidian';
// from files :
import { AppContextService } from './context/appContextService';
import { CreateQuestModal } from './modal/questModal';
import { selfSettingsTab } from './UI/settingsTab';
import { ViewService } from './context/services/viewService';
import { CreateHabitModal } from 'modal/habitModal';
import { HabitService } from 'context/services/habitService';


export default class GOL extends Plugin {
	private viewService!: ViewService;
	private appService!: AppContextService;
	private habitService!: HabitService;

	async onload() {
		console.warn('Game of Life plugin loaded');

		// Initialize data service and app context
		await AppContextService.init(this.app.vault, this.app);
		this.appService = AppContextService.getInstance();

		// Initialize services
		this.habitService = new HabitService(this.appService);

		// Initialize view service
		this.viewService = new ViewService(this.app);
		this.viewService.registerViews(this);

		// Add ribbon icons and commands
		this.addCommands();
	}

	private addCommands() {

		this.addRibbonIcon("dice", "Open sideView", () => {
			this.viewService.openSideView();
		});
		this.addRibbonIcon("plus", "Create New Habit", () => {
			new CreateHabitModal(this.app).open();
		});
		this.addCommand({
			id: 'create-new-quest',
			name: 'Create New Quest',
			callback: () => {
				new CreateQuestModal(this.app).open();
			}
		});
		this.addCommand({
			id: 'create-new-habit',
			name: 'Create New Habit',
			callback: () => {
				new CreateHabitModal(this.app).open();
			}
		});

		this.addCommand({
			id: 'show-user-data',
			name: 'Show User Data',
			callback: () => {
				const userData = this.appService.getUser();
				console.log(`User Data: ${JSON.stringify(userData, null, 2)}`);
			}
		});
		this.addCommand({
			id: 'reload-user-data',
			name: 'Reload User Data',
			callback: () => {
				this.appService.reloadUserData();
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
