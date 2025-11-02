import { Plugin } from 'obsidian';
// from files - services:
import { AppContextService } from './context/appContextService';
import ViewService from './context/services/viewService';
import UnlocksService from './context/services/unlockService';
// from files - other
// import { CreateQuestModal } from './modal/questModal';
import { selfSettingsTab } from './UI/settingsTab';
import { GenericForm } from 'components/forms/genericForm';
import { openFullscreenMainView } from 'helpers/sideViewSetting';
import { Unlock } from 'lucide-react';
import { UserModal } from 'modal/userInfoModal';
import { UserModal_test } from 'modal/testUI';

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

		UnlocksService.onUnlockView("side") && (
			this.addRibbonIcon("sword", "Open sideView", () => {
				this.viewService.openSideView();
			})
		) && (
			this.addCommand({
				id: 'open-side-view',
				name: 'Open Side View',
				callback: () => {
					this.viewService.openSideView();
				}
			})
		);

		UnlocksService.onUnlockView("main") && (
			this.addRibbonIcon("swords", "Open mainView", () => {
				this.viewService.openMainView();
			})
		) && (
			this.addCommand({
				id: 'open-main-view',
				name: 'Open Main View',
				callback: () => {
					this.viewService.openMainView();
				}
			})
		);

		this.addRibbonIcon("plus-square", "Create New Habit", () => {
			new GenericForm(this.app, 'habit-create').open();
		});

		UnlocksService.onUnlockElement("habit") && (
			this.addCommand({
				id: 'create-new-habit',
				name: 'Create New Habit',
				callback: () => {
					new GenericForm(this.app, 'habit-create').open();
				}
			})
		);

		UnlocksService.onUnlockElement("quest") && (
			this.addCommand({
				id: 'create-new-quest',
				name: 'Create New Quest',
				callback: () => {
					new GenericForm(this.app, 'quest-create').open();
				}
			})
		);

		UnlocksService.onUnlockView("full") && (
			this.addCommand({
				id: 'open-fullscreen-main-view',
				name: 'Open Fullscreen Main View',
				callback: () => {
					openFullscreenMainView();
				}
			})
		);

		this.addCommand({
			id: 'open-user-info-modal',
			name: 'Open User Info Modal',
			callback: () => {
				new UserModal(this.app).open();
			}
		});

		this.addCommand({
			id: 'open-user-info-modal',
			name: 'Open User Info Modal test',
			callback: () => {
				new UserModal_test(this.app).open();
			}
		});
	}

	onunload() {
		this.viewService.closeSideView();
		this.viewService.closeMainView();
		console.warn('Game of Life plugin unloaded');
	}
}
