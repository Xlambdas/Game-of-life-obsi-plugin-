import { Plugin } from 'obsidian';
// from files - services:
import { AppContextService } from './context/appContextService';
import { ViewService } from './context/services/viewService';
// from files - other
// import { CreateQuestModal } from './modal/questModal';
import { selfSettingsTab } from './UI/settingsTab';
import { GenericForm } from 'components/forms/genericForm';

export default class GOL extends Plugin {
	private viewService!: ViewService;

	async onload() {
		console.warn('Game of Life plugin loaded');

		// Initialize data service and app context
		await AppContextService.init(this.app.vault, this.app);

		// Initialize view service
		this.viewService = new ViewService(this.app);
		this.viewService.registerViews(this);

		this.addCommands();
	}

	private addCommands() {
		/*Add ribbon icons and commands*/
		// settings commands and views
		this.addSettingTab(
			new selfSettingsTab(this.app, this)
		);

		this.addRibbonIcon("sword", "Open sideView", () => {
			this.viewService.openSideView();
		});

		this.addCommand({
			id: 'open-side-view',
			name: 'Open side View',
			callback: () => {
				this.viewService.openSideView();
			}
		});

		// creation commands (quest or habit)
		// this.addCommand({
		// 	id: 'create-new-quest',
		// 	name: 'Create New Quest',
		// 	callback: () => {
		// 		new CreateQuestModal(this.app).open();
		// 	}
		// });
		this.addCommand({
			id: 'create-new-habit',
			name: 'Create New Habit',
			callback: () => {
				new GenericForm(this.app, 'habit-create').open();
			}
		});

		this.addCommand({
			id: 'create-new-quest',
			name: 'Create New Quest',
			callback: () => {
				new GenericForm(this.app, 'quest-create').open();
			}
		});

		this.addRibbonIcon("plus", "create Habit", ()=>{
			new GenericForm(this.app, 'habit-create').open();
		})
	}

	onunload() {
		this.viewService.closeSideView();
		console.warn('Game of Life plugin unloaded');
	}
}
