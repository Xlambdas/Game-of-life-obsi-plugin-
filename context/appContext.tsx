import React, { createContext, useContext, useState } from 'react';
import GOL from '../plugin';
import { QuestSettings } from 'constants/DEFAULT';
import { GameSettings } from 'data/settings';

export const AppContext = createContext<AppContextType | null>(null);


export interface AppContextType {
	plugin: GOL;
	user: GameSettings;
	quests: QuestSettings[];
	updateUser: (newData: Partial<GameSettings>) => void;
	updateQuests: (newQuests: QuestSettings[]) => void;
}



