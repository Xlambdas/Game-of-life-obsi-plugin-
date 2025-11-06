export type AttributeBlock = {
	strength: number;
	agility: number;
	endurance: number;
	charisma: number;
	wisdom: number;
	perception: number;
	intelligence: number;
	willpower: number;
	spirit: number;
	flow: number;
	reputation: number;
	resilience: number;
}

export const DEFAULT_ATTRIBUTES: AttributeBlock = {
	strength: 0,
	agility: 0,
	endurance: 0,
	charisma: 0,
	wisdom: 0,
	perception: 0,
	intelligence: 0,
	willpower: 0,
	spirit: 0,
	flow: 0,
	reputation: 0,
	resilience: 0,
};


interface AttributeDetail {
	name: string;
	fullName: string;
	description: string;
	benefits: string[];
	icon: string;
}

export const attributeDetails: Record<string, AttributeDetail> = {
	strength: {
		name: 'STR',
		fullName: 'Strength',
		icon: '💪',
		description: 'Physical power and raw force. Affects your ability to overcome physical challenges and perform feats of power.',
		benefits: [
			'Increases damage in physical confrontations',
			'Improves ability to move heavy objects',
			'Enhances physical intimidation'
		]
	},
	agility: {
		name: 'AGI',
		fullName: 'Agility',
		icon: '🏃',
		description: 'Speed, reflexes, and coordination. Determines how quickly you can react and move.',
		benefits: [
			'Improves dodge and evasion',
			'Increases initiative in time-sensitive situations',
			'Enhances precision in delicate tasks'
		]
	},
	endurance: {
		name: 'END',
		fullName: 'Endurance',
		icon: '🛡️',
		description: 'Physical stamina and resilience. Your ability to withstand prolonged effort and resist fatigue.',
		benefits: [
			'Increases overall health and durability',
			'Reduces effects of exhaustion',
			'Improves resistance to environmental hazards'
		]
	},
	intelligence: {
		name: 'INT',
		fullName: 'Intelligence',
		icon: '🧠',
		description: 'Mental acuity and reasoning ability. Your capacity for logic, analysis, and learning.',
		benefits: [
			'Enhances problem-solving capabilities',
			'Improves memory and recall',
			'Increases learning speed for new skills'
		]
	},
	wisdom: {
		name: 'WIS',
		fullName: 'Wisdom',
		icon: '📚',
		description: 'Intuition, insight, and awareness. The ability to make sound judgments and perceive deeper truths.',
		benefits: [
			'Improves decision-making quality',
			'Enhances social awareness',
			'Increases resistance to manipulation'
		]
	},
	charisma: {
		name: 'CHA',
		fullName: 'Charisma',
		icon: '✨',
		description: 'Personal magnetism and force of personality. Your ability to influence and inspire others.',
		benefits: [
			'Improves persuasion and negotiation',
			'Enhances leadership abilities',
			'Increases social influence'
		]
	},
	perception: {
		name: 'PER',
		fullName: 'Perception',
		icon: '👁️',
		description: 'Awareness of your surroundings and attention to detail. The ability to notice what others miss.',
		benefits: [
			'Increases chance to spot hidden details',
			'Improves situational awareness',
			'Enhances ability to read people'
		]
	},
	resilience: {
		name: 'RES',
		fullName: 'Resilience',
		icon: '🔰',
		description: 'Mental and emotional fortitude. Your ability to recover from setbacks and persist through adversity.',
		benefits: [
			'Reduces impact of stress and pressure',
			'Improves recovery from mental strain',
			'Increases resistance to fear and doubt'
		]
	},
	spirit: {
		name: 'SPI',
		fullName: 'Spirit',
		icon: '🕊️',
		description: 'Inner strength and connection to deeper purpose. The force of your conviction and beliefs.',
		benefits: [
			'Enhances sense of purpose',
			'Improves morale and motivation',
			'Increases spiritual awareness'
		]
	},
	willpower: {
		name: 'WIL',
		fullName: 'Willpower',
		icon: '🔥',
		description: 'Self-discipline and determination. Your ability to resist temptation and maintain focus on goals.',
		benefits: [
			'Improves self-control and discipline',
			'Enhances focus and concentration',
			'Increases resistance to mental influence'
		]
	},
	flow: {
		name: 'FLO',
		fullName: 'Flow',
		icon: '🌊',
		description: 'Adaptability and harmony with change. Your ability to move smoothly through life\'s challenges.',
		benefits: [
			'Enhances adaptability to new situations',
			'Improves improvisation skills',
			'Increases mental flexibility'
		]
	},
	reputation: {
		name: 'REP',
		fullName: 'Reputation',
		icon: '🏅',
		description: 'The regard in which you are held by others. Affects social interactions and influence.',
		benefits: [
			'Increases trust and credibility',
			'Improves negotiation outcomes',
			'Enhances ability to gather information'
		]
	}
};
