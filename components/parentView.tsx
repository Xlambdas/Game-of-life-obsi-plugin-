// /**
//  * The `ParentView` component serves as the main parent container for managing user data, quests,
//  * and rendering different views based on the provided `type` prop. It handles data loading,
//  * periodic updates, and cleanup when the component is unmounted or the sidebar is closed.
//  *
//  * @param {Object} props - The props for the component.
//  * @param {App} props.app - The Obsidian app instance used for accessing vault and adapter functionalities.
//  * @param {string} props.type - Determines the type of view to render. Can be either "main" or "side".
//  * @param {(callback: () => void) => void} props.setOnCloseCallback - A function to set a callback
//  *        that is triggered when the sidebar is closed.
//  *
//  * @returns {JSX.Element} - The rendered component, which can be a `MainViewSettings`, `SideViewSettings`,
//  *          or a fallback `QuestList` component.
//  *
//  * @remarks
//  * - The component initializes and manages state for user data, quests, and periodic updates.
//  * - It reads and writes user and quest data from JSON files located in the plugin's data directory.
//  * - Includes utility functions for calculating levels, updating XP, and loading quests.
//  * - Automatically reloads data at a specified interval (`timeReload`).
//  * - Ensures proper cleanup of timeouts when the component is unmounted or the sidebar is closed.
//  */

// import { useEffect, useRef, useState } from "react";
// import { Notice, App } from "obsidian";
// // from other files :
// import { SideViewSettings } from "view/sideView";
// import { MainViewSettings } from "view/mainView";
// import { QuestList } from "../data/managers/quest_use";
// import { DEFAULT_SETTINGS } from "../constants/DEFAULT";


// export const ParentView = ({ app, type, setOnCloseCallback }: { app: App; type: string; setOnCloseCallback: (callback: () => void) => void; }) => {
// 	// console.log("file - parentView")
// 	const [data, setData] = useState(DEFAULT_SETTINGS);
// 	const [xp, setXp] = useState(0);
// 	const [level, setLevel] = useState(1);
// 	const [lvlThreshold, setlvlThreshold] = useState(100);
// 	const [newXp, setNewXp] = useState(0);
// 	const [quest, setQuest] = useState<{ id: number; title: string; description: string; xp: number; completed: boolean }[]>([]);

// 	const timeReload = 5000; // 20s
// 	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

// 	const filePath = `${app.vault.configDir}/plugins/game-of-life/data/db/user.json`;
// 	const fileQuest = `${app.vault.configDir}/plugins/game-of-life/data/db/quest.json`;


// 	useEffect(() => {

// 		LoadQuest();

// 		// function of auto update :
// 		const startUpdateLoop = () => {
// 			timeoutRef.current = setTimeout(() => {
// 			loadData();
// 			LoadQuest();
// 			startUpdateLoop();
// 			}, timeReload);
// 		};
// 		startUpdateLoop();

// 		// cleanup function to clear the timeout when the component unmounts.
// 		if (setOnCloseCallback) {
// 			setOnCloseCallback(() => {
// 			if (timeoutRef.current) {
// 				clearTimeout(timeoutRef.current);
// 				timeoutRef.current = null;
// 				// console.log("Timeout arrêté car la sidebar est fermée.");
// 			}
// 			});
// 		}
// 		return () => {
// 			if (timeoutRef.current) {
// 			clearTimeout(timeoutRef.current);
// 			}
// 		};
// 	}, [app]);


// 	const LoadQuest = async (): Promise<any> => {
// 		// Load the data in the file quests.json
// 		try {
// 			if (!(await app.vault.adapter.exists(fileQuest))) {
// 				console.warn(`⚠️ File ${fileQuest} unknown.`);
// 				const quests: { id: number; title: string; description: string; xp: number; completed: boolean }[] = [];
// 				await app.vault.adapter.write(fileQuest, JSON.stringify(quests, null, 2));
// 				setQuest(quests);
// 				return;
// 			}
// 			const content = await app.vault.adapter.read(fileQuest);
// 			const parsedQuests = JSON.parse(content);
// 			// console.log("(file test.tsx - const ParentView) Data loaded: ", content);
// 			// console.warn("(file test.tsx - const ParentView) Data loaded: ", parsedQuests)
// 			setQuest(parsedQuests);
// 		}catch (error) {
// 			console.error("(file test.tsx - const ParentView) Error when loading data:", error);
// 		}
// 	}

// 		// Define the parent functions to be passed to child components :
// 		const ParentFunctions = {loadData, LoadQuest, testLoadQuests: LoadQuest }; //, calculLevel, updateXP };
// 		if (type === "main") {
// 			return <MainViewSettings isOpen={true} userData={data} parentFunctions={ParentFunctions} />;
// 		}
// 		if (type === "side") {
// 			return <SideViewSettings app={App} isOpen={true} userData={data} parentFunctions={ParentFunctions} />;
// 		}

// 		// Return a test component if type is not "main" or "side"
// 		return (
// 			<QuestList />
// 		);
// 	};

export {}
