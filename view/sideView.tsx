import React, { useEffect, useRef, useState } from "react";

// --- | side view interface | ---

interface ParentFunctions {
	loadData: () => void;
	updateXP: (amount: number) => void;
}

interface SideProps {
	isOpen: boolean;
	// onClose: () => void;
	userData: any;
	parentFunctions: ParentFunctions;
}

export const SideView: React.FC<SideProps> = ({
	isOpen,
	// onClose,
	userData,
	parentFunctions
}) => {
	// console.log("file - SideView")

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
				clearTimeout(timeoutRef.current);
			}
		};
	}, [isOpen]);

	if (!isOpen) return null;


	const newLocal = `${(user.newXp / user.lvlThreshold) * 100}`;
	return (
	<div>
		<div className="sidebar">
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

			{/* Habits/Quests */}
			<div className="card"> {/* sinon proposé accordion ? */}
				<h3 className="accordion-title">Habits</h3>
				{user.quests.map((quest: any) => ( // todo - comprendre comment fonctionne .map
					<div key={quest.id} className="quest-item">
						<p>{quest.title}</p>
						<p className="quest-status">{quest.xp}</p>
					</div>
				))}
			</div>
			<div className="card"> {/* sinon proposé accordion ? */}
				<h3 className="accordion-title">Quests</h3>
				{/* {user.quests.map((quest: any) => ( // todo - comprendre comment fonctionne .map
					<div key={quest.id} className="quest-item">
						<p>{quest.title}</p>
						<p className="quest-status">{quest.xp}</p>
					</div>
				))} */}
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
			<button onClick={ () => {
				console.log('button onClick : (file ModalTest - const child) parentFunctions.loadData: ', parentFunctions.loadData);
				parentFunctions.loadData();
				}}>settings
			</button>
			<div className="card">
				<button onClick={() =>{
					console.log('button onClick : (file ModalTest - const child) parentFunctions.updateXP: ', parentFunctions.updateXP);
					parentFunctions.updateXP(10);
				}}>Augmenter XP</button>
				<button onClick={() =>{
					console.log('button onClick : (file ModalTest - const child) parentFunctions.updateXP: ');
					parentFunctions.updateXP(-10);
				}}>diminuer XP</button>
					{/* <button onClick={parentFunctions.updateXP(-10)}>Diminuer XP</button> */}
			</div>
		</div>
	</div>
	);
  };


async function loadQuests(): Promise<any[]> {
    const filePath = `$/plugins/game-of-life/data/user.json`;
    const response = await fetch(filePath);
    return await response.json();
}

async function loadUserData(): Promise<any> {
    const filePath = "path/to/user_data.json";
    const response = await fetch(filePath);
    return await response.json();
}
