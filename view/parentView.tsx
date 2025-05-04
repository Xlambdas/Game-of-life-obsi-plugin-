// const Sidebar = () => {
// 	// get user data from JSON file :

// 	const [user, setUser] = useState(userData);
// 	useEffect(() => {
// 		console.log(user.user1.persona.name);  // Affiche "John Doe" dans la console
// 	}, [user]);

// 	const [xp, setXp] = useState(user.user1.persona.xp);

// 	useEffect(() => {
// 		const updatedUser = { ...user, user1: { ...user.user1, persona: { ...user.user1.persona, xp } } };
// 		setUser(updatedUser);
// 	}, [xp]);
// 	const level = Math.floor(xp / 100);
// 	const quests = [
// 		{ id: 1, title: "Apprendre une nouvelle chanson au piano", status: "En cours" },
// 		{ id: 2, title: "Faire 30 min de sport", status: "Terminée" },
// 	];
// 	const stats = { force: 10, intelligence: 15, discipline: 12 };
// 	console.log("user", xp);
// 	const handleXpChange = (newXp: number) => {
// 		setXp(newXp);
// 	};

// 	return (
// 		<div className="sidebar">
// 			{/* XP & Niveau */}
// 			<div className="card">
// 				<h2 className="card-title">Niveau {level}</h2>
// 				<div className="progress-bar">
// 					<div className="progress" style={{ width: `${(xp % 100)}%` }}></div>
// 				</div>
// 				<p className="xp-text">{xp % 100}/100 XP</p>
// 			</div>

// 			{/* Quêtes */}
// 			<div className="accordion">
// 				<h3 className="accordion-title">Quêtes</h3>
// 				{quests.map((quest) => (
// 				<div key={quest.id} className="quest-item">
// 					<p className="quest-title">{quest.title}</p>
// 					<p className="quest-status">{quest.status}</p>
// 				</div>
// 				))}
// 			</div>

// 			{/* Statistiques */}
// 			<div className="card">
// 				<h2 className="card-title">Statistiques</h2>
// 				{Object.entries(stats).map(([key, value]) => (
// 				<div key={key} className="stat-item">
// 					<span className="stat-name">{key}</span>
// 					<span className="stat-value">{value}</span>
// 				</div>
// 				))}
// 			</div>
// 			<div>
// 			<h1>Profil Utilisateur</h1>
// 			<p>Nom: {user.user1.persona.name}</p>
// 			<p>classe: {user.user1.persona.class}</p>
// 			<p>xp: {xp}</p>

// 			</div>
// 			<button onClick={() => handleXpChange(xp + 10)}>Augmenter XP</button>
// 			<button onClick={() => saveSettings()}>save settings</button>
// 		</div>
// 	);
// };

// export default Sidebar;




//  -------------------------------

import React, { useEffect, useRef, useState } from "react";
import { Notice, Modal, App } from "obsidian";
import { SideView, SideViewTest } from "view/sideView";
import { MainView } from "view/mainView";
import { DEFAULT_SETTINGS } from "settings";
import { TestMainView } from "view/testmainView";
import { TestSideView } from "view/sidebar";
import test from "node:test";



export const ParentView = ({ app, type, setOnCloseCallback }: { app: App; type: string; setOnCloseCallback: (callback: () => void) => void; }) => {
	console.log("file - parentView")
	const [data, setData] = useState(DEFAULT_SETTINGS);
	const [xp, setXp] = useState(0);
	const [level, setLevel] = useState(1);
	const [lvlThreshold, setlvlThreshold] = useState(100);
	const [newXp, setNewXp] = useState(0);
	const [quest, setQuest] = useState<{ id: number; title: string; description: string; xp: number; completed: boolean }[]>([]);

	const timeReload = 5000; // 20s
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const filePath = `${app.vault.configDir}/plugins/game-of-life/data/user.json`;
	const fileQuest = `${app.vault.configDir}/plugins/game-of-life/data/quest.json`;


	useEffect(() => {
		console.log("(file parentView - const ParentView) chargement des données.. ", data);
		loadData();
		// for quests :
		testLoadQuest();
		// getAvailableQuests().then(setQuest);

		// Fonction de mise à jour automatique
		const startUpdateLoop = () => {
			timeoutRef.current = setTimeout(() => {
			console.log("Mise à jour automatique des données...");
			loadData();
			testLoadQuest();
			startUpdateLoop(); // Relance la boucle
			}, timeReload);
		};
		startUpdateLoop();

		// On passe une fonction de cleanup à sideView.onClose()
		if (setOnCloseCallback) {
			setOnCloseCallback(() => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
				console.log("Timeout arrêté car la sidebar est fermée.");
			}
			});
		}

		return () => {
			if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			}
		};
	}, [app]);

	const loadData = async (): Promise<any> => {
		try {
			if (!(await app.vault.adapter.exists(filePath))) {
				console.warn(`⚠️ File ${filePath} unknown. Creating DEFAULT USER.`);
				const defaultUser = DEFAULT_SETTINGS;
				await app.vault.adapter.write(filePath, JSON.stringify(defaultUser, null, 2));
				setData(defaultUser);
				return;
			}
			const content = await app.vault.adapter.read(filePath);
			const parsedData = JSON.parse(content);
			setData(parsedData);
			const xp = parsedData.user1.persona.xp;
			const level = parsedData.user1.persona.level;
			const lvlThreshold = parsedData.user1.persona.lvlThreshold;
			const newXp = parsedData.user1.persona.newXp;
			setXp(xp);
			setLevel(level);
			setlvlThreshold(lvlThreshold);
			setNewXp(newXp);
			// console.log("(file test.tsx - const ParentView) Data loaded: ", content);
			// console.warn("(file test.tsx - const ParentView) Data loaded: ", parsedData);

		}catch (error) {
			console.error("(file test.tsx - const ParentView) Error when loading data:", error);
		}
	}

	// for the quests :
	const testLoadQuest = async (): Promise<any> => {
		try {
			if (!(await app.vault.adapter.exists(fileQuest))) {
				console.warn(`⚠️ File ${fileQuest} unknown.`);
				const quests: { id: number; title: string; description: string; xp: number; completed: boolean }[] = [];
				await app.vault.adapter.write(fileQuest, JSON.stringify(quests, null, 2));
				setQuest(quests);
				return;
			}
			const content = await app.vault.adapter.read(fileQuest);
			const parsedQuests = JSON.parse(content);
			console.log("(file test.tsx - const ParentView) Data loaded: ", content);
			console.warn("(file test.tsx - const ParentView) Data loaded: ", parsedQuests)
			setQuest(parsedQuests);
		}catch (error) {
			console.error("(file test.tsx - const ParentView) Error when loading data:", error);
		}
	}

	// async function loadQuests(): Promise<any[]> {
	// 	const quests = await fetch(fileQuest);
	// 	console.log("(file test - const ParentView) loadQuests: quests = ", quests);
	// 	return await quests.json();
	// };

	// async function completeQuest(questId: string): Promise<void> {
	// 	let userData = await loadData();
	// 	if (!userData) {
	// 		throw new Error("Failed to load user data.");
	// 	}
	
	// 	if (!userData.completedQuests.includes(questId)) {
	// 		userData.completedQuests.push(questId);
	// 		userData.xp += 10; // Exemple : ajouter de l'XP
	// 		await this.app.vault.adapter.write(filePath, JSON.stringify(userData, null, 2));
	// 	}
	// }

	// async function getAvailableQuests(): Promise<any[]> {
	// 	const quests = await loadQuests();
	// 	const userData = await loadData();
	// 	return quests.map(quest => ({
	// 		...quest,
	// 		completed: userData.completedQuests.includes(quest.id)
	// 	}));
	// }

	const calculLevel = (xp: number, level: number): { level: number, newXp: number, lvlSeuil: number } => {
		let lvl = 1;
		let seuil = 100;

		while (xp >= seuil) {
			if (lvl === level) {
				new Notice("Level up!");
			}
			xp -= seuil;
			seuil = Math.trunc(seuil * 1.2);
			lvl++;
		}
		console.log("(file test - const ParentView) calculLevel: calcul fini : level, xp, seuil - ", level, xp, seuil);

		return { level: lvl, newXp: xp, lvlSeuil: seuil };
	};
	// console.log("(file test - const ParentView) calculLevel: calcul fini : ", data);

	const updateXP = async (amount: number) => {
		console.log(`(file test - const ParentView) updateXP: amount: `, amount);

		if (!data) return;
		let updatedXP = Math.max(xp + amount, 0);
		console.log(`(file test - const ParentView) updateXP: updatedXP = `, updatedXP);
		let calcul = calculLevel(updatedXP, level);
		console.log(`(file test - const ParentView) updateXP: calcul = `, calcul);
		let updatedLevel = calcul.level;
		let updatedlvlThreshold = calcul.lvlSeuil;
		let newXp = calcul.newXp;

		setXp(updatedXP);
		console.log('(file test - const ParentView) updateXP: updatedXP = ', xp);
		setLevel(updatedLevel);
		setlvlThreshold(updatedlvlThreshold);
		setNewXp(newXp);

		// console.log(`call updatedXP : XP: ${updatedXP}, Level: ${updatedLevel}, newThreshold: ${updatedlvlThreshold}, newXp: ${newXp}`);
		const updatedUser = {
			...data,
			user1: { ...data.user1, persona: { ...data.user1.persona, xp: updatedXP, level: updatedLevel, newXp: newXp, lvlThreshold: updatedlvlThreshold } },
		};
		// console.log("updatedUser", updatedUser);
		setData(updatedUser);
		console.log(`width = ${(newXp / lvlThreshold) * 100}%`);

		try {
			await app.vault.adapter.write(filePath, JSON.stringify(updatedUser, null, 2));
			console.log("Données sauvegardées !");
		} catch (error) {
			console.error("Erreur lors de la sauvegarde :", error);
			new Notice("❌ Échec de la sauvegarde !");
		}
	};

	// const QuestList = () => {
	// 	const [quests, setQuests] = useState<any[]>([])};

	// console.log("(file test - const ParentView) loadData: pas lues ", data);
		const ParentFunctions = {loadData, testLoadQuest, updateXP, calculLevel, testLoadQuests: testLoadQuest }; //, calculLevel, updateXP };
		if (type === "main") {
			return <MainView isOpen={true} userData={data} parentFunctions={ParentFunctions} />;
		}
		if (type === "side") {
			return <SideViewTest app={App} isOpen={true} userData={data} quests={quest} parentFunctions={ParentFunctions} />;
		}

		return (
			<QuestList />
		);
	};




export const TestParentView: React.FC<{ type: string }> = ({ type }) => {
	const [sharedState, setSharedState] = useState({ xp: 0, level: 1 });

	// Fonction pour mettre à jour l'état partagé
	const updateSharedState = (newXP: number) => {
		const newLevel = Math.floor(newXP / 100) + 1; // Calcul du niveau basé sur XP
		setSharedState({ xp: newXP, level: newLevel });
	};

	if (type === "testSide") {
		return (
			<div>
				<h1>Test Parent side View</h1>
				<TestSideView
					sharedState={sharedState}
					updateSharedState={(newState) => updateSharedState(newState.xp)}
					onClose={() => console.log("Sidebar closed")}
				/>

			</div>
		);
	} if (type === "testMain") {
		return (
			<div>
				<h1>Test Parent main View</h1>

				<TestMainView
					sharedState={sharedState}
					updateSharedState={(newState) => updateSharedState(newState.xp)}
				/>
			</div>
		);
	}

	return <div>Invalid type</div>;
};




export const QuestList = () => {
    const [quests, setQuests] = useState<any[]>([]);

    useEffect(() => {
        getAvailableQuests().then(setQuests);
    }, []);

    return (
        <div>
            <h2>Quêtes</h2>
            <ul>
				{quests.map((quest, index) => (
					<li
						key={quest.id || index}
						onClick={async () => {
							if (!quest.completed) {
								await completeQuest(quest.id);
								setQuests(prevQuests =>
									prevQuests.map(q =>
										q.id === quest.id ? { ...q, completed: true } : q
									)
								);
								console.log("Quest completed! : ", quest);
							}
						}}
						style={{ cursor: "pointer" }}
					>
						{quest.title} {quest.completed ? "✅" : "🔲"}
					</li>
				))}
            </ul>
        </div>
    );
};


async function getAvailableQuests(): Promise<any[]> {
    const quests = await loadQuestsFromVault();
    const userData = await loadUserDataFromVault();

    return quests.map(quest => ({
        ...quest,
		completed: Array.isArray(userData.completedQuests) && userData.completedQuests.includes(quest.id)
    }));
}

async function completeQuest(questId: string) {
    const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/user.json`;
    let userData = await loadUserDataFromVault();

	if (!Array.isArray(userData.completedQuests)) {
		userData.completedQuests = [];
	}
	if (!userData.completedQuests.includes(questId)) {
		userData.completedQuests.push(questId);
        userData.xp += 10; // Exemple : ajouter de l'XP
        await this.app.vault.adapter.write(filePath, JSON.stringify(userData, null, 2));
    }
}

async function loadUserDataFromVault(): Promise<any> {
	const fileP = `${this.app.vault.configDir}/plugins/game-of-life/data/user.json`;
	const content = await this.app.vault.adapter.read(fileP);
    return JSON.parse(content);
}

async function loadQuestsFromVault(): Promise<any[]> {
	const fileQuest = `${this.app.vault.configDir}/plugins/game-of-life/data/quests.json`;
    const content = await this.app.vault.adapter.read(fileQuest);
    return JSON.parse(content);
}
