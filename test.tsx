import { PluginSettingTab, Plugin, App, Setting, Modal } from 'obsidian';
import React, { useState, useEffect } from "react";
// from other files :
import userData from "data/user.json";
import  game_of_life from "main";

const Sidebar = () => {
	// get user data from JSON file :

	const [user, setUser] = useState(userData);
	useEffect(() => {
		console.log(user.user1.persona.name);  // Affiche "John Doe" dans la console
	}, [user]);

	const [xp, setXp] = useState(user.user1.persona.xp);

	useEffect(() => {
		const updatedUser = { ...user, user1: { ...user.user1, persona: { ...user.user1.persona, xp } } };
		setUser(updatedUser);
		// Here you would typically make an API call to update the JSON file on the server
		// For example:
		// fetch('/path/to/api', {
		//   method: 'POST',
		//   headers: {
		//     'Content-Type': 'application/json',
		//   },
		//   body: JSON.stringify(updatedUser),
		// });
	}, [xp]);
	const level = Math.floor(xp / 100);
	const quests = [
		{ id: 1, title: "Apprendre une nouvelle chanson au piano", status: "En cours" },
		{ id: 2, title: "Faire 30 min de sport", status: "Terminée" },
	];
	const stats = { force: 10, intelligence: 15, discipline: 12 };
	console.log("user", xp);
	const handleXpChange = (newXp: number) => {
		setXp(newXp);
	};

	return (
		<div className="sidebar">
			{/* XP & Niveau */}
			<div className="card">
				<h2 className="card-title">Niveau {level}</h2>
				<div className="progress-bar">
					<div className="progress" style={{ width: `${(xp % 100)}%` }}></div>
				</div>
				<p className="xp-text">{xp % 100}/100 XP</p>
			</div>

			{/* Quêtes */}
			<div className="accordion">
				<h3 className="accordion-title">Quêtes</h3>
				{quests.map((quest) => (
				<div key={quest.id} className="quest-item">
					<p className="quest-title">{quest.title}</p>
					<p className="quest-status">{quest.status}</p>
				</div>
				))}
			</div>

			{/* Statistiques */}
			<div className="card">
				<h2 className="card-title">Statistiques</h2>
				{Object.entries(stats).map(([key, value]) => (
				<div key={key} className="stat-item">
					<span className="stat-name">{key}</span>
					<span className="stat-value">{value}</span>
				</div>
				))}
			</div>
			<div>
			<h1>Profil Utilisateur</h1>
			<p>Nom: {user.user1.persona.name}</p>
			<p>classe: {user.user1.persona.class}</p>
			<p>xp: {xp}</p>

			</div>
			<button onClick={() => handleXpChange(xp + 10)}>Augmenter XP</button>
			<button onClick={() => saveSettings()}>save settings</button>
		</div>
	);
};

export default Sidebar;
