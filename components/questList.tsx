import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/appContext";
import { Quest } from "../data/DEFAULT";

export const QuestList = () => {
	const app = useAppContext();

	const [quests, setQuests] = useState<Quest[]>([]);
	const [newQuest, setNewQuest] = useState("");

	useEffect(() => {
		const loadedObj = app.getQuests() || [];
		const loaded = Array.isArray(loadedObj) ? loadedObj : Object.values(loadedObj);
		setQuests(loaded);
	}, []);

	const addQuest = () => {
		if (!newQuest.trim()) return;
		const newQuestObj: Quest = {
			id: Date.now().toString(),
			title: newQuest.trim(),
			done: false,
		};
		const updated = [...quests, newQuestObj];
		app.setQuests(updated);
		setQuests(updated);
		setNewQuest("");
	};

	return (
		<div>
			<h2>Quests</h2>
			<ul>
				{quests.map((q, i) => (
					<li key={i}>🗡️ {q.title}</li>
				))}
			</ul>

			<input
				type="text"
				value={newQuest}
				onChange={(e) => setNewQuest(e.target.value)}
				placeholder="New quest"
			/>
			<button onClick={addQuest}>Add</button>
		</div>
	);
};
