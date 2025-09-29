import { App, Modal } from 'obsidian';

export class RuleModal extends Modal {
	/* Modal for the rules of the game (called from the settingTab) */
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl('h2', { text: 'Rules' }).style.textAlign = 'center';
		contentEl.createEl('p', { text: 'Before starting the game, you should know some rules of the game. Try to understand them...'});

		// All the information about the game's rules :
		contentEl.createEl('hr');
		const game_rule = contentEl.createEl('h3', { text: 'About the game' });
		game_rule.style.textAlign = 'center';
		contentEl.createEl('p', { text: 'The game is based on the principle of an RPG, but with a little twist, you will have to do some tasks in the real life to gain experience and level up.'});
		contentEl.createEl('p', { text: 'like a real RPG, you will have a level, xp to gain, some tasks to do and even quest to realize.'});

		contentEl.createEl('br');
		contentEl.createEl('p', { text: 'About the data :'}).style.fontWeight = 'bold';
		contentEl.createEl('p', { text: 'You\'ll be able to access some data, like your persona and your level manager.'}).style.fontStyle = 'italic';
		const lvlManager = contentEl.createEl('p', { text: 'How work the level manager ?'});
		lvlManager.style.fontWeight = 'bold';
		lvlManager.style.textAlign = 'center';
		contentEl.createEl('p', { text: 'You have different attributes (strength, intelligence, agility, health, mana) that can be improved by completing quests, daily tasks, or other activities. Those quests, tasks, and activities will give you XP, which will allow you to level up and improve your attributes. The sum of this XP will be your level.'});
		const wrngData = contentEl.createEl('p', { text: 'You can also lose XP if you don\'t complete your tasks or if you change the difficulty of the game.'});
		wrngData.style.fontStyle = 'italic';
		wrngData.style.textAlign = 'center';
		contentEl.createEl('p', { text: 'You\'ll have some bonus in the game depending of your level, your class, your skills and the difficulty you\'ll choose.'});


		// ... and the difficulty :
		contentEl.createEl('br');
		contentEl.createEl('p', { text: 'About the difficulty :'}).style.fontWeight = 'bold';
		contentEl.createEl('p', { text: 'You can change the difficulty of the game, but be carefull, it will reset your level and xp. Furthermore if you are on level 5 or above you current progression will be convert to bonus.'}).style.fontStyle = 'italic';
		contentEl.createEl('p', { text: 'Easy'}).style.textAlign = 'center';
		const diffEasy = contentEl.createEl('ul');
		diffEasy.createEl('li', { text: 'You don\'t lose XP by not completing daily task.' });
		diffEasy.createEl('li', { text: 'You\'ll have a bonus of 10% of your XP.' });
		contentEl.createEl('p', { text: 'Medium'}).style.textAlign = 'center';
		const diffMedium = contentEl.createEl('ul');
		diffMedium.createEl('li', { text: 'you loose XP if you don\'t complete your daily task 5 days a row.' });
		diffMedium.createEl('li', { text: 'You\'ll have a bonus of 5% of your XP.' });
		contentEl.createEl('p', { text: 'Hard'}).style.textAlign = 'center';
		const diffHard = contentEl.createEl('ul');
		diffHard.createEl('li', { text: 'you loose XP if you don\'t complete your daily task 2 days a row.' });
		diffHard.createEl('li', { text: 'You\'ll have no bonus.' });
		contentEl.createEl('p', { text: 'Platinium'}).style.textAlign = 'center';
		const diffPlatinium = contentEl.createEl('ul');
		diffPlatinium.createEl('li', { text: 'you loose XP if you don\'t complete your daily task.' });
		diffPlatinium.createEl('li', { text: 'You\'ll have a malus of 5% of your XP.' });


		// All the information about the persona :
		contentEl.createEl('hr');
		contentEl.createEl('h3', { text: 'About your Persona'}).style.textAlign = 'center';
		const personaList = contentEl.createEl('ul');
		personaList.createEl('li', { text: 'You\'ll have a persona, which you will create.'});
		personaList.createEl('li', { text: 'This persona will be your character in the game and in the real life.'});
		personaList.createEl('li', { text: 'You can choose his name, his class...'});

		// ... and the differents classes :
		contentEl.createEl('p', { text: 'About the class :'}).style.fontWeight = 'bold';
		contentEl.createEl('p', { text: 'You\'ll find every informations about the possible class in the settings of the plugin. If you are new to this plugin, we advise you to choose the User class in the easy difficulty to understand how the game work (then reset on the settings page to choose the class and difficulty you really want).' }).style.fontStyle = 'italic';
		contentEl.createEl('p', { text: 'You can choose any class you want.'}).style.textAlign = 'center';
		contentEl.createEl('p', { text: 'the class can be choose only once but can evoluate in the time.'}).style.textAlign = 'center';
		contentEl.createEl('p', { text: 'The class will give you some bonus in the game.'}).style.textAlign = 'center';

		contentEl.createEl('br');
		contentEl.createEl('p', { text: 'about the differents classes :'}).style.fontWeight = 'bold';
		contentEl.createEl('p', { text: 'User'}).style.textAlign = 'center'; // user classe
		const userList = contentEl.createEl('ul');
		userList.createEl('li', { text: 'Default class, the most simple to play. You\'ll have no bonus.' });
		contentEl.createEl('p', { text: 'Warrior'}).style.textAlign = 'center'; // warrior classe
		const warriorList = contentEl.createEl('ul');
		warriorList.createEl('li', { text: 'this class is the most powerful, you\'ll have a bonus of 10% of your XP.' });
		contentEl.createEl('p', { text: 'Mage'}).style.textAlign = 'center'; // Mage classe
		const mageList = contentEl.createEl('ul');
		mageList.createEl('li', { text: 'this class is the most intelligent, you\'ll have a bonus of 10% of your XP.' });
		contentEl.createEl('p', { text: 'Rogue'}).style.textAlign = 'center'; // Rogue classe
		const rogueList =contentEl.createEl('ul');
		rogueList.createEl('li', { text: 'this class is the most agile, you\'ll have a bonus of 10% of your XP.' });
		contentEl.createEl('p', { text: 'Healer'}).style.textAlign = 'center'; // Healer classe
		const healerList =contentEl.createEl('ul');
		healerList.createEl('li', { text: 'this class is the most helpful, you\'ll have a bonus of 10% of your XP.' });

		// Part about the tips :
		contentEl.createEl('hr');
		contentEl.createEl('h3', { text: 'Tips' }).style.textAlign = 'center';
		const tipsList = contentEl.createEl('ul');
		tipsList.createEl('li', { text: 'Stay consistent with your tasks to level up faster.' });
		tipsList.createEl('li', { text: 'Choose a class that aligns with your real-life goals.' });
		tipsList.createEl('li', { text: 'Use the plugin settings to track your progress.' });

		// Part about the warnings :
		contentEl.createEl('hr');
		contentEl.createEl('h3', { text: 'Warnings' }).style.textAlign = 'center';
		const warningsList = contentEl.createEl('ul');
		warningsList.createEl('li', { text: 'Changing difficulty will reset your level and XP.' });
		warningsList.createEl('li', { text: 'Choose your class wisely, for the moment it cannot be changed later.' });
		warningsList.createEl('li', { text: 'Read the documentation for detailed rules and guidelines.' });

		// End of the rules :
		contentEl.createEl('br');
		contentEl.createEl('hr');
		contentEl.createEl('h2', { text: 'Good luck with your life !' }).style.textAlign = 'center';
		contentEl.createEl('hr');

	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
