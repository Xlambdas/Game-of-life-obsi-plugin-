import { useState, useEffect } from 'react';
import { Notice } from 'obsidian';
import { useAppContext } from '../context/appContext';
import { Quest } from '../constants/DEFAULT';
import { ModifyQuestModal } from '../modales/questModal';

const QuestItem = ({
    quest,
    onComplete,
    onModify,
}: {
    quest: Quest;
    onComplete: (quest: Quest, completed: boolean) => void,
    onModify: (quest: Quest) => void
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
                </div>
                <button
                    className="quest-edit-button"
                    onClick={() => onModify(quest)}
                    aria-label="Edit quest"
                >
                    ✏️
                </button>
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

export const QuestList = () => {
    const { plugin, updateXP } = useAppContext();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');

    useEffect(() => {
        const loadQuests = async () => {
            if (!plugin || !plugin.questService) {
                console.warn("Quest management service not initialized");
                return;
            }
            
        };
        
        if (plugin) {
            loadQuests();
        }
    }, [plugin]);

    const handleCompleteQuest = async (quest: Quest, completed: boolean) => {
        try {
            if (!plugin || !plugin.questService) {
                console.error("Quest management service not available");
                return;
            }
            
            await plugin.questService.setQuestCompleted(
                quest.id,
                completed,
                async (xpDelta: number) => {
                    await updateXP(xpDelta);
                }
            );
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
            if (a.progression.isCompleted !== b.progression.isCompleted) {
                return a.progression.isCompleted ? 1 : -1;
            }
            return b.reward.XP - a.reward.XP;
        });

    if (quests.length === 0) {
        return <div className="empty-quests">Loading quests...</div>;
    }

    return (
        <details 
            className="quest-list" 
            open={isOpen} 
            onToggle={(e) => setIsOpen(e.currentTarget.open)}
        >
            <summary className="accordion-title">Quests</summary>
            
            <div className="quest-controls">
                <input
                    type="text"
                    placeholder="Search quests..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="quest-search"
                />
                
                <div className="quest-tabs">
                    <button 
                        className={`quest-tab ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active
                    </button>
                    <button 
                        className={`quest-tab ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed
                    </button>
                    <button 
                        className={`quest-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All
                    </button>
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

export const QuestRecentCompletion = () => {
    const { plugin } = useAppContext();
    const [recentQuests, setRecentQuests] = useState<Quest[]>([]);

    useEffect(() => {
        const loadRecentQuests = async () => {
            if (!plugin || !plugin.questService) return;
            
            const allQuests = plugin.questService.getAllQuests();
            const completed = allQuests.filter(q => q.progression.isCompleted);
            // Sort by most recently completed if we had that data
            // For now just take the last few
            setRecentQuests(completed.slice(-3));
        };
        
        if (plugin) {
            loadRecentQuests();
        }
    }, [plugin]);

    if (recentQuests.length === 0) {
        return null;
    }

    return (
        <div className="recent-completions">
            <h4>Recent Completions</h4>
            <div className="recent-quests">
                {recentQuests.map(quest => (
                    <div key={quest.id} className="recent-quest">
                        <span className="quest-title">{quest.title}</span>
                        <span className="quest-reward">+{quest.reward.XP} XP</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
