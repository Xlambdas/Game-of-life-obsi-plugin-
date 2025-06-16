export const mainTitle = (contentEl: HTMLElement, title: string) =>{
		const headerContainer = contentEl.createDiv({ cls: "header-container" });
		headerContainer.createEl("h1", { text: title });
	}

export const titleSection = (container: HTMLElement, texte: string) => {
		const title = container.createEl("h3", { text: texte });
		title.style.textAlign = "center";
		title.style.width = "100%";
		title.style.marginBottom = "20px";
		title.style.color = "var(--text-normal)";
		title.style.fontSize = "1.2em";
		title.style.fontWeight = "600";
	}


export const subTitle = (container: HTMLElement, title: string) => {
	const titleEl = container.createEl("h4", { text: title, cls: "section-title" });
	titleEl.style.marginBottom = "10px";
	// titleEl.style.color = "var(--text-accent)";
	titleEl.style.fontSize = "1.2em";
	titleEl.style.fontWeight = "bold";
	titleEl.style.fontStyle = "italic";
	return titleEl;
};

export class DescriptionHelper {
	private element: HTMLElement;

	constructor(container: HTMLElement, text: string) {
		this.element = container.createEl("small", { text });
		this.applyStyles();
	}

	private applyStyles() {
		this.element.style.display = "block";
		this.element.style.marginBottom = "10px";
		this.element.style.color = "var(--text-muted)";
		this.element.style.fontSize = "0.8em";
		this.element.style.fontStyle = "italic";
		this.element.style.fontWeight = "normal";
	}

	setText(text: string) {
		this.element.setText(text);
	}
}
