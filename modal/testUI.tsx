import * as ReactDOM from 'react-dom/client';
import { App, Modal, Notice } from 'obsidian';
import React from 'react';
import { X } from 'lucide-react';
// from files (services, Default) :
import { AppContextService } from '../context/appContextService';
import { UserSettings } from '../data/DEFAULT';

interface AttributeCardProps {
	name: string;
	value: number;
	icon: string;
	onIncrease: () => void;
	hasPoints: boolean;
}

const AttributeCard: React.FC<AttributeCardProps> = ({ name, value, icon, onIncrease, hasPoints }) => (
	<div className="attribute-card">
		<div className="attribute-card-icon">{icon}</div>
		<div className="attribute-card-content">
			<div className="attribute-card-name">{name}</div>
			<div className="attribute-card-value">{value}</div>
		</div>
		{hasPoints && (
			<button onClick={onIncrease} className="attribute-card-button">
				+
			</button>
		)}
	</div>
);

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
			const updatedUser = AppContextService.getInstance().getUser();
			setLocalUser(updatedUser);
		} catch (error) {
			console.error('Failed to spend point:', error);
		}
	};

	// Map attributes to icons
	const attributeIcons: Record<string, string> = {
		strength: '💪',
		agility: '🏃',
		endurance: '🛡️',
		intelligence: '🧠',
		wisdom: '📚',
		charisma: '✨',
		perception: '👁️',
		resilience: '🔰',
		spirit: '🕊️',
		willpower: '🔥',
		flow: '🌊'
	};

	// Split attributes into two columns
	const attributes = Object.entries(localUser.attribute);
	const leftColumn = attributes.slice(0, Math.ceil(attributes.length / 2));
	const rightColumn = attributes.slice(Math.ceil(attributes.length / 2));

	return (
		<div className="game-modal-container">
			<button onClick={onClose} className="game-modal-close">
				<X size={24} />
			</button>

			{/* Header Section */}
			<div className="game-modal-header">
				<div className="game-status-badge">STATUS</div>
				<div className="game-level-display">
					<div className="game-level-number">{localUser.xpDetails.level}</div>
					<div className="game-level-label">LEVEL</div>
				</div>
				<div className="game-persona-info">
					<div className="game-persona-row">
						<span className="game-persona-label">JOB:</span>
						<span className="game-persona-value">{localUser.persona.class}</span>
					</div>
					<div className="game-persona-row">
						<span className="game-persona-label">TITLE:</span>
						<span className="game-persona-value">{localUser.persona.name}</span>
					</div>
				</div>
			</div>

			{/* Stats Bars */}
			<div className="game-stats-bars">
				<div className="game-stat-bar">
					<div className="game-stat-icon">⚡</div>
					<div className="game-stat-progress">
						<div 
							className="game-stat-fill xp-fill" 
							style={{ width: `${Math.min(100, (localUser.xpDetails.newXp / localUser.xpDetails.lvlThreshold) * 100)}%` }}
						/>
					</div>
					<div className="game-stat-text">{localUser.xpDetails.newXp}/{localUser.xpDetails.lvlThreshold}</div>
				</div>
				
				<div className="game-stat-bar">
					<div className="game-stat-icon">🔮</div>
					<div className="game-stat-progress">
						<div className="game-stat-fill mp-fill" style={{ width: '100%' }} />
					</div>
					<div className="game-stat-text">{localUser.xpDetails.xp}</div>
				</div>

				<div className="game-free-points">
					<div className="game-free-points-icon">⭐</div>
					<div className="game-free-points-label">POINTS</div>
					<div className="game-free-points-value">{freePts}</div>
				</div>
			</div>

			{/* Attributes Grid */}
			<div className="game-attributes-container">
				<div className="game-attributes-column">
					{leftColumn.map(([key, value]) => (
						<AttributeCard
							key={key}
							name={key.toUpperCase().slice(0, 3)}
							value={value || 0}
							icon={attributeIcons[key] || '⚪'}
							onIncrease={() => handleSpendPoint(key as keyof UserSettings["attribute"])}
							hasPoints={freePts > 0}
						/>
					))}
				</div>
				<div className="game-attributes-column">
					{rightColumn.map(([key, value]) => (
						<AttributeCard
							key={key}
							name={key.toUpperCase().slice(0, 3)}
							value={value || 0}
							icon={attributeIcons[key] || '⚪'}
							onIncrease={() => handleSpendPoint(key as keyof UserSettings["attribute"])}
							hasPoints={freePts > 0}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export class UserModal_test extends Modal {
	/* Modal for the user information and free points */
	private user: UserSettings;
	private root: ReactDOM.Root | null = null;
	private service: AppContextService = AppContextService.getInstance();

	constructor(app: App) {
		super(app);
		this.modalEl.addClass('user-stats-modal');
		this.modalEl.addClass('game-ui-modal');
		const service = AppContextService.getInstance();
		this.user = service.getUser();
	}

	async handleSpendPoint(attribute: keyof UserSettings["attribute"]): Promise<void> {
		try {
			await this.service["xpService"].spendFreePoints(attribute, 1);
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

		this.root = ReactDOM.createRoot(contentEl);
		this.root.render(
			<UserStatsContent
				user={this.user}
				onClose={() => this.close()}
				onSpendPoint={(attr) => this.handleSpendPoint(attr)}
			/>
		);
	}

	onClose() {
		const { contentEl } = this;
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		contentEl.empty();
	}
}
