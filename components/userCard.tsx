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
import { useAppContext } from "context/appContext";
import { on } from "events";



interface UserCardProps {
	user: UserSettings;
	onUserUpdate?: (updatedUser: UserSettings) => void;
	onNextLevel?: () => boolean;
}

export const UserCard: React.FC<UserCardProps> = ({user, onUserUpdate, onNextLevel}) => {
	/* Card displaying user information and XP progress */
	const appService = useAppContext();
	const app = appService.getApp();
	const [currentUser, setCurrentUser] = useState<UserSettings>(user);

	useEffect(() => {
		// Écouter les mises à jour de la database
		const handleUserUpdate = async (event: CustomEvent) => {
			console.log("UserCard received dbUpdated event");
			const freshUser = appService.dataService.getUser();
			setCurrentUser(freshUser);
			onUserUpdate?.(freshUser);
		};

		document.addEventListener("dbUpdated", handleUserUpdate as EventListener);

		return () => {
			document.removeEventListener("dbUpdated", handleUserUpdate as EventListener);
		};
	}, [appService, onUserUpdate]);

	// Mettre à jour quand les props changent aussi
	useEffect(() => {
		setCurrentUser(user);
	}, [user]);

	const freePts = currentUser.xpDetails.freePts || 0;
	const nextLevel = currentUser.xpDetails.newXp >= currentUser.xpDetails.lvlThreshold;

    return (
		<div className="card">
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				marginBottom: '4px'
			}}>
				<button
					onClick={() => new UserModal(app, onUserUpdate).open()}
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
					Level {currentUser.xpDetails.level}
				</h2>
				<button
					onClick={() => new NextLevelModal(app, currentUser).open()}
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
					value={currentUser.xpDetails.newXp}
					max={currentUser.xpDetails.lvlThreshold}
					showPercent={false}
				/>
				<div className="xp-text">
					{currentUser.xpDetails.newXp}/{currentUser.xpDetails.lvlThreshold}
				</div>
			</div>
		</div>
	);
};
