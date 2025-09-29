import React from "react";
// from file (default):
import { Quest } from "../data/DEFAULT";

interface QuestSideViewProps {
	filteredQuests: Quest[];
	isOpen: boolean;
	filter: string;
	activeTab: "active" | "completed" | "all";
	sortBy: "priority" | "xp" | "difficulty" | "date";
	handleToggle: (e: React.SyntheticEvent<HTMLDetailsElement, Event>) => void;
	handleCompleteQuest: (quest: Quest, completed: boolean) => void;
	setFilter: (filter: string) => void;
	setActiveTab: (tab: "active" | "completed" | "all") => void;
	setSortBy: (sort: "priority" | "xp" | "difficulty" | "date") => void;
	handleModifyQuest: (quest: Quest) => void;
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
			<div className="quest-filter-dropdown">
				<button className="quest-filter-button">
					{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
				</button>
				<div className="quest-filter-options">
				<button
					className={`quest-filter-option ${activeTab === "active" ? "active" : ""}`}
					onClick={() => setActiveTab("active")}
				>
					Active
				</button>
				<button
					className={`quest-filter-option ${activeTab === "completed" ? "active" : ""}`}
					onClick={() => setActiveTab("completed")}
				>
					Completed
				</button>
				<button
					className={`quest-filter-option ${activeTab === "all" ? "active" : ""}`}
					onClick={() => setActiveTab("all")}
				>
					All
				</button>
				</div>
			</div>

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
					className={`quest-sort-option ${sortBy === "xp" ? "active" : ""}`}
					onClick={() => setSortBy("xp")}
				>
					XP Reward
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
					onComplete={handleCompleteQuest}
					onModify={handleModifyQuest}
				/>
			))}
			</div>
		)}
		</details>
	);
};

interface QuestItemProps {
	quest: Quest;
	onComplete: (quest: Quest, completed: boolean) => void;
	onModify: (quest: Quest) => void;
}

const QuestItem: React.FC<QuestItemProps> = ({ quest, onComplete, onModify }) => {
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

			{quest.shortDescription && (
				<div className="quest-description">
					{quest.shortDescription}
				</div>
			)}

			<div className="quest-xp">
				XP: {quest.reward.XP}
			</div>
		</div>
	);
};
