import React, { useEffect, useState } from "react";
import { Notice } from "obsidian";

interface SidebarProps {
	app: any;
}

const Sidebar: React.FC<SidebarProps> = ({ app }) => {
	const filePath = `${app.vault.configDir}/plugins/game-of-life/data/user.json`;
	const [user, setUser] = useState<any>(null);
	const [XP, setXp] = useState(0);
	const [level, setLevel] = useState(1);
	const [xpThreshold, setXpThreshold] = useState(100);
	const [XPEachLevel, setXPEachLevel] = useState(100);

	const calculateLevel = (xp: number): { level: number, xpThreshold: number } => {
		let lvl = 1;
		let threshold = 100;

		while (xp >= threshold) {
			xp -= threshold;
			lvl++;
			threshold = Math.floor(threshold * 1.2);
			console.log(`Level up! XP: ${xp}, Level: ${lvl}, Threshold: ${threshold}`);
		}
		return { level: lvl, xpThreshold: threshold };
	};

	const loadUserData = async () => {
		try {
			if (!(await app.vault.adapter.exists(filePath))) {
				console.warn(`⚠️ File ${filePath} unknown. Creating DEFAULT USER.`);
				const defaultUser = { user1: { persona: { xp: 0, level: 1 } } };
				await app.vault.adapter.write(filePath, JSON.stringify(defaultUser, null, 2));
				setUser(defaultUser);
				setXp(0);
				setLevel(1);
				setXpThreshold(100);
				setXPEachLevel(100);
				return;
			}

			const data = await app.vault.adapter.read(filePath);
			const parsedData = JSON.parse(data);
			setUser(parsedData);
			const { xp, level } = parsedData.user1.persona;
			const { xpThreshold } = calculateLevel(xp);
			setXp(xp);
			setLevel(level);
			setXpThreshold(xpThreshold);
			setXPEachLevel(xpThreshold - xpThreshold);
		} catch (error) {
			console.error("Error when loading data:", error);
		}
	};

	useEffect(() => {
		loadUserData();
	}, [app]);

	const updateXP = async (amount: number) => {
		if (!user) return;

		let updatedXP = Math.max(XP + amount, 0);
		const { level: newLevel, xpThreshold: newThreshold } = calculateLevel(updatedXP);

		setXp(updatedXP);
		setLevel(newLevel);
		setXpThreshold(newThreshold);
		setXPEachLevel(newThreshold - xpThreshold);
		console.log(`XP: ${updatedXP}, Level: ${newLevel}, Threshold: ${newThreshold}, newThreshold: ${newThreshold}`);
		const updatedUser = {
			...user,
			user1: { ...user.user1, persona: { ...user.user1.persona, xp: updatedXP, level: newLevel } },
		};
		setUser(updatedUser);

		try {
			await app.vault.adapter.write(filePath, JSON.stringify(updatedUser, null, 2));
			console.log("Données sauvegardées !");
		} catch (error) {
			console.error("Erreur lors de la sauvegarde :", error);
			new Notice("❌ Échec de la sauvegarde !");
		}
	};

	if (!user) return <p>Chargement...</p>;

	return (
		<div className="sidebar">
			<div className="card">
				<h2 className="card-title">Niveau {level}</h2>
				<div className="progress-bar">
					<div className="progress" style={{ width: `${(XPEachLevel / xpThreshold) * 100}%` }}></div>
				</div>
				<p className="xp-text">{XPEachLevel}/{xpThreshold}</p>
				<p>Nom : {user?.user1.persona.name}</p>
			</div>
			<h2>Panneau interactif</h2>
			<p>Ceci est une interface React dans Obsidian.</p>
			<p>XP : {XP}</p>
			<button onClick={() => updateXP(10)}>Augmenter XP</button>
			<button onClick={() => updateXP(-10)} disabled={XP <= 0}>Diminuer XP</button>
		</div>
	);
};

export default Sidebar;
