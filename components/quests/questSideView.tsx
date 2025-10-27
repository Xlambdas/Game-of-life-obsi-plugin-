import React from "react";
// from file (default):
import { Quest } from "../../data/DEFAULT";
import { ChevronDown, SortAsc, Filter } from "lucide-react";

interface QuestSideViewProps {
	filteredQuests: Quest[];
	isOpen: boolean;
	filter: string;
	activeTab: "active" | "completed" | "all" | "upcoming";
	sortBy: "priority" | "xp" | "difficulty" | "date";
	handleToggle: (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => void;
	handleCompleteQuest: (quest: Quest, completed: boolean) => void;
	setFilter: (filter: string) => void;
	setActiveTab: (tab: "active" | "completed" | "all" | "upcoming") => void;
	setSortBy: (sort: "priority" | "xp" | "difficulty" | "date") => void;
	handleModifyQuest: (quest: Quest) => void;
	getDaysUntil: (targetDate: Date) => string;
}

export const QuestSideView: React.FC<QuestSideViewProps> = (props) => {
	/* Side view for quests */
	const {
		filteredQuests,
		isOpen,
		filter,
		activeTab,
		sortBy,
		handleToggle,
		handleCompleteQuest,
		setFilter,
		setActiveTab,
		setSortBy,
		handleModifyQuest,
		getDaysUntil
	} = props;

	return (
		<details
			className="quest-list"
			open={isOpen}
			onToggle={handleToggle}
		>
		<summary className="accordion-title">Quests</summary>

		{/* Search bar and filters */}
		<div className="quest-controls">
			<input
				type="text"
				placeholder="Search quests..."
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				className="quest-search"
			/>

			<div className="quest-controls-row">
			{/* Tabs: Active / Completed / All */}

			<button
				className="habit-filter-button"
				onClick={() => {
					const next =
						activeTab === "active"
							? "completed"
							: activeTab === "completed"
							? "all"
							: activeTab === "all"
							? "upcoming"
							: "active";
					setActiveTab(next);
				}}
			>
				{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
			</button>

			{/* Sorting */}
			<div className="quest-sort-dropdown">
				<button className="quest-sort-button">
				Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
				</button>
				<div className="quest-sort-options">
				<button
					className={`quest-sort-option ${sortBy === "priority" ? "active" : ""}`}
					onClick={() => setSortBy("priority")}
				>
					Priority
				</button>
				<button
					className={`quest-sort-option ${sortBy === "difficulty" ? "active" : ""}`}
					onClick={() => setSortBy("difficulty")}
				>
					Difficulty
				</button>
				<button
					className={`quest-sort-option ${sortBy === "date" ? "active" : ""}`}
					onClick={() => setSortBy("date")}
				>
					Date
				</button>
				</div>
			</div>
			</div>
		</div>

		{/* List or message if empty */}
		{filteredQuests.length === 0 ? (
			<div className="no-quests-message">
			{filter ? "No quests match your search" : "No quests available"}
			</div>
		) : (
			<div className="quests-container">
			{filteredQuests.map((quest) => (
				<QuestItem
					key={quest.id}
					quest={quest}
					activeTab={activeTab}
					onComplete={handleCompleteQuest}
					onModify={handleModifyQuest}
					getDaysUntil={getDaysUntil}
				/>
			))}
			</div>
		)}
		</details>
	);
};

interface QuestItemProps {
	quest: Quest;
	activeTab?: "active" | "completed" | "all" | "upcoming";
	onComplete: (quest: Quest, completed: boolean) => void;
	onModify: (quest: Quest) => void;
	getDaysUntil: (targetDate: Date) => string;
}

const QuestItem: React.FC<QuestItemProps> = ({ quest, activeTab, onComplete, onModify, getDaysUntil }) => {
	/* Individual quest item in the list */
	const isEditable = !quest.progression.isCompleted && !quest.meta.isSystemQuest;

	return (
		<div className="quest-item">
			<div className="quest-header">
				<div className="quest-checkbox-section">
				<input
					type="checkbox"
					checked={quest.progression.isCompleted}
					onChange={() => onComplete(quest, !quest.progression.isCompleted)}
					disabled={activeTab === "upcoming"}
					className="quest-checkbox"
				/>
				<span className={`quest-title ${quest.progression.isCompleted ? "completed" : ""}`}>
					{quest.title}
					{quest.meta.isSystemQuest && <span className="quest-system-badge">System</span>}
				</span>
				{isEditable && (
					<button
						className="quest-edit-button"
						onClick={() => onModify(quest)}
						aria-label="Edit quest"
					>
						Edit
					</button>
				)}
				</div>
			</div>
			<ProgressBar value={quest.progression.progress} max={100} showPercent={false} className="quest-progress-bar" />

			{quest.shortDescription && (
				<div className="quest-description">
					{quest.shortDescription}
				</div>
			)}

			{/* Remaining days */}
			{quest.progression.dueDate && !quest.progression.isCompleted ? <div className="quest-xp">
				<strong>{getDaysUntil(new Date(quest.progression.dueDate))} days remaining</strong>
			</div> : null}

			{/* Attributes rewards */}
			<div className="quest-xp">
				{quest.reward.attributes && (Object.entries(quest.reward.attributes)
				.filter(([_, v]) => v !== 0 && v !== null && v !== undefined)
				.map(([key, value]) => (
					<span key={key} className="flex items-center gap-1">
						<span className="text-amber-300 font-medium">{key}: </span>
						<span className="text-amber-100">{value}</span> <br />
					</span>
				)))}
			</div>
		</div>
	);
};



type Props = {
  value: number;       // 0..max
  max?: number;        // default 100
  showPercent?: boolean;
  className?: string;
};

export const ProgressBar: React.FC<Props> = ({ value, max = 100, showPercent = false, className = "" }) => {

  const safeVal = typeof value === "number" && !isNaN(value) ? value : 0;
  const pct = Math.max(0, Math.min(100, Math.round((safeVal / max) * 100)));

  return (
    <div className={`progress ${pct === 100 ? "completed" : ""} ${className}`}>
      <div
        className="progress__fill"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={safeVal}
        aria-label={`Progression ${pct}%`}
      />
      {showPercent && <span className="progress-meta">{pct}%</span>}
    </div>
  );
};
