import React, { useState, useEffect, useMemo, use } from "react";
import { Notice } from "obsidian";
// from files (services, default):
import { useAppContext } from "../../context/appContext";
import { AttributeBlock, DEFAULT_ATTRIBUTES, Quest, UserSettings } from "../../data/DEFAULT";
// from file (UI):
import { QuestSideView } from "./questSideView";
// import { ModifyQuestModal } from "modal/questModal";
import { GenericForm } from "../forms/genericForm";
import { on } from "events";

interface QuestListProps {
	quests: Quest[];
	user: UserSettings;
	onQuestUpdate?: (updatedQuests: Quest[]) => void;
	onUserUpdate?: (updatedUser: UserSettings) => void;
}

export const QuestList: React.FC<QuestListProps> = ({ quests, user, onQuestUpdate, onUserUpdate }) => {
	/* Side view to display and manage quests */
	const appService = useAppContext();

	const [questState, setQuestState] = useState<Quest[]>(quests);

	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const [activeTab, setActiveTab] = useState<"active" | "completed" | "all" | "upcoming">("active");
	const [sortBy, setSortBy] = useState<"priority" | "xp" | "difficulty" | "date">("priority");

	useEffect(() => {
		const refreshAllQuests = async () => {
			/* Refresh all quests to update their statuses if needed */
			const refreshedQuests = await Promise.all(questState.map(quest => appService.questService.refreshQuests(quest)));
			setQuestState(refreshedQuests);
			await appService.dataService.saveAllQuests(refreshedQuests);
		};
		refreshAllQuests();
	}, []);

	useEffect(() => {
		const savedOpen = localStorage.getItem("questListOpen");
		const savedFilter = localStorage.getItem("questListFilter");
		const savedTab = localStorage.getItem("questListActiveTab");
		const savedSort = localStorage.getItem("questListSortBy");
		if (savedOpen) setIsOpen(savedOpen === "true");
		if (savedFilter) setFilter(savedFilter);
		if (savedTab === "active" || savedTab === "completed" || savedTab === "all") {
			setActiveTab(savedTab);
		}
		if (savedSort === "priority" || savedSort === "xp" || savedSort === "difficulty" || savedSort === "date") {
			setSortBy(savedSort);
		}
	}, []);

	useEffect(() => {
		setQuestState(quests); // sync when prop changes
	}, [quests]);

	const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => {
		const details = e.currentTarget;
		setIsOpen(details.open);
		localStorage.setItem("questListOpen", details.open ? "true" : "false");
	};

	const handleSetFilter = (value: string) => {
		setFilter(value);
		localStorage.setItem("questListFilter", value);
	};

	const handleSetActiveTab = (tab: "active" | "completed" | "all") => {
		setActiveTab(tab);
		localStorage.setItem("questListActiveTab", tab);
	};

	const handleSetSortBy = (sort: "priority" | "xp" | "difficulty" | "date") => {
		setSortBy(sort);
		localStorage.setItem("questListSortBy", sort);
	};


	const handleGetDaysUntil = (targetDate: Date): string => {
		return appService.xpService.getDaysUntil(new Date(), targetDate, 'quest');
	}

	const handleCompleteQuest = async (quest: Quest, completed: boolean) => {
		// Update Quest as completed or not, update user XP and attributes.
		try {
			const updatedQuest = await appService.questService.questCompletion(quest, completed);
			await appService.questService.saveQuest(updatedQuest);
			const updatedQuests = questState.map(q => q.id === updatedQuest.id ? updatedQuest : q);
			setQuestState(updatedQuests);
			const user = await appService.xpService.updateXPFromAttributes(quest.reward.attributes || {}, completed);
			await appService.dataService.saveUser(user);
			if (onUserUpdate) onUserUpdate(user);
			if (onQuestUpdate) onQuestUpdate(updatedQuests);
			if (completed) new Notice(`Quest "${quest.title}" completed!`);
		} catch (error) {
			console.error("Error completing quest:", error);
			new Notice("An error occurred while updating the quest. Please try again.");
		}
	};

	const handleModify = (quest: Quest) => {
		new GenericForm(appService.getApp(), 'quest-modify', quest).open();
	};

	const filteredQuests = useMemo(() => {
		return questState
			.filter((quest) => {
				const matchesSearch =
					!filter ||
					quest.title.toLowerCase().includes(filter.toLowerCase()) ||
					quest.description.toLowerCase().includes(filter.toLowerCase());
				const matchesTab =
					activeTab === "all" && validateRequirements(quest, user) ||
					(activeTab === "active" && !quest.progression.isCompleted) ||
					(activeTab === "completed" && quest.progression.isCompleted) ||
					(activeTab === "upcoming" && !quest.progression.isCompleted && !validateRequirements(quest, user));

				return matchesSearch && matchesTab;
			})
			.sort((a, b) => {
				switch (sortBy) {
					case "priority":
						const priorityOrder = { high: 0, medium: 1, low: 2 };
						return priorityOrder[a.settings.priority || "low"] - priorityOrder[b.settings.priority || "low"];
					case "xp":
						return b.reward.XP - a.reward.XP;
					case "difficulty":
						const difficultyOrder = { easy: 0, medium: 1, hard: 2, expert: 3 };
						return difficultyOrder[a.settings.difficulty || "easy"] - difficultyOrder[b.settings.difficulty || "easy"];
					case "date":
						return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
					default:
						return 0;
				}
			});
	}, [questState, filter, activeTab, sortBy]);

	if (!questState.length) return <div>No quests available</div>;

	return (
		<QuestSideView
			filteredQuests={filteredQuests}
			isOpen={isOpen}
			filter={filter}
			activeTab={activeTab}
			sortBy={sortBy}
			handleToggle={handleToggle}
			handleCompleteQuest={handleCompleteQuest}
			setFilter={handleSetFilter}
			setActiveTab={handleSetActiveTab}
			setSortBy={handleSetSortBy}
			handleModifyQuest={handleModify}
			getDaysUntil={handleGetDaysUntil}
		/>
	);
};


const validateRequirements = (quest: Quest, user: UserSettings) => {
	// Check if user meets the level requirement for the quest
	const userLevel = user.xpDetails.level ?? 1;
	const userAttributes = user.attribute ?? DEFAULT_ATTRIBUTES;
	const questLevel = quest.requirements.level || 1;
	const questAttributes = quest.requirements.attributes || {};
	// If no requirements, always valid
	if (questLevel <= 1 && Object.keys(questAttributes).length === 0) return true;
	// Check level requirement
	if (questLevel > userLevel) return false;

	// Check if user meets the attribute requirements for the quest
	for (const [attr, reqValue] of Object.entries(questAttributes)) {
		const userValue = userAttributes[attr as keyof typeof userAttributes] ?? 0;
		if (userValue < (reqValue ?? 0)) return false;
	}

	if (quest.requirements.previousQuests && quest.requirements.previousQuests.length > 0) {
		// Check if all previous quests are completed
		const userQuests = Array.isArray(user.quests) ? user.quests : [];
		const allCompleted = quest.requirements.previousQuests.every(prevQuestId => {
			const prevQuest = userQuests.find(q => q.id === prevQuestId);
			return prevQuest?.progression.isCompleted;
		});
		if (!allCompleted) return false;
	}
	// console.log("Quest requirements met for quest:", quest.title);
	return true;
};
