import React, { useState } from "react";

export function validateValue<T extends readonly string[]>(
	value: string,
	validValues: T,
	fallback: T[number]
): T[number] {
	return (validValues.includes(value as any) ? value : fallback) as T[number];
}

interface FormHeaderProps {
	title: string;
	showAdvanced?: boolean;
	setShowAdvanced?: (show: boolean) => void;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
	title,
	showAdvanced,
	setShowAdvanced,
}) => {
	return (
		<div className="form-header">
			<h1>{title}</h1>
			<label className="switch" title="show/hide advanced options">
				<input
					type="checkbox"
					checked={showAdvanced}
					onChange={(e) => setShowAdvanced && setShowAdvanced(e.target.checked)}
				/>
				<span className="slider round"></span>
			</label>
		</div>
	);
};


interface FormFooterProps {
	onCancel?: () => void;
	onDelete?: () => void;
	submitLabel?: string; // custom label (quest/habit)
}

export const FormFooter: React.FC<FormFooterProps> = ({
	onCancel,
	onDelete,
	submitLabel = "Save"
}) => {
	return (
		<div className="form-footer">
			<span className="required-note">* Required fields</span>
			<div className="button-group">
				{onCancel && (
					<button type="button" onClick={onCancel}>Cancel</button>
				)}
				{onDelete && (
					<button type="button" className="delete-btn" onClick={onDelete}>Delete</button>
				)}
				<button type="submit" className="save-btn">{submitLabel}</button>
			</div>
		</div>
	);
};
