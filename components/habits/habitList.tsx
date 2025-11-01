import React, { useEffect, useMemo, useState } from "react";
// from files (Service, DEFAULT):
import { useAppContext } from "context/appContext";
import { Habit, Quest, UserSettings } from "data/DEFAULT";
// from files (UI):
import { HabitSideView } from "./habitSideView";
import { GenericForm } from "../forms/genericForm";


interface HabitListProps {
	habits: Habit[];
	onHabitUpdate?: (updatedHabits: Habit[]) => void;
	onUserUpdate?: (updatedUser: UserSettings) => void;
}

export const HabitList: React.FC<HabitListProps> = ({ habits, onHabitUpdate, onUserUpdate }) => {
	/* Side view to display and manage habits */
	const appService = useAppContext();

	const [habitState, setHabitState] = useState<Habit[]>(habits);

	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today");
	const [sortBy, setSortBy] = useState<"priority" | "xp" | "difficulty" | "recurrence">("priority");

	useEffect(() => {
		const refreshAllHabits = async () => {
			/* Refresh all habits to update their streaks and next dates */
			const refreshedHabits = await Promise.all(habitState.map(habit => appService.habitService.refreshHabits(habit)));
			setHabitState(refreshedHabits);
			await appService.dataService.saveAllHabits(refreshedHabits);
		};
		refreshAllHabits();
	}, []);

	useEffect(() => {
		const savedOpen = localStorage.getItem("habitListOpen");
		const savedFilter = localStorage.getItem("habitListFilter");
		const savedTab = localStorage.getItem("habitListActiveTab");
		const savedSort = localStorage.getItem("habitListSortBy");
		if (savedOpen) setIsOpen(savedOpen === "true");
		if (savedFilter) setFilter(savedFilter);
		if (savedTab === "today" || savedTab === "upcoming") {
			setActiveTab(savedTab);
		}
		if (savedSort === "priority" || savedSort === "xp" || savedSort === "difficulty" || savedSort === "recurrence") {
			setSortBy(savedSort);
		}
	}, []);

	useEffect(() => {
		setHabitState(habits); // sync quand props changent
	}, [habits]);

	// Handlers for UI interactions (and localStorage persistence)
	const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => {
		const details = e.currentTarget;
		setIsOpen(details.open);
		localStorage.setItem("habitListOpen", details.open ? "true" : "false");
	}
	const handleSetFilter = (value: string) => {
		setFilter(value);
		localStorage.setItem("habitListFilter", value);
	};

	const handleSetActiveTab = (tab: "today" | "upcoming") => {
		setActiveTab(tab);
		localStorage.setItem("habitListActiveTab", tab);
	};

	const handleSetSortBy = (sort: "priority" | "xp" | "difficulty" | "recurrence") => {
		setSortBy(sort);
		localStorage.setItem("habitListSortBy", sort);
	};

	const handleGetDaysUntil = (targetDate: Date): string => {
		// console.log("Calculating days until:", new Date(), targetDate);
		return appService.xpService.getDaysUntil(new Date(), targetDate, 'habit');
	}

	const handleCheckbox_old = async (habit: Habit, completed: boolean) => {
		try {
			// Update habit completion status :
			const updatedHabit = await appService.habitService.updateHabitCompletion(habit, completed);
			await appService.habitService.saveHabit(updatedHabit);
			const updatedHabits = habitState.map(h => h.id === updatedHabit.id ? updatedHabit : h);
			setHabitState(updatedHabits);
			// Update user XP based on habit completion :
			const newUser = await appService.xpService.updateXPFromAttributes(habit.reward.attributes || {}, completed);
			await appService.dataService.saveUser(newUser);

			// Refresh quest that may depend on this habit :
			let allQuests = await appService.dataService.loadAllQuests();
			let questsArray = Object.values(allQuests);

			// Find all quests that depend on this habit (directly)
        const directlyAffectedQuestIds = new Set<string>();
        questsArray.forEach(quest => {
            if (quest.progression.subtasks?.conditionHabits?.some(ch => ch.id === habit.id)) {
                directlyAffectedQuestIds.add(quest.id);
            }
        });
        
        if (directlyAffectedQuestIds.size > 0) {
            // Build complete dependency chain
            const allAffectedQuestIds = new Set<string>(directlyAffectedQuestIds);
            let foundNewDependents = true;
            
            // Keep searching until no new dependents are found
            while (foundNewDependents) {
                foundNewDependents = false;
                questsArray.forEach(quest => {
                    // Skip if already in the affected set
                    if (allAffectedQuestIds.has(quest.id)) return;
                    
                    // Check if this quest depends on any affected quest
                    const dependsOnAffectedQuest = quest.progression.subtasks?.conditionQuests?.some(
                        cq => allAffectedQuestIds.has(cq.id)
                    );
                    
                    const dependsOnAffectedInRequirements = quest.requirements.previousQuests?.some(
                        pq => {
                            const pqId = typeof pq === 'string' ? pq : pq.id;
                            return allAffectedQuestIds.has(pqId);
                        }
                    );
                    
                    if (dependsOnAffectedQuest || dependsOnAffectedInRequirements) {
                        allAffectedQuestIds.add(quest.id);
                        foundNewDependents = true;
                    }
                });
            }
            
            // console.log("All affected quests:", Array.from(allAffectedQuestIds));
            
            // Sort quests by dependency order
            const sortedQuestIds = topologicalSort(questsArray, allAffectedQuestIds);
            
            // console.log("Refresh order:", sortedQuestIds);
            
            // Create a map for quick lookup and update
            const questMap = new Map(questsArray.map(q => [q.id, q]));
            
            // Refresh in dependency order
            for (const questId of sortedQuestIds) {
                const quest = questMap.get(questId);
                if (quest) {
                    const refreshedQuest = await appService.questService.refreshQuests(quest);
                    questMap.set(questId, refreshedQuest);
                    
                    // Update the array immediately so subsequent refreshes see the new data
                    questsArray = questsArray.map(q => q.id === questId ? refreshedQuest : q);
                }
            }
            
            await appService.dataService.saveAllQuests(questsArray);
            
            // Trigger a global update
            document.dispatchEvent(new CustomEvent("dbUpdated", {
                detail: {
                    type: 'habit',
                    action: 'complete',
                    data: habit
                }
            }));
        }
			// Notify parent component of updates
			if (onHabitUpdate) onHabitUpdate(updatedHabits);
			if (onUserUpdate) onUserUpdate(newUser);
		} catch (error) {
			console.error("Error updating habit completion:", error);
		}
	};

	const handleCheckbox = async (habit: Habit, completed: boolean) => {
		try {
			// Step 1: Update the habit
			const updatedHabit = await appService.habitService.updateHabitCompletion(habit, completed);
			await appService.habitService.saveHabit(updatedHabit);
			const updatedHabits = habitState.map(h => h.id === updatedHabit.id ? updatedHabit : h);
			setHabitState(updatedHabits);
			
			// Step 2: Update user XP
			const newUser = await appService.xpService.updateXPFromAttributes(habit.reward.attributes || {}, completed);
			await appService.dataService.saveUser(newUser);
			
			// Step 3: Refresh quests in dependency order
			let allQuests = await appService.dataService.loadAllQuests();
			let questsArray = Object.values(allQuests);
			
			// Find all quests that depend on this habit (directly)
			const directlyAffectedQuestIds = new Set<string>();
			questsArray.forEach(quest => {
				if (quest.progression.subtasks?.conditionHabits?.some(ch => ch.id === habit.id)) {
					directlyAffectedQuestIds.add(quest.id);
				}
			});
			
			if (directlyAffectedQuestIds.size > 0) {
				// Build complete dependency chain
				const allAffectedQuestIds = new Set<string>(directlyAffectedQuestIds);
				let foundNewDependents = true;
				
				while (foundNewDependents) {
					foundNewDependents = false;
					questsArray.forEach(quest => {
						if (allAffectedQuestIds.has(quest.id)) return;
						
						const dependsOnAffectedQuest = quest.progression.subtasks?.conditionQuests?.some(
							cq => allAffectedQuestIds.has(cq.id)
						);
						
						const dependsOnAffectedInRequirements = quest.requirements.previousQuests?.some(
							pq => {
								const pqId = typeof pq === 'string' ? pq : pq.id;
								return allAffectedQuestIds.has(pqId);
							}
						);
						
						if (dependsOnAffectedQuest || dependsOnAffectedInRequirements) {
							allAffectedQuestIds.add(quest.id);
							foundNewDependents = true;
						}
					});
				}
				
				// console.log("All affected quests:", Array.from(allAffectedQuestIds));
				
				// Sort quests by dependency order
				const sortedQuestIds = topologicalSort(questsArray, allAffectedQuestIds);
				
				// console.log("Refresh order:", sortedQuestIds);
				
				// Refresh in dependency order, passing the current quest state
				for (const questId of sortedQuestIds) {
					const questIndex = questsArray.findIndex(q => q.id === questId);
					if (questIndex !== -1) {
						const quest = questsArray[questIndex];
						// USE THE NEW METHOD WITH CONTEXT
						const refreshedQuest = await appService.questService.refreshQuestsWithContext(quest, questsArray);
						questsArray[questIndex] = refreshedQuest;
						// console.log(`Refreshed ${quest.title}: progress ${quest.progression.progress}% -> ${refreshedQuest.progression.progress}%`);
					}
				}
				
				await appService.dataService.saveAllQuests(questsArray);
				
				document.dispatchEvent(new CustomEvent("dbUpdated", {
					detail: {
						type: 'habit',
						action: 'complete',
						data: habit
					}
				}));
			}
			
			// Step 4: Notify parent
			if (onHabitUpdate) onHabitUpdate(updatedHabits);
			if (onUserUpdate) onUserUpdate(newUser);
			
		} catch (error) {
			console.error("Error updating habit:", error);
		}
	};

	const handleModify = (habit: Habit) => {
		// console.log("Modifying habit:", habit);
		new GenericForm(appService.getApp(), 'habit-modify', habit).open();
	};

	const filteredHabits = useMemo(() => {
		return habitState
			.filter((habit) => {
				const search = filter.trim().toLowerCase();
				const matchesSearch =
					!search ||
					habit.title.toLowerCase().includes(search) ||
					(habit.description && habit.description.toLowerCase().includes(search)) ||
					(habit.shortDescription && habit.shortDescription.toLowerCase().includes(search));

				const today = new Date();
				const todayStr = today.toISOString().slice(0, 10); // format YYYY-MM-DD

				const lastCompletedDateStr = habit.streak.lastCompletedDate
					? new Date(habit.streak.lastCompletedDate).toISOString().slice(0, 10)
					: "";
				const nextDateStr = habit.streak.nextDate
					? new Date(habit.streak.nextDate).toISOString().slice(0, 10)
					: "";

				let matchesTab = false;
				if (activeTab === "today") {
					// lastCompletedDate is today OR nextDate is today or in the future
					matchesTab =
						lastCompletedDateStr === todayStr ||
						nextDateStr <= todayStr;
				} else {
					// upcoming: nextDate is after today
					matchesTab = nextDateStr > todayStr && lastCompletedDateStr !== todayStr;
				}
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
					case "recurrence":
						return new Date(b.streak.nextDate).getTime() - new Date(a.streak.nextDate).getTime();
					default:
						return 0;
				}
			});
	}, [habitState, filter, activeTab, sortBy]);

	if (!habitState.length) return <div>No habits available</div>;

	return (
		<HabitSideView
			filteredHabits={filteredHabits}
			isOpen={isOpen}
			filter={filter}
			activeTab={activeTab}
			sortBy={sortBy}
			handleToggle={handleToggle}
			handleComplete={handleCheckbox}
			setFilter={handleSetFilter}
			setActiveTab={handleSetActiveTab}
			setSortBy={handleSetSortBy}
			handleModifyHabit={handleModify}
			getDaysUntil={handleGetDaysUntil}
		/>
	);
};



// Helper function: Topological sort
function topologicalSort(allQuests: Quest[], affectedIds: Set<string>): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    // Initialize for all affected quests
    affectedIds.forEach(id => {
        graph.set(id, []);
        inDegree.set(id, 0);
    });
    
    // Build the dependency graph for ALL affected quests
    affectedIds.forEach(questId => {
        const quest = allQuests.find(q => q.id === questId);
        if (!quest) return;
        
        // Find dependencies (what this quest depends ON)
        const dependencies: string[] = [];
        
        // Check conditionQuests
        quest.progression.subtasks?.conditionQuests?.forEach(cq => {
            if (affectedIds.has(cq.id)) {
                dependencies.push(cq.id);
            }
        });
        
        // Check previousQuests
        quest.requirements.previousQuests?.forEach(pq => {
            const pqId = typeof pq === 'string' ? pq : pq.id;
            if (affectedIds.has(pqId)) {
                dependencies.push(pqId);
            }
        });
        
        // Update the graph
        dependencies.forEach(depId => {
            // depId -> questId (depId must be done before questId)
            if (!graph.has(depId)) {
                graph.set(depId, []);
                inDegree.set(depId, 0);
            }
            graph.get(depId)!.push(questId);
        });
        
        // Set in-degree
        inDegree.set(questId, (inDegree.get(questId) || 0) + dependencies.length);
    });
    
    // console.log("Dependency graph:", Object.fromEntries(graph));
    // console.log("In-degrees:", Object.fromEntries(inDegree));
    
    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    const result: string[] = [];
    
    // Start with quests that have no dependencies (in-degree = 0)
    inDegree.forEach((degree, questId) => {
        if (degree === 0) {
            queue.push(questId);
        }
    });
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        result.push(current);
        
        // Process all quests that depend on current
        const dependents = graph.get(current) || [];
        dependents.forEach(dependent => {
            const newDegree = (inDegree.get(dependent) || 0) - 1;
            inDegree.set(dependent, newDegree);
            
            if (newDegree === 0) {
                queue.push(dependent);
            }
        });
    }
    
    return result;
}
