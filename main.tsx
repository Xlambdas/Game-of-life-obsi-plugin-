import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TextComponent, ButtonComponent, ItemView, WorkspaceLeaf, View } from 'obsidian';
import React, { createContext, useState } from "react";
import { createRoot } from "react-dom/client";
//from other files :
import {GameSettings, selfSettingTab, DEFAULT_SETTINGS} from './settings';
import { QuestSettings, DEFAULT_QUEST_SETTINGS } from "./quest_settings";
import userData from "data/user.json";
import { ParentView, TestParentView } from 'view/parentView';

// --- | settings App part | ---
interface mainSettings {
	Setting: string;
}
interface questSettings {
	QuestSetting: string;
}

// const DEFAULT_SETTINGS: mainSettings = {
// 	Setting: 'default',
// }

// const DEFAULT_QUEST_SETTINGS: questSettings = {
// 	QuestSetting: 'default',
// }

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
	questSetting: QuestSettings;
	intervalId: number | undefined;


	async onload() {
		// --- | Settings part | ---
		console.warn('loading plugin');
		await this.loadSettings();
		this.addSettingTab(new selfSettingTab(this.app, this));
		this.registerView(MAIN_VIEW, (leaf) => new mainView(leaf));  // todo
		this.registerView(TEST_SIDE_VIEW, (leaf) => new testSideView(leaf)); // todo
		this.registerView(TEST_MAIN_VIEW, (leaf) => new testMainView(leaf)); // todo
		this.registerView(SIDE_VIEW, (leaf) => new sideView(leaf));  // todo

		this.addRibbonIcon('dice', 'Activate sideview', () => {
			this.openSideView();
			new Notice("Welcome Back !");
		});

		this.addRibbonIcon('sword', 'Activate mainview', () => {
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
			id: "open RPG main view",
			name: "open RPG main view",
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

		this.addCommand({
			id: "test sideview",
			name: "test sideview",
			callback: () => {
				console.log("print, callback sidebar RPG");
				this.openTestSideView();
			}
		});

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

		this.intervalId = window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000);
	}

	onunload() {
		console.warn('unloading plugin');
		if (this.intervalId) {
			clearInterval(this.intervalId);
		}
		// this.app.workspace.getLeavesOfType(SIDE_VIEW).forEach((leaf) => leaf.detach());
		// this.app.workspace.getLeavesOfType(MAIN_VIEW).forEach((leaf) => leaf.detach());
		// this.app.workspace.getLeavesOfType(TEST_SIDE_VIEW).forEach((leaf) => leaf.detach());
		// this.app.workspace.getLeavesOfType(TEST_MAIN_VIEW).forEach((leaf) => leaf.detach());
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

	async loadSettings() {
		await this.loadUserSettings();
		await this.loadQuestSettings();
	}

	async loadUserSettings() {
		const path = `${this.app.vault.configDir}/plugins/game-of-life/data/user.json`;
		try {
			if (await this.app.vault.adapter.exists(path)) {
				const content = await this.app.vault.adapter.read(path);
				const parsed = JSON.parse(content);
				this.settings = { ...DEFAULT_SETTINGS, ...parsed };
				console.log("✅ user.json chargé :", this.settings);
				return this.settings;
			} else {
				console.warn("user.json introuvable, création avec défauts.");
				this.settings = { ...DEFAULT_SETTINGS };
				return this.settings;
			}
		} catch (err) {
			console.error("❌ Erreur loadUserSettings :", err);
			this.settings = { ...DEFAULT_SETTINGS };
			return this.settings;
		}
	}

	async loadQuestSettings() {
		const path = `${this.app.vault.configDir}/plugins/game-of-life/data/quests.json`;
		try {
			if (await this.app.vault.adapter.exists(path)) {
				const content = await this.app.vault.adapter.read(path);
				const parsed = JSON.parse(content);
				this.questSetting = { ...DEFAULT_QUEST_SETTINGS, ...parsed };
				console.log("✅ quests.json chargé :", this.questSetting);
				return this.questSetting;
			} else {
				console.warn("quests.json introuvable, création avec défauts.");
				this.questSetting = { ...DEFAULT_QUEST_SETTINGS };
				return this.questSetting;
			}
		} catch (err) {
			console.error("❌ Erreur loadQuestSettings :", err);
			this.questSetting = { ...DEFAULT_QUEST_SETTINGS };
			return this.questSetting;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		const path = `${this.app.vault.configDir}/plugins/game-of-life/data/user.json`;
		await this.app.vault.adapter.write(path, JSON.stringify(this.settings, null, 2));
		console.log("saveSettings.Paramètres sauvegardés !", this.settings);
		await this.saveData(this.questSetting);
		const pathQuest = `${this.app.vault.configDir}/plugins/game-of-life/data/quests.json`;
		await this.app.vault.adapter.write(pathQuest, JSON.stringify(this.questSetting, null, 2));
		console.log("saveSettings.Quest.Paramètres sauvegardés !", this.questSetting);
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
	private onCloseCallback: (() => void) | null = null;

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
		root.render(<ParentView app={this.app} type="side" setOnCloseCallback={(callback) => { this.onCloseCallback = callback; }}/>);
	}

	async onClose() {
		if (this.onCloseCallback) {
			this.onCloseCallback(); // clean all ParentView
		}
	}

}

class mainView extends ItemView { // todo
	private onCloseCallback: (() => void) | null = null;

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
		root.render(<ParentView app={this.app} type="main" setOnCloseCallback={(callback) => { this.onCloseCallback = callback; }} />);

	}

	async onClose() {
		if (this.onCloseCallback) {
			this.onCloseCallback(); // clean all ParentView
		}
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
        textArea.setPlaceholder("Tapez votre nom ici...");

        // Bouton de validation
        new ButtonComponent(contentEl)
            .setButtonText("Enregistrer")
            .onClick(async () => {
                const userInput = textArea.getValue().trim();
                if (userInput) {
                    await this.saveToDatabase(userInput);
					await this.saveQuestToDatabase(userInput);
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

	async saveQuestToDatabase(text: string) {
		const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/quests.json`; // 📄 Nom du fichier dans Obsidian
		const fileExists = await this.app.vault.adapter.exists(filePath);

		let content = `{"quest": "${text}"},\n`;
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
