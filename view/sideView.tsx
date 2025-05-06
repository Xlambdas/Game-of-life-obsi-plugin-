import React, { useEffect, useRef, useState } from "react";
import { QuestList } from "../data/managers/quest_use";
import { createRoot } from "react-dom/client";
import { App, Modal, Notice, Plugin, WorkspaceLeaf, ItemView } from "obsidian";
import { ParentView } from "../components/parentView";
import { SIDE_VIEW } from "../constants/viewTypes";
import ReactDOM from "react-dom";



// --- | side view interface | ---
export class SideView extends ItemView {
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
	app: any;
	isOpen: boolean;
	userData: any;
	quests: any;
	parentFunctions: ParentFunctions;
}



export const SideViewSettings: React.FC<SideProps> = ({
	app,
	isOpen,
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
			<p>Nom: {user.name}</p>
			<p>classe: {user.class}</p>
			<p>xp: {user.xp}</p>
			<button onClick={ () => {
				// console.log('button onClick : (file ModalTest - const child) parentFunctions.loadData: ', parentFunctions.loadData);
				parentFunctions.loadData();
				}}>settings
			</button>
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

