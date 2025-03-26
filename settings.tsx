import { readFileSync } from 'fs';
import { PluginSettingTab, Plugin, App, Setting, Modal } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import { create } from 'domain';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { createRoot, Root } from 'react-dom/client';
// import Sidebar from './view/sidebar';


export interface GameSettings {
	user1: {
		settings: {
			difficulty: string;
			theme: string;
			language: string;
		};
		persona: {
			name: string;
			class: string;
			health: number;
			xp: number;
			level: number;
			newXp: number;
			lvlThreshold: number;
		};
		attribute: {
			strength: number;
			agility: number;
			endurance: number;
			charisma: number;
			wisdom: number;
			perception: number;
			intelligence: number;
		};
		free_pts: number;
		inventory: {};
		equipment: {};
		habits: {};
		quests: {};
		skills: {};
	}
}

export const DEFAULT_SETTINGS: GameSettings = {
	user1: {
		settings: {
			difficulty: 'easy',
			theme: 'default',
			language: 'en',
		},
		persona: {
			name: "User",
			class: "user",
			health: 100,
			xp: 0,
			level: 1,
			newXp: 0,
			lvlThreshold: 100,
		},
		attribute: {
			strength: 10,
			agility: 10,
			endurance: 10,
			charisma: 10,
			wisdom: 10,
			perception: 10,
			intelligence: 10
		},
		free_pts: 0,
		inventory: {},
		equipment: {},
		habits: {},
		quests: {},
		skills: {},
	}
}; // user.persona.level[0] = level, user.persona.level[1] = xp du niveau actuel, user.persona.level[2] = xp total (depuis le début)

export class selfSettingTab extends PluginSettingTab {
	settings: GameSettings;
	plugin: any;

	constructor(app: App, plugin: any) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		const title = containerEl.createEl('h2', { text: 'Game of Life Plugin Settings' });
		title.style.textAlign = 'center';
		console.log('display all : ', this.plugin);

		/** generals settings : include github documentation and tutoriel */
		containerEl.createEl('h4', { text: 'General Settings' });
		new Setting(containerEl)
			.setName('Documentation')
			.setDesc('Click to open the full documentation on github.')
			.addButton(button =>
				button
				.setButtonText('Open Docs')
				.onClick(() => {
					window.open('https://github.com/Xlambdas/game-of-life')
				})
			);

		new Setting(containerEl) // todo
			.setName('Tutorial')
			.setDesc('Click to navigate through the tutorial and the different settings...')
			.addButton(button =>
				button
					.setButtonText('start now')
					.onClick(async () => {
						new tutorialModal(this.app).open();
						console.log('show tutorial')
					})
			);

		/** game settings : include game rules, difficulty, and user persona */
		containerEl.createEl('h4', { text: 'Game Settings' });
		const descGameSettings = containerEl.createEl('p', { text: 'You are not allowed to change the rule of the game, but if you do, do it at your own risk !' });
		descGameSettings.style.fontStyle = 'italic';
		descGameSettings.style.fontSize = '12px';

		new Setting(containerEl)
			.setName('Game\'s Rules')
			.setDesc('Click to have a pop up which show the rules of your game.')
			.addButton(button =>
				button
					.setButtonText('rules')
					.onClick(async () => {
						new RuleModal(this.app).open();
					})
			);

		new Setting(containerEl)
			.setName('Choose your difficulty :')
			.setDesc('Select one of the available choices.')
			.addDropdown(dropdown => {
				dropdown.addOptions({
					easy: 'easy',
					medium: 'medium',
					hard: 'hard',
					platinium: 'platinium',
				});
				dropdown.setValue(this.plugin.settings.user1.settings.difficulty || DEFAULT_SETTINGS.user1.settings.difficulty);
				const difficulty = dropdown.getValue();
				console.log('diff value', difficulty)
				dropdown.onChange(async (diffValue) => {
					const modal = new difficultyModal(this.app);
					modal.openAndWait().then((value) => {
						console.log("Difficulty(file:settings.tsx)=>value get :", value);
						if (value == true) {
							this.plugin.settings.user1.settings.difficulty = diffValue;
							this.plugin.saveSettings();
							console.log('Difficulty(file:settings.tsx)=> Selected if :', value, diffValue);
						} else {
							this.plugin.saveSettings();
							console.log('Difficulty(file:settings.tsx)=> save settings :', value);
						}
					});

				});
			});

		new Setting(containerEl)
			.setName('Username')
			.setDesc('This name will be used for your persona.')
			.addText(text =>
				text
					.setValue(this.plugin.settings.user1.persona.name)
					.onChange(async (value) => {
						this.plugin.settings.user1.persona.name = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Choose your class:')
			.setDesc('Select one of the available choices.')
			.addDropdown(dropdown => {
				dropdown.addOptions({
					user: 'user',
					warrior: 'warrior',
					mage: 'mage',
					rogue: 'rogue',
					healer: 'healer',
				});
				dropdown.setValue(this.plugin.settings.user1.persona.class || DEFAULT_SETTINGS.user1.persona.class);
				const classValue = dropdown.getValue();
				console.log('classe value', classValue)
				dropdown.onChange(async (classValue) => {
					this.plugin.settings.user1.persona.class = classValue;
					this.plugin.saveSettings();
				});
			});

		/** Final settings : delete all the data */
		containerEl.createEl('h4', { text: 'Final Settings' });

		new Setting(containerEl)
			.setName('Reset Game Settings')
			.setDesc('Click to restart the settings to default. Be careful, all your game data may be erased... If so close this window after clicking this button.')
			.addButton(button => {
				button
					.setButtonText('reset')
					.onClick(async () => {
						this.plugin.settings = { ...DEFAULT_SETTINGS};
						console.log('settings reset', this.plugin.settings);
						// useEffect(() => {}, [this.plugin.settings]);
						await this.plugin.saveSettings();
					})
					.buttonEl.style.backgroundColor = '#cb2d06';
			});

		containerEl.createEl('h4', { text: 'Debug' });
		new Setting(containerEl)
			.setName('Xp')
			.addText(text =>
				text
					.setValue(this.plugin.settings.user1.persona.xp.toString())
					.onChange(async (value) => {
						const xpValue = parseInt(value, 10);
						if (!isNaN(xpValue)) {
							this.plugin.settings.user1.persona.xp = xpValue;
							await this.plugin.saveSettings();
						}
					})
					.inputEl.setAttr('type', 'number')
			);
		new Setting(containerEl)
			.setName('level')
			.addText(text =>
				text
					.setValue(this.plugin.settings.user1.persona.level)
					.onChange(async (value) => {
						this.plugin.settings.user1.persona.level = value;
						await this.plugin.saveSettings();
					})
			);

		// ---------- | piste de recherche | ---------------
	// 	containerEl.createEl('h4', { text: 'balec' });

	// 	new Setting(containerEl)
	// 		.setName('test rules')
	// 		.setDesc('patati patata')
	// 		.addButton(button =>
	// 			button
	// 				.setButtonText('test')
	// 				.onClick(async () => {
						
	// 					new HoverPluginModal(this.app).open();
						
	// 				})
	// 				.buttonEl.style.backgroundColor = '#cb2d06'
	// 		);


	// 		new Setting(containerEl)
    //   .setName('toggle')
    //   .addToggle(toggle => 
    //     toggle
    //       .setValue(this.plugin.settings.enableFeature)
    //       .onChange(async (value) => {
    //         this.plugin.settings.enableFeature = value;
    //         await this.plugin.saveSettings();
    //       }));
	// 	new Setting(containerEl)
	// 		.setName('Choose Option')
	// 		.setDesc('Pick an option')
	// 		.addDropdown(radio => 
	// 			radio
	// 			.addOption('yes', 'Yes')
	// 			.addOption('no', 'No')
	// 			.setValue(this.plugin.settings.choice)
	// 			.onChange(async (value) => {
	// 				this.plugin.settings.choice = value;
	// 				await this.plugin.saveSettings();
	// 			}));

	// 	new Setting(containerEl)
	// 	.setName('Level')
	// 	.addSlider(slider => 
	// 	  slider
	// 		.setLimits(1, 100, 1)
	// 		.setValue(this.plugin.settings.level)
	// 		.onChange(async (value) => {
	// 		  this.plugin.settings.level = value;
	// 		  await this.plugin.saveSettings();
	// 		}));

	}
}

// -------------------------- | Class part | --------------------------

class RuleModal extends Modal {
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

class difficultyModal extends Modal {
	private resolve: ((value: boolean) => void) | null = null;

	constructor(app: App) {
		super(app);
	}

	async openAndWait(): Promise<boolean> {
		return new Promise((resolve) => {
			this.resolve = resolve;
			this.open();
		});
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Change the difficulty' });
		contentEl.createEl('p', { text: 'Changing your difficulty will reset your level and your xp.'});
		contentEl.createEl('p', { text: 'If you wait until the level 5, you\'ll be able to get an equivalent bonus of your current level.'});
		const text = contentEl.createEl('p', { text: 'Are you really sure you want to change it ?'});
		text.style.textAlign = 'right';

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("I agree")
					.setCta()
					.onClick(() => {
						if (this.resolve) this.resolve(true);
						this.close();
					})
			);
	}
	onClose() {
		this.contentEl.empty();
	}
}

class tutorialModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Tutorial' });
		contentEl.createEl('p', { text: 'The tutorial is not available for the moment, but you can find some information about the game in the settings.'});
		// contentEl.createEl('p', { text: 'This is the tutorial of the game of life plugin. You will find here some information about the game and how to use it.'});
		// contentEl.createEl('p', { text: 'If you want to have more information, you can go to the documentation on github.'});
		// contentEl.createEl('p', { text: 'You can also find some tips and tricks to level up faster and some warnings about the game.'});
		// contentEl.createEl('p', { text: 'If you have any question, you can ask on the forum or on the github page.'});
	}

	onClose() {
		this.contentEl.empty();
	}
}


// -------------------------- | Function part | --------------------------
export async function openFilePerson(): Promise<any> {
	const path = `${this.app.vault.configDir}/plugins/game-of-life/person.json`; // une fois que le nom du fichier sera changé : ${this.manifest.id}
	try {
		if (await this.app.vault.adapter.exists(path)) {
			const data = await this.app.vault.adapter.read(path);
			const parsed = JSON.parse(data);
			return parsed;
		} else {
			console.warn("File of the person undefined. We need to take the default values.");
			return DEFAULT_SETTINGS.user1.persona;
		}
	} catch (error) {
		console.warn("Impossible de charger le fichier, utilisation des valeurs par défaut :", error);
		return DEFAULT_SETTINGS.user1.persona;
	}
}

export async function existPerson(): Promise<any> {
	try {
		const parsed = await openFilePerson();
		if (parsed.name == ""){
			console.log('exist pas person...');
			return createPerson(parsed);
		} else {
			console.log('exist person..')
			return showPerson(parsed);
		}

	} catch (error) {
		console.error(error);
	}
}


export async function createPerson(parsed: object): Promise<any> {
	try {
		const parse = parsed;
		console.log('create person');
	} catch (error) {
		console.error(error);
	}
}

export async function showPerson(parsed: any): Promise<any> {
	try {
		const parse = parsed;
		console.log('show person : ', parse.name);
		return parse.name;
	} catch (error) {
		console.error(error);
	}
}










// -------------------------- | piste de recherche | --------------------------

// const HoverModal = ({ app }: { app: App }) => {
//     const [showPopover, setShowPopover] = useState(false);

//     return (
//         <div style={{ padding: "20px" }}>
//             <div
//                 onMouseEnter={() => setShowPopover(true)}
//                 onMouseLeave={() => setShowPopover(false)}
//                 style={{ display: "inline-block", padding: "10px", background: "#ddd", cursor: "pointer" }}
//             >
//                 Survole-moi !
//                 {showPopover && (
//                     <div
//                         onMouseEnter={() => setShowPopover(true)} // Garde ouvert si on est dessus
//                         onMouseLeave={() => setShowPopover(false)} // Ferme si on sort
//                         style={{
//                             position: "absolute",
//                             background: "white",
//                             border: "1px solid black",
//                             padding: "10px",
//                             marginTop: "5px",
//                             zIndex: 1000,
//                         }}
//                     >
//                         Contenu de la fenêtre !
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export class HoverPluginModal extends Modal {
//     private root: any;

//     constructor(app: App) {
//         super(app);
//     }

//     onOpen() {
//         const { contentEl } = this;
//         this.root = createRoot(contentEl); // Utilisation de createRoot
//         this.root.render(<HoverModal app={this.app} />);
//     }

//     onClose() {
//         if (this.root) {
//             this.root.unmount(); // Nettoyage propre
//         }
//     }
// }


// async function readJSONFile(filePath: string): Promise<any> {
// 	try {
// 		const data = await readFileSync(filePath, 'utf-8');
// 		return JSON.parse(data);
// 	} catch (error) {
// 		console.error(`Error reading file from disk: ${error}`);
// 		return null;
// 	}
// }

// async function combineData(): Promise<void> {
// 	const settingsPath = path.join(__dirname, 'settings.json');
// 	const userPath = path.join(__dirname, 'user.json');

// 	const settings = await readJSONFile(settingsPath) as GameSettings;
// 	const user = await readJSONFile(userPath) as GameUserData;

// 	if (settings && user) {
// 		// Combine or relate the data as needed
// 		const combinedData = {
// 			...settings,
// 			user: user.persona,
// 		};

// 		console.log('Combined Data:', combinedData);
// 	} else {
// 		console.error('Failed to read one or both JSON files.');
// 	}
// }

// combineData();
