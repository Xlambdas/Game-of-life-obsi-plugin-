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

import React, { useEffect, useState } from "react";
import { Notice, Modal, App } from "obsidian";
import {ModalTest, SideView} from "view/sideView";
import {MainView} from "view/mainView";
import { DEFAULT_SETTINGS } from "settings";
import { TestMainView } from "view/testmainView";
import { TestSideView } from "view/sidebar";

export const ParentA = () => {
  const [count, setCount] = useState(0);

  const sayHello = () => {
    alert("Hello depuis le Parent !");
  };

  const increment = () => {
    setCount((prev) => prev + 1);
  };

  const reset = () => {
    setCount(0);
  };

  const parentFunctions = { sayHello, increment, reset };

  return (
    <div>
      <h2>Parent</h2>
      <p>Compteur : {count}</p>
      <button onClick={sayHello}>Dire Bonjour</button>
      <button onClick={increment}>Incrémenter</button>
      <button onClick={reset}>Réinitialiser</button>

      {/* Passer toutes les fonctions au composant enfant */}
      <ModalTest onClose={() => {}} parentFunctions={parentFunctions} />
    </div>
  );
};

export const ParentView = ({ app, type }: { app: App; type: string }) => {
	console.log("file - parentView")
	// const [user, setUser] = useState<any>(null);
	const [data, setData] = useState(DEFAULT_SETTINGS);
	const [xp, setXp] = useState(0);
	const [level, setLevel] = useState(1);
	const [lvlThreshold, setlvlThreshold] = useState(100);
	const [newXp, setNewXp] = useState(0);
	
	
	const filePath = `${app.vault.configDir}/plugins/game-of-life/data/user.json`;

	useEffect(() => {
		console.log("(file parentView - const ParentView) useEffect, avant de load les data :", data);
		loadData();
	}, [app]);

	const loadData = async () => {
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
	};

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

	const getChange = (parsed: string) => {
		if (parsed == JSON.stringify(data)) {
			console.log("change as : ", parsed, data);
			console.log("change : ", true);
			return false;
		}
		console.log("change : ", false);
		return true;
	}


	// console.log("(file test - const ParentView) loadData: pas lues ", data);
	const ParentFunctions = { loadData, updateXP, calculLevel, getChange }; //, calculLevel, updateXP };
	if (type === "main") {
		return <MainView userData={data} parentFunctions={ParentFunctions} />;
	}
	if (type === "side") {
		return <SideView userData={data} parentFunctions={ParentFunctions} />;
	}

	return <div> test </div>;

}



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
