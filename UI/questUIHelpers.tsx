import React, { useState } from 'react';
// from files :
import { QuestForm } from 'components/questForm';
import { QuestList } from 'components/questList';
import { AppProvider } from 'context/appContext';

export function CreateQuestModalUI({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
	return (
			<div className="quest-modal">
				<QuestForm onSuccess={onSuccess} onCancel={onCancel} />
			</div>
	);
}
