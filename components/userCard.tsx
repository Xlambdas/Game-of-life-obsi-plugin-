import React, { useState } from "react";
import { UserSettings } from "../data/DEFAULT";
import { useAppContext } from "../context/appContext";
import { addXP } from "../context/services/xpService";
import { Notice } from "obsidian";



interface UserCardProps {
	user: UserSettings;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {

    return (
		<div className="card">
			<h2 className="card-title">Level {user.xpDetails.level}</h2>
			<div className="progress-container">
				<progress
					className="progress-bar"
					value={(user.xpDetails.newXp / user.xpDetails.lvlThreshold) * 100}
					max={100}
					title={`${user.xpDetails.newXp}/${user.xpDetails.lvlThreshold} XP`}
				/>
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
