import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { App, Modal, Notice } from 'obsidian';
// from files (services, Default) :
import { AppContextService } from '../context/appContextService';
import { UserSettings } from '../data/DEFAULT';
import { attributeDetails } from '../data/attributeDetails';
import { CaseUpper, Plus } from 'lucide-react';
// from file (UI, helpers) :
import { ProgressBar } from 'components/smallComponents';

import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { personaImages } from '../data/image';
import { text } from 'stream/consumers';
import { NextLevelModal } from './NextLevelModal';

interface StatsModalProps {
	user: UserSettings;
	onSpendPoint: (attribute: keyof UserSettings["attribute"]) => Promise<void>;
	app: App;
}

export class UserModal extends Modal {
	private user: UserSettings;
	private root: ReactDOM.Root | null = null;
	private service: AppContextService = AppContextService.getInstance();

	constructor(app: App) {
		super(app);
		this.user = this.service.getUser();
	}

	async handleSpendPoint(attribute: keyof UserSettings["attribute"]): Promise<void> {
		try {
			await this.service["xpService"].spendFreePoints(attribute, 1);
			this.user = this.service.getUser();
			// Re-render to update the UI
			this.render();
		} catch (error) {
			console.error('Failed to spend point:', error);
		}
	}

	render() {
		if (this.root) {
			this.root.render(
				<StatsModal
					user={this.user}
					onSpendPoint={(attr) => this.handleSpendPoint(attr)}
					app={this.app}
				/>
			);
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('user-modal-container');

		// Make the modal wider to accommodate the new layout
		this.modalEl.style.maxWidth = '1200px';
		this.modalEl.style.width = '90vw';

		this.root = ReactDOM.createRoot(contentEl);
		this.render();
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


const StatsModal: React.FC<StatsModalProps> = ({ user: initialUser, onSpendPoint, app }) => {
	type AttrKey = keyof UserSettings['attribute'];

	const [user, setUser] = useState<UserSettings>(initialUser);
	const [selectedAttribute, setSelectedAttribute] = useState<AttrKey | null>(null);
	// const [imageSrc, setImageSrc] = React.useState<string>('');

	React.useEffect(() => {
		setUser(initialUser);
	}, [initialUser]);

	// Prepare radar chart data
	const maxAttribute = Math.max(...Object.values(user.attribute));
	const roundedMax = Math.ceil(maxAttribute / 5) * 5;
	const tickCount = (roundedMax / 5) + 1;
	const radarData = (Object.entries(user.attribute) as [AttrKey, number][])
		.map(([key, value]) => {
			return {
				attribute: attributeDetails[key]?.name || String(key),
				fullName: attributeDetails[key]?.fullName || String(key),
				key: key, // Keep the key to track which attribute was clicked
				value,
				fullMark: maxAttribute
			};
		});

	const handleSpendPoint = async (attrKey: keyof UserSettings['attribute']) => {
		if (user.xpDetails.freePts > 0) {
			await onSpendPoint(attrKey);
		}
	};

	const handleNextLevel = () => {
		const modal = new NextLevelModal(app, user);

		modal.onClose = () => {
			const updatedUser = AppContextService.getInstance().getUser();
			setUser(updatedUser);
		};
		modal.open();
	};

	const userProgress =  user.xpDetails.newXp < user.xpDetails.lvlThreshold ? Math.min(user.xpDetails.newXp / user.xpDetails.lvlThreshold, 1) : 100;
	console.log("User Progress:", userProgress);

	const [currentImage, setCurrentImage] = useState(personaImages['good_guys']);
	useEffect(() => {
		const interval = setInterval(() => {
			// Random chance to blink (about once every 10 seconds on average)
			if (Math.random() < 0.1) {
				setCurrentImage(personaImages['guys_GOL-close eyes']);
				setTimeout(() => {
					setCurrentImage(personaImages['good_guys']);
				}, 500); // blink lasts 1 second
			}
		}, 1000); // check every second
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="stats-modal-wrapper">
			{/* LEFT PANEL - STATS */}
			<div className="stats-panel">
				<h2>Stats</h2>
				{/* RADAR CHART */}
				<div className="radar-chart-container">
					<ResponsiveContainer width="100%" height={300}>
						<RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
							<PolarGrid stroke="rgba(255,255,255,0.1)"/>
							<PolarAngleAxis dataKey="attribute" stroke="#ccc" />
							<PolarRadiusAxis
								angle={90}
								domain={[0, roundedMax]}
								tick={{ fill: "#888" }}
								tickCount={tickCount}
							/>
							<Radar
								name="Attribute"
								dataKey="value"
								stroke="#8884d8"
								fill="url(#grad)"
								fillOpacity={0.8}
							/>
							<defs>
								<radialGradient id="grad" cx="50%" cy="50%" r="50%">
									<stop offset="0%" stopColor="#8884d8" stopOpacity={0.7} />
									<stop offset="100%" stopColor="#8884d8" stopOpacity={0.5} />
								</radialGradient>
							</defs>
							<Tooltip
								contentStyle={{ backgroundColor: "#1a1a1a", border: "none" }}
								formatter={(value: any, name: any, props: any) => {
									return [value, props.payload.fullName];
								}}
							/>
						</RadarChart>
					</ResponsiveContainer>
				</div>

				<div className="stats-info-section">
					{/* Left side - Stats bars */}
					<div className="stats-info-left">
						{/* <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
							<p className="persona-class">{user.persona.class}</p>
							<p className="persona-name">{user.persona.name}</p>
							<p className="persona-level">Level {user.xpDetails.level}</p>
						</div> */}

						{/* XP Bar */}
						<div className="stats-bar-row">
							<div className="stats-bar-label">XP</div>
							<div className="stats-progress-wrapper">
								<div className="stats-progress-fill xp-fill" style={{ width: `${userProgress}%` }} />
							</div>
						</div>

						{/* Mana */}
						<div className="stats-bar-row">
							<div className="stats-bar-label">Mana</div>
							<div className="stats-progress-wrapper">
								<div className="stats-progress-fill mana-fill" style={{ width: user.persona.mana }} />
							</div>
						</div>

						{/* Health */}
						<div className="stats-bar-row">
							<div className="stats-bar-label">Health</div>
							<div className="stats-progress-wrapper">
								<div className="stats-progress-fill health-fill" style={{ width: user.persona.health }} />
							</div>
						</div>

						{/* Free Points */}
						<div className="free-points-container">
							<span className="free-points-label">Free Points:</span>
							<span
								className={`free-points-value ${
									user.xpDetails.freePts > 0 ? 'has-points' : ''
								}`}
							>
								{user.xpDetails.freePts}
							</span>
						</div>

						{userProgress >= 100 && (
							<button
								onClick={() => {
									handleNextLevel();
								}}
								className="next-level-button"
								title="View Unlocks"
							>
								<span className="next-level">Next Level</span>
							</button>
						)}
					</div>

					{/* Right side - Persona image */}
					<div className="persona-image-container">
						<img
							src={currentImage}
							alt={user.persona.name}
							className="persona-image"
						/>
					</div>
				</div>


				{/* Level Display //todo: to re-add level box design? */}
				{/* <div className="level-display-box">
					<div className="level-display-label">Level</div>
					<div className="level-display-number">{user.xpDetails.level}</div>
					<div className="level-display-class">{user.persona.class}</div>
					<div className="level-display-title">{user.persona.name}</div>
				</div> */}
				{/* <div className="persona-info-overlay">
					<div className="persona-class">{user.persona.class}</div>
					<div className="persona-name">{user.persona.name}</div>
				</div> */}
			</div>

			{/* RIGHT PANEL - ATTRIBUTES */}
			<div className="attributes-panel">
				<h2>Attributes</h2>

				<div className="attributes-grid">
					{(Object.entries(user.attribute) as [AttrKey, number][]).map(([key, value]) => {
						const detail = attributeDetails[key];
						return (
							<div
								key={key}
								className={`attribute-card ${selectedAttribute === key ? 'selected' : ''}`}
								onClick={() => setSelectedAttribute(key)}
							>
								<div className="attribute-card-header">
									<div className="attribute-card-name">
										{detail?.fullName || String(key)}
									</div>
									<div className="attribute-card-value">{value}</div>
								</div>

								{user.xpDetails.freePts > 0 && (
									<button
										className="attribute-upgrade-btn"
										onClick={(e) => {
											e.stopPropagation();
											handleSpendPoint(key as keyof UserSettings['attribute']);
										}}
									>
										UPGRADE
									</button>
								)}

								<div className="attribute-info-icon">ⓘ</div>
							</div>
						);
					})}
				</div>

				{selectedAttribute && (() => {
					const key = selectedAttribute;
					const detail = attributeDetails[key];
					const value = user.attribute[key];
					return (
						<div className="attribute-detail-overlay" onClick={() => setSelectedAttribute(null)}>
						<div className="attribute-detail-card" onClick={(e) => e.stopPropagation()}>
							<div className="attribute-detail-header">
							<div className="attribute-detail-icon">{detail?.icon}</div>
							<div className="attribute-detail-info">
								<div className="attribute-detail-category">{detail?.name?.toUpperCase()}</div>
								<h3 className="attribute-detail-name">{detail?.fullName || detail?.name}</h3>
							</div>
							<div className="attribute-detail-value">{value}</div>
							</div>

							<div className="attribute-detail-body">
							<p className="attribute-description">{detail?.description}</p>
							{detail?.benefits && (
								<div className="attribute-benefits">
								<h4>Benefits</h4>
								<ul>
									{detail.benefits.map((b, i) => <li key={i}>{b}</li>)}
								</ul>
								</div>
							)}
							</div>

							<div className="attribute-detail-footer">
							<button className="attribute-detail-close-btn" onClick={() => setSelectedAttribute(null)}>Close</button>
							</div>
						</div>
						</div>
					);
				})()}
			</div>
		</div>
	)
};
