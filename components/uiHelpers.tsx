export const separator = (container: HTMLElement) => {
	const separator = container.createEl("hr", {cls: "section-separator"});
	separator.style.margin = "20px 0";
	separator.style.border = "none";
	separator.style.borderTop = "2px solid var(--background-modifier-border)";
	separator.style.opacity = "0.8";
	return separator;
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

import type { Plugin } from "obsidian";
import { Notice, ButtonComponent } from "obsidian";
import { Quest } from "../constants/DEFAULT";

type EndButtonDeps = {
	contentEl: HTMLElement;
	plugin: {
		questService?: {
			saveQuestToJSON: (
				title: string,
				shortDescription: string,
				description: string,
				reward_XP: number,
				require_level: number,
				require_previousQuests: string,
				difficulty: string,
				category: string,
				dueDate: string | undefined,
				priority: string,
				questId: string | undefined,
				attributeRewards: any
			) => Promise<Quest>;
		};
	};
	close: () => void;
	getFormData: () => {
		title: string;
		shortDescription: string;
		description: string;
		reward_XP: number;
		require_level: number;
		require_previousQuests: string[] | string;
		difficulty: string;
		category: string;
		dueDate: string | undefined;
		priority: string;
		attributeRewards: any;
	};
};

/*
*
*/
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
			const { title, shortDescription, description, reward_XP, require_level, require_previousQuests, difficulty, category, dueDate, priority, attributeRewards } = getFormData();
			if (!title) {
				new Notice("Quest title is required !");
				return;
			}
			if (!shortDescription) {
				new Notice("Short description is required !");
				return;
			}

			if (isNaN(reward_XP) || reward_XP < 0) {
				new Notice("XP reward must be a positive number !");
				return;
			}

			if (require_level < 0) {
				new Notice("Level must be a positive number !");
				return;
			}

			if (!plugin?.questService) {
				return;
			}

			try {
				const { title, shortDescription, description, reward_XP, require_level, require_previousQuests, difficulty, category, dueDate, priority, attributeRewards } = getFormData();

				// Create the quest with attribute rewards
				const quest = {
					title,
					shortDescription,
					description,
					reward: {
						XP: reward_XP,
						attributes: {
							strength: attributeRewards.strength || 0,
							agility: attributeRewards.agility || 0,
							endurance: attributeRewards.endurance || 0,
							charisma: attributeRewards.charisma || 0,
							wisdom: attributeRewards.wisdom || 0,
							perception: attributeRewards.perception || 0,
							intelligence: attributeRewards.intelligence || 0
						}
					},
					settings: {
						type: 'quest',
						priority: priority as "low" | "medium" | "high",
						difficulty: difficulty as "easy" | "medium" | "hard" | "expert",
						category: category || "Other",
						isSecret: false,
						isTimeSensitive: false
					},
					progression: {
						isCompleted: false,
						completed_at: new Date(0),
						progress: 0,
						dueDate: dueDate ? new Date(dueDate) : undefined,
						subtasks: []
					},
					requirements: {
						level: require_level,
						previousQuests: require_previousQuests || [],
						stats: {
							strength: 0,
							agility: 0,
							endurance: 0,
							charisma: 0,
							wisdom: 0,
							perception: 0,
							intelligence: 0
						}
					}
				};

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
