import React, { useEffect, useRef, useState } from "react";
// import { QuestListTest } from "../questList/questListTest";
import { QuestList } from "../components/parentView";
import { createRoot } from "react-dom/client";
import { App, Modal, Notice, Plugin, WorkspaceLeaf, ItemView } from "obsidian";
import { ParentView } from "../components/parentView";
// import { SIDE_VIEW } from "../constants/viewTypes";
// --- | side view interface | ---

export const SIDE_VIEW = 'side-view';

export class sideView extends ItemView {
	// Open the side view
	private onCloseCallback: (() => void) | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return SIDE_VIEW;
	}

	getDisplayText() {
		return 'Test view';
	}

	getIcon() {
		return 'dice';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		// container.createEl('h4', { text: ' test view' });
		const root = createRoot(container);
		root.render(<ParentView app={this.app} type="side" setOnCloseCallback={(callback) => { this.onCloseCallback = callback; }}/>);
	}

	async onClose() {
		if (this.onCloseCallback) {
			this.onCloseCallback(); // clean all ParentView
		}
	}

}


interface ParentFunctions {
	loadData: () => void;
	testLoadQuests: () => void;
	updateXP: (amount: number) => void;
}

interface SideProps {
	isOpen: boolean;
	// onClose: () => void;
	userData: any;
	quests: any;
	parentFunctions: ParentFunctions;
}

export const SideView: React.FC<SideProps> = ({
	isOpen,
	// onClose,
	userData,
	quests,
	parentFunctions
}) => {
	// console.log("file - SideView")

	const data = JSON.stringify(userData, null, 2);
	const parsed = JSON.parse(data);
	const settings = parsed.user1.settings;
	const user = parsed.user1.persona;
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const testQuest = JSON.stringify(quests, null, 2);
	const parsedQuest = JSON.parse(testQuest);
	console.log("parsedQuest : ", quests);
	const quest = parsedQuest.quests;

	const updateLoop = () => {
		parentFunctions.loadData();
		parentFunctions.testLoadQuests();
		// console.log("file sideView - const child - updateLoop");
	};

	useEffect(() => {
		if (isOpen) {
			// console.log("file sideView - const child - setTimeout");
			timeoutRef.current = setTimeout(updateLoop, 20000); // reload every X seconds
		}
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [isOpen]);

	if (!isOpen) return null;


	const newLocal = `${(user.newXp / user.lvlThreshold) * 100}`;
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
				<h3 className="accordion-title">Habits</h3>
				{/* {user.quests.map((quest: any) => ( // todo - comprendre comment fonctionne .map
					<div key={quest.id} className="quest-item">
						<p>{quest.title}</p>
						<p className="quest-status">{quest.xp}</p>
					</div>
				))} */}
			</div>
			<div className="card"> {/* sinon proposé accordion ? */}
				<h3 className="accordion-title">Quests</h3>
				{/* {user.quests.map((quest: any) => ( // todo - comprendre comment fonctionne .map
					<div key={quest.id} className="quest-item">
						<p>{quest.title}</p>
						<p className="quest-status">{quest.xp}</p>
					</div>
				))} */}
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



		<div>
			{/* dev part !! */}
			<h1>Dev</h1>
			<p>Nom: {user.name}</p>
			<p>classe: {user.class}</p>
			<p>xp: {user.xp}</p>
			<button onClick={ () => {
				console.log('button onClick : (file ModalTest - const child) parentFunctions.loadData: ', parentFunctions.loadData);
				parentFunctions.loadData();
				}}>settings
			</button>
			<div className="card">
				<button onClick={() =>{
					console.log('button onClick : (file ModalTest - const child) parentFunctions.updateXP: ', parentFunctions.updateXP);
					parentFunctions.updateXP(10);
				}}>Augmenter XP</button>
				<button onClick={() =>{
					console.log('button onClick : (file ModalTest - const child) parentFunctions.updateXP: ');
					parentFunctions.updateXP(-10);
				}}>diminuer XP</button>
					{/* <button onClick={parentFunctions.updateXP(-10)}>Diminuer XP</button> */}
			</div>
		</div>
	</div>
	);
};


async function loadQuests(): Promise<any[]> {
    const filePath = `$/plugins/game-of-life/data/user.json`;
    const response = await fetch(filePath);
    return await response.json();
}

async function loadUserData(): Promise<any> {
    const filePath = "path/to/user_data.json";
    const response = await fetch(filePath);
    return await response.json();
}


// -------------------

import ReactDOM from "react-dom";
import { QuestListTest } from "../data/managers/quest_use";

interface ParentFunctionsTest {
	loadData: () => void;
	testLoadQuests: () => void;
	updateXP: (amount: number) => void;
}

interface SidePropsTest {
	app: any; // Replace 'any' with the correct type if you know it
	isOpen: boolean;
	// onClose: () => void;
	userData: any;
	quests: any;
	parentFunctions: ParentFunctionsTest;
}


export const SideViewTest: React.FC<SidePropsTest> = ({
	app,
	isOpen,
	// onClose,
	userData,
	quests,
	parentFunctions
}) => {
	// console.log("file - SideView")

	const data = JSON.stringify(userData, null, 2);
	const parsed = JSON.parse(data);
	const settings = parsed.user1.settings;
	const user = parsed.user1.persona;
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const testQuest = JSON.stringify(quests, null, 2);
	const parsedQuest = JSON.parse(testQuest);
	const quest = parsedQuest.quests;

	const updateLoop = () => {
		parentFunctions.loadData();
		parentFunctions.testLoadQuests();
		// console.log("file sideView - const child - updateLoop");
	};

	useEffect(() => {
		if (isOpen) {
			// console.log("file sideView - const child - setTimeout");
			timeoutRef.current = setTimeout(updateLoop, 20000); // reload every X seconds
		}
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [isOpen]);

	if (!isOpen) return null;


	const newLocal = `${(user.newXp / user.lvlThreshold) * 100}`;



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

			<div className="card"> {/* sinon proposé accordion ? */}
				<h3 className="accordion-title">Quests</h3>
				<QuestList />
			</div>

			<div className="card"> {/* sinon proposé accordion ? */}
				<h3 className="accordion-title">Habits</h3>
				<QuestListTest app={app} />
			</div>

		</div>
	</div>
	);
};
