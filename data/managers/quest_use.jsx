import React, { useState, useEffect } from 'react';

// Créez un service pour les opérations liées aux quêtes
class QuestService {
	constructor(app) {
		if (!app || !app.vault || !app.vault.adapter || !app.vault.configDir) {
			throw new Error("App mal initialisé ou invalide");
		}
		this.app = app;
	}

	async getAvailableQuests() {
		const quests = await this.loadQuestsFromVault();
		const userData = await this.loadUserDataFromVault();

		return quests.map(quest => ({
		...quest,
		completed: Array.isArray(userData.completedQuests) && userData.completedQuests.includes(quest.id)
		}));
	}

	async completeQuest(questId) {
		const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/user.json`;
		let userData = await this.loadUserDataFromVault();

		if (!Array.isArray(userData.completedQuests)) {
		userData.completedQuests = [];
		}
		if (!userData.completedQuests.includes(questId)) {
		userData.completedQuests.push(questId);
		userData.xp += 10; // Exemple : ajouter de l'XP
		await this.app.vault.adapter.write(filePath, JSON.stringify(userData, null, 2));
		}
	}

	async loadUserDataFromVault() {
		const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/user.json`;
		const content = await this.app.vault.adapter.read(filePath);
		return JSON.parse(content);
	}

	async loadQuestsFromVault() {
		const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
		const content = await this.app.vault.adapter.read(filePath);
		return JSON.parse(content);
	}
	}

	// Composant QuestList qui utilise le service
export const QuestListTest = ({ app }) => {
	// console.log("QuestList received app:", app);

	const [quests, setQuests] = useState([]);
	const [questService, setQuestService] = useState(null);

	useEffect(() => {
		if (app?.vault?.adapter && app.vault.configDir) {
			setQuestService(new QuestService(app));
		} else {
			console.warn("App pas encore prêt :", app);
		}
	}, [app]);

	useEffect(() => {
		const loadQuests = async () => {
			if (!questService) return; // sécurité critique
			try {
				const availableQuests = await questService.getAvailableQuests();
				setQuests(availableQuests);
			} catch (err) {
				console.error("Erreur lors du chargement des quêtes :", err);
			}
		};
		loadQuests();
	}, [questService]);

	const handleQuestClick = async (quest) => {
		if (!quest.completed && questService) {
		await questService.completeQuest(quest.id);
		setQuests(prevQuests =>
			prevQuests.map(q =>
			q.id === quest.id ? { ...q, completed: true } : q
			)
		);
		console.log("Quest completed! : ", quest);
		}
	};

	return (
		<div>
			<h2>Quêtes</h2>
			<ul>
				{quests.map((quest) => (
					<li
						key={quest.id}
						onClick={() => handleQuestClick(quest)}
						style={{ cursor: "pointer" }}
					>
						{quest.title} {quest.completed ? "✅" : "🔲"}
					</li>
				))}
			</ul>
		</div>
	);
};




