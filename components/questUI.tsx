import { ButtonComponent, Notice } from "obsidian";
import { Quest } from "../constants/DEFAULT";
import { validateQuestFormData, EndButtonDeps } from "./questHelpers";

export const endButton = ({
	contentEl,
	plugin,
	close,
	getFormData
}: EndButtonDeps) => {
	// Buttons container
	const buttonsContainer = contentEl.createDiv({ cls: "buttons-container" });

	// Create a flex container for the note and buttons
	const flexContainer = buttonsContainer.createDiv({ cls: "buttons-flex-container" });

	// Add required fields note on the left
	const noteContainer = flexContainer.createDiv({ cls: "required-note-container" });
	noteContainer.createEl("p", { text: '* Required fields', cls: 'required-note' });

	// Create a container for the buttons
	const buttonsGroup = flexContainer.createDiv({ cls: "buttons-group" });

	// Cancel button
	new ButtonComponent(buttonsGroup)
		.setButtonText("Cancel")
		.onClick(() => {
			close();
		});

	// Save button
	new ButtonComponent(buttonsGroup)
		.setButtonText("Save Quest")
		.setCta()
		.onClick(async () => {
			const formData = getFormData();
			
			// Validate form data
			const validationError = validateQuestFormData(formData);
			if (validationError) {
				new Notice(validationError);
				return;
			}

			if (!plugin?.questService) {
				return;
			}

			try {
				const { title, shortDescription, description, reward_XP, require_level, require_previousQuests, difficulty, category, dueDate, priority, attributeRewards } = formData;

				await plugin.questService.saveQuestToJSON(
					title,
					shortDescription,
					description,
					reward_XP,
					require_level,
					Array.isArray(require_previousQuests) ? require_previousQuests.join(",") : require_previousQuests,
					difficulty,
					category,
					dueDate,
					priority,
					undefined, // questId for new quests
					attributeRewards // Pass the attribute rewards
				);
				close();
			} catch (error) {
				console.error("Error saving quest:", error);
				new Notice("Failed to save quest. Check console for details.");
			}
		});
};
