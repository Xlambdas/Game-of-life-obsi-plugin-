import { Plugin, WorkspaceLeaf } from 'obsidian';
import { MainViewSettings } from '../view/mainView';
import { SideViewSettings } from '../view/sideView';
// import { SIDE_VIEW, MAIN_VIEW, TEST_SIDE_VIEW } from 'constants/viewTypes'; //todo - comprendre pourquoi l'import ne fonctionne pas
import GOL from '../plugin'

export const SIDE_VIEW = 'side-view';
export const MAIN_VIEW = 'main-view';
export const TEST_SIDE_VIEW = 'test-view';

export class ViewService {
    plugin: GOL;

    constructor(plugin: GOL) {
        this.plugin = plugin;
    }

    registerViews() {
        this.plugin.registerView(MAIN_VIEW, (leaf) => new MainViewSettings(leaf, this.plugin));
        this.plugin.registerView(SIDE_VIEW, (leaf) => new SideViewSettings(leaf, this.plugin));
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


