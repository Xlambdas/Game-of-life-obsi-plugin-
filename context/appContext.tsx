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
	updateSettings: (newData: Partial<UserSettings>) => void;
	updateXP: (amount: number) => void;
	saveData: () => Promise<void>;
	refreshRate: number;
    // dataService: DataService;
    // quests: QuestSettings[];
    // updateUserSettings: (newData: Partial<UserSettings>) => void;
    // updateQuests: (newQuests: QuestSettings[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);



interface AppContextProviderProps {
	children: React.ReactNode;
	plugin: GOL;
}

export function AppContextProvider({ children, plugin }: AppContextProviderProps) {
	// Initialize the appContextService with the plugin instance
    useEffect(() => {
        appContextService.initialize(plugin);
    }, [plugin]);

	if (!plugin.settings) {
		console.error('plugin.settings is undefined!', plugin);
		return <div>Loading plugin settings...</div>;
	}
    // Utiliser useState pour stocker et mettre à jour le contexte
	const [settings, setSettings] = useState<UserSettings>(plugin.settings ?? DEFAULT_SETTINGS);

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
    const updateSettings = (newData: Partial<UserSettings>) => {
        const updatedSettings = { ...settings, ...newData };
        setSettings(updatedSettings);
        
        // Mettre à jour dans le service et déclencher la sauvegarde
        appContextService.updateUserSettings(updatedSettings);
    };
    const updateXP = (amount: number) => {
        appContextService.updateXP(amount);
    };
    // Fonction pour déclencher manuellement une sauvegarde
    const saveData = async () => {
        await appContextService.saveUserDataToFile();
		await appContextService.saveQuestDataToFile();
    };

	const contextValue: AppContextType = {
		plugin,
		settings,
		updateSettings,
		updateXP,
		saveData,
		refreshRate: appContextService.getRefreshRate(),
		// dataService: plugin.dataService
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

// export const TestuseAppContext = () => useContext(AppContext);



// --------------------------
// Hook to use the AppContext
export function useAppContext(): AppContextType {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
}
