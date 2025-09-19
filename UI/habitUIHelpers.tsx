import React from 'react';
import * as ReactDOM from 'react-dom/client';
// from files :
import { AppContextService } from '../context/appContextService';
import { AppProvider } from '../context/appContext';
import { Habit, Quest } from 'data/DEFAULT';
import { HabitForm } from '../components/habitForm';


export function CreateHabitModalUI({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
	return (
			<div className="quest-modal">
				<HabitForm onSuccess={onSuccess} onCancel={onCancel} />
			</div>
	);
}

export function ModifyHabitModalUI({ habit, onSuccess, onDelete }: { habit: Habit, onSuccess: () => void, onDelete: () => void }) {
	return (
			<div className="quest-modal">
				<HabitForm existingHabit={habit} onSuccess={onSuccess} onDelete={onDelete} />
			</div>
	);
}
