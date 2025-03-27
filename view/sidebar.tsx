import React, { useState, useEffect } from "react";

// --- | side view interface | ---

interface SharedState {
	xp: number;
	level: number;
}

interface TestSideViewProps {
	sharedState: SharedState;
	updateSharedState: (newState: SharedState) => void;
	onClose: () => void;
}

export const TestSideView: React.FC<TestSideViewProps> = ({ sharedState, updateSharedState, onClose }) => {
	const { xp, level } = sharedState;
	const [reloadKey, setReloadKey] = useState(0);

	const handleIncreaseXP = () => {
		const newXP = xp + 10;
		updateSharedState({ xp: newXP, level: Math.floor(newXP / 100) + 1 });
	};

	const handleDecreaseXP = () => {
		const newXP = Math.max(xp - 10, 0);
		updateSharedState({ xp: newXP, level: Math.floor(newXP / 100) + 1 });
	};

	const handleReloadSidebar = () => {
		
		setReloadKey(prevKey => prevKey + 1);
	};

	useEffect(() => {
		return () => {
			onClose(); // Trigger onClose when the component unmounts
		};
	}, [onClose]);

	return (
		<div key={reloadKey}>
			<h2>Test Side View</h2>
			<p>XP: {xp}</p>
			<p>Level: {level}</p>
			<button onClick={handleIncreaseXP}>Augmenter XP</button>
			<button onClick={handleDecreaseXP}>Diminuer XP</button>
			<button onClick={handleReloadSidebar}>Reload Sidebar</button>
		</div>
	);
};
