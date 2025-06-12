import { StatBlock } from "constants/DEFAULT";
import { App, Notice } from "obsidian";
import GOL from "plugin";

export interface LevelCalculation {
    level: number;
    newXp: number;
    lvlThreshold: number;
    leveledUp: boolean;
}

export class XpService {
	private app: App;
	private plugin: GOL;
	private attributes: StatBlock;
	private xp: number = 0;

	constructor(app: App, plugin: GOL) {
		this.app = app;
		this.plugin = plugin;
	}

	public updateAttributes(): void {
		const user = this.plugin.settings.user1;
		if (user && user.attribute && user.persona) {
			const { strength, agility, endurance, charisma, wisdom, perception, intelligence } = user.attribute;
			const totalAttributes = strength + agility + endurance + charisma + wisdom + perception + intelligence;
			
			user.attribute.strength = strength;
			user.attribute.agility = agility;
			user.attribute.endurance = endurance;
			user.attribute.charisma = charisma;
			user.attribute.wisdom = wisdom;
			user.attribute.perception = perception;
			user.attribute.intelligence = intelligence;
            this.plugin.saveSettings();
		} else {
			console.error("User or persona settings are not available.");
		}
	}

	public getXp(): number {
		return this.xp;
	}


	public getCurrentXp(): number {
        return this.plugin.settings?.user1?.persona?.xp ?? 0;
    }

    public getCurrentLevel(): number {
        return this.plugin.settings?.user1?.persona?.level ?? 1;
    }

    public addXp(amount: number): LevelCalculation {
        if (!this.plugin.settings?.user1?.persona) {
            throw new Error("User persona not available");
        }

        const persona = this.plugin.settings.user1.persona;
        const oldLevel = persona.level;
        
        // Add XP (ensure it doesn't go below 0)
        persona.xp = Math.max(0, persona.xp + amount);

        // Calculate new level
        const calculation = this.calculateLevel(persona.xp, oldLevel);
        
        // Update persona with new values
        persona.level = calculation.level;
        persona.newXp = calculation.newXp;
        persona.lvlThreshold = calculation.lvlThreshold;

        // Show level up notice if leveled up
        if (calculation.leveledUp) {
            new Notice(`Level up! You are now level ${calculation.level}!`);
        }

        return calculation;
    }

    public setXp(newXp: number): LevelCalculation {
        if (!this.plugin.settings?.user1?.persona) {
            throw new Error("User persona not available");
        }

        const persona = this.plugin.settings.user1.persona;
        const oldLevel = persona.level;
        
        persona.xp = Math.max(0, newXp);
        
        const calculation = this.calculateLevel(persona.xp, oldLevel);
        
        persona.level = calculation.level;
        persona.newXp = calculation.newXp;
        persona.lvlThreshold = calculation.lvlThreshold;

        if (calculation.leveledUp) {
            new Notice(`Level up! You are now level ${calculation.level}!`);
        }

        return calculation;
    }

    public resetXp(): void {
        if (!this.plugin.settings?.user1?.persona) {
            throw new Error("User persona not available");
        }

        const persona = this.plugin.settings.user1.persona;
        persona.xp = 0;
        persona.newXp = 0;
        persona.level = 1;
        persona.lvlThreshold = 100;
    }

    private calculateLevel(totalXp: number, currentLevel: number): LevelCalculation {
        let level = 1;
        let remainingXp = totalXp;
        let threshold = 100;
        let leveledUp = false;

        // Calculate the correct level based on total XP
        while (remainingXp >= threshold) {
            if (level === currentLevel) {
                leveledUp = true;
            }
            remainingXp -= threshold;
            threshold = Math.trunc(threshold * 1.2);
            level++;
        }

        // If we ended up with a higher level than current, we leveled up
        if (level > currentLevel) {
            leveledUp = true;
        }

        return {
            level,
            newXp: remainingXp,
            lvlThreshold: threshold,
            leveledUp
        };
    }

    public getXpForNextLevel(): number {
        if (!this.plugin.settings?.user1?.persona) {
            return 100;
        }

        return this.plugin.settings.user1.persona.lvlThreshold - this.plugin.settings.user1.persona.newXp;
    }

    public getProgressToNextLevel(): number {
        if (!this.plugin.settings?.user1?.persona) {
            return 0;
        }

        const persona = this.plugin.settings.user1.persona;
        return (persona.newXp / persona.lvlThreshold) * 100;
    }
}
