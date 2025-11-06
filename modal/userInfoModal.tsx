import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { App, Modal, Notice } from 'obsidian';
// from files (services, Default) :
import { AppContextService } from '../context/appContextService';
import { UserSettings } from '../data/DEFAULT';
import { Plus, User, X } from 'lucide-react';
// from file (UI, helpers) :
import { ProgressBar } from 'components/smallComponents';

export class UserModal extends Modal {
	/* Modal for the user information and free points */
	private user: UserSettings;
	private xpService = AppContextService.getInstance().xpService;

	constructor(app: App) {
		super(app);
		this.user = AppContextService.getInstance().getUser();
		this.modalEl.addClass('user-stats-modal');
		// const service = AppContextService.getInstance();
	}

	async handleSpendPoint(attribute: keyof UserSettings["attribute"]): Promise<void> {
		try {
			await this.xpService.spendFreePoints(attribute, 1);
			// Update local user reference
			this.user = AppContextService.getInstance().getUser();
		} catch (error) {
			new Notice('Failed to spend free point');
			console.error(error);
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('user-modal-container');

		const root = ReactDOM.createRoot(contentEl);
		root.render(
			<UserStatsContent
				user={this.user}
				onClose={() => this.close()}
				onSpendPoint={(attr) => this.handleSpendPoint(attr)}
			/>
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}


interface UserStatsContentProps {
	user: UserSettings;
	onClose: () => void;
	onSpendPoint: (attribute: keyof UserSettings["attribute"]) => Promise<void>;
}

const UserStatsContent: React.FC<UserStatsContentProps> = ({ user, onClose, onSpendPoint }) => {
	const [localUser, setLocalUser] = React.useState(user);
	const freePts = localUser.xpDetails.freePts || 0;

	const handleSpendPoint = async (attribute: keyof UserSettings["attribute"]) => {
		try {
			await onSpendPoint(attribute);
			// Refresh user data after spending
			const updatedUser = AppContextService.getInstance().getUser();
			setLocalUser(updatedUser);
		} catch (error) {
			console.error('Failed to spend point:', error);
		}
	};

	return (
		<div className="user-modal-content">
			<div className="user-modal-header">
				<h2 className="user-modal-title" style={{ textAlign: 'center' }}>
					Character Stats
				</h2>
			</div>

			<div className="user-info-section">
				<div className="progress-container">
					<ProgressBar value={user.xpDetails.newXp} max={user.xpDetails.lvlThreshold} showPercent={false} className="xp-progress-bar" />
					<p className="xp-text">
						{user.xpDetails.newXp}/{user.xpDetails.lvlThreshold}
					</p>
					</div>
				<div className="user-info-main">
					<div>
						<h3 className="user-persona-name">{localUser.persona.name}</h3>
						<p className="user-persona-class">
							Level {localUser.xpDetails.level} {localUser.persona.class}
						</p>
					</div>
					<div className="free-points-display">
						<div className="free-points-number">{freePts}</div>
						<div className="free-points-label">Free Points</div>
					</div>
				</div>

				<div className="user-xp-info">
					<div className="user-xp-total">Total XP: {localUser.xpDetails.xp}</div>
					<div className="progress-bar-wrapper">
						<div className="progress-bar">
							<div
								className="progress-bar-fill"
								style={{ width: `${Math.min(100, (localUser.xpDetails.newXp / localUser.xpDetails.lvlThreshold) * 100)}%` }}
							/>
						</div>
					</div>
					<div className="user-xp-next">
						{localUser.xpDetails.newXp} / {localUser.xpDetails.lvlThreshold} XP to next level
					</div>
				</div>
			</div>

			<div className="attributes-section">
				<h3 className="attributes-title">Attributes</h3>
				{freePts > 0 && (
					<div className="free-points-notice">
						💡 You have {freePts} point{freePts !== 1 ? 's' : ''} to spend!
					</div>
				)}

				<div className="attributes-list">
					{Object.entries(localUser.attribute).map(([key, value]) => (
						<AttributeRow
							key={key}
							name={key}
							value={value || 0}
							onIncrease={() => handleSpendPoint(key as keyof UserSettings["attribute"])}
							hasPoints={freePts > 0}
						/>
					))}
				</div>
			</div>
		</div>
	);
};


interface AttributeRowProps {
	name: string;
	value: number;
	onIncrease: () => void;
	hasPoints: boolean;
}

const AttributeRow: React.FC<AttributeRowProps> = ({ name, value, onIncrease, hasPoints }) => (
	<div className="attribute-row">
		<span className="attribute-name">{name}</span>
		<span className="attribute-value">{value}</span>
		<button
			onClick={onIncrease}
			disabled={!hasPoints}
			className={`attribute-button ${hasPoints ? 'active' : 'disabled'}`}
		>
			<Plus size={14} /> 1
		</button>
	</div>
);
