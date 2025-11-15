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
		if (loadingRef.current) return; // prevent re-entry
		// console.log("-----> Loading data for SideView...");
		loadingRef.current = true;
		setLoading(true);
		try {
			const loadedUser = appService.dataService.getUser();
			// console.log("Loaded user:", loadedUser);
			const loadedQuests = await appService.dataService.getQuests();
			// console.log("-<>----------");
			// console.log("Loaded quests:", loadedQuests);
			const loadedHabits = await appService.dataService.getHabits();
			// console.log("------<>-----");
			// console.log("Loaded habits:", loadedHabits);
			if (loadedUser && typeof loadedUser === 'object' && 'settings' in loadedUser) {
				setUser(loadedUser as UserSettings);
			} else {
				setUser(null);
			}
			if (open_load) {
				// console.log("><---><User data loaded in SideView");
				open_load = false;
				const updatedQuests = await Promise.all(
					Object.values(loadedQuests).map((q: Quest) => appService.questService.refreshQuests(q))
				);
				// await appService.dataService.refreshAllData();
				const updatedHabits = await Promise.all(
					Object.values(loadedHabits).map((h: Habit) => appService.habitService.refreshHabits(h))
				);
				// console.log("Updated quests after refresh:", updatedQuests);
				// console.log("Updated habits after refresh:", updatedHabits);
				await appService.dataService.saveAllQuests(updatedQuests);
				await appService.dataService.saveAllHabits(updatedHabits);
				setUser(loadedUser as UserSettings);
				setQuests(updatedQuests);
				setHabits(updatedHabits);

			} else {
				setQuests(Object.values(loadedQuests));
				setHabits(Object.values(loadedHabits));
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
		// console.log(">-----< usestate effect sideview loading:", loading);
		loadData();
		const handleReload = () => {
			// console.log("🔄 dbUpdated event triggered");
			loadData();
		};
		document.addEventListener("dbUpdated", handleReload);

		return () => {
			console.log("useEffect cleanup");
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
				<UserCard app={appService.getApp()} context={appService} user={user} />
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
						app={appService.getApp()}
						context={appService}
						habits={habits}
					/>
				</div>
			</div>
		</div>
	);
};
