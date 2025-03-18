import React, { createContext } from 'react';


import { App } from 'obsidian';

export const AppContext = createContext<App | undefined>(undefined);

export default function ReactView() {
	console.log('reactviexw components');

	return <div>Hello, React!</div>;

};

