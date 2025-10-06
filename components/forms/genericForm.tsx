import * as ReactDOM from 'react-dom/client';
import { Notice, Modal, App } from "obsidian";
// from files (services, Default) :
import { AppContextService } from "../../context/appContextService";
import { AppProvider } from "../../context/appContext";
import { Quest, Habit } from "data/DEFAULT";
// from files (UI) :
import { QuestFormUI } from "../quests/questForm";
import { HabitFormUI } from "../habits/habitForm";

type DataType = Quest | Habit;

export class GenericForm extends Modal {
	/* Modal for creating or modifying a quest or habit */
	private mode: 'quest-create' | 'quest-modify' | 'habit-create' | 'habit-modify';
	private data?: DataType;

	constructor(app: App, mode: 'quest-create' | 'quest-modify' | 'habit-create' | 'habit-modify', existingData?: DataType) {
		super(app);
		this.mode = mode;
		this.data = existingData;
		if ((mode.endsWith("modify") && !existingData) || (mode.endsWith("create") && existingData)) {
		throw new Error("Invalid mode/data combination.");
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		const root = ReactDOM.createRoot(contentEl);
		const service = AppContextService.getInstance();
		const dataService = service['dataService'];

		const handleSubmit = async (data: DataType) => {
			if (this.mode === 'quest-create') {
				console.log("Submitting new quest:", data);
				await dataService.addQuest(data as Quest);
			} else if (this.mode === 'quest-modify') {
				const allQuests = await dataService.loadAllQuests();
				const updatedQuests: Quest[] = allQuests.map(q => q.id === (data as Quest).id ? (data as Quest) : q);
				await dataService.saveAllQuests(updatedQuests);
			} else if (this.mode === 'habit-create') {
				await dataService.addHabit(data as Habit);
			} else if (this.mode === 'habit-modify') {
				const allHabits = await dataService.loadAllHabits();
				const updatedHabits: Habit[] = allHabits.map(h => h.id === (data as Habit).id ? (data as Habit) : h);
				await dataService.saveAllHabits(updatedHabits);
			}
			new Notice(`${this.mode.split("-")[0].charAt(0).toUpperCase() + this.mode.split("-")[0].slice(1)} ${this.mode.endsWith("create") ? "created" : "updated"} successfully`);
			// Notify other components of the update
			document.dispatchEvent(new CustomEvent("dbUpdated", { detail: { type: this.mode.split("-")[0], data } }));
			this.close();
		};

		const handleDelete = async () => {
			if (!this.data) return;
			if (this.mode === "quest-modify") {
				const allQuests = await dataService.loadAllQuests();
				const updatedQuests = allQuests.filter(q => q.id !== (this.data as Quest).id);
				await dataService.saveAllQuests(updatedQuests);
			} else if (this.mode === "habit-modify") {
				const allHabits = await dataService.loadAllHabits();
				const updatedHabits = allHabits.filter(h => h.id !== (this.data as Habit).id);
				await dataService.saveAllHabits(updatedHabits);
			} else return;

			this.close();
			new Notice(`${this.mode.split("-")[0].charAt(0).toUpperCase() + this.mode.split("-")[0].slice(1)} deleted successfully`);
			document.dispatchEvent(new CustomEvent("dbUpdated", { detail: { type: this.mode.split("-")[0], data: this.data } }));
		};

		let ui = null;
		if (this.mode === 'quest-create' || this.mode === 'quest-modify') {
			ui = (
				<QuestFormUI
					existingQuest={this.data}
					onSuccess={handleSubmit}
					onCancel={this.mode === 'quest-create' ? () => this.close() : undefined}
					onDelete={this.mode === 'quest-modify' ? handleDelete : undefined}
				/>
			);
		} else if (this.mode === 'habit-create' || this.mode === 'habit-modify') {
			ui = (
				<HabitFormUI
					existingHabit={this.data as Habit}
					onSuccess={handleSubmit}
					onCancel={this.mode === 'habit-create' ? () => this.close() : undefined}
					onDelete={this.mode === 'habit-modify' ? handleDelete : undefined}
				/>
			);
		} else {
			ui = <div>Invalid mode</div>;
		}
		root.render(
			<AppProvider appService={service}>
				<div className="quest-modal">
					{ui}
				</div>
			</AppProvider>
		);
	}
	onClose() {
		this.contentEl.empty();
	}
}
