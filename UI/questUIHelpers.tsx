import React, { useState } from 'react';
// from files :
import { QuestForm } from 'components/questForm';
import { QuestList } from 'components/questList';
import { AppProvider } from 'context/appContext';

export function CreateQuestModalUI() {

	return (
			<div className="quest-modal">
				<h1>Create a New Quest</h1>
				<QuestList />
			</div>
	);
}
