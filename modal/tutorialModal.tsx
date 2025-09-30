import { App, Modal } from "obsidian";

export class TutorialModal extends Modal {
	// todo: fill the modal with the tutorial content
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
