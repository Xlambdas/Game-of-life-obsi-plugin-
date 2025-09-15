import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { AppProvider } from "../context/appContext";
import { AppContextService } from "../context/appContextService";
import { useState } from "react";
import { useAppContext } from "../context/appContext";
import { SideView } from "../UI/sideView";

// identifiant unique de la vue
export const SIDE_VIEW_TYPE = "side-view";



export class SideViewSetting extends ItemView {
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
		return "sword"; //todo change icon
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
