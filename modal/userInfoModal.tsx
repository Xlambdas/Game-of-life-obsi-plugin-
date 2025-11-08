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

	const userProgress =  user.xpDetails.newXp < user.xpDetails.lvlThreshold ? Math.min(user.xpDetails.newXp / user.xpDetails.lvlThreshold, 1) : 100;

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
								<div className="stats-progress-fill xp-fill" style={{ width: userProgress }} />
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
									<div className="attribute-card-info">
										<div className="attribute-card-icon">
											{detail?.icon}
										</div>
										<div className="attribute-card-name">
											{detail?.name || String(key)}
										</div>
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
										+ UPGRADE
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

const StatsModal_old: React.FC<StatsModalProps> = ({ user: initialUser, onSpendPoint }) => {
	type SelectedAttribute = {
		key: keyof typeof attributeDetails;
		name: string;
		fullName: string;
		icon: string;
		description: string;
		benefits: string[];
		value: number;
	};

  const [user, setUser] = useState(initialUser);
  const [selectedAttribute, setSelectedAttribute] = useState<SelectedAttribute | null>(null);

  // Update local state when prop changes
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Prepare radar chart data
  const radarData = (Object.entries(user.attribute) as [keyof typeof attributeDetails, number][])
    .map(([key, value]) => ({
      attribute: attributeDetails[key]?.name || key,
      value: value,
      fullMark: 25
    }));

  const handleSpendPoint = async (attrKey: keyof UserSettings["attribute"]) => {
    if (user.xpDetails.freePts > 0) {
      await onSpendPoint(attrKey);
      // The parent will update and pass new user data
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '24px',
      padding: '24px',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      borderRadius: '12px',
      fontFamily: 'monospace',
      maxWidth: '1100px',
      margin: '0 auto'
    }}>
      {/* Left Panel - Stats */}
      <div style={{
        flex: '1',
        border: '2px solid #444',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#252525'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '18px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>Stats</h2>

        {/* Radar Chart */}
        <div style={{ marginBottom: '30px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#444" />
              <PolarAngleAxis 
                dataKey="attribute" 
                tick={{ fill: '#e0e0e0', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 25]}
                tick={{ fill: '#888' }}
              />
              <Radar
                name="Attributes"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Free Points */}
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#333',
          borderRadius: '6px',
          border: '1px solid #555'
        }}>
          <div style={{
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>⭐</span>
            <span>Free Points:</span>
            <span style={{
              fontWeight: 'bold',
              fontSize: '18px',
              color: '#ffd700',
              marginLeft: 'auto'
            }}>{user.xpDetails.freePts}</span>
          </div>
        </div>

        {/* XP Bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
            fontSize: '14px'
          }}>
            <span>⚡</span>
            <span>XP:</span>
          </div>
          <div style={{
            width: '100%',
            height: '24px',
            backgroundColor: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #555',
            position: 'relative'
          }}>
            <div style={{
              width: `${(user.xpDetails.newXp / user.xpDetails.lvlThreshold) * 100}%`,
              height: '100%',
              backgroundColor: '#4caf50',
              transition: 'width 0.3s ease'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '12px',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              {user.xpDetails.newXp} / {user.xpDetails.lvlThreshold}
            </div>
          </div>
        </div>

        {/* Mana Bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
            fontSize: '14px'
          }}>
            <span>🔮</span>
            <span>Mana:</span>
          </div>
          <div style={{
            width: '100%',
            height: '24px',
            backgroundColor: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #555',
            position: 'relative'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#2196f3'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '12px',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>
              {user.xpDetails.xp}
            </div>
          </div>
        </div>

        {/* Level Display */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          padding: '12px',
          backgroundColor: '#333',
          borderRadius: '6px',
          border: '1px solid #555'
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>LEVEL</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd700' }}>
            {user.xpDetails.level}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            {user.persona.class}
          </div>
          <div style={{ fontSize: '14px', color: '#e0e0e0' }}>
            {user.persona.name}
          </div>
        </div>
      </div>

      {/* Right Panel - Attributes */}
      <div style={{
        flex: '1',
        border: '2px solid #444',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#252525'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '18px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>Attributes</h2>

        {/* Attributes Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {(Object.entries(user.attribute) as [keyof typeof attributeDetails, number][]).map(([key, value]) => {
            const detail = attributeDetails[key];
            return (
              <div
                key={String(key)}
                style={{
                  padding: '12px',
                  backgroundColor: '#333',
                  borderRadius: '6px',
                  border: '1px solid #555',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => setSelectedAttribute({ key, ...detail, value })}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{detail?.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {detail?.name || key}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#4caf50'
                  }}>
                    {value}
                  </span>
                </div>
                {user.xpDetails.freePts > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpendPoint(key as keyof UserSettings["attribute"]);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#4caf50',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    + UPGRADE
                  </button>
                )}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  fontSize: '12px',
                  color: '#888'
                }}>
                  ⓘ
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Attribute Detail */}
        {selectedAttribute && (
          <div style={{
            padding: '16px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            border: '2px solid #4caf50',
            marginTop: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #444'
            }}>
              <span style={{ fontSize: '28px' }}>{selectedAttribute.icon}</span>
              <div>
                <div style={{ fontSize: '12px', color: '#888' }}>ATTRIBUTE</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {selectedAttribute.fullName}
                </div>
              </div>
              <div style={{
                marginLeft: 'auto',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#4caf50'
              }}>
                {selectedAttribute.value}
              </div>
            </div>
            <p style={{
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '12px',
              color: '#ccc'
            }}>
              {selectedAttribute.description}
            </p>
            {selectedAttribute.benefits && (
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#4caf50'
                }}>
                  BENEFITS:
                </div>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '13px',
                  color: '#ccc'
                }}>
                  {selectedAttribute.benefits.map((benefit, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

