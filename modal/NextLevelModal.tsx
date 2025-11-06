import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { App, Modal, Notice } from 'obsidian';
// from files (services, Default) :
import { AppContextService } from '../context/appContextService';
import { UserSettings } from '../data/DEFAULT';
import { getUnlocksForLevel } from 'helpers/unlocksHelpers';


export class NextLevelModal extends Modal {
	/* Modal to show the things unlocked on next level  - if the user change level then this updates */
	private user: UserSettings;
	private xpService = AppContextService.getInstance().xpService;

	constructor(app: App, user: UserSettings) {
		super(app);
		this.user = user;
		this.modalEl.addClass('user-stats-modal');
		// const service = AppContextService.getInstance();
	}

	public nextLevel = async (): Promise<void> => {
		console.log("Going to next level...");
		await Promise.resolve(this.xpService.goNextLevel(this.user));
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('user-modal-container');

		const root = ReactDOM.createRoot(contentEl);
		root.render(
			<LevelContainer
				user={this.user}
				onClose={() => this.close()}
				onNextLevel={this.nextLevel}
			/>
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}


interface LevelContainerProps {
	user: UserSettings;
	onClose: () => void;
	onNextLevel: () => Promise<void>;
}





const LevelContainer: React.FC<LevelContainerProps> = ({ user, onClose, onNextLevel }) => {
	const isNextLevel = user.xpDetails.newXp >= user.xpDetails.lvlThreshold;
	const nextLevel = user.xpDetails.level + 1;
	const currentUnlocks = getUnlocksForLevel(user.xpDetails.level);
	const upcomingUnlocks = getUnlocksForLevel(nextLevel);


	return (
		<div className="user-modal-content">
			{isNextLevel ? (
				<div>
					<div className="level-up-message">
						<p>Congratulations! You can now go on the next level!</p>
					</div>
				</div>
			) : (
				<div className="xp-progress-section level-up-message">
					<p className="">
						Need <strong>{user.xpDetails.lvlThreshold - user.xpDetails.newXp}</strong> more XP to reach Level {nextLevel}
					</p>
				</div>
			)}

			<div>
				{upcomingUnlocks.length > 0 && (
					<div className="unlocks-section">
						<h2>Next Level Previews</h2>
						<div className="unlocks-grid">
							{upcomingUnlocks.map((unlock, index) => (
								<div key={index} className="unlock-item">
									<span className="unlock-category">{unlock.category}</span>
									<span className="unlock-name">{unlock.name}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* second part */}
			{isNextLevel ? (
				<div>
					<button
						className="next-level-button"
						onClick={async () => {
							await onNextLevel();
							new Notice(`You've advanced to level ${nextLevel}!`);
							onClose();
						}}
					>
						<span className="button-level-transition">
							<span className="current-level">Level {user.xpDetails.level}</span>
							<span className="level-arrow">→</span>
							<span className="next-level">Level {nextLevel}</span>
						</span>
					</button>
				</div>
			) : (
				<button className="close-button" onClick={onClose}>
					Close
				</button>
			)}
		</div>
	);
};




const LevelContainer_new: React.FC<LevelContainerProps> = ({ user, onClose, onNextLevel }) => {
	const isNextLevel = user.xpDetails.newXp >= user.xpDetails.lvlThreshold;
	const nextLevel = user.xpDetails.level + 1;
	const currentUnlocks = getUnlocksForLevel(user.xpDetails.level);
	const upcomingUnlocks = getUnlocksForLevel(nextLevel);

	return (
		<div className="level-up-container">
			{isNextLevel ? (
				<>
					<div className="level-up-header">
						<h1>🎉 Level Up!</h1>
						<p className="level-display">Level {user.xpDetails.level} → Level {nextLevel}</p>
					</div>
					<div className="level-up-animation">
						<p>Congratulations! You can now advance to the next level!</p>
					</div>

					{upcomingUnlocks.length > 0 && (
						<div className="unlocks-section">
							<h2>🔓 New Unlocks at Level {nextLevel}</h2>
							<div className="unlocks-grid">
								{upcomingUnlocks.map((unlock, index) => (
									<div key={index} className="unlock-item">
										<span className="unlock-category">{unlock.category}</span>
										<span className="unlock-name">{unlock.name}</span>
									</div>
								))}
							</div>
						</div>
					)}

					<button
						className="next-level-button"
						onClick={async () => {
							await onNextLevel();
							new Notice(`You've advanced to level ${nextLevel}!`);
							onClose();
						}}
					>
						Advance to Level {nextLevel}
					</button>
				</>
			) : (
				<>
					<h2>Current Progress</h2>
					<p className="xp-progress">
						You have <strong>{user.xpDetails.newXp}</strong> XP
					</p>
					<p className="xp-needed">
						Need <strong>{user.xpDetails.lvlThreshold - user.xpDetails.newXp}</strong> more XP to reach Level {nextLevel}
					</p>

					{currentUnlocks.length > 0 && (
						<div className="unlocks-section">
							<h2>✨ Current Level Unlocks (Level {user.xpDetails.level})</h2>
							<div className="unlocks-grid">
								{currentUnlocks.map((unlock, index) => (
									<div key={index} className="unlock-item unlocked">
										<span className="unlock-category">{unlock.category}</span>
										<span className="unlock-name">{unlock.name}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{upcomingUnlocks.length > 0 && (
						<div className="unlocks-section">
							<h2>🔒 Next Level Preview (Level {nextLevel})</h2>
							<div className="unlocks-grid">
								{upcomingUnlocks.map((unlock, index) => (
									<div key={index} className="unlock-item locked">
										<span className="unlock-category">{unlock.category}</span>
										<span className="unlock-name">{unlock.name}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</>
			)}

			<button className="close-button" onClick={onClose}>
				Close
			</button>
		</div>
	);
};
