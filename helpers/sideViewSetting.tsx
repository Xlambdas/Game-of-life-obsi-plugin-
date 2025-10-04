import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
// from files (services, ):
import { AppProvider } from "../context/appContext";
import { AppContextService } from "../context/appContextService";
// from file (UI):
import { SideView } from "../UI/sideView";
import { MainView } from "../UI/mainView";


export const SIDE_VIEW_TYPE = "side-view";
export const MAIN_VIEW_TYPE = "main-view";

export class SideViewSetting extends ItemView {
	/* React root for rendering side view */
	private root: ReactDOM.Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return SIDE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "SideBar View";
	}

	getIcon(): string {
		return "sword";
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();

		this.root = ReactDOM.createRoot(container);
		this.root.render(
			<AppProvider appService={AppContextService.getInstance()}>
				<SideView />
			</AppProvider>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}

export class MainViewSetting extends ItemView {
	/* React root for rendering main view */
	private root: ReactDOM.Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return MAIN_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Main View";
	}

	getIcon(): string {
		return "swords";
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();

		this.root = ReactDOM.createRoot(container);
		this.root.render(
			<AppProvider appService={AppContextService.getInstance()}>
				<MainView />
			</AppProvider>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}


// experimental part for fullscreen main view :

let root: ReactDOM.Root | null = null;
let overlay: HTMLDivElement | null = null;

function handleKeyDown(e: KeyboardEvent) {
	console.log("keydown event:", e.key);
    if (e.key === "Escape") {
        closeFullscreenMainView();
    }
}

export function openFullscreenMainView() {
    if (overlay) return; // already open

    overlay = document.createElement("div");
    overlay.className = "gol-fullscreen-overlay";
    document.body.appendChild(overlay);

    root = ReactDOM.createRoot(overlay);
    root.render(
        <AppProvider appService={AppContextService.getInstance()}>
            <MainView />
            <button
                className="exit-fullscreen"
                onClick={closeFullscreenMainView}
            >
                Exit
            </button>
        </AppProvider>
    );

    // 🔑 add Escape listener
    window.addEventListener("keydown", handleKeyDown);
}

export function closeFullscreenMainView() {
    if (root) {
        root.unmount();
        root = null;
    }
    if (overlay) {
        overlay.remove();
        overlay = null;
    }

    // 🔑 remove listener to avoid leaks
    window.removeEventListener("keydown", handleKeyDown);
}
