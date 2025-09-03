import React, { useState } from 'react';
import { useAppContext } from '../context/appContext';
import { Quest, DEFAULT_QUEST } from '../data/DEFAULT';
import { v4 as uuid } from 'uuid';

interface QuestFormProps {
	onClose?: () => void;
	onSubmit?: (quest: Quest) => void;
}

export const QuestFormComponent: React.FC<QuestFormProps> = ({ onClose, onSubmit }) => {
	const app = useAppContext();
	const [formData, setFormData] = useState({
		title: '',
		shortDescription: '',
		description: '',
		category: 'Undefined',
		priority: 'low' as const,
		difficulty: 'easy' as const,
		rewardXP: 10,
		rewardTitle: '',
		spiritBoost: 0,
		requiredLevel: 0,
		timeAvailableMinutes: 30,
		estimatedDurationMinutes: 30,
		recommendedTimeOfDay: 'any' as const,
		energyRequired: 0,
		willpowerRequired: 0,
		linkedToGoal: '',
		isSecret: false,
		isTimeSensitive: false,
		failureDescription: '',
		spiritLoss: 0,
		XPLoss: 0,
		lockoutTimeMinutes: 0,
		notes: ''
	});
	const [showAdvanced, setShowAdvanced] = useState(false);

	const handleSubmit = async () => {

		if (!formData.title.trim()) {
			alert('Quest title is required');
			return;
		}

		const now = new Date();
		const newQuest: Quest = {
			id: uuid(),
			title: formData.title.trim(),
			shortDescription: formData.shortDescription,
			description: formData.description,
			created_at: now,
			settings: {
				type: 'quest',
				category: formData.category,
				priority: formData.priority,
				difficulty: formData.difficulty,
				isSecret: formData.isSecret,
				isTimeSensitive: formData.isTimeSensitive
			},
			progression: {
				isCompleted: false,
				completedAt: null,
				progress: 0,
				dueDate: new Date(0),
				startedAt: new Date(0),
				lastUpdated: new Date(0),
				subtasks: [],
				attempts: 0,
				failures: 0,
				timeSpentMinutes: 0
			},
			reward: {
				XP: formData.rewardXP,
				items: [],
				attributes: { ...DEFAULT_QUEST.reward.attributes },
				unlocks: [],
				badges: [],
				title: formData.rewardTitle,
				spiritBoost: formData.spiritBoost
			},
			requirements: {
				level: formData.requiredLevel,
				previousQuests: [],
				attributes: { ...DEFAULT_QUEST.requirements.attributes },
				timeAvailableMinutes: formData.timeAvailableMinutes,
				tagsRequired: []
			},
			meta: {
				difficulty: formData.difficulty,
				category: formData.category,
				tags: [],
				isSystemQuest: false,
				createdBy: 'user',
				linkedToGoal: formData.linkedToGoal,
				estimatedDurationMinutes: formData.estimatedDurationMinutes,
				recommendedTimeOfDay: formData.recommendedTimeOfDay,
				energyRequired: formData.energyRequired,
				willpowerRequired: formData.willpowerRequired
			},
			failureConsequence: {
				description: formData.failureDescription,
				spiritLoss: formData.spiritLoss,
				XPLoss: formData.XPLoss,
				lockoutTimeMinutes: formData.lockoutTimeMinutes
			},
			notes: formData.notes
		};

		try {
			// Sauvegarder via AppContextService
			const currentQuests = app.getQuests();
			const questsArray = Array.isArray(currentQuests) 
				? currentQuests 
				: Object.values(currentQuests);
			
			const updatedQuests = [...questsArray, newQuest];
			app.setQuests(updatedQuests);

			if (onSubmit) {
				onSubmit(newQuest);
			}
			
			if (onClose) {
				onClose();
			}
		} catch (error) {
			console.error('Failed to create quest:', error);
		}
	};

	return (
		<div className="quest-form-container">
			<h2>Create New Quest</h2>
			<form onSubmit={handleSubmit}>
				{/* Champs de base */}
				<div className="form-group">
					<label htmlFor="title">Quest Title *</label>
					<input
						id="title"
						type="text"
						value={formData.title}
						onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
						placeholder="Enter quest title..."
						required
					/>
				</div>

				<div className="form-group">
					<label htmlFor="shortDescription">Short Description</label>
					<textarea
						id="shortDescription"
						value={formData.shortDescription}
						onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
						placeholder="Brief description..."
						rows={2}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="category">Category</label>
					<select
						id="category"
						value={formData.category}
						onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
					>
						<option value="Undefined">Undefined</option>
						<option value="Health">Health</option>
						<option value="Fitness">Fitness</option>
						<option value="Learning">Learning</option>
						<option value="Work">Work</option>
						<option value="Social">Social</option>
						<option value="Creative">Creative</option>
						<option value="Spiritual">Spiritual</option>
						<option value="Adventure">Adventure</option>
					</select>
				</div>

				{/* Toggle pour les paramètres avancés */}
				<div className="form-group">
					<label>
						<input
							type="checkbox"
							checked={showAdvanced}
							onChange={(e) => setShowAdvanced(e.target.checked)}
						/>
						Advanced Settings
					</label>
				</div>

				{/* Paramètres avancés */}
				{showAdvanced && (
					<>
						<div className="form-group">
							<label htmlFor="description">Full Description</label>
							<textarea
								id="description"
								value={formData.description}
								onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
								placeholder="Detailed description..."
								rows={4}
							/>
						</div>

						<div className="form-row">
							<div className="form-group">
								<label htmlFor="priority">Priority</label>
								<select
									id="priority"
									value={formData.priority}
									onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
								>
									<option value="low">Low</option>
									<option value="medium">Medium</option>
									<option value="high">High</option>
									<option value="urgent">Urgent</option>
								</select>
							</div>

							<div className="form-group">
								<label htmlFor="difficulty">Difficulty</label>
								<select
									id="difficulty"
									value={formData.difficulty}
									onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
								>
									<option value="easy">Easy</option>
									<option value="normal">Normal</option>
									<option value="hard">Hard</option>
									<option value="expert">Expert</option>
								</select>
							</div>
						</div>

						<div className="form-row">
							<div className="form-group">
								<label htmlFor="rewardXP">Reward XP</label>
								<input
									id="rewardXP"
									type="number"
									value={formData.rewardXP}
									onChange={(e) => setFormData(prev => ({ ...prev, rewardXP: parseInt(e.target.value) || 100 }))}
									min="1"
								/>
							</div>

							<div className="form-group">
								<label htmlFor="requiredLevel">Required Level</label>
								<input
									id="requiredLevel"
									type="number"
									value={formData.requiredLevel}
									onChange={(e) => setFormData(prev => ({ ...prev, requiredLevel: parseInt(e.target.value) || 1 }))}
									min="1"
								/>
							</div>
						</div>

						{/* <div className="form-group">
							<label htmlFor="dueDate">Due Date</label>
							<input
								id="dueDate"
								type="date"
								value={formData.dueDate}
								onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
							/>
						</div> */}
					</>
				)}

				{/* Boutons d'action */}
				<div className="form-actions">
					<button type="button" onClick={onClose}>Cancel</button>
					<button type="submit" className="mod-cta">Create Quest</button>
				</div>
			</form>
		</div>
	);
};
