import { Plugin, WorkspaceLeaf } from 'obsidian';
import { mainView } from '../view/mainView';
import { sideView } from '../view/sideView';

export const SIDE_VIEW = 'side-view';
export const MAIN_VIEW = 'main-view';
export const TEST_SIDE_VIEW = 'test-view';

export class ViewService {
    plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    registerViews() {
        this.plugin.registerView(MAIN_VIEW, (leaf) => new mainView(leaf));
        this.plugin.registerView(SIDE_VIEW, (leaf) => new sideView(leaf));
    }

    async openMainView() {
        const { workspace } = this.plugin.app;
        let leaf = workspace.getLeavesOfType(MAIN_VIEW)[0];

        if (!leaf) {
            // Create a new leaf in the main workspace if none exists
            leaf = workspace.getLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: MAIN_VIEW, active: true });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async openSideView() {
        const { workspace } = this.plugin.app;
        const leaves = workspace.getLeavesOfType(SIDE_VIEW);
        let leaf: WorkspaceLeaf | null = null;

        console.log("open side leaf", leaf);
        if (leaves.length === 0) {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: SIDE_VIEW, active: true });
            }
        } else {
            leaf = leaves[0];
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async openSidebarRPG() {
        const { workspace } = this.plugin.app;
        const leaves = workspace.getLeavesOfType(TEST_SIDE_VIEW);
        let leaf: WorkspaceLeaf | null = null;

        console.log("open test leaf");
        if (leaves.length === 0) {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: TEST_SIDE_VIEW, active: true });
            }
        } else {
            leaf = leaves[0];
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }
}
