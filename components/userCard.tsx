import React, { useEffect, useState } from "react";
import { App } from "obsidian";
// from file (default, services):
import { UserSettings } from "../data/DEFAULT";
import { AppContextService } from "../context/appContextService";
// from file (UI, helpers) :
import { ProgressBar } from "./smallComponents";
import { UserModal } from "modal/userInfoModal";
import { NextLevelModal } from "modal/NextLevelModal";
import { User, Trophy } from "lucide-react";



interface UserCardProps {
	app: App;
	context: AppContextService;
	user: UserSettings;
	onNextLevel?: () => boolean;
}

export const UserCard: React.FC<UserCardProps> = ({app, context, user, onNextLevel}) => {
	/* Card displaying user information and XP progress */

	const freePts = user.xpDetails.freePts || 0;
	const nextLevel = user.xpDetails.newXp >= user.xpDetails.lvlThreshold;

    return (
		<div className="card">
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				marginBottom: '12px'
			}}>
				<button
					onClick={() => new UserModal(app).open()}
					className="user-modal-button"
					title="View Stats & Spend Points"
				>
					<User size={16} />
					{freePts > 0 && (
						<span className="free-points-indicator">
							{freePts}
						</span>
					)}
				</button>
				<h2 className="card-title" style={{ margin: 0, flex: 1, textAlign: 'center' }}>
					Level {user.xpDetails.level}
				</h2>
				<button
					onClick={() => new NextLevelModal(app, user).open()}
					className="user-modal-button"
					title="View Unlocks"
				>
					<Trophy size={16} />
					{nextLevel && (
						<span className="free-points-indicator">
							{1}
						</span>
					)}
				</button>

			</div>
			<div className="progress-container">
				<ProgressBar
					value={user.xpDetails.newXp}
					max={user.xpDetails.lvlThreshold}
					showPercent={false}
					className="xp-progress-bar"
				/>
				<p className="xp-text">
					{user.xpDetails.newXp}/{user.xpDetails.lvlThreshold}
				</p>
			</div>
		</div>
	);
};
