import { App, Modal, Setting } from 'obsidian';

export class difficultyModal extends Modal {
	/* Modal for the setting of the difficulty */
	private resolve: ((value: boolean) => void) | null = null;

	constructor(app: App) {
		super(app);
	}

	async openAndWait(): Promise<boolean> {
		return new Promise((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Change the difficulty' });
		contentEl.createEl('p', { text: 'Changing your difficulty will reset your level and your xp.'});
		contentEl.createEl('p', { text: 'If you wait until the level 5, you\'ll be able to get an equivalent bonus of your current level.'});
		const text = contentEl.createEl('p', { text: 'Are you really sure you want to change it ?'});
		text.style.textAlign = 'right';

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("I agree")
					.setCta()
					.onClick(() => {
						if (this.resolve) this.resolve(true);
						this.close();
					})
			);
	}
	onClose() {
		this.contentEl.empty();
	}
}
