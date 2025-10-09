import { App, WorkspaceLeaf } from "obsidian";
// from files :
import { SIDE_VIEW_TYPE, SideViewSetting, MAIN_VIEW_TYPE, MainViewSetting } from "../../helpers/sideViewSetting";

export default class ViewService {
	/* service for managing views */
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	registerViews(plugin: { registerView: Function }) {
		this.app.workspace.onLayoutReady(() => {
			plugin.registerView(
				SIDE_VIEW_TYPE,
				(leaf: WorkspaceLeaf) => new SideViewSetting(leaf)
			);
			plugin.registerView(
				MAIN_VIEW_TYPE,
				(leaf: WorkspaceLeaf) => new MainViewSetting(leaf)
			);
		});
	}

	async openSideView() {
		let leaf = this.app.workspace.getLeavesOfType(SIDE_VIEW_TYPE).first();
		if (!leaf) {
			const rightLeaf = this.app.workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
				await leaf.setViewState({
					type: SIDE_VIEW_TYPE,
					active: true,
				});
			}
		}
		if (leaf) {
			this.app.workspace.revealLeaf(leaf);
		}
	}

	async openMainView() {
		let leaf = this.app.workspace.getLeavesOfType(MAIN_VIEW_TYPE).first();

		if (!leaf) {
			const mainLeaf = this.app.workspace.getLeaf(false);
			if (mainLeaf) {
				leaf = mainLeaf;
				await leaf.setViewState({
					type: MAIN_VIEW_TYPE,
					active: true,
				});
			}
		}
		if (leaf) {
			this.app.workspace.revealLeaf(leaf);
		}
	}

	closeSideView() {
		this.app.workspace.detachLeavesOfType(SIDE_VIEW_TYPE);
	}
	closeMainView() {
		this.app.workspace.detachLeavesOfType(MAIN_VIEW_TYPE);
	}
}
