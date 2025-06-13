import React, { useState, useEffect } from "react";
import { useApp } from "../context/appContext";

export const QuestList = () => {
  const app = useApp();
  const [quests, setQuests] = useState<string[]>([]);
  const [newQuest, setNewQuest] = useState("");

  // Charge les quêtes au démarrage
  useEffect(() => {
    const loaded = app.getData("quests") || [];
    setQuests(loaded);
  }, []);

  // Ajoute une nouvelle quête
  const addQuest = () => {
    const updated = [...quests, newQuest];
    setQuests(updated);
    app.setData("quests", updated);
    setNewQuest("");
  };

  return (
    <div>
      <h2>Quests</h2>
      <ul>
        {quests.map((q, i) => (
          <li key={i}>🗡️ {q}</li>
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
