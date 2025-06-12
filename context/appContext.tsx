import React, { createContext, useContext, useState, useEffect } from 'react';
import GOL from '../plugin';
import { appContextService } from './appContextService';
import { viewSyncService } from 'services/syncService';
import { UserSettings, DEFAULT_SETTINGS } from '../constants/DEFAULT';
import { DataService } from '../services/dataService';



export interface AppContextType {
    // updateLevel: (newLevel: number) => void; // Function to update the test level
    plugin: GOL;
    settings: UserSettings;
	updateSettings: (newData: Partial<UserSettings>) => Promise<void>;
	updateXP: (amount: number) => void;
	setXp: (newXp: number) => void;
    resetXp: () => void;
    getCurrentXp: () => number;
    getCurrentLevel: () => number;
    getXpProgress: () => { current: number; needed: number; percentage: number };
	saveData: () => Promise<void>;
	loadData: () => Promise<void>;
	refreshRate: number;
	isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);



interface AppContextProviderProps {
	children: React.ReactNode;
	plugin: GOL;
}

export function AppContextProvider({ children, plugin }: AppContextProviderProps) {
	const [settings, setSettings] = useState<UserSettings>(plugin.settings ?? DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
	// Initialize the appContextService with the plugin instance
    useEffect(() => {
		const initializeServices = async () => {
            if (!plugin.settings) {
                console.error('plugin.settings is undefined!', plugin);
                return;
            }

            try {
                setIsLoading(true);
                
                // Initialiser appContextService avec DataService
                await appContextService.initialize(plugin);
                
                // Charger toutes les données
                await appContextService.loadAllData();
                
                // Mettre à jour l'état local
                const loadedSettings = appContextService.settings || plugin.settings;
                setSettings(loadedSettings);
                
                setIsInitialized(true);
                console.log("✅ AppContext initialized with all services");
            } catch (error) {
                console.error("❌ Failed to initialize AppContext:", error);
                // Fallback sur les settings du plugin
                setSettings(plugin.settings);
            } finally {
                setIsLoading(false);
            }
        };

        initializeServices();
    }, [plugin]);

	// if (!plugin.settings) {
	// 	console.error('plugin.settings is undefined!', plugin);
	// 	return <div>Loading plugin settings...</div>;
	// }


	// appContextService.setContext(contextValue);
	// 	const [appContext, setAppContext] = useState<AppContextType | null>(
    //     AppContextService.getInstance().context
    // );
	// const [user, setUser] = useState<UserSettings>(DEFAULT_SETTINGS);

	// const updateUser = (newData: Partial<UserSettings>) => {
	// 	setUser(prev => ({ ...prev, ...newData }));
	// };

    // S'abonner aux changements de contexte
    // useEffect(() => {
    //     const unsubscribe = AppContextService.getInstance().subscribe(setAppContext);
    //     return unsubscribe;
    // }, []);
    // if (!appContext) {
    //     return <div>Loading...</div>;
    // }

    // Fonction pour mettre à jour les paramètres
    const updateSettings = async (newData: Partial<UserSettings>) => {
		try {
        	const updatedSettings = { ...settings, ...newData };
        	setSettings(updatedSettings);
		
        // Mettre à jour dans le service et déclencher la sauvegarde
        await appContextService.updateUserSettings(updatedSettings);
		} catch (error) {
			console.error("Error updating settings:", error);
			setSettings(settings);
		}
    };
    const updateXP = (amount: number) => {
        appContextService.updateXP(amount);
    };

	const loadData = async () => {
		try {
			setIsLoading(true);
			// Charger les données utilisateur
			await appContextService.loadAllData();
			const loadedSettings = appContextService.settings || plugin.settings;
			setSettings(loadedSettings);
		} catch (error) {
			console.error("Error loading data:", error);
		} finally {
			setIsLoading(false);
		}
	};
    // Fonction pour déclencher manuellement une sauvegarde
    const saveData = async () => {
        await appContextService.saveUserDataToFile();
		await appContextService.saveQuestDataToFile();
		await appContextService.saveHabitDataToFile();
    };

	const contextValue: AppContextType = {
		plugin,
		settings,
		updateSettings,
		updateXP,
        setXp: appContextService.setXp ?? (() => {}),
        resetXp: appContextService.resetXp ?? (() => {}),
        getCurrentXp: appContextService.getCurrentXp ?? (() => 0),
        getCurrentLevel: appContextService.getCurrentLevel ?? (() => 0),
		getXpProgress: appContextService.getXpProgress ?? (() => ({ current: 0, needed: 0, percentage: 0 })),
		saveData,
		loadData,
		refreshRate: appContextService.getRefreshRate(),
		isLoading,
	}

	useEffect(() => {
        // subscribe to changes in the viewSyncService
        const stateUnsubscribe = viewSyncService.onStateChange((newSettings) => {
            if (newSettings) {
                setSettings(newSettings);
            }
        });
		return () => {
            stateUnsubscribe();
        };
	}, []);

    return (
        <AppContext.Provider value={ contextValue  }>
            {children}
        </AppContext.Provider>
    );
}

// --------------------------
// Hook to use the AppContext
export function useAppContext(): AppContextType {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
}
