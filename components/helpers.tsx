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
