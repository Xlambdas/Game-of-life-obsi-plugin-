import React, { createContext, useContext } from "react";
// from file :
import { AppContextService } from "./appContextService";
import { DataService } from "./services/dataService";

// Responsabilité : exposer via React Context un appService prêt à utiliser pour tous les composants.
// Ne fait pas de calcul métier complexe.

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
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context.appService;
}
