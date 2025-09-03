import { ItemView, WorkspaceLeaf } from "obsidian";
import { AppContextService } from "context/appContextService";


export const VIEW_TYPE_QUEST = "quest-view";


export class QuestView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_QUEST;
  }

  getDisplayText() {
    return "Quest Manager";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();

    // Create sidebar
    const sidebar = container.createDiv({ cls: "quest-sidebar" });
    const content = container.createDiv({ cls: "quest-content" });

    // Sample tabs
    const tabs = ["New Quest", "Current Quests"];
    tabs.forEach((tab) => {
      const btn = sidebar.createEl("button", { text: tab });
      btn.onclick = () => {
        content.empty();
        content.createEl("h2", { text: `${tab} Page` });
        // Dynamically inject quest components here
      };
    });
  }

  async onClose() {
    // Clean up if necessary
  }
}
