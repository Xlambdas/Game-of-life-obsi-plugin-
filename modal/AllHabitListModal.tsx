import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App, Modal } from 'obsidian';
import { AppContextService } from 'context/appContextService';
import { AppProvider } from 'context/appContext';
import { Habit } from 'data/DEFAULT';
import { HabitModal } from './habitDetailsModal';


export class HabitListModal extends Modal {
	private root: ReactDOM.Root | null = null;
	private service: AppContextService = AppContextService.getInstance();

	constructor(app: App) {
		super(app);
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
				<HabitList
					service={this.service}
					onClose={() => this.close()}
					onOpenHabit={(habit) => {
						this.close();
						new HabitModal(this.app, habit).open();
					}}
				/>
			</AppProvider>
		);
	}

	onClose() {
		this.root?.unmount();
		this.root = null;
	}
}

interface HabitListProps {
	service: AppContextService;
	onClose: () => void;
	onOpenHabit: (habit: Habit) => void;
}

export const HabitList: React.FC<HabitListProps> = ({
	service,
	onClose,
	onOpenHabit,
}) => {
	const [habits, setHabits] = useState<Habit[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');

	useEffect(() => {
		const load = async () => {
			const all = await service.dataService.loadAllHabits();
			setHabits(all);
			setLoading(false);
		};
		load();
	}, [service]);

	const filtered = habits.filter(h =>
		h.title.toLowerCase().includes(search.toLowerCase()) ||
		(h.description ?? '').toLowerCase().includes(search.toLowerCase())
	);

	const active = filtered.filter(h => !h.isArchived);
	const archived = filtered.filter(h => h.isArchived);

	if (loading) {
		return <div className="habit-list-loading">Loading habits...</div>;
	}

	return (
		<div className="habit-list-container">
			<div className="habit-list-header">
				<h2>All Habits</h2>
				<input
					type="text"
					className="habit-list-search"
					placeholder="Search habits..."
					value={search}
					onChange={e => setSearch(e.target.value)}
				/>
			</div>

			{/* ACTIVE HABITS */}
			<section className="habit-list-section">
				<h3 className="habit-list-section-title">
					Active
					<span className="habit-list-count">{active.length}</span>
				</h3>
				{active.length === 0 ? (
					<p className="habit-list-empty">No active habits found.</p>
				) : (
					<div className="habit-list-grid">
						{active.map(habit => (
							<HabitCard
								key={habit.id}
								habit={habit}
								onClick={() => onOpenHabit(habit)}
							/>
						))}
					</div>
				)}
			</section>

			{/* ARCHIVED HABITS */}
			<section className="habit-list-section habit-list-section--archived">
				<h3 className="habit-list-section-title">
					Archived
					<span className="habit-list-count">{archived.length}</span>
				</h3>
				{archived.length === 0 ? (
					<p className="habit-list-empty">No archived habits.</p>
				) : (
					<div className="habit-list-grid">
						{archived.map(habit => (
							<HabitCard
								key={habit.id}
								habit={habit}
								onClick={() => onOpenHabit(habit)}
								dimmed
							/>
						))}
					</div>
				)}
			</section>
		</div>
	);
};

interface HabitCardProps {
	habit: Habit;
	onClick: () => void;
	dimmed?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onClick, dimmed = false }) => {
	const totalCompletions = habit.streak.history.filter(h => h.success).length;

	return (
		<div
			className={`habit-card ${dimmed ? 'habit-card--archived' : ''}`}
			onClick={!dimmed ? onClick : undefined}
			role="button"
			tabIndex={dimmed ? -1 : 0}
			onKeyDown={e => !dimmed && e.key === 'Enter' && onClick()}
			aria-disabled={dimmed}
		>
			<div className="habit-card-header">
				<span className="habit-card-title">{habit.title}</span>
				<span className="habit-card-level">Lv. {habit.progress.level}</span>
			</div>
			{habit.description && (
				<p className="habit-card-description">{habit.description}</p>
			)}
			<div className="habit-card-meta">
				<span className="habit-card-meta-item">
					🔥 {habit.streak.current} streak
				</span>
				<span className="habit-card-meta-item">
					✅ {totalCompletions} total
				</span>
				<span className="habit-card-meta-item">
					{habit.settings.category}
				</span>
				<span className={`habit-card-difficulty habit-card-difficulty--${(habit.settings.difficulty ?? 'normal').toLowerCase()}`}>
					{habit.settings.difficulty ?? 'normal'}
				</span>
			</div>
		</div>
	);
};
