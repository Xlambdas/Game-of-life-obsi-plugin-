import React from "react";
import ReactDOM from "react-dom/client";
import { App, Modal } from "obsidian";

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export const OpenConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	onCancel,
}) => {
	if (!isOpen) return null;

	return (
		<div className="confirm-overlay">
			<div className="confirm-modal">
				<h2>{title}</h2>

				{description && <p>{description}</p>}

				<div className="confirm-actions">
					<button onClick={onCancel}>
						{cancelText}
					</button>

					<button
						className="danger"
						onClick={onConfirm}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
};


export class ConfirmModal extends Modal {
	private root: ReactDOM.Root | null = null;
	private title: string;
	private description?: string;
	private confirmText?: string;
	private cancelText?: string;
	private onConfirmCallback: () => void;

	constructor(
		app: App,
		opts: {
			title: string;
			description?: string;
			confirmText?: string;
			cancelText?: string;
			onConfirm: () => void;
		}
	) {
		super(app);
		this.title = opts.title;
		this.description = opts.description;
		this.confirmText = opts.confirmText;
		this.cancelText = opts.cancelText;
		this.onConfirmCallback = opts.onConfirm;
	}

	onOpen() {
		this.root = ReactDOM.createRoot(this.contentEl);
		this.root.render(
			<OpenConfirmModal
				isOpen={true}
				title={this.title}
				description={this.description}
				confirmText={this.confirmText}
				cancelText={this.cancelText}
				onConfirm={() => {
					this.onConfirmCallback();
					this.close();
				}}
				onCancel={() => this.close()}
			/>
		);
	}

	onClose() {
		this.root?.unmount();
		this.root = null;
	}
}
