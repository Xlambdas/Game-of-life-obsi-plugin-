import React from "react";

// exemple of modal :
export const ModalTest = ({
  onClose,
  parentFunctions,
}: {
  onClose: () => void;
  parentFunctions: {
    sayHello: () => void;
    increment: () => void;
    reset: () => void;
  };
}) => {
  return (
    <div>
      <h2>Test Modal</h2>
      <button onClick={parentFunctions.sayHello}>Dire Bonjour (Parent)</button>
      <button onClick={parentFunctions.increment}>Incrémenter (Parent)</button>
      <button onClick={parentFunctions.reset}>Réinitialiser (Parent)</button>
      <button onClick={onClose}>Fermer</button>
    </div>
  );
};

// --- | side view interface | ---

interface ParentFunctions {
	loadData: () => void;
	updateXP: (amount: number) => void;
	getChange: (parsed: string) => boolean;

	// calculLevel: (xp: number, level: number) => void;
  }

interface ChildProps {
	userData: any;
	parentFunctions: ParentFunctions;
  }

export const SideView: React.FC<ChildProps> = ({
	userData,
	parentFunctions
}) => {
	console.log("file - SideView")

	const data = JSON.stringify(userData, null, 2);
	const parsed = JSON.parse(data);
	const settings = parsed.user1.settings;
	const user = parsed.user1.persona;
	setTimeout(() => {
		console.log("file sideView - const child - setTimeout");
		if (parentFunctions.getChange(parsed) == true) {
			parentFunctions.loadData();
		}
	}, 60000); // Attendre 1 minute avant de charger les données
	const newLocal = `${(user.newXp / user.lvlThreshold) * 100}`;
	// console.log("test: ", data);
	// console.log("(file ModalTest - const child) parsed: ", parsed);
	// console.log("(file ModalTest - const child) class: ", person.class);
	// console.log("(file ModalTest - const child) updateXP: ", parentFunctions.updateXP);

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

			{/* Quests */}
			<div className="card"> {/* sinon proposé accordion ? */}
				<h3 className="accordion-title">Habits</h3>
				{/* {user.quests.map((quest: any) => ( // todo - comprendre comment fonctionne .map
					<div key={quest.id} className="quest-item">
						<p>{quest.title}</p>
						<p className="quest-status">{quest.xp}</p>
					</div>
				))} */}
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
