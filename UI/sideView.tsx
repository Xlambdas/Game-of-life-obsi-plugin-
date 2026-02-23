import * as React from "react";
import { useEffect, useState } from "react";
// from files (services, Default):
import { useAppContext } from "../context/appContext";
import { UserSettings, Quest, Habit } from "../data/DEFAULT";
// from files (UI, components):
import { UserCard } from "../components/userCard";
import { QuestList } from "../components/quests/questList";
import { HabitList } from "components/habits/habitList";
import { Notice } from "obsidian";
import { SidebarCalendar } from "components/sidebarCalendar";

export const SideView: React.FC = () => {
	/* SideView component that displays user info, quests, and habits.
		Fetches data from AppContextService and updates on data changes.
		Allows adding XP to user.
	*/
	const appService = useAppContext();
	const [quests, setQuests] = useState<Quest[]>([]);
	const [habits, setHabits] = useState<Habit[]>([]);
	const [user, setUser] = useState<UserSettings | null>(null);

	const [loading, setLoading] = useState(false);
	const loadingRef = React.useRef(false);
	const lastLoadTime = React.useRef(0);
	let open_load = true;

	const loadData = React.useCallback(async () => {
		if (loadingRef.current) return;
		loadingRef.current = true;
		setLoading(true);
		try {
			const loadedUser = appService.dataService.getUser();

			// Load ALL data (archived included) for saving
			const allQuests = await appService.dataService.getQuests();
			const allHabits = await appService.dataService.getHabits();

			// Filtered for display only
			const activeQuests = Object.values(allQuests).filter(q => !q.isArchived);
			const activeHabits = Object.values(allHabits).filter(h => !h.isArchived);

			if (loadedUser && typeof loadedUser === 'object' && 'settings' in loadedUser) {
				setUser(loadedUser as UserSettings);
			} else {
				setUser(null);
			}

			if (open_load) {
				open_load = false;

				// Refresh only active ones
				const updatedQuests = await Promise.all(
					activeQuests.map((q: Quest) => appService.questService.refreshQuests(q))
				);
				const updatedHabits = await Promise.all(
					activeHabits.map((h: Habit) => appService.habitService.refreshHabits(h))
				);

				// Merge updated active back into full list before saving
				const mergedQuests = { ...allQuests };
				updatedQuests.forEach(q => { mergedQuests[q.id] = q; });

				const mergedHabits = { ...allHabits };
				updatedHabits.forEach(h => { mergedHabits[h.id] = h; });

				// Save full merged data (archived ones are preserved)
				await appService.dataService.setQuests(mergedQuests);
				await appService.dataService.setHabits(mergedHabits);

				setUser(loadedUser as UserSettings);
				setQuests(updatedQuests);   // only active in state
				setHabits(updatedHabits);   // only active in state
			} else {
				setQuests(activeQuests);
				setHabits(activeHabits);
			}
		} catch (error) {
			console.error("Error loading data in SideView:", error);
			new Notice("Error loading data in SideView. See console for details.");
		} finally {
			console.log("✅ loadData finished - resetting loadingRef");
			loadingRef.current = false;
			setLoading(false);
		}
	}, [appService]);

	useEffect(() => {
		// console.log("🎯 useEffect triggered - appService:", !!appService);
		if (!appService) return;
		console.log(">-----< usestate effect sideview loading:", loading);
		loadData();
		const handleReload = () => {
			console.log("🔄 dbUpdated event triggered");
			loadData();
		};
		document.addEventListener("dbUpdated", handleReload);

		return () => {
			// console.log("useEffect cleanup");
			document.removeEventListener("dbUpdated", handleReload);}
	}, [appService]);

	const handleQuestUpdate = (updatedQuests: Quest[]) => {
        setQuests(updatedQuests);
    };

	const handleCompleteHabit = (updatedHabit: Habit[]) => {
		new Notice("Habit updated!");
		// console.log("Updated habit received in SideView:", updatedHabit);
		setHabits(updatedHabit);
	};

	if (!user) return <p className="side-view-loading">Loading...</p>;
	return (
		<div className="side-view-container">
			<div className="side-view-header">
				<UserCard user={user} onUserUpdate={setUser} />
			</div>
			<div className="side-view-content">
				<div className="card">
					<QuestList
						quests={quests}
						user={user}
						onUserUpdate={setUser}
						onQuestUpdate={handleQuestUpdate}
					/>
					<hr className="separator"></hr>
					<HabitList
						habits={habits}
						onUserUpdate={setUser}
						onHabitUpdate={handleCompleteHabit}
					/>
				</div>
				<div className="card">
					<SidebarCalendar
						habits={habits}
						onUserUpdate={setUser}
						onHabitsUpdate={handleCompleteHabit}
					/>
				</div>
			</div>
		</div>
	);
};
