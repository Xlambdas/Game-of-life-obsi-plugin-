export const mainTitle = (contentEl: HTMLElement, title: string) =>{
		const headerContainer = contentEl.createDiv({ cls: "header-container" });
		headerContainer.createEl("h1", { text: title });
	}
