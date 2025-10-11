import React from "react";
// from file (default):
import { UserSettings } from "../../../data/DEFAULT";
import { ProgressBar } from "components/quests/questSideView";

interface UserCardProps {
	user: UserSettings;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
	/* Card displaying user information and XP progress */

    return (
		<div className="card">
			<h2 className="card-title">Level {user.xpDetails.level}</h2>
			<div className="progress-container">
				<ProgressBar value={user.xpDetails.newXp} max={user.xpDetails.lvlThreshold} showPercent={false} className="xp-progress-bar" />
				
				<p className="xp-text">
					{user.xpDetails.newXp}/{user.xpDetails.lvlThreshold}
				</p>
			</div>
			<div>
				<p className="card-subtitle">
					<strong>Name :</strong> {user.persona.name}
				</p>
				<p className="card-subtitle">
					<strong>Classe :</strong> {user.persona.class}
				</p>
				<p className="card-subtitle">
					<strong>Total XP :</strong> {user.xpDetails.xp}
				</p>
			</div>
		</div>
	);
};
