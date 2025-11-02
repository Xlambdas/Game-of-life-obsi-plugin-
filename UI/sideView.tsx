import { Notice } from "obsidian";
import * as React from "react";
import { useEffect, useState } from "react";
// from files (services, Default):
import { useAppContext } from "../context/appContext";
import { UserSettings, Quest, Habit } from "../data/DEFAULT";
// from files (UI, components):
import { UserCard } from "../components/userCard";
import { QuestList } from "../components/quests/questList";
import { HabitList } from "components/habits/habitList";

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

	const loadData = async () => {
		if (loading) return; // prevent re-entry
		setLoading(true);
		const loadedUser = appService.dataService.getUser();
		const loadedQuests = await appService.dataService.getQuests();
		const loadedHabits = await appService.dataService.getHabits();
		if (loadedUser && typeof loadedUser === 'object' && 'settings' in loadedUser) {
			setUser(loadedUser as UserSettings);
		} else {
			setUser(null);
		}
		setQuests(Object.values(loadedQuests));
		setHabits(Object.values(loadedHabits));
		setLoading(false);
	};
	useEffect(() => {
		if (!appService) return;
		loadData();
	}, [appService]);

	useEffect(() => {
		const handleReload = () => { if (!loading) loadData(); };
		document.addEventListener("dbUpdated", handleReload);
		return () => document.removeEventListener("dbUpdated", handleReload);
	}, [loading]);

	const handleQuestUpdate = (updatedQuests: Quest[]) => {
        setQuests(updatedQuests);
    };

	if (!user) return <p>Loading...</p>;
	return (
		<div>
			<UserCard app={appService.getApp()} context={appService} user={user} />
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
				/>
			</div>
		</div>
	);
};
