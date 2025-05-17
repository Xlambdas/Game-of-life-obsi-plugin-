import { useState, useEffect } from 'react';
import { pathUserDB } from '../../constants/paths';
import { useAppContext } from '../../context/appContext';
import { Notice } from 'obsidian';
import { get } from 'http';
import { DEFAULT_SETTINGS, Quest } from '../../constants/DEFAULT';

const QuestItem = ({ quest, onComplete }: { quest: Quest; onComplete: (quest: Quest) => void }) => {
	return (
        <div className="quest-item">
            <label className="quest-label">
                <input
                    type="checkbox"
                    checked={quest.isCompleted}
                    onChange={() => onComplete(quest)}
                    className="quest-checkbox"
                />
                <span className={`quest-title ${quest.isCompleted ? 'completed' : ''}`}>
                    {quest.title}
                </span>
            </label>
            <div className="quest-details">
                <p className="quest-description">{quest.shortDescription}</p>
                <p className="quest-reward">XP: {quest.reward.XP}</p>
            </div>
        </div>
    );
};

export async function loadUserDataFromVault(): Promise<any> {
    try {
        // First try to read the file
        const content = await this.app.vault.adapter.read(pathUserDB);
        return JSON.parse(content);
    } catch (error) {
        // If file doesn't exist, create it with default structure
        try {
            // Ensure the directory exists
            const dirPath = pathUserDB.substring(0, pathUserDB.lastIndexOf('/'));
            await this.app.vault.adapter.mkdir(dirPath, { recursive: true });
            
            // Create the file with default data
            const defaultData = DEFAULT_SETTINGS;
            await this.app.vault.adapter.write(pathUserDB, JSON.stringify(defaultData, null, 2));
            return defaultData;
        } catch (createError) {
            console.error("Error creating user data file:", createError);
            throw createError;
        }
    }
}

export async function loadQuestsFromVault(): Promise<any[]> {
	const fileQuest = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
    const content = await this.app.vault.adapter.read(fileQuest);
    return JSON.parse(content);
}


export const QuestList = () => {
	// return a list of quests from the quests.json file, and display them in a list.
    // const [quests, setQuests] = useState<any[]>([]);
	const { plugin, updateXP } = useAppContext();
	const [quests, setQuests] = useState<Quest[]>([]);
	const [isOpen, setIsOpen] = useState(false);

	const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => {
        const details = e.currentTarget;
        setIsOpen(details.open);
        // Sauvegarder l'état dans localStorage
        localStorage.setItem('questListOpen', details.open ? 'true' : 'false');
    };

	useEffect(() => {
        // Charger l'état depuis localStorage au montage du composant
        const savedState = localStorage.getItem('questListOpen');
        if (savedState !== null) {
            setIsOpen(savedState === 'true');
        }
    }, []);

    useEffect(() => {
        const loadQuests = async () => {
            try {
                // Path to quests.json file
                const questsPath = `${plugin.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
                const userDataPath = `${plugin.app.vault.configDir}/plugins/game-of-life/data/db/user.json`;

                // Check if files exist
                const questsExists = await plugin.app.vault.adapter.exists(questsPath);
                const userDataExists = await plugin.app.vault.adapter.exists(userDataPath);

                if (!questsExists) {
                    console.warn("Quests file does not exist:", questsPath);
                    return;
                }

                // Read quests file
                const questsContent = await plugin.app.vault.adapter.read(questsPath);
                const questsData = JSON.parse(questsContent);

                // Read user data to get completed quests
                let completedQuests: string[] = [];
                if (userDataExists) {
                    const userContent = await plugin.app.vault.adapter.read(userDataPath);
                    const userData = JSON.parse(userContent);
					console.log("User data loaded:", userData);
                    completedQuests = userData.user1.completedQuests;
					console.log("Completed quests loaded:", completedQuests);
                }

                // Format quests with completion status
                const formattedQuests = Array.isArray(questsData)
                    ? questsData.map((quest: Quest) => ({
                        ...quest,
                        completed: completedQuests.includes(quest.id)
                    }))
                    : [];
				console.log("Loaded quests with completion status:", formattedQuests);

                setQuests(formattedQuests);
            } catch (error) {
                console.error("Error loading quests:", error);
            }
        };
        if (plugin && plugin.app) {
			loadQuests();
		}
    }, [plugin]);

	const handleCompleteQuest = async (quest: Quest) => {
		try {
            const quests = await loadQuestsFromVault();
			console.log("Quests loaded:", quests);
            const userData = await loadUserDataFromVault();
			console.log("User data loaded:", userData);
            // First update local state for immediate UI feedback
            setQuests(prevQuests =>
                prevQuests.map(q =>
                    q.id === quest.id ? { ...q, isCompleted: !q.isCompleted } : q
                )
            );
            
            // Vérifier directement l'état actuel de la quête
            const isCurrentlyCompletedInUI = quest.isCompleted;
            console.log(`Quest ${quest.id} UI state - Completed: ${isCurrentlyCompletedInUI}`);

            if (isCurrentlyCompletedInUI) {
                // Marquer comme non complétée et enlever XP :
                console.log(`Unmarking quest ${quest.id} as completed and removing ${quest.reward.XP} XP`);
                userData.user1.persona.xp -= quest.reward.XP;
                userData.user1.completedQuests = userData.user1.completedQuests.filter((id: string) => id !== quest.id);
                
                // Mettre à jour le statut dans le fichier des quêtes
                const updatedQuests = quests.map(q => 
                    q.id === quest.id ? { ...q, isCompleted: false } : q
                );
                await plugin.app.vault.adapter.write(
                    `${plugin.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`,
                    JSON.stringify(updatedQuests, null, 2)
                );
                
                await plugin.app.vault.adapter.write(pathUserDB, JSON.stringify(userData, null, 2));
                updateXP(-quest.reward.XP);
                new Notice(`Quest uncompleted. Removed ${quest.reward.XP} XP`);
            } else {
                // Si la quête n'est PAS complétée dans l'UI, alors l'utilisateur veut la cocher
                console.log(`Marking quest ${quest.id} as completed and adding ${quest.reward.XP} XP`);
                
                // Éviter les doublons
                if (!userData.user1.completedQuests.includes(quest.id)) {
                    userData.user1.completedQuests.push(quest.id);
                    userData.user1.persona.xp += quest.reward.XP;

                    // Mettre à jour le statut dans le fichier des quêtes
                    const updatedQuests = quests.map(q => 
                        q.id === quest.id ? { ...q, isCompleted: true } : q
                    );
                    await plugin.app.vault.adapter.write(
                        `${plugin.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`,
                        JSON.stringify(updatedQuests, null, 2)
                    );

                    await plugin.app.vault.adapter.write(pathUserDB, JSON.stringify(userData, null, 2));
                    updateXP(quest.reward.XP);
                    new Notice(`Quest completed! Earned ${quest.reward.XP} XP`);
                } else {
                    // La quête est déjà marquée comme complétée dans les données, mais pas dans l'UI
                    // Ce cas ne devrait normalement pas se produire avec le code ci-dessous
                    console.warn(`Quest ${quest.id} was already completed in data but not in UI`);
                }
            }
        } catch (error) {
            console.error("Error handling quest completion:", error);
            new Notice("Failed to update quest status");
        }
    };

    if (quests.length === 0) {
        return <div className="empty-quests">No quests available</div>;
    }

    return (
        <details 
            className="quest-list" 
            open={isOpen} 
            onToggle={handleToggle}
        >
            <summary className="accordion-title">Quest</summary>
            {quests.map((quest) => (
                <QuestItem
                    key={quest.id}
                    quest={quest}
                    onComplete={handleCompleteQuest}
                />
            ))}
        </details>
    );
};


async function getAvailableQuests(): Promise<Quest[]> {
    const quests = await loadQuestsFromVault();
    const userData = await loadUserDataFromVault();

	return Array.isArray(quests) ? quests.map(quest => ({
		...quest,
		isCompleted: Array.isArray(userData.completedQuests) && userData.completedQuests.includes(quest.id)
	})) : [];
}

async function completeQuest(questId: string) {
    const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/user.json`;
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


// export class QuestService {
// 	constructor() {
// 		const { quests } = useAppContext();
// 	}
// }



// Créez un service pour les opérations liées aux quêtes
// class QuestService {
// 	constructor(app) {
// 		if (!app || !app.vault || !app.vault.adapter || !app.vault.configDir) {
// 			throw new Error("App mal initialisé ou invalide");
// 		}
// 		this.app = app;
// 	}

// 	async getAvailableQuests() {
// 		const quests = await this.loadQuestsFromVault();
// 		const userData = await this.loadUserDataFromVault();

// 		return quests.map(quest => ({
// 		...quest,
// 		completed: Array.isArray(userData.completedQuests) && userData.completedQuests.includes(quest.id)
// 		}));
// 	}

// 	async completeQuest(questId) {
// 		const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/user.json`;
// 		let userData = await this.loadUserDataFromVault();

// 		if (!Array.isArray(userData.completedQuests)) {
// 		userData.completedQuests = [];
// 		}
// 		if (!userData.completedQuests.includes(questId)) {
// 		userData.completedQuests.push(questId);
// 		userData.xp += 10; // Exemple : ajouter de l'XP
// 		await this.app.vault.adapter.write(filePath, JSON.stringify(userData, null, 2));
// 		}
// 	}

// 	async loadUserDataFromVault() {
// 		const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/user.json`;
// 		const content = await this.app.vault.adapter.read(filePath);
// 		return JSON.parse(content);
// 	}

// 	async loadQuestsFromVault() {
// 		const filePath = `${this.app.vault.configDir}/plugins/game-of-life/data/db/quests.json`;
// 		const content = await this.app.vault.adapter.read(filePath);
// 		return JSON.parse(content);
// 	}
// 	}

// 	// Composant QuestList qui utilise le service
// export const QuestListTest = ({ app }) => {
// 	// console.log("QuestList received app:", app);

// 	const [quests, setQuests] = useState([]);
// 	const [questService, setQuestService] = useState(null);

// 	useEffect(() => {
// 		if (app?.vault?.adapter && app.vault.configDir) {
// 			setQuestService(new QuestService(app));
// 		} else {
// 			console.warn("App pas encore prêt :", app);
// 		}
// 	}, [app]);

// 	useEffect(() => {
// 		const loadQuests = async () => {
// 			if (!questService) return; // sécurité critique
// 			try {
// 				const availableQuests = await questService.getAvailableQuests();
// 				setQuests(availableQuests);
// 			} catch (err) {
// 				console.error("Erreur lors du chargement des quêtes :", err);
// 			}
// 		};
// 		loadQuests();
// 	}, [questService]);

// 	const handleQuestClick = async (quest) => {
// 		if (!quest.completed && questService) {
// 		await questService.completeQuest(quest.id);
// 		setQuests(prevQuests =>
// 			prevQuests.map(q =>
// 			q.id === quest.id ? { ...q, completed: true } : q
// 			)
// 		);
// 		console.log("Quest completed! : ", quest);
// 		}
// 	};

// 	return (
// 		<div>
// 			<h2>Quêtes</h2>
// 			<ul>
// 				{quests.map((quest) => (
// 					<li
// 						key={quest.id}
// 						onClick={() => handleQuestClick(quest)}
// 						style={{ cursor: "pointer" }}
// 					>
// 						{quest.title} {quest.completed ? "✅" : "🔲"}
// 					</li>
// 				))}
// 			</ul>
// 		</div>
// 	);
// };




