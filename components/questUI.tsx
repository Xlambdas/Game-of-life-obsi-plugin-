import { ButtonComponent, Notice } from "obsidian";
import { Quest } from "../constants/DEFAULT";
import { validateQuestFormData, EndButtonDeps } from "./questHelpers";
import { dueDateInput } from "./inputs";

export const endButton = ({
	version,
	contentEl,
	onSubmit,
	onCancel,
	onDelete,
}: EndButtonDeps) => {
	// Buttons container
	const buttonsContainer = contentEl.createDiv({ cls: "buttons-container" });

	// Create a flex container for the note and buttons
	const flexContainer = buttonsContainer.createDiv({ cls: "buttons-flex-container" });

	// required fields note
	const noteContainer = flexContainer.createDiv({ cls: "required-note-container" });
	noteContainer.createEl("p", { text: '* Required fields', cls: 'required-note' });
	const buttonsGroup = flexContainer.createDiv({ cls: "buttons-group" });

	// Cancel button
	if (version === "create" && onCancel) {
		new ButtonComponent(buttonsGroup)
			.setButtonText("Cancel")
			.onClick(() => onCancel());
	} else if (version === "edit" && onDelete) {
		new ButtonComponent(buttonsGroup)
			.setButtonText("Delete")
			.setWarning()
			.onClick(async () => {
				await onDelete();
			});
	}
	// Save button
	new ButtonComponent(buttonsGroup)
		.setButtonText("Save Quest")
		.setCta()
		.onClick(async () => {
			try {
				await onSubmit();
			} catch (error) {
				console.error("Error saving quest:", error);
				new Notice("Failed to save quest. Check console for details.");
			}
		});
};
