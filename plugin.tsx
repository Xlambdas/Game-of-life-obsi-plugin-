import { Plugin } from 'obsidian';
// from files - services:
import { AppContextService } from './context/appContextService';
import { ViewService } from './context/services/viewService';
// from files - other
// import { CreateQuestModal } from './modal/questModal';
import { selfSettingsTab } from './UI/settingsTab';
import { GenericForm } from 'components/forms/genericForm';
import { openFullscreenMainView } from 'helpers/sideViewSetting';

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

		this.addRibbonIcon("swords", "Open mainView", () => {
			this.viewService.openMainView();
		});
		this.addRibbonIcon("plus-square", "Create New Quest", () => {
			new GenericForm(this.app, 'quest-create').open();
		});

		this.addCommand({
			id: 'open-side-view',
			name: 'Open side View',
			callback: () => {
				this.viewService.openSideView();
			}
		});

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

		this.addCommand({
			id: 'open-fullscreen-main-view',
			name: 'Open Fullscreen Main View',
			callback: () => {
				openFullscreenMainView();
			}
		});
	}

	onunload() {
		this.viewService.closeSideView();
		this.viewService.closeMainView();
		console.warn('Game of Life plugin unloaded');
	}
}
