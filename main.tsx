import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TextComponent, ButtonComponent, ItemView, WorkspaceLeaf, View } from 'obsidian';
import React, { createContext, useState } from "react";
import { createRoot } from "react-dom/client";
//from other files :
import {GameSettings, selfSettingTab} from './settings';
import userData from "data/user.json";
import { ParentA, ParentView, TestParentView } from 'view/parentView';

// --- | settings App part | ---
interface mainSettings {
	Setting: string;
}

const DEFAULT_SETTINGS: mainSettings = {
	Setting: 'default'
}

export const AppContext = createContext<App | undefined>(undefined);
export const SIDE_VIEW = 'side-view';
export const MAIN_VIEW = 'main-view';
export const TEST_VIEW = 'test-view';
export const TEST_SIDE_VIEW = 'test-side-view';
export const TEST_MAIN_VIEW = 'test-main-view';


/**
 * Game of Life Plugin for Obsidian.
 */
export default class game_of_life extends Plugin {
	settings: GameSettings;


	async onload() {
		// --- | Settings part | ---
		console.warn('loading plugin');
		await this.loadSettings();
		this.addSettingTab(new selfSettingTab(this.app, this));
		this.registerView(MAIN_VIEW, (leaf) => new mainView(leaf));  // todo
		this.registerView(TEST_SIDE_VIEW, (leaf) => new testSideView(leaf)); // todo
		this.registerView(TEST_MAIN_VIEW, (leaf) => new testMainView(leaf)); // todo
		this.registerView(SIDE_VIEW, (leaf) => new sideView(leaf));  // todo

		this.addRibbonIcon('sword', 'Activate sideview', () => {
			this.openSideView();
			new Notice("Welcome Back !");
		});

		this.addRibbonIcon('dice', 'Activate mainview', () => {
			this.openMainView();
			new Notice("Welcome Back !");
		});

		// --- | All commands | ---
		this.addCommand({
			id: "open RPG sidebar",
			name: "open RPG sidebar",
			callback: () => {
				new Notice("Welcome Back !");
				console.log("print, callback sidebar RPG");
				this.openSideView();
			}
		});

		this.addCommand({
			id: "open main view",
			name: "open main view",
			callback: () => {
				console.log("print, callback main view");
				this.openMainView();
			}
		});

		this.addCommand({
			id: "create new quest",
			name: "new quest",
			callback: () => {
				new questModal(this.app).open(); // todo
			}
		});

		// this.addCommand({
		// 	id: "test parent/enfant",
		// 	name: "test parent/enfant",
		// 	callback: () => {
		// 		new ParentModal(this.app).open();
		// 	}
		// });
		// this.addCommand({
		// 	id: "test sideview",
		// 	name: "test sideview",
		// 	callback: () => {
		// 		console.log("print, callback sidebar RPG");
		// 		this.openTestView();
		// 	}
		// });

		// this.addCommand({
		// 	id: "Maxi test sideview",
		// 	name: "Maxi test sideview",
		// 	callback: () => {
		// 		console.log("print, callback sidebar RPG");
		// 		this.openTestSideView();
		// 	}
		// });

		// this.addCommand({
		// 	id: "Maxi test mainview",
		// 	name: "Maxi test mainview",
		// 	callback: () => {
		// 		console.log("print, callback sidebar RPG");
		// 		this.openTestMainView();
		// 	}
		// });

		this.addCommand({
			id: "open game life file",
			name: "open game life",
			callback: async () => {
				this.openFile("database.md");
			}
		});

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		console.warn('unloading plugin');
		this.app.workspace.getLeavesOfType(SIDE_VIEW).forEach((leaf) => leaf.detach());
		this.app.workspace.getLeavesOfType(MAIN_VIEW).forEach((leaf) => leaf.detach());
		this.app.workspace.getLeavesOfType(TEST_SIDE_VIEW).forEach((leaf) => leaf.detach());
		this.app.workspace.getLeavesOfType(TEST_MAIN_VIEW).forEach((leaf) => leaf.detach());
	}



	openSidebarRPG() { // todo
		const { workspace } = this.app;
		const leaf = workspace.getLeaf();
		if (leaf) {
			// const view = new sidebarRPG(leaf);
			leaf.setViewState({ type: "my-view", active: true });
		}
		this.app.workspace.setActiveLeaf(leaf);
		if (leaf) {
			this.app.workspace.revealLeaf(leaf);
		}
	}



	// --- | Functions | ---
	async openFile(filePath: string) {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			this.app.workspace.openLinkText(filePath, "", true);
		} else {
			console.log("Fichier introuvable :", filePath);
		}
	}

	async newQuest() {
		console.log('t\'as une nouvelle quete bro');
		new questModal(this.app).open();
	}

	// Function for the settings :
	async loadSettings() {
		const data = await this.loadData();
		this.settings = { ...DEFAULT_SETTINGS, ...data };

		const path = `${this.app.vault.configDir}/plugins/game-of-life/data/user.json`;
		// console.log("Paramètres chargés !", this.settings);

		try {
			if (await this.app.vault.adapter.exists(path)) {
				const data = await this.app.vault.adapter.read(path);
				const parsed = JSON.parse(data);
				console.log("(file : main) loadSettings = settings exist");
				// console.log("loadSettings = if parsed : ", this.app.vault.adapter);
				return { ...DEFAULT_SETTINGS, ...parsed };
			} else {
				console.warn("Fichier de paramètres introuvable. Création avec valeurs par défaut.");
				return { ...DEFAULT_SETTINGS };
			}
		} catch (error) {
			console.warn("Impossible de charger le fichier, utilisation des valeurs par défaut :", error);
			return { ...DEFAULT_SETTINGS };
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		const path = `${this.app.vault.configDir}/plugins/game-of-life/data/user.json`;
		await this.app.vault.adapter.write(path, JSON.stringify(this.settings, null, 2));
		console.log("saveSettings.Paramètres sauvegardés !", this.settings);
	}

	async openMainView() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(MAIN_VIEW)[0];

		if (!leaf) {
			// Create a new leaf in the main workspace if none exist
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
		const { workspace } = this.app;

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
	}
	// async openTestView() {
	// 	const { workspace } = this.app;

	// 	const leaves = workspace.getLeavesOfType(TEST_VIEW);
	// 	let leaf: WorkspaceLeaf | null = null;

	// 	console.log("open test leaf");
	// 	if (leaves.length === 0) {
	// 		leaf = workspace.getRightLeaf(false);
	// 		if (leaf) {
	// 			await leaf.setViewState({ type: TEST_VIEW, active: true });
	// 		}
	// 	} else {
	// 		leaf = leaves[0];
	// 	}
	// }
	async openTestSideView() {
		const { workspace } = this.app;

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
	}
	async openTestMainView() {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(TEST_MAIN_VIEW);
		let leaf: WorkspaceLeaf | null = null;

		console.log("open test leaf");
		if (leaves.length === 0) {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: TEST_MAIN_VIEW, active: true });
			}
		} else {
			leaf = leaves[0];
		}
	}
};


// --- | view part | ---

class sideView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return SIDE_VIEW;
	}

	getDisplayText() {
		return 'Test view';
	}

	getIcon() {
		return 'dice';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		// container.createEl('h4', { text: ' test view' });
		const root = createRoot(container);
		root.render(<ParentView app={this.app} type="side" />);
	}

	async onClose() {
		// Nothing to clean up.
	}
}
class mainView extends ItemView { // todo
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return MAIN_VIEW;
	}

	getDisplayText() {
		return 'Main view';
	}

	getIcon() {
		return 'sword';
	}

	async onOpen() {
		const container = this.containerEl;
		container.empty();
		// container.createEl('h4', { text: ' main test view' });
		const root = createRoot(container);
		root.render(<ParentView app={this.app} type="main" />)
	}

	async onClose() {
		// Nothing to clean up.
	}
}


//------------------ | Piste de recherche | ---------------------------------------
class questModal extends Modal {
	constructor(app: App) {
	super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl("h2", {text: 'Nom de la quete :'});
		// text area :
		const textArea = new TextComponent(contentEl);
		textArea.inputEl.setAttribute("rows", "5"); // ✅ Ajout de la hauteur
        textArea.inputEl.setAttribute("style", "width: 100%; resize: vertical;");
        textArea.setPlaceholder("Tapez votre texte ici...");

        // Bouton de validation
        new ButtonComponent(contentEl)
            .setButtonText("Enregistrer")
            .onClick(async () => {
                const userInput = textArea.getValue().trim();
                if (userInput) {
                    await this.saveToDatabase(userInput);
                    new Notice("Texte enregistré !");
                } else {
                    new Notice("Champ vide !");
                }
                this.close();
            });
    }

    onClose() {
        this.contentEl.empty();
    }


	async saveToDatabase(text: string) {
		const filePath = "database.md"; // 📄 Nom du fichier dans Obsidian
		const fileExists = await this.app.vault.adapter.exists(filePath);

		let content = `- ${text}\n`;
		if (fileExists) {
			const existingContent = await this.app.vault.adapter.read(filePath);
			content = existingContent + content;
		}

		await this.app.vault.adapter.write(filePath, content);
	}

}


//  --- | piste de recherche | ---
class testSideView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return TEST_VIEW;
	}

	getDisplayText() {
		return 'Test view';
	}

	getIcon() {
		return 'dice';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		// container.createEl('h4', { text: ' test view' });
		const root = createRoot(container);
		root.render(<TestParentView type="testSide" />);
	}

	async onClose() {
		// Nothing to clean up.
	}
}

class testMainView extends ItemView { // todo
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return MAIN_VIEW;
	}

	getDisplayText() {
		return 'Main view';
	}

	getIcon() {
		return 'sword';
	}

	async onOpen() {
		const container = this.containerEl;
		container.empty();
		// container.createEl('h4', { text: ' main test view' });
		const root = createRoot(container);
		root.render(<TestParentView type="testMain" />)
	}

	async onClose() {
		// Nothing to clean up.
	}
}
