import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { AppProvider } from "../context/appContext";
import { AppContextService } from "../context/appContextService";
import { useEffect, useState } from "react";
import { useAppContext } from "../context/appContext";
import { UserSettings, Quest, Habit } from "../data/DEFAULT";
import { addXP } from "../context/services/xpService";
import { UserCard } from "../components/userCard";
import QuestService from "../context/services/questService";
import { QuestList } from "../components/questList";
import { HabitList } from "components/habitList";

// Responsabilité : uniquement afficher les données et gérer les interactions avec l’utilisateur (boutons, inputs, filtres).
// Ne fait pas de CRUD direct ni de calcul métier complexe. Tout passe par useAppContext().

export const SideView: React.FC = () => {
	const appService = useAppContext();
	const [quests, setQuests] = useState<Quest[]>([]);
	const [habits, setHabits] = useState<Habit[]>([]);
	const [user, setUser] = useState<UserSettings | null>(null);

	const loadData = async () => {
		const loadedUser = await appService.get('user');
		const loadedQuests = await appService.get('quests');
		const loadedHabits = await appService.get('habits');
		if (loadedUser && typeof loadedUser === 'object' && 'settings' in loadedUser) {
			setUser(loadedUser as UserSettings);
		} else {
			setUser(null);
		}
		setQuests(Object.values(loadedQuests));
		setHabits(Object.values(loadedHabits));
	};
	useEffect(() => {
		if (!appService) return;
		loadData();
	}, [appService]);

	const handleAddXP = async (amount: number) => {
		if (!user) return;
		const updatedUser = await addXP(appService, user, amount);
		setUser(updatedUser);
		console.log(`Added ${amount} XP to user. New user: ${updatedUser}`);
		new Notice(`You gained ${amount} XP!`);
		loadData();
	};

	if (!user) return <p>Loading...</p>;
	return (
		<div>
			<UserCard user={user} />
			<div className="card">
				<QuestList
					quests={quests}
					onUserUpdate={setUser}
				/>
				<hr className="separator"></hr>
				<HabitList
					habits={habits}
					onUserUpdate={setUser}
				/>
			</div>
			<button onClick={() => handleAddXP(10)} className="btn">
				Add 10 XP
			</button>
		</div>
	);
};
