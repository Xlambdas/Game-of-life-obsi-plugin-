import React, { useState } from 'react';
// from files :
import { QuestForm } from 'components/questForm';
import { QuestList } from 'components/questList';
import { AppProvider } from 'context/appContext';
import { useAppContext } from 'context/appContext';
import { Quest } from 'data/DEFAULT';

export function CreateQuestModalUI({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
	return (
			<div className="quest-modal">
				<QuestForm onSuccess={onSuccess} onCancel={onCancel} />
			</div>
	);
}

export function ModifyQuestModalUI({ quest, onSuccess, onDelete }: { quest: Quest, onSuccess: () => void, onDelete: () => void }) {
	return (
			<div className="quest-modal">
				<QuestForm existingQuest={quest} onSuccess={onSuccess} onDelete={onDelete} />
			</div>
	);
}
