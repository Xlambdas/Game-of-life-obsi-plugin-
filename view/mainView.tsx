/**
 * Represents the main view of the plugin, extending the Obsidian `ItemView`.
 * This view is responsible for rendering the main interface of the plugin.
 */

import React, { useEffect, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { ItemView, WorkspaceLeaf } from "obsidian";
// from other files :

import { MAIN_VIEW } from "../constants/viewTypes";
import { useAppContext, AppContextProvider} from '../context/appContext';
import { appContextService } from '../context/appContextService';
import GOL from "../plugin";
import { Notice } from "obsidian";
import { viewSyncService } from '../services/syncService';

// Removed incorrect import of React

// --- | main view interface | ---
export class MainViewSettings extends ItemView { // todo
	private plugin: GOL;
	private onCloseCallback: (() => void) | null = null;
	root: Root;

	constructor(leaf: WorkspaceLeaf, plugin: GOL) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return MAIN_VIEW;
	}

	getDisplayText() {
		return 'Main view';
	}

	getIcon() {
		return 'sword';
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		this.root = createRoot(container);
		container.empty();
		this.root.render(<AppContextProvider plugin={ this.plugin }><MainView /></AppContextProvider>);
		// root.render(<ParentView app={this.app} type="main" setOnCloseCallback={(callback) => { this.onCloseCallback = callback; }} />);
	}

	async onClose() {
		await appContextService.saveUserDataToFile();
		this.root.unmount();
		if (this.onCloseCallback) {
			this.onCloseCallback(); // clean all ParentView
		}
	}
}


export const MainView = () => {
	const { refreshRate } = useAppContext();
	const { saveData, updateXP } = useAppContext();
	const [lastSaved, setLastSaved] = useState<Date | null>(null);


	const handleSave = async () => {
		await saveData();
		setLastSaved(new Date());
		new Notice("Data saved successfully!");
	};

	const handleAddXP = (amount: number) => {
		updateXP(amount);
		new Notice(`${amount > 0 ? "Added" : "Removed"} ${Math.abs(amount)} XP`);
	};

	useEffect(() => {
		console.log('MainView: Initializing with refresh rate:', appContextService.getRefreshRate());
		
		const saveData = async () => {
			await appContextService.saveUserDataToFile();
		};

		let currentInterval = setInterval(() => {
			saveData();
			setLastSaved(new Date());
		}, appContextService.getRefreshRate());

		// Subscribe to refresh rate changes
		console.log('MainView: Subscribing to refresh rate changes');
		const unsubscribe = viewSyncService.onRefreshRateChange((newRate: number) => {
			console.log('MainView received refresh rate change:', newRate);
			clearInterval(currentInterval);
			currentInterval = setInterval(() => {
				saveData();
				setLastSaved(new Date());
			}, newRate);
		});

		return () => {
			console.log('MainView: Cleaning up interval and subscription');
			clearInterval(currentInterval);
			unsubscribe();
		};
	}, []);

	return (
		<div>
			<h2>Game of Life - Main View</h2>
			<div>
				<h3>Experience points</h3>
				<button onClick={() => handleAddXP(10)}>Add 10 XP</button>
				<button onClick={() => handleAddXP(-10)}>Remove 10 XP</button>
			</div>
			<div>
				<h3>Development Settings</h3>
				<div className="dev-buttons">
					<button onClick={handleSave}>Manual Save</button>
				</div>
				{lastSaved && (
					<p className="last-saved">Last saved: {lastSaved.toLocaleTimeString()}</p>
				)}
			</div>

		</div>
	);
};


interface ParentFunctions {
	loadData: () => void;
	updateXP: (amount: number) => void;
}

interface MainProps {
	isOpen: boolean;
	userData: any;
	parentFunctions: ParentFunctions;
}

export const MainViewSettings_OLD: React.FC<MainProps> = ({
	isOpen,
	userData,
	parentFunctions
}) => {
	// console.log("file - mainView")

	const data = JSON.stringify(userData, null, 2);
	const parsed = JSON.parse(data);
	const settings = parsed.user1.settings;
	const user = parsed.user1.persona;
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const updateLoop = () => {
		parentFunctions.loadData();
	};

	useEffect(() => {
		if (isOpen) {
			timeoutRef.current = setTimeout(updateLoop, 20000); // reload every X seconds
		}
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current); // Stop the loop when the component unmounts
			}
		};
	}, [isOpen]);
	if (!isOpen) return null;
	const newLocal = `${(user.newXp / user.lvlThreshold) * 100}`;
	// todo - make the visual part :
	return (
		<div className="mainview"> { /* visual representation of the main view */ }
			<div>
				<h1>This is the main view</h1>
				{/* Xp and level */}
				<div className="card">
					<h2 className="card-title">Level {user.level}</h2>
					<progress className="progress-bar" value={newLocal} max="100" style={{  }}>newlocal</progress>
					<p className="xp-text">{user.newXp}/{user.lvlThreshold}</p>
					<div>
						<p className="card-subtitle">Name : {user.name}</p>
						<p className="card-subtitle">Class : {user.class}</p>
						<p className="card-subtitle">Current XP : {user.xp}</p>
					</div>
				</div>


				{/* Stats */}
				<div className="card">
					<h2 className="card-title">Stats</h2>
				</div>

				{/* Skills ?  todo */}
				{/* Badges ? todo */}

		</div>
		<div>
			{/* dev part : */}
			<h1>Dev</h1>
			<div>
				<h2>Vue A</h2>

			</div>
			<p>Nom: {user.name}</p>
			<p>classe: {user.class}</p>
			<p>xp: {user.xp}</p>
			<div className="card">
				<button onClick={() =>{
					console.log('button onClick : (file ModalTest - const child) parentFunctions.updateXP: ', parentFunctions.updateXP);
					parentFunctions.updateXP(10);
				}}>Augmenter XP</button>
				<button onClick={() =>{
					console.log('button onClick : (file ModalTest - const child) parentFunctions.updateXP: ');
					parentFunctions.updateXP(-10);
				}}>diminuer XP</button>
			</div>
		</div>

	</div>
	);
};
