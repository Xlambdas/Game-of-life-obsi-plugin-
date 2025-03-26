import React from "react";

// --- | main view interface | ---

interface ParentFunctions {
	loadData: () => void;
	updateXP: (amount: number) => void;
	getChange: (parsed: string) => boolean;
  }

interface MainProps {
	userData: any;
	parentFunctions: ParentFunctions;
  }

export const MainView: React.FC<MainProps> = ({
	userData,
	parentFunctions
}) => {
	console.log("file - mainView")

	const data = JSON.stringify(userData, null, 2);
	const parsed = JSON.parse(data);
	const settings = parsed.user1.settings;
	const user = parsed.user1.persona;
	// parentFunctions.loadData;
	setTimeout(() => {
		console.log("file mainView - const child - setTimeout");
		if (parentFunctions.getChange(parsed) == true) {
			parentFunctions.loadData();
		}
	}, 60000); // Attendre 1 minute avant de charger les données
	const newLocal = `${(user.newXp / user.lvlThreshold) * 100}`;

	return (
	  <div>
		<div className="mainview">
			<h1>This is the main view</h1>
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
