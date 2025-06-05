import type { Plugin } from "obsidian";
import { Notice, ButtonComponent } from "obsidian";
import { Quest } from "../constants/DEFAULT";
import { validateQuestFormData, EndButtonDeps } from "./questFormHelpers";

export class DescriptionHelper {
	private element: HTMLElement;

	constructor(container: HTMLElement, text: string) {
		this.element = container.createEl("small", { text });
		this.applyStyles();
	}

	private applyStyles() {
		this.element.style.display = "block";
		this.element.style.marginBottom = "10px";
		this.element.style.color = "var(--text-muted)";
		this.element.style.fontSize = "0.8em";
		this.element.style.fontStyle = "italic";
		this.element.style.fontWeight = "normal";
	}

	setText(text: string) {
		this.element.setText(text);
	}
}

export const separator = (container: HTMLElement) => {
	const separator = container.createEl("hr", {cls: "section-separator"});
	separator.style.margin = "20px 0";
	separator.style.border = "none";
	separator.style.borderTop = "2px solid var(--background-modifier-border)";
	separator.style.opacity = "0.8";
	return separator;
}

export const createHeader = (contentEl: HTMLElement, title: string) =>{
		const headerContainer = contentEl.createDiv({ cls: "header-container" });
		headerContainer.createEl("h1", { text: title });
	}


export const titleSection = (container: HTMLElement, texte: string) => {
		const title = container.createEl("h3", { text: texte });
		title.style.textAlign = "center";
		title.style.width = "100%";
		title.style.marginBottom = "20px";
		title.style.color = "var(--text-normal)";
		title.style.fontSize = "1.2em";
		title.style.fontWeight = "600";
	}


export const subTitle = (container: HTMLElement, title: string) => {
	const titleEl = container.createEl("h3", { text: title, cls: "section-title" });
	titleEl.style.marginBottom = "10px";
	// titleEl.style.color = "var(--text-accent)";
	titleEl.style.fontSize = "1.2em";
	titleEl.style.fontWeight = "bold";
	titleEl.style.fontStyle = "italic";
	return titleEl;
};

export const endButton = ({
	version = 'create',
	contentEl,
	onSubmit,
	onCancel,
	onDelete,
}: EndButtonDeps) => {
	const buttonContainer = contentEl.createDiv({ cls: "buttons-container" });

	const flexContainer = buttonContainer.createDiv({ cls: "buttons-flex-container" });
	const noteContainer = flexContainer.createDiv({ cls: "required-note-container" });
	noteContainer.createEl("p", { text: '* Required fields', cls: 'required-note' });
	const buttonGroup = flexContainer.createDiv({ cls: "buttons-group" });

	// cancel button
	if (version === 'create' && onCancel) {
		new ButtonComponent(buttonGroup)
			.setButtonText("Cancel")
			.onClick(() => onCancel());
	} else if (version === 'edit' && onDelete) {
		new ButtonComponent(buttonGroup)
			.setButtonText("Delete")
			.setWarning()
			.onClick(async () => {
				await onDelete();
		});
	}
	
	new ButtonComponent(buttonGroup)
		.setButtonText("Save Habit")
		.setCta()
		.onClick(async () => {
			try {
				await onSubmit();
			} catch (error) {
				console.error("Error saving habit:", error);
				new Notice("Failed to save habit. Check console for details.");
			}
		});
}
