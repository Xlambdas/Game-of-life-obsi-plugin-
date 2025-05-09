import React, { use, useEffect, useRef, useState } from "react";
import { QuestList } from "../data/managers/quest_use";
import { createRoot, Root } from "react-dom/client";
import { SIDE_VIEW } from "../constants/viewTypes";
import { AppContextProvider, useAppContext } from '../context/appContext';
import { appContextService } from '../context/appContextService';
import GOL from "../plugin";
import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { viewSyncService } from '../services/syncService';


// --- | side view interface | ---
export class SideViewSettings extends ItemView {
	private plugin: GOL;
	private onCloseCallback: (() => void) | null = null;
	root: Root;

	constructor(leaf: WorkspaceLeaf, plugin: GOL) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return SIDE_VIEW;
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
		this.root.render(<AppContextProvider plugin={ this.plugin }><SideView /></AppContextProvider>);
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


export const SideView = () => {
	const { saveData, updateXP, settings } = useAppContext();
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [xpProgress, setXpProgress] = useState<number>(0);
	const [userData, setUserData] = useState<any>(null);

	useEffect(() => {
		// Extract user data from settings
		if (settings && settings.user1 && settings.user1.persona) {
			setUserData(settings.user1.persona);

			// Calculate XP progress
			const persona = settings.user1.persona;
			const newProgress = (persona.newXp / persona.lvlThreshold) * 100;
			setXpProgress(newProgress);
		}
	}, [settings]);

	const handleSave = async () => {
		await saveData();
		setLastSaved(new Date());
		new Notice("Data saved successfully!");
	};
	const handleAddXP = (amount: number) => {
		updateXP(amount);
	};


	useEffect(() => {
		console.log('SideView: Initializing with refresh rate:', appContextService.getRefreshRate());
		
		const saveData = async () => {
			await appContextService.saveUserDataToFile();
		};

		let currentInterval = setInterval(() => {
			saveData();
			setLastSaved(new Date());
			if (settings?.user1?.persona) {
				const persona = settings.user1.persona;
				const newProgress = (persona.newXp / persona.lvlThreshold) * 100;
				setXpProgress(newProgress);
			}
		}, appContextService.getRefreshRate());

		// Subscribe to refresh rate changes
		console.log('SideView: Subscribing to refresh rate changes');
		const unsubscribe = viewSyncService.onRefreshRateChange((newRate: number) => {
			console.log('SideView received refresh rate change:', newRate);
			clearInterval(currentInterval);
			currentInterval = setInterval(() => {
				saveData();
				setLastSaved(new Date());
				if (settings?.user1?.persona) {
					const persona = settings.user1.persona;
					const newProgress = (persona.newXp / persona.lvlThreshold) * 100;
					setXpProgress(newProgress);
				}
			}, newRate);
		});

		return () => {
			console.log('SideView: Cleaning up interval and subscription');
			clearInterval(currentInterval);
			unsubscribe();
		};
	}, [settings]);


	return (
		<div>
			<div className="sidebar">
				{/* Xp and level */}
				{userData && (
					<div className="card">
						<h2 className="card-title">Level {userData.level}</h2>
						<div className="progress-container">
							<progress className="progress-bar" value={xpProgress} max="100" />
							<p className="xp-text">{userData.newXp}/{userData.lvlThreshold}</p>
						</div>
						<div>
							<p className="card-subtitle"><strong>Name :</strong> {userData.name}</p>
							<p className="card-subtitle"><strong>Classe :</strong> {userData.class}</p>
							<p className="card-subtitle"><strong>Total XP :</strong> {userData.xp}</p>
						</div>
					</div>
				)}

				{/* Habits / Quests Section */}
				<div className="card"> {/* sinon proposé accordion ? */}
					<QuestList />
					<p>Habits</p>
				</div>
				{/* <button onClick={handleAddXP(10)}>Add XP</button> */}
				{/* Dev Tools Section (collapsible) */}
				<details className="dev-tools card">
					<summary className="dev-tools-title">Developer Tools</summary>
					<div className="dev-tools-content">
						<button className="dev-button" onClick={() => handleAddXP(10)}>Add 10 XP</button>
						<button className="dev-button" onClick={() => handleAddXP(-10)}>Remove 10 XP</button>
						<button className="dev-button" onClick={handleSave}>Force Save</button>
					</div>
				</details>
				{lastSaved && (
					<p className="last-saved">Last saved: {lastSaved.toLocaleTimeString()}</p>
				)}
			</div>
		</div>
	);
};


interface ParentFunctions {
	loadData: () => void;
	// testLoadQuests: () => void;
	updateXP: (amount: number) => void;
}

interface SideProps {
	app: any;
	isOpen: boolean;
	userData: any;
	// quests: any;
	parentFunctions: ParentFunctions;
}



export const SideViewSettings_OLD: React.FC<SideProps> = ({
	app,
	isOpen,
	userData,
	// quests,
	parentFunctions
}) => {
	// console.log("file - SideView")

	const data = JSON.stringify(userData, null, 2);
	const parsed = JSON.parse(data);
	const settings = parsed.user1.settings;
	const user = parsed.user1.persona;
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { updateSettings, saveData } = useAppContext();

	// const testQuest = JSON.stringify(quests, null, 2);
	// const parsedQuest = JSON.parse(testQuest);
	// console.log("parsedQuest : ", quests);
	// const quest = parsedQuest.quests;

	const updateLoop = () => {
		parentFunctions.loadData();
		// parentFunctions.testLoadQuests();
		saveData();
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
	<div>
		<div className="sidebar">
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

			{/* Habits/Quests */}
			<div className="card"> {/* sinon proposé accordion ? */}
				<h3 className="accordion-title">Quests</h3>
				<QuestList />
			</div>

			{/* Stats */}
			<div className="card">
				<h2 className="card-title">Stats</h2>
				{/* {Object.entries(user.stats).map(([key, value]) => (
					<div key={key} className="stat-item">
						<span className="stat-name">{key}</span>
						<span className="stat-value">{value}</span>
					</div>
				))} */}
			</div>

			{/* Skills ?  todo */}
			{/* Badges ? todo */}

		</div>

		{/* dev part : */}
		<div>
			<h1>Dev</h1>
			<div>
				<h2>Vue B</h2>
			</div>
			<p>Name: {user.name}</p>
			<p>classe: {user.class}</p>
			<p>xp: {user.xp}</p>
			<div className="card">
				<button onClick={() =>{
					// console.log('button onClick : (file ModalTest - const child) parentFunctions.updateXP: ', parentFunctions.updateXP);
					parentFunctions.updateXP(10);
				}}>Augmenter XP</button>
				<button onClick={() =>{
					// console.log('button onClick : (file ModalTest - const child) parentFunctions.updateXP: ');
					parentFunctions.updateXP(-10);
				}}>diminuer XP</button>
					{/* <button onClick={parentFunctions.updateXP(-10)}>Diminuer XP</button> */}
			</div>
		</div>
	</div>
	);
};

// function LevelComponent() {
// 	const { testLevel } = useAppContext();

// 	return (
// 	  <div>
// 		<h1>Niveau : {testLevel}</h1>
// 		<button onClick={levelUp}>Monter de niveau</button>
// 	  </div>
// 	);
//   }
