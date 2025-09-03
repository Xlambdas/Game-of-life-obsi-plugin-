import { App, Notice, ToggleComponent } from 'obsidian';
import { Quest, DEFAULT_QUEST, AttributeBlock } from 'data/DEFAULT';
import { v4 as uuid } from 'uuid';
import { useAppContext } from 'context/appContext';
import { T } from 'framer-motion/dist/types.d-B50aGbjN';
import { TitleInput, ShortDescriptionInput, DescriptionInput, CategoryInput, PriorityInput, DifficultyInput, DueDateInput } from 'helpers/inputs';
import GOL from 'plugin';
import { separator, titleSection } from 'helpers/UIHelpers';
import QuestService from 'context/services/questService';
import { getSettingsInputs } from 'helpers/form/formHelpers';


// export class QuestForm {
// 	private questService: QuestService;
// 	private titleInput: TitleInput;
// 	private shortDescriptionInput: ShortDescriptionInput;
// 	private descriptionInput: DescriptionInput;
// 	private categoryInput: CategoryInput;
// 	private priorityInput: PriorityInput;
// 	private difficultyInput: DifficultyInput;
// 	private dueDateInput: DueDateInput;
// 	private xpBonusInput: 

//     constructor(
// 		private container: HTMLElement,
// 		private header: HTMLElement,
// 		questService: QuestService,
// 		existingQuest?: Quest
// 	) {
// 		this.questService = questService;
// 		const form = container.createDiv({ cls: "form" });

// 		this.titleInput = new TitleInput(form, existingQuest?.title);
// 		this.shortDescriptionInput = new ShortDescriptionInput(form, existingQuest?.shortDescription);
// 		this.categoryInput = new CategoryInput(form, this.questService, existingQuest?.settings.category);

// 		// advanced mode
// 		const advancedContainer = form.createDiv({ cls: "advanced-mode" });
// 		if (!header) {
// 			console.error("Header container not found");
// 			return;
// 		}

// 		new ToggleComponent(header)
// 			.setTooltip("Show/hide supplementary settings")
// 			.setValue(false)
// 			.onChange((value) => {
// 				if (value) {
// 					this.showAdvancedMode(advancedContainer, existingQuest);
// 				} else {
// 					advancedContainer.empty();
// 				}
// 			});
// 	}

// 	private showAdvancedMode(
// 		container: HTMLElement,
// 		existingQuest?: Quest
// 	) {
// 		separator(container);
// 		titleSection(container, "Advanced Settings");

// 		this.descriptionInput = new DescriptionInput(container, existingQuest?.description);
// 		const { priorityInput, difficultyInput } = getSettingsInputs(
// 			container,
// 			existingQuest?.settings.priority,
// 			existingQuest?.settings.difficulty
// 		);
// 		this.priorityInput = priorityInput;
// 		this.difficultyInput = difficultyInput;

// 		// Convert dueDate string to Date object if it exists
// 		let dueDate: Date | undefined = undefined;
// 		if (existingQuest?.progression.dueDate) {
// 			dueDate = new Date(existingQuest.progression.dueDate);
// 		}
// 		this.dueDateInput = new DueDateInput(container, dueDate);


// 	}

// 	public getFormData(): Quest {
// 		const now = new Date(Date.now());
// 		const formData: Quest = {
// 			...DEFAULT_QUEST,
// 			id: uuid(),
// 			title: this.titleInput.getValue().trim(),
// 			shortDescription: this.shortDescriptionInput.getValue().trim(),
// 			description: this.descriptionInput ? this.descriptionInput.getValue().trim() : "",
// 			created_at: now,
// 			settings: {
// 				type: "quest",
// 				priority: this.priorityInput ? this.priorityInput.getValue(): DEFAULT_QUEST.settings.priority,
// 				difficulty: this.difficultyInput ? this.difficultyInput.getValue(): DEFAULT_QUEST.settings.difficulty,
// 				category: this.categoryInput.getValue() || DEFAULT_QUEST.settings.category,
// 			},
// 			progression: {
// 				...DEFAULT_QUEST.progression,
// 				// dueDate: this.dueDateInput ? this.dueDateInput : Date,
// 			},
// 			reward: {
// 				...DEFAULT_QUEST.reward,
// 				attributes: DEFAULT_QUEST.reward.attributes,
// 			}
// 		};

// 		formData.reward.attributes = updateAttributes(formData);


// 		console.log("Updated attributes:", formData.reward.attributes);
// 		return formData;
// 	}
// 	public validateForm(formData: Quest): boolean {
// 		const { title, shortDescription } = formData;

// 		if (!title) {
// 			new Notice("Quest title is required!");
// 			return false;
// 		}
// 		if (!shortDescription) {
// 			new Notice("Short description is required!");
// 			return false;
// 		}

// 		return true;
// 	}
// }


// // export interface QuestFormInputs {
// // 	titleInput: { getValue: () => string };
// // 	shortDescriptionInput: { getValue: () => string };
// // 	descriptionInput?: { getValue: () => string };
// // 	rewardXPInput?: { getValue: () => string };
// // 	requireLevelInput?: { getValue: () => number };
// // 	requirePreviousQuestsInput?: { getValue: () => string[] };
// // 	priorityInput?: { getValue: () => string };
// // 	difficultyInput?: { getValue: () => string };
// // 	rewardAttributeInput?: { getStatBlock: () => Record<string, number> };
// // 	dueDateInput?: { getValue: () => string };
// // }


// export function updateAttributes(formData: Quest): AttributeBlock {
// 	const baseAttributes = { ...DEFAULT_QUEST.reward.attributes };
// 	const categoryAttributes = updateAttributesByCategory(formData.settings.category, baseAttributes);

// 	if (formData.reward.attributes) {
// 		formData.reward.attributes = {
// 			...DEFAULT_QUEST.reward.attributes,
// 			...baseAttributes,
// 			...categoryAttributes,
// 			...formData.reward.attributes
// 		};
// 	} else {
// 		const currentAttributes: AttributeBlock = {
// 			...DEFAULT_QUEST.reward.attributes,
// 			...baseAttributes
// 		};
// 		const updatedAttributes = updateAttributesByCategory(formData.settings.category, currentAttributes);
// 		formData.reward.attributes = updatedAttributes;
// 	}
// 	return categoryAttributes;
// }

// export const updateAttributesByCategory = (category: string, attributes: AttributeBlock): AttributeBlock => {
// 	const updatedAttributes: AttributeBlock = { ...attributes };

// 	switch (category) {
// 		case 'Physical':
// 			updatedAttributes.strength += 1;
// 			updatedAttributes.agility += 1;
// 			updatedAttributes.endurance += 1;
// 			break;
// 		case 'Mental':
// 			updatedAttributes.wisdom += 1;
// 			updatedAttributes.perception += 1;
// 			updatedAttributes.intelligence += 1;
// 			break;
// 		case 'Social':
// 			updatedAttributes.charisma += 1;
// 			updatedAttributes.intelligence += 1;
// 			updatedAttributes.reputation += 1;
// 			break;
// 		case 'Creative':
// 			updatedAttributes.charisma += 1;
// 			updatedAttributes.perception += 1;
// 			updatedAttributes.flow += 1;
// 			break;
// 		case 'Emotional':
// 			updatedAttributes.wisdom += 1;
// 			updatedAttributes.charisma += 1;
// 			updatedAttributes.spirit += 1;
// 			break;
// 		case 'Organizational':
// 			updatedAttributes.intelligence += 1;
// 			updatedAttributes.perception += 1;
// 			updatedAttributes.willpower += 1;
// 			break;
// 		case 'Exploration':
// 			updatedAttributes.agility += 1;
// 			updatedAttributes.perception += 1;
// 			updatedAttributes.intelligence += 1;
// 			updatedAttributes.resilience += 1;
// 			break;
// 		case 'Spiritual':
// 			updatedAttributes.spirit += 2;
// 			updatedAttributes.wisdom += 1;
// 			break;
// 		case 'Resilience':
// 			updatedAttributes.resilience += 2;
// 			updatedAttributes.endurance += 1;
// 			break;
// 		case 'Leadership':
// 			updatedAttributes.charisma += 1;
// 			updatedAttributes.willpower += 1;
// 			updatedAttributes.reputation += 1;
// 			break;
// 		case 'Undefined':
// 		default:
// 			break;
// 	}

// 	console.log("Updated attributes for category:", category, updatedAttributes);
// 	return updatedAttributes;
// }
