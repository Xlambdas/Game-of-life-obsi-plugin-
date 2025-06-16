import { App, Modal } from "obsidian";

export class TutorialModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: "Tutorial" });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
