
import { useState, useEffect } from 'react';
import { pathUserDB } from '../constants/paths';
import { useAppContext } from '../context/appContext';
import { Notice } from 'obsidian';
import { get } from 'http';
import { DEFAULT_SETTINGS, Quest } from '../constants/DEFAULT';
import { ModifyQuestModal } from '../modales/questModal';
import { QuestSideView } from 'components/questUI';
import { appContextService } from 'context/appContextService';


export const QuestList = () => {
	// return a list of quests from the quests.json file, and display them in a list.
	const { plugin, updateXP } = useAppContext();
	const [quests, setQuests] = useState<Quest[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState('');
	const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
	const [sortBy, setSortBy] = useState<'priority' | 'xp' | 'difficulty' | 'date'>('priority');
	const [error, setError] = useState<string | null>(null);

	const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => {
		const details = e.currentTarget;
		setIsOpen(details.open);
		localStorage.setItem('questListOpen', details.open ? 'true' : 'false');
	};

	useEffect(() => {
		const savedState = localStorage.getItem('questListOpen');
		if (savedState !== null) {
			setIsOpen(savedState === 'true');
		}
	}, []);

	useEffect(() => {
		const loadQuests = async () => {
			try {
				if (!appContextService.dataService) {
					throw new Error("Data service is not available");
				}
				const questsData = await appContextService.dataService.loadQuestsFromFile();
				setQuests(questsData);
				setError(null);
			} catch (error) {
				console.error("Error loading quests:", error);
				setError("Failed to load quests");
			}
		};
		if (plugin && plugin.app) {
			loadQuests();
		}
	}, [plugin]);

	/* * Handle quest completion logic
	* This function handles marking a quest as completed or uncompleted
	* It updates the quest's progression, user data, and saves changes to the file.
	*/
	const handleCompleteQuest = async (quest: Quest, completed: boolean) => {
		try {
			if (!appContextService.dataService) {
				throw new Error("Data service is not available");
			}
			const quests = await appContextService.dataService.loadQuestsFromFile();
			const userData = await appContextService.dataService.loadUser();
			if (!userData || typeof userData !== 'object' || !('user1' in userData)) {
				throw new Error("User data is missing or malformed");
			}

			// First update local state for immediate UI feedback
			setQuests(prevQuests =>
				prevQuests.map(q =>
					q.id === quest.id ? { ...q, progression: { ...q.progression, isCompleted: !q.progression.isCompleted } } : q
				)
			);

			if (!completed) {
				// Unmark as completed
				if (userData.user1?.persona?.xp !== undefined) {
					userData.user1.persona.xp -= quest.reward.XP;
				}
				if (Array.isArray(userData.user1?.completedQuests)) {
					userData.user1.completedQuests = userData.user1.completedQuests.filter((id: string) => id !== quest.id);
				}
				
				const updatedQuests = quests.map(q => 
					q.id === quest.id ? { 
						...q, 
						progression: { 
							...q.progression, 
							isCompleted: false,
							progress: 0,
							completed_at: new Date(0)
						}
					} : q
				);

				await appContextService.dataService.saveQuestsToFile(updatedQuests);
				await appContextService.dataService.saveSettings();
				updateXP(-quest.reward.XP);
				new Notice(`Quest uncompleted. Removed ${quest.reward.XP} XP`);
			} else {
				// Mark as completed
				if (Array.isArray(userData.user1?.completedQuests) && !userData.user1.completedQuests.includes(quest.id)) {
					userData.user1.completedQuests.push(quest.id);
					if (userData.user1?.persona?.xp !== undefined) {
						userData.user1.persona.xp += quest.reward.XP;
					}

					const updatedQuests = quests.map(q =>
						q.id === quest.id ? {
							...q,
							progression: {
								...q.progression,
								isCompleted: true,
								progress: 100,
								completed_at: new Date()
							}
						} : q
					);
					await appContextService.dataService.saveQuestsToFile(updatedQuests);
					await appContextService.dataService.saveSettings();
					updateXP(quest.reward.XP);
					new Notice(`Quest completed! Earned ${quest.reward.XP} XP`);
				}
			}
			setError(null);
		} catch (error) {
			console.error("Error handling quest completion:", error);
			setError("Failed to update quest status");
			new Notice("Failed to update quest status");
			throw error;
		}
	};

	const handleModifyQuest = (quest: Quest) => {
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
			if (a.progression.isCompleted !== b.progression.isCompleted) {
				return a.progression.isCompleted ? 1 : -1;
			}

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

	if (error) {
		return <div className="quest-error">{error}</div>;
	}

	if (quests.length === 0) {
		return <div className="empty-quests">No quests available</div>;
	}

	return (
		<div>
			<QuestSideView
				// quests={quests}
				filteredQuests={filteredQuests}
				isOpen={isOpen}
				filter={filter}
				activeTab={activeTab}
				handleToggle={handleToggle}
				handleCompleteQuest={handleCompleteQuest}
				setFilter={setFilter}
				setActiveTab={setActiveTab}
				setSortBy={setSortBy}
				sortBy={sortBy}
				handleModifyQuest={handleModifyQuest}
			/>
		</div>
	);
};
