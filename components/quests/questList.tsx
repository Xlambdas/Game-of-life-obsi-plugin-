import React, { useState, useEffect, useMemo, use } from "react";
import { Notice } from "obsidian";
// from files (services, default):
import { useAppContext } from "../../context/appContext";
import { DEFAULT_DIFFICULTIES, Quest, UserSettings } from "../../data/DEFAULT";
// from file (UI):
import { QuestSideView } from "./questSideView";
// import { ModifyQuestModal } from "modal/questModal";
import { GenericForm } from "../forms/genericForm";
import { on } from "events";
import { DateString } from "helpers/dateHelpers";

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
		if (savedTab === "active" || savedTab === "completed" || savedTab === "all" || savedTab === "upcoming") {
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

	const handleSetActiveTab = (tab: "active" | "completed" | "all" | "upcoming") => {
		setActiveTab(tab);
		localStorage.setItem("questListActiveTab", tab);
	};

	const handleSetSortBy = (sort: "priority" | "xp" | "difficulty" | "date") => {
		setSortBy(sort);
		localStorage.setItem("questListSortBy", sort);
	};


	const handleGetDaysUntil = (startDate: DateString, targetDate: DateString): string => {
		return appService.xpService.getDaysUntil(startDate, targetDate, 'quest');
	}

	const handleCompleteQuest = async (quest: Quest, completed: boolean) => {
    try {
        const updatedQuest = await appService.questService.questCompletion(quest, completed);
        await appService.questService.saveQuest(updatedQuest);

        // Refresh ALL quests to update their statuses (requirements, etc.)
        let allQuests = await appService.dataService.loadAllQuests();
		allQuests = Object.values(allQuests).map(q =>
            q.id === updatedQuest.id ? updatedQuest : q
        );

		// If uncompleting, check for dependent quests
        if (!completed) {
			// Find all quests that depend on this quest
			allQuests = allQuests.map(q => {
				// Check if this quest has the uncompleted quest as a requirement
				const hasAsDependency =
					q.requirements.previousQuests?.some(q => q.id === quest.id) ||
					q.progression.subtasks?.conditionQuests?.some(cq => cq.id === quest.id);

				// If it does and it's currently completed, uncomplete it
				if (hasAsDependency && q.progression.isCompleted) {
					return {
						...q,
						progression: {
							...q.progression,
							isCompleted: false,
							completedAt: null,
							progress: 0,
							lastUpdated: new Date().toISOString(),
						}
					};
				}
				return q;
			});
        }

        const refreshedQuests = await Promise.all(
            Object.values(allQuests).map(q => appService.questService.refreshQuests(q))
        );
        setQuestState(refreshedQuests);
        await appService.dataService.saveAllQuests(refreshedQuests);

        // Update user XP
        let user = await appService.xpService.updateXPFromAttributes(quest.reward.attributes || {}, completed, 'quest');
        await appService.dataService.saveUser(user);

        if (onUserUpdate) onUserUpdate(user);
        if (onQuestUpdate) onQuestUpdate(refreshedQuests);
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
				const validateRequirements = appService.questService.validateRequirements(quest, user, questState);
				const matchesTab =
					activeTab === "all" && validateRequirements ||
					(activeTab === "active" && validateRequirements && !quest.progression.isCompleted) ||
					(activeTab === "completed" && quest.progression.isCompleted) ||
					(activeTab === "upcoming" && !quest.progression.isCompleted && !validateRequirements);

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
						const difficultyOrder = {
							...DEFAULT_DIFFICULTIES.reduce((acc, diff, index) => ({ ...acc, [diff]: index }), {} as Record<string, number>),
						};
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
