import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../context/appContext";
import { Quest, UserSettings } from "../data/DEFAULT";
import { addXP } from "../context/services/xpService";
import { Notice } from "obsidian";
import QuestService from "../context/services/questService";
import { QuestSideView } from "./questSideView";

interface QuestListProps {
	quests: Quest[];
	onQuestUpdate?: (updatedQuests: Quest[]) => void;
	onUserUpdate?: (updatedUser: UserSettings) => void;
}

export const QuestList: React.FC<QuestListProps> = ({ quests, onQuestUpdate, onUserUpdate }) => {
	const appService = useAppContext();
	const questService = new QuestService(appService);

	// ✅ Une seule source de vérité
	const [questState, setQuestState] = useState<Quest[]>(quests);

	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const [activeTab, setActiveTab] = useState<"active" | "completed" | "all">("active");
	const [sortBy, setSortBy] = useState<"priority" | "xp" | "difficulty" | "date">("priority");

	useEffect(() => {
		setQuestState(quests); // sync quand props changent
	}, [quests]);

	const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => {
		const details = e.currentTarget;
		setIsOpen(details.open);
		localStorage.setItem("questListOpen", details.open ? "true" : "false");
	};

	// Gestion complétion
	const handleCompleteQuest = async (quest: Quest, completed: boolean) => {
		try {
			const updatedQuest = await questService.toggleQuestCompletion(quest);
			const user = await appService.getUser();

			// MAJ immédiate du state local
			const updatedList = questState.map(q =>
				q.id === updatedQuest.id
					? {
							...q,
							progression: {
								...q.progression,
								isCompleted: completed,
								progress: completed ? 100 : 0,
								completedAt: completed ? new Date() : null,
							},
					  }
					: q
			);
			setQuestState(updatedList);

			// MAJ User + XP
			if (completed) {
				if (Array.isArray(user.completedQuests) && !user.completedQuests.includes(updatedQuest.id)) {
					user.completedQuests.push(updatedQuest.id);
					if (updatedQuest.reward.XP) {
						const newUser = await addXP(appService, user as UserSettings, updatedQuest.reward.XP);
						onUserUpdate?.(newUser);
						new Notice(`Quest completed! +${updatedQuest.reward.XP} XP`);
					}
				}
			} else {
				// si décochée → on enlève l'XP
				user.completedQuests = user.completedQuests.filter((id: string) => id !== updatedQuest.id);
				if (updatedQuest.reward.XP) {
					const newUser = await addXP(appService, user as UserSettings, -updatedQuest.reward.XP);
					onUserUpdate?.(newUser);
				}

				// await appService.updateUserData(user);
				new Notice("Quest marked as not completed.");
			}

			// propager au parent si besoin
			onQuestUpdate?.(updatedList);
		} catch (err) {
			console.error("Error completing quest:", err);
			new Notice("Failed to update quest status");
		}
	};

	const handleModifyQuest = (quest: Quest) => {
		console.log("TODO: open modal to edit quest", quest);
	};

	// Filtrage & tri (sur questState uniquement)
	const filteredQuests = useMemo(() => {
		return questState
			.filter((quest) => {
				const matchesSearch =
					!filter ||
					quest.title.toLowerCase().includes(filter.toLowerCase()) ||
					quest.description.toLowerCase().includes(filter.toLowerCase());
				const matchesTab =
					activeTab === "all" ||
					(activeTab === "active" && !quest.progression.isCompleted) ||
					(activeTab === "completed" && quest.progression.isCompleted);
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
			handleToggle={handleToggle}
			handleCompleteQuest={handleCompleteQuest}
			setFilter={setFilter}
			setActiveTab={setActiveTab}
			setSortBy={setSortBy}
			sortBy={sortBy}
			handleModifyQuest={handleModifyQuest}
		/>
	);
};
