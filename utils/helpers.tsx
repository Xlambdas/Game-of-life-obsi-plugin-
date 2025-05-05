

// export const getQuestPath = () => {
// 	const vaultPath = (window as any).app.vault.adapter.getBasePath();
// 	const questPath = `${vaultPath}/quests.json`;
// 	return questPath;
// }

// export const getUserPath = () => {
// 	const vaultPath = (window as any).app.vault.adapter.getBasePath();
// 	const userPath = `${vaultPath}/user.json`;
// 	return userPath;
// }

// export const getSettingsPath = () => {
// 	const vaultPath = (window as any).app.vault.adapter.getBasePath();
// 	const settingsPath = `${vaultPath}/settings.json`;
// 	return settingsPath;
// }

// export const readJson = async (filePath: string) => {
// 	const response = await fetch(filePath);
// 	if (!response.ok) {
// 		throw new Error(`Error fetching JSON: ${response.statusText}`);
// 	}
// 	const data = await response.json();
// 	return data;
// }

// export const writeJson = async (filePath: string, data: any) => {
// 	const response = await fetch(filePath, {
// 		method: 'PUT',
// 		headers: {
// 			'Content-Type': 'application/json'
// 		},
// 		body: JSON.stringify(data)
// 	});
// 	if (!response.ok) {
// 		throw new Error(`Error writing JSON: ${response.statusText}`);
// 	}
// 	return response.json();
// }
