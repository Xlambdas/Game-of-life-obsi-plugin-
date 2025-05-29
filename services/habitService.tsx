import { App } from 'obsidian';
import { Habit, StatBlock } from '../constants/DEFAULT';
import { viewSyncService } from './syncService';


export class HabitServices {
	private app: App;
	private plugin: any;
	private habit: Habit[] = [];
	private completedQuestIds: string[] = [];
	private dataUser: any;
	private habitCounter: number = 0;
	private availableIds: Set<number> = new Set();

	constructor(app: App, plugin: any) {
		this.app = app;
		this.plugin = plugin;
		this.dataUser = JSON.parse(JSON.stringify(this.plugin.settings));
	}

}
