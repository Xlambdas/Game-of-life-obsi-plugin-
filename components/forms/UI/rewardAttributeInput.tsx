import React, { useState } from "react";
// from file (Default):
import { DEFAULT_ATTRIBUTES } from "data/attributeDetails";


export interface AttributeReward {
	[key: string]: number;
}

export interface AttributeRewardPair {
	attribute: string;
	xp: number;
}

interface RewardAttributeInputProps {
	initialValue?: AttributeReward;
	onChange: (rewards: AttributeReward) => void;
	error: {[key: string]: string};
	setError: (error: {[key: string]: string}) => void;
}

export const RewardAttributeInput: React.FC<RewardAttributeInputProps> = ({
	initialValue = {},
	onChange,
	error, setError
}) => {
	// 🔑 initialise UNIQUEMENT les paires non nulles
	const [pairs, setPairs] = useState<AttributeRewardPair[]>(() => {
		const initPairs = Object.entries(initialValue)
		.filter(([_, xp]) => xp && xp > 0)
		.map(([attr, xp]) => ({
			attribute: attr,
			xp: xp as number,
		}));
		return initPairs.length > 0 ? initPairs : [{ attribute: "", xp: 0 }];
	});

	// Conversion des paires -> objet statBlock complet
	const pairsToAttributes = (pairs: AttributeRewardPair[]) => {
		const result: Record<string, number> = {};
		Object.keys(DEFAULT_ATTRIBUTES).forEach(attr => {
		result[attr] = 0;
		});
		pairs.forEach(p => {
		if (p.attribute && p.xp > 0) {
			result[p.attribute] = p.xp;
		}
		});
		return result;
	};

	const handleChange = (index: number, field: "attribute" | "xp", value: string) => {
		const updated = pairs.map((p, i) =>
		i === index ? { ...p, [field]: field === "xp" ? Number(value) : value } : p
		);
		setPairs(updated);
		onChange(pairsToAttributes(updated));
	};

	const handleAdd = () => {
		setPairs([...pairs, { attribute: "", xp: 0 }]);
	};

	const handleRemove = (index: number) => {
		const updated = pairs.filter((_, i) => i !== index);
		setPairs(updated.length > 0 ? updated : [{ attribute: "", xp: 0 }]);
		onChange(pairsToAttributes(updated));
	};

	// Récupère les attributs déjà sélectionnés (pour désactiver les options doublons)
	const selectedAttributes = pairs.map(p => p.attribute).filter(Boolean);

	return (
		<div className="form-group">
			<label>Attribute XP Rewards:</label>
			<p className="helper-text">Assign XP rewards to specific attributes for this quest.</p>
			<div className="attribute-pairs-container">
				{pairs.map((pair, index) => (
				<div
					key={index}
					className="attribute-pair"
					style={{
						display: "flex",
						alignItems: "center",
						marginBottom: "8px"
					}}
				>
					<select
					value={pair.attribute}
					onChange={(e) => handleChange(index, "attribute", e.target.value)}
					className="input"
					style={{ flex: 1, marginRight: "8px" }}
					>
					<option value="" disabled={!!pair.attribute}>
						Select attribute...
					</option>
					{Object.keys(DEFAULT_ATTRIBUTES).map(attr => (
						<option
						key={attr}
						value={attr}
						disabled={selectedAttributes.includes(attr) && pair.attribute !== attr}
						>
						{attr.charAt(0).toUpperCase() + attr.slice(1)}
						</option>
					))}
					</select>
					<input
					type="number"
					placeholder="XP amount..."
					value={pair.xp || ""}
					onChange={(e) => handleChange(index, "xp", e.target.value)}
					className={error.attributeRewards ? "input-error" : "attribute-xp-input"}
					style={{ width: "35%", marginRight: "8px" }}
					/>
					<button
					type="button"
					onClick={() => handleRemove(index)}
					className="mod-warning"
					style={{
						width: "24px",
						height: "24px",
						padding: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
					>
					×
					</button>
				</div>
				))}
			</div>
			<button type="button" className="mod-cta" onClick={handleAdd}>
				+ Add Attribute Reward
			</button>
		</div>
	);
};
