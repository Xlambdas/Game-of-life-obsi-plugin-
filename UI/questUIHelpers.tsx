// from files (Default) :
import { Quest } from 'data/DEFAULT';
// from files (UI):
import { QuestForm } from 'components/forms/quests/questForm';


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
