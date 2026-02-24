import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App, Modal, Notice } from 'obsidian';
import { AppContextService } from 'context/appContextService';
import { AppProvider } from 'context/appContext';
import { Habit, UserSettings } from 'data/DEFAULT';
import { DateHelper, DateString } from 'helpers/dateHelpers';
import { SidebarCalendar } from 'components/sidebarCalendar';
import { ConfirmModal } from './confirmModal';
import { UNLOCK_HABIT_VIEW } from 'data/unlocks';
import { HabitListModal } from './AllHabitListModal';

export class HabitModal extends Modal {
	private habit: Habit;
	private root: ReactDOM.Root | null = null;
	private service: AppContextService = AppContextService.getInstance();
	private user: UserSettings;
	private onUserUpdate: (updatedUser: UserSettings) => void = () => { };

	constructor(app: App, habit: Habit) {
		super(app);
		this.habit = habit;
		this.user = this.service.getUser();
	}

	getAllHabits() {
		return this.service.dataService.loadAllHabits();
	}

	onOpen() {
		this.modalEl.style.maxWidth = "1000px";
		this.modalEl.style.width = "90vw";

		this.root = ReactDOM.createRoot(this.contentEl);
		this.render();
	}

	render() {
		if (!this.root) return;

		this.root.render(
			<AppProvider appService={this.service}>
				<HabitDetails
					habit={this.habit}
					allHabits={[]}
					service={this.service}
					onClose={() => this.close()}
					onOpenAllHabits={() => {
						this.close();
						new HabitListModal(this.app).open();
					}}
					user={this.user}
					onUserUpdate={this.onUserUpdate}
				/>
			</AppProvider>
		);
	}

	onClose() {
		this.root?.unmount();
		this.root = null;
	}
}

interface HabitDetailsProps {
	habit: Habit;
	allHabits: Habit[];
	service: AppContextService;
	onClose: () => void;
	onOpenAllHabits: () => void;
	user: UserSettings;
	onUserUpdate: (updatedUser: UserSettings) => void;
}

export const HabitDetails: React.FC<HabitDetailsProps> = ({
	habit: initialHabit,
	allHabits,
	service,
	onClose,
	onOpenAllHabits,
	onUserUpdate
}) => {
	const habitService = service.habitService;
	const [habit, setHabit] = useState<Habit>(initialHabit);
	const [habits, setHabits] = useState<Habit[]>(allHabits);

	const [loading, setLoading] = useState(false);

	const triggerReload = () => {
		document.dispatchEvent(new CustomEvent("dbUpdated"));
	};

	useEffect(() => {
		setHabit(initialHabit);
	}, [initialHabit]);

	useEffect(() => {
		const loadHabits = async () => {
			const loadedHabits = await service.dataService.loadAllHabits();
			setHabits(loadedHabits);
		};
		loadHabits();
	}, [service]);

	// -------------------
	// ACTIONS
	// -------------------
	const handleEdit = () => {
		habitService.handleModify(habit);
	};

	const handleDelete = async () => {
		new ConfirmModal(service.getApp(), {
			title: "Delete Habit",
			description: "You are about to delete this habit. Continue?",
			confirmText: "Delete",
			cancelText: "Cancel",
			onConfirm: async () => {
				new Notice(`Deleting habit and cleaning up related quests... ${habit.id}`);
				await habitService.deleteHabit(habit.id, service.questService);
				triggerReload();
				onClose();
				new Notice("Habit deleted successfully!");
			},
		}).open();
	};

	const handleArchive = () => {
		new ConfirmModal(service.getApp(), {
			title: "Archive Habit",
			description: "You are about to archive this habit. Continue?",
			confirmText: "Archive",
			cancelText: "Cancel",
			onConfirm: async () => {
				const updated = { ...habit, isArchived: true };
				await habitService.saveHabit(updated);
				triggerReload();
				onClose();
				new Notice("Habit archived successfully!");
			},
		}).open();
	};

	const handleCompleteHabit = (updatedHabit: Habit[]) => {
		new Notice("Habit updated!");
		setHabits(updatedHabit);
	};

	// -------------------
	// RENDER
	// -------------------
	const statsUnlocked = UNLOCK_HABIT_VIEW.stats <= habit.progress.level ? true : false;

	return (
		<div className="habit-modal-container">
			{/* TOP SECTION */}
			<div className="habit-top-section">
				{/* LEFT DETAILS */}
				<div className="habit-left">
					<h2 className="habit-title">{habit.title}</h2>
					<div className="habit-details-block">
						<p className="habit-description">
							{habit.description || "No description."}
						</p>
						<div className="habit-meta">
							<div><strong>Category:</strong> {habit.settings.category}</div>
							<div><strong>Difficulty:</strong> {habit.settings.difficulty}</div>
							<div><strong>Priority:</strong> {habit.settings.priority}</div>
							<div>
								<strong>Recurrence:</strong> Every {habit.recurrence.interval} {habit.recurrence.unit}
							</div>
						</div>
						<div className="habit-action-buttons">
							<button className="habit-delete-btn" onClick={handleDelete}>
								Delete
							</button>
							<button className="habit-modify-btn" onClick={handleEdit}>
								Modify
							</button>
							<button className="habit-archived-btn" onClick={handleArchive}>
								Archive
							</button>
							<button className="habit-all-habits-btn" onClick={onOpenAllHabits}>
								All Habits
							</button>
						</div>
					</div>
				</div>
				{/* RIGHT CALENDAR */}
				<div className="habit-calendar-box">
					<SidebarCalendar habit={habit} onUserUpdate={onUserUpdate} onHabitsUpdate={handleCompleteHabit} />
				</div>
			</div>
			{/* BOTTOM STATS */}
			{statsUnlocked && <div className="habit-stats-section">
				<h3>Stats</h3>
				{(() => {
					const last30Days = DateHelper.addInterval(DateHelper.today(), -1, "months");
					const recentHistory = habit.streak.history.filter(h => h.date >= last30Days);
					const completedRecent = recentHistory.filter(h => h.success).length;
					const totalRecent = recentHistory.length;
					const completionRate = totalRecent > 0 ? Math.round((completedRecent / totalRecent) * 100) : 0;
					const totalCompletions = habit.streak.history.filter(h => h.success).length;
					const freezeAvailable = habit.streak.freeze?.available ?? 0;
					const freezeUsed = habit.streak.freeze?.history?.length ?? 0;
					const createdDate = new Date(habit.created_at);
					const today = new Date();
					const consistencyScore = totalRecent > 0 ? (completedRecent / totalRecent) : 0;
					const freezePenalty = (habit.streak.freeze.history?.length || 0) * 0.05;
					const disciplineScore = (habit.streak.current * 0.4) + (completionRate * 0.6) - (freezePenalty * 100);
					const normalizedDiscipline = Math.max(0, Math.round(disciplineScore));
					const momentum = habit.streak.history.filter(h => h.success).reduce((score, entry) => {
						const daysAgo = Math.floor((new Date(today).getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24));
						if (daysAgo <= 3) return score + 3;
						if (daysAgo <= 7) return score + 2;
						if (daysAgo <= 14) return score + 1;
						return score;
					}, 0);
					const attributeImpact = Object.entries(habit.reward.attributes).filter(([_, v]) => v > 0).map(([key, value]) => ({
						name: key,
						total: habit.streak.history.filter(h => h.success).length * value
					}));
					const nextMilestone = habit.progress.milestones.find(m => habit.streak.current < m.target);
					const milestoneProgress = nextMilestone ? Math.round((habit.streak.current / nextMilestone.target) * 100) : 100;
					const streakResets = habit.streak.history.filter((h, i, arr) => i > 0 && arr[i - 1].success && !h.success).length;
					const daysSinceCreation = Math.floor((new Date(DateHelper.today()).getTime() - new Date(habit.created_at).getTime()) / (1000 * 60 * 60 * 24));
					const expected = Math.floor(daysSinceCreation / habit.recurrence.interval);
					const reliability = expected > 0 ? Math.round((totalCompletions / expected) * 100) : 0;

					return (
						<div className="habit-stats-content">
							{/* BOTTOM STATS */}
							<div className="habit-stats-section">

								{/* ===== IDENTITY ===== */}
								<div className="habit-stats-card">
									<h3>🧬 Identity Growth</h3>

									<div className="habit-stats-grid">
										<div><strong>Level:</strong> {habit.progress.level}</div>
										<div><strong>Total Completions:</strong> {totalCompletions}</div>
										<div><strong>Attribute Impact:</strong></div>
										{attributeImpact.map(attr => (
											<div key={attr.name}>
												{attr.name}: {attr.total}
											</div>
										))}
									</div>
								</div>


								{/* ===== PERFORMANCE ===== */}
								<div className="habit-stats-card">
									<h3>🔥 Performance</h3>

									<div className="habit-stats-grid">
										<div><strong>Current Streak:</strong> {habit.streak.current}</div>
										<div><strong>Best Streak:</strong> {habit.streak.best}</div>
										<div><strong>Momentum:</strong> {momentum}</div>
										<div><strong>Discipline Score:</strong> {normalizedDiscipline}%</div>
									</div>
								</div>


								{/* ===== RELIABILITY ===== */}
								<div className="habit-stats-card">
									<h3>📈 Reliability</h3>

									<div className="habit-stats-grid">
										<div><strong>Last 30d Consistency:</strong> {completionRate}%</div>
										<div><strong>Reliability Index:</strong> {reliability}%</div>
										<div><strong>Streak Resets:</strong> {streakResets}</div>
										<div><strong>Days Active:</strong> {daysSinceCreation}</div>
									</div>
								</div>


								{/* ===== RESOURCE SYSTEM ===== */}
								<div className="habit-stats-card">
									<h3>❄ Freeze System</h3>

									<div className="habit-stats-grid">
										<div><strong>Available:</strong> {freezeAvailable}</div>
										<div><strong>Used:</strong> {freezeUsed}</div>
									</div>
								</div>


								{/* ===== PROGRESSION ===== */}
								{nextMilestone && (
									<div className="habit-stats-card">
										<h3>🎁 Progression</h3>

										<div className="habit-stats-grid">
											<div>
												<strong>Next Milestone:</strong> {nextMilestone.target}
											</div>
											<div>
												<strong>Progress:</strong> {milestoneProgress}%
											</div>
										</div>
									</div>
								)}

							</div>
						</div>
					);
				})()}
			</div>}
		</div>
	);
};
