import React, { createContext, useContext } from "react";
// from file :
import { AppContextService } from "./appContextService";

const AppContext = createContext<AppContextService | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
	const service = AppContextService.getInstance();

	return (
		<AppContext.Provider value={service}>
			{children}
		</AppContext.Provider>
	);
}

export const useApp = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context;
}
