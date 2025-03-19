import React, { useEffect, useState } from "react";
import { Notice, Modal, App } from "obsidian";



interface SidebarProps {
	app: any;
}

const Sidebar: React.FC<SidebarProps> = ({ app }) => {

	const filePath = `${app.vault.configDir}/plugins/game-of-life/data/user.json`;
	const [user, setUser] = useState<any>(null);
	const [xp, setXp] = useState(0);
	const [level, setLevel] = useState(1);
	const [lvlThreshold, setlvlThreshold] = useState(100);
	const [newXp, setNewXp] = useState(0);

	const loadUserData = async () => {
		try {
			if (!(await app.vault.adapter.exists(filePath))) {
				console.warn(`⚠️ File ${filePath} unknown. Creating DEFAULT USER.`);
				const defaultUser = { user1: { persona: { xp: 0, level: 1 } } };
				await app.vault.adapter.write(filePath, JSON.stringify(defaultUser, null, 2));
				setUser(defaultUser);
				setXp(0);
				setLevel(1);
				setlvlThreshold(100);
				return;
			}

			const data = await app.vault.adapter.read(filePath);
			const parsedData = JSON.parse(data);
			setUser(parsedData);
			const xp = parsedData.user1.persona.xp;
			const level = parsedData.user1.persona.level;
			const lvlThreshold = parsedData.user1.persona.lvlThreshold;
			const newXp = parsedData.user1.persona.newXp;
			const quests = parsedData.user1.quests;
			console.log("on load data : ", quests);
			// console.log(`XP: ${xp}, level: ${level}`);
			setXp(xp);
			setLevel(level);
			setlvlThreshold(lvlThreshold);
		} catch (error) {
			console.error("Error when loading data:", error);
		}
	};

	const calcul_Level = (xp: number, level: number): { level: number, newXp: number, lvlSeuil: number } => {
		// console.log(`Calculating level for XP: ${xp}, Level: ${level}`);
		let lvl = 1;
		let seuil = 100;

		while (xp >= seuil) {
			if (lvl === level) {
				new Notice("Level up!");
			}
			// 	console.log(`Level up! XP: ${xp}, Level: ${lvl}, Threshold: ${seuil}`);
			// 	new levelModal(app).open();
			// 	return { level: lvl, xp: xp, lvlSeuil: seuil };
			// } else {
			// 	xp -= seuil;
			// 	lvl++;
			// 	seuil = Math.trunc(seuil * 1.2);
			// 	return { level: lvl, xp: xp, lvlSeuil: seuil };
			// }
			xp -= seuil;
			seuil = Math.trunc(seuil * 1.2);
			lvl++;
			// console.log(`Level up! XP: ${xp}, Level: ${lvl}, Threshold: ${seuil}`);
		}
		return { level: lvl, newXp: xp, lvlSeuil: seuil };

	};


	useEffect(() => {
		loadUserData();
	}, [app]);

	const updateXP = async (amount: number) => {
		if (!user) return;

		let updatedXP = Math.max(xp + amount, 0);
		let calcul = calcul_Level(updatedXP, level);
		let updatedLevel = calcul.level;
		let updatedlvlThreshold = calcul.lvlSeuil;
		let newXp = calcul.newXp;

		setXp(updatedXP);
		setLevel(updatedLevel);
		setlvlThreshold(updatedlvlThreshold);
		setNewXp(newXp);

		// console.log(`call updatedXP : XP: ${updatedXP}, Level: ${updatedLevel}, newThreshold: ${updatedlvlThreshold}, newXp: ${newXp}`);
		const updatedUser = {
			...user,
			user1: { ...user.user1, persona: { ...user.user1.persona, xp: updatedXP, level: updatedLevel, newXp: newXp, lvlThreshold: updatedlvlThreshold } },
		};
		// console.log("updatedUser", updatedUser);
		setUser(updatedUser);
		console.log(`width = ${(newXp / lvlThreshold) * 100}%`);

		try {
			await app.vault.adapter.write(filePath, JSON.stringify(updatedUser, null, 2));
			console.log("Données sauvegardées !");
		} catch (error) {
			console.error("Erreur lors de la sauvegarde :", error);
			new Notice("❌ Échec de la sauvegarde !");
		}
	};

	if (!user) return <p>Chargement...</p>;
	
	const newLocal = `${(user?.user1.persona.newXp / user?.user1.persona.lvlThreshold) * 100}`;
	// console.log(`newLocal = ${newLocal}`);
// <div className="progress-bar">
// <div className="bg-blue-500 h-4 transition-all duration-300" style={{ width: `${(newXp / lvlThreshold) * 100}%` }}>|</div>
// 				</div>



	return (
		<div className="sidebar">
			{/* Xp and level */}
			<div className="card">
				<h2 className="card-title">Level {user?.user1.persona.level}</h2>
				<progress className="progress-bar" value={newLocal} max="100" style={{  }}>newlocal</progress>
				<p className="xp-text">{user?.user1.persona.newXp}/{user?.user1.persona.lvlThreshold}</p>
				<div>
					<p className="card-subtitle">Name : {user?.user1.persona.name}</p>
					<p className="card-subtitle">Class : {user?.user1.persona.class}</p>
					<p className="card-subtitle">Current XP : {xp}</p>
				</div>
			</div>

			{/* Quests */}
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

			{/* Skills ?  */} // todo
			{/* Badges ? */} // todo

			{/* dev part !! */}
			<div className="card">
				<button onClick={() => updateXP(10)}>Augmenter XP</button>
				<button onClick={() => updateXP(-10)} disabled={xp <= 0}>Diminuer XP</button>
			</div>

			{/* pistes de recherche */}
			{/* <div><ul>
				{user.user1.quests.map((user.user1.quests) => (
				<li key={item.id}>{item.name}</li>
				))}
			</ul>
			</div> */}
		</div>
	);
};

export default Sidebar;


// ---------------------------------------------
interface ProgressBarProps {
	testXp: number;
	testlvlThreshold: number;
  }

const ProgressBar: React.FC<ProgressBarProps> = ({ testXp, testlvlThreshold }) => {
	if (testXp <= 0) return null; // Cache la barre si newXp = 0
  
	const progress = Math.min((testXp / testlvlThreshold) * 100, 100); // Limite à 100%
  
	return (
	  <div className="progress-bar" style={{ width: "100%" }}>
		<div
		  className="progress"
		  style={{ width: `${progress}%` }}
		/>
	  </div>
	);
  };




// ---------------------------------------------
class levelModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Tutorial' });
		contentEl.createEl('p', { text: 'The tutorial is not available for the moment, but you can find some information about the game in the settings.'});
		// contentEl.createEl('p', { text: 'This is the tutorial of the game of life plugin. You will find here some information about the game and how to use it.'});
		// contentEl.createEl('p', { text: 'If you want to have more information, you can go to the documentation on github.'});
		// contentEl.createEl('p', { text: 'You can also find some tips and tricks to level up faster and some warnings about the game.'});
		// contentEl.createEl('p', { text: 'If you have any question, you can ask on the forum or on the github page.'});
	}

	onClose() {
		this.contentEl.empty();
	}
};
