/**
 * Represents the main view of the plugin, extending the Obsidian `ItemView`.
 * This view is responsible for rendering the main interface of the plugin.
 */

import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { ItemView, WorkspaceLeaf } from "obsidian";
// from other files :
import { ParentView } from "../components/parentView";
import { MAIN_VIEW } from "../constants/viewTypes";



// --- | main view interface | ---
export class MainView extends ItemView { // todo
	private onCloseCallback: (() => void) | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
		const container = this.containerEl;
		container.empty();
		const root = createRoot(container);
		root.render(<ParentView app={this.app} type="main" setOnCloseCallback={(callback) => { this.onCloseCallback = callback; }} />);
	}

	async onClose() {
		if (this.onCloseCallback) {
			this.onCloseCallback(); // clean all ParentView
		}
	}
}


interface ParentFunctions {
	loadData: () => void;
	updateXP: (amount: number) => void;
}

interface MainProps {
	isOpen: boolean;
	userData: any;
	parentFunctions: ParentFunctions;
}

export const MainViewSettings: React.FC<MainProps> = ({
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
