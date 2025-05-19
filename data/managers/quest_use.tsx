import { useState, useEffect } from 'react';
import { pathUserDB } from '../../constants/paths';
import { useAppContext } from '../../context/appContext';
import { Notice } from 'obsidian';
import { get } from 'http';
import { DEFAULT_SETTINGS, Quest } from '../../constants/DEFAULT';
import { ModifyQuestModal } from '../../modales/questModal';

const QuestItem = ({
	quest,
	onComplete,
	onModify,
}: {
	quest: Quest;
	onComplete: (quest: Quest, completed: boolean) => void;
	onModify: (quest: Quest) => void;
}) => {
	return (
        <div className="quest-item">
            <div className="quest-header">
                <div className="quest-checkbox-section">
                    <input
                        type="checkbox"
                        checked={quest.progression.isCompleted}
                        onChange={() => onComplete(quest, !quest.progression.isCompleted)}
                        className="quest-checkbox"
                    />
                    <span className={`quest-title ${quest.progression.isCompleted ? 'completed' : ''}`}>
                        {quest.title}
                    </span>
                    <button
                        className="quest-edit-button"
                        onClick={() => onModify(quest)}
                        aria-label="Edit quest"
                    >
                        Edit
                    </button>
                </div>
            </div>
            {quest.description && (
                <div className="quest-description">
                    {quest.description}
                </div>
            )}
            <div className="quest-xp">
                XP: {quest.reward.XP}
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
	const { plugin, updateXP } = useAppContext();
	const [quests, setQuests] = useState<Quest[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
    const [sortBy, setSortBy] = useState<'priority' | 'xp' | 'difficulty' | 'date'>('priority');


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
                    q.id === quest.id ? { ...q, progression: { ...q.progression, isCompleted: !q.progression.isCompleted } } : q
                )
            );
            
            // Vérifier directement l'état actuel de la quête
            const isCurrentlyCompletedInUI = quest.progression.isCompleted;
            console.log(`Quest ${quest.id} UI state - Completed: ${isCurrentlyCompletedInUI}`);

            if (isCurrentlyCompletedInUI) {
                // Marquer comme non complétée et enlever XP :
                console.log(`Unmarking quest ${quest.id} as completed and removing ${quest.reward.XP} XP`);
                userData.user1.persona.xp -= quest.reward.XP;
                userData.user1.completedQuests = userData.user1.completedQuests.filter((id: string) => id !== quest.id);
                
                // Mettre à jour le statut dans le fichier des quêtes
                const updatedQuests = quests.map(q => 
                    q.id === quest.id ? { ...q, progression: { ...q.progression, isCompleted: false } } : q
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
                        q.id === quest.id ? { ...q, progression: { ...q.progression, isCompleted: true } } : q
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

	const handleModifyQuest = (quest: Quest) => {
        console.log("Modify quest clicked:", quest); // Debug log
        if (plugin) {
            try {
                const modal = new ModifyQuestModal(plugin.app, plugin);
                modal.quest = quest;
                modal.open();
            } catch (error) {
                console.error("Error opening modify modal:", error);
                new Notice("Failed to open quest editor");
            }
        }
    };

    // Filter and sort quests
    const filteredQuests = quests
        .filter(quest => {
            const matchesSearch = !filter || 
                quest.title.toLowerCase().includes(filter.toLowerCase()) ||
                quest.description.toLowerCase().includes(filter.toLowerCase()) ||
                (quest.settings.category && quest.settings.category.toLowerCase().includes(filter.toLowerCase()));
            
            const matchesTab = activeTab === 'all' || 
                (activeTab === 'active' && !quest.progression.isCompleted) ||
                (activeTab === 'completed' && quest.progression.isCompleted);
                
            return matchesSearch && matchesTab;
        })
        .sort((a, b) => {
            // First sort by completion status
            if (a.progression.isCompleted !== b.progression.isCompleted) {
                return a.progression.isCompleted ? 1 : -1;
            }

            // Then sort by selected criteria
            switch (sortBy) {
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.settings.priority || 'low'] - priorityOrder[b.settings.priority || 'low'];
                case 'xp':
                    return b.reward.XP - a.reward.XP;
                case 'difficulty':
                    const difficultyOrder = { easy: 0, medium: 1, hard: 2, expert: 3 };
                    return difficultyOrder[a.settings.difficulty || 'easy'] - difficultyOrder[b.settings.difficulty || 'easy'];
                case 'date':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                default:
                    return 0;
            }
        });

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
            <div className="quest-controls">
                <input
                    type="text"
                    placeholder="Search quests..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="quest-search"
                />
                
                <div className="quest-controls-row">
                    <div className="quest-filter-dropdown">
                        <button className="quest-filter-button">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </button>
                        <div className="quest-filter-options">
                            <button 
                                className={`quest-filter-option ${activeTab === 'active' ? 'active' : ''}`}
                                onClick={() => setActiveTab('active')}
                            >
                                Active
                            </button>
                            <button 
                                className={`quest-filter-option ${activeTab === 'completed' ? 'active' : ''}`}
                                onClick={() => setActiveTab('completed')}
                            >
                                Completed
                            </button>
                            <button 
                                className={`quest-filter-option ${activeTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveTab('all')}
                            >
                                All
                            </button>
                        </div>
                    </div>

                    <div className="quest-sort-dropdown">
                        <button className="quest-sort-button">
                            Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                        </button>
                        <div className="quest-sort-options">
                            <button 
                                className={`quest-sort-option ${sortBy === 'priority' ? 'active' : ''}`}
                                onClick={() => setSortBy('priority')}
                            >
                                Priority
                            </button>
                            <button 
                                className={`quest-sort-option ${sortBy === 'xp' ? 'active' : ''}`}
                                onClick={() => setSortBy('xp')}
                            >
                                XP Reward
                            </button>
                            <button 
                                className={`quest-sort-option ${sortBy === 'difficulty' ? 'active' : ''}`}
                                onClick={() => setSortBy('difficulty')}
                            >
                                Difficulty
                            </button>
                            <button 
                                className={`quest-sort-option ${sortBy === 'date' ? 'active' : ''}`}
                                onClick={() => setSortBy('date')}
                            >
                                Date
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {filteredQuests.length === 0 ? (
                <div className="no-quests-message">
                    {filter ? "No quests match your search" : "No quests available"}
                </div>
            ) : (
                <div className="quests-container">
                    {filteredQuests.map((quest) => (
                        <QuestItem
                            key={quest.id}
                            quest={quest}
                            onComplete={handleCompleteQuest}
                            onModify={handleModifyQuest}
                        />
                    ))}
                </div>
            )}
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




