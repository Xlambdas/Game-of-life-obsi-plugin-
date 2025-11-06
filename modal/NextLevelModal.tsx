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

interface UnlockItem {
	category: string;
	name: string;
	description?: string;
	benefits?: string[];
	icon?: string;
}



const LevelContainer: React.FC<LevelContainerProps> = ({ user, onClose, onNextLevel }) => {
	const isNextLevel = user.xpDetails.newXp >= user.xpDetails.lvlThreshold;
	const nextLevel = user.xpDetails.level + 1;
	const upcomingUnlocks = getUnlocksForLevel(nextLevel);
	const [selectedUnlock, setSelectedUnlock] = React.useState<UnlockItem | null>(null);


	return (
		<div className="user-modal-content">
			{/* header */}
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

			{/* body - with unlocks */}
			<div>
				{upcomingUnlocks.length > 0 && (
					<div className="unlocks-section">
						<h2>Next Level Previews</h2>
						<div className="unlocks-grid">
							{upcomingUnlocks.map((unlock, index) => (
								<div
									key={index}
									className="unlock-item"
									onClick={() => setSelectedUnlock(unlock)}
								>
									<span className="unlock-category">{unlock.category}</span>
									<span className="unlock-name">{unlock.name}</span>
									<span className="unlock-info-icon">ⓘ</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Unlock Detail Popover */}
			{selectedUnlock && (
				<div
					className="unlock-detail-overlay"
					onClick={() => setSelectedUnlock(null)}
				>
					<div
						className="unlock-detail-card"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="unlock-detail-header">
							<div>
								<h3 className="unlock-detail-name">{selectedUnlock.name}</h3>
							</div>
							<span className="unlock-detail-category">{selectedUnlock.category}</span>
						</div>

						<div className="unlock-detail-body">
							{selectedUnlock.description && (
								<p className="unlock-description">{selectedUnlock.description}</p>
							)}

							{selectedUnlock.benefits && selectedUnlock.benefits.length > 0 && (
								<div className="unlock-benefits">
									<h4>Benefits:</h4>
									<ul>
										{selectedUnlock.benefits.map((benefit, i) => (
											<li key={i}>{benefit}</li>
										))}
									</ul>
								</div>
							)}
						</div>

						<div className="unlock-detail-footer">
							<button
								className="unlock-detail-close-btn"
								onClick={() => setSelectedUnlock(null)}
							>
								Got it!
							</button>
						</div>
					</div>
				</div>
			)}

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
