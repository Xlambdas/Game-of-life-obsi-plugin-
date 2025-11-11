import React, { useState } from 'react';
import { X, Trophy } from 'lucide-react';
// from file (default):
import { UserSettings } from 'data/DEFAULT';

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
				aria-label={`Progression: ${pct}%`}
			/>
		{showPercent && <span className="progress-meta">{pct}%</span>}
		</div>
	);
};


// todo : create UnlocksModal component here
interface UnlocksModalProps {
  user: UserSettings;
  onClose: () => void;
}

export const UnlocksModal: React.FC<UnlocksModalProps> = ({ user, onClose }) => {
  const currentLevel = user.xpDetails.level;
  
  // Define your unlock milestones here
  const unlocks = [
    { level: 5, name: 'Daily Quests', description: 'Unlock daily quest system' },
    { level: 10, name: 'Advanced Attributes', description: 'Unlock flow and spirit attributes' },
    { level: 15, name: 'Equipment Slots', description: 'Equip items for stat bonuses' },
    { level: 20, name: 'Prestige System', description: 'Reset with permanent bonuses' },
    { level: 25, name: 'Guild Features', description: 'Join and create guilds' },
    { level: 30, name: 'Legendary Quests', description: 'Access epic quest chains' },
  ];

  const nextUnlocks = unlocks.filter(u => u.level > currentLevel);
  const unlockedFeatures = unlocks.filter(u => u.level <= currentLevel);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--background-primary)',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={24} />
            Unlocks & Rewards
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {nextUnlocks.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', color: 'var(--text-accent)' }}>Coming Soon</h3>
            {nextUnlocks.map((unlock) => {
              const levelsUntil = unlock.level - currentLevel;
              return (
                <div
                  key={unlock.level}
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    borderLeft: '3px solid var(--text-accent)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {unlock.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {unlock.description}
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: 'var(--background-modifier-border)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      marginLeft: '12px'
                    }}>
                      Lvl {unlock.level}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--text-muted)', 
                    marginTop: '8px',
                    fontStyle: 'italic'
                  }}>
                    {levelsUntil} level{levelsUntil !== 1 ? 's' : ''} to go!
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {unlockedFeatures.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '12px', color: 'var(--text-success)' }}>Unlocked ✓</h3>
            {unlockedFeatures.map((unlock) => (
              <div
                key={unlock.level}
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  opacity: 0.7,
                  borderLeft: '3px solid var(--text-success)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {unlock.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {unlock.description}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: 'var(--text-success)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    marginLeft: '12px'
                  }}>
                    Lvl {unlock.level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {nextUnlocks.length === 0 && unlockedFeatures.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: 'var(--text-muted)'
          }}>
            No unlocks configured yet!
          </div>
        )}
      </div>
    </div>
  );
};
