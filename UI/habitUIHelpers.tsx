// from files (Default) :
import { Habit } from 'data/DEFAULT';
// from files (UI):
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
