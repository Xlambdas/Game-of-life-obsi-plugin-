import React from "react";


  // --- | side view interface | ---
  
  interface SharedState {
	xp: number;
	level: number;
  }
  
  interface TestMainViewProps {
	sharedState: SharedState;
	updateSharedState: (newState: SharedState) => void;
  }
  
  export const TestMainView: React.FC<TestMainViewProps> = ({ sharedState, updateSharedState }) => {
	const { xp, level } = sharedState;
  
	const handleIncreaseXP = () => {
	  const newXP = xp + 10;
	  updateSharedState({ xp: newXP, level: Math.floor(newXP / 100) + 1 });
	};
  
	const handleDecreaseXP = () => {
	  const newXP = Math.max(xp - 10, 0);
	  updateSharedState({ xp: newXP, level: Math.floor(newXP / 100) + 1 });
	};
  
	return (
	  <div>
		<h2>Test Side View</h2>
		<p>XP: {xp}</p>
		<p>Level: {level}</p>
		<button onClick={handleIncreaseXP}>Augmenter XP</button>
		<button onClick={handleDecreaseXP}>Diminuer XP</button>
	  </div>
	);
  };
