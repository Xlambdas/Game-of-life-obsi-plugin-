import React, { createContext, useContext } from "react";
// from file (services) :
import { AppContextService } from "./appContextService";

/*
	This file defines a React context for the application, providing access to the AppContextService
	throughout the component tree. It includes the context type, provider component, and a custom hook
	for consuming the context.
*/

type AppContextType = {
	appService: AppContextService;
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({
	children,
	appService,
}: {
	children: React.ReactNode;
	appService: AppContextService;
}) => {
	return (
		<AppContext.Provider value={{ appService }}>
			{children}
		</AppContext.Provider>
	);
}

export const useAppContext = (): AppContextService => {
	// Custom hook to access the AppContextService instance from the context
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context.appService;
}
