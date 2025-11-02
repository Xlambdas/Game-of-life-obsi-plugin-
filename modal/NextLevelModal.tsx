import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { App, Modal, Notice } from 'obsidian';
// from files (services, Default) :
import { AppContextService } from '../context/appContextService';
import { UserSettings } from '../data/DEFAULT';


export class NextLevelModal extends Modal {
	/* Modal to show the things unlocked on next level  - if the user change level then this updates */
	private user: UserSettings;
	private xpService = AppContextService.getInstance().xpService;

	constructor(app: App, user: UserSettings) {
		super(app);
		this.user = user;
		this.modalEl.addClass('next-level-modal');
		const service = AppContextService.getInstance();
	}

	public nextLevel = async (): Promise<void> => {
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
	return (
		<div className="level-up-container">
			<h2>Congratulations!</h2>
			<p>You've reached Level {user.xpDetails.level}!</p>
			<button className="next-level-button" onClick={onNextLevel}>
				Next Level
			</button>
			<button className="close-button" onClick={onClose}>
				Close
			</button>
		</div>
	);
}
