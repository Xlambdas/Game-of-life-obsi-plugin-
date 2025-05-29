import { Plugin, Notice } from 'obsidian';
import { ViewService } from '../services/viewServices';
import GOL from '../plugin';

export function registerCommands(plugin: GOL, viewService: ViewService) {
    // Command to open the sidebar
    plugin.addCommand({
        id: "open RPG sidebar",
        name: "open RPG sidebar",
        callback: () => {
            new Notice("Welcome Back !");
            console.log("print, callback sidebar RPG");
            viewService.openSideView();
        }
    });

    // Command to open the main view
    plugin.addCommand({
        id: "open RPG main view",
        name: "open RPG main view",
        callback: () => {
            console.log("print, callback main view");
            viewService.openMainView();
        }
    });

    // Command to create a new quest
    plugin.addCommand({
        id: "create new quest",
        name: "new quest",
        callback: () => {
            plugin.newQuest();
        }
    });

	// Create a new habit
	plugin.addCommand({
		id: "create new habit",
		name: "new habit",
		callback: () => {
			plugin.newHabit();
		}
	});

    // Command to test sidebar
    plugin.addCommand({
        id: "test sideview",
        name: "test sideview",
        callback: () => {
            console.log("print, callback sidebar RPG");
            viewService.openSidebarRPG();
        }
    });

    // Command to open game life file
    plugin.addCommand({
        id: "open game life file",
        name: "open game life",
        callback: async () => {
            const file = plugin.app.vault.getAbstractFileByPath("database.md");
            if (file) {
                plugin.app.workspace.openLinkText("database.md", "", true);
            } else {
                console.log("Fichier introuvable : database.md");
            }
        }
    });
}
