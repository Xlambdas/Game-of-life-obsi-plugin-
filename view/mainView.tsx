import React, { useEffect, useRef } from "react";

// --- | main view interface | ---

interface ParentFunctions {
	loadData: () => void;
	updateXP: (amount: number) => void;
}

interface MainProps {
	isOpen: boolean;
	userData: any;
	parentFunctions: ParentFunctions;
}

export const MainView: React.FC<MainProps> = ({
	isOpen,
	userData,
	parentFunctions
}) => {
	// console.log("file - mainView")

	const data = JSON.stringify(userData, null, 2);
	const parsed = JSON.parse(data);
	const settings = parsed.user1.settings;
	const user = parsed.user1.persona;
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const updateLoop = () => {
		parentFunctions.loadData();
		// console.log("file sideView - const child - updateLoop");
	};

	useEffect(() => {
		if (isOpen) {
			console.log("file sideView - const child - setTimeout");
			timeoutRef.current = setTimeout(updateLoop, 20000); // reload every X seconds
		}
		return () => {
			if (timeoutRef.current) {
			  clearTimeout(timeoutRef.current); // Stop the loop when the component unmounts
			}
		};
	}, [isOpen]);
	if (!isOpen) return null; // If the main view is closed, don't display anything


	const newLocal = `${(user.newXp / user.lvlThreshold) * 100}`;
	return (
		<div className="mainview">
			<div>
				<h1>This is the main viewwww</h1>
				{/* Xp and level */}
				<div className="card">
					<h2 className="card-title">Level {user.level}</h2>
					<progress className="progress-bar" value={newLocal} max="100" style={{  }}>newlocal</progress>
					<p className="xp-text">{user.newXp}/{user.lvlThreshold}</p>
					<div>
						<p className="card-subtitle">Name : {user.name}</p>
						<p className="card-subtitle">Class : {user.class}</p>
						<p className="card-subtitle">Current XP : {user.xp}</p>
					</div>
				</div>


				{/* Stats */}
				<div className="card">
					<h2 className="card-title">Stats</h2>
					{/* {Object.entries(user.stats).map(([key, value]) => (
						<div key={key} className="stat-item">
							<span className="stat-name">{key}</span>
							<span className="stat-value">{value}</span>
						</div>
					))} */}
				</div>

				{/* Skills ?  todo */}
				{/* Badges ? todo */}

		</div>
		<div>
			{/* dev part !! */}
			<h1>Dev</h1>
			<p>Nom: {user.name}</p>
			<p>classe: {user.class}</p>
			<p>xp: {user.xp}</p>
			<div className="card">
				<button onClick={() =>{
					console.log('button onClick : (file ModalTest - const child) parentFunctions.updateXP: ', parentFunctions.updateXP);
					parentFunctions.updateXP(10);
				}}>Augmenter XP</button>
				<button onClick={() =>{
					console.log('button onClick : (file ModalTest - const child) parentFunctions.updateXP: ');
					parentFunctions.updateXP(-10);
				}}>diminuer XP</button>
			</div>
		</div>
	</div>
	);
};
