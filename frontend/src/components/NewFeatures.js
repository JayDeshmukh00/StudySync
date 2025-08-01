import React from 'react';
import { Icon } from './Icon';

// This component is now just for Flashcards, as the full feature is built out.
// You can add more cards here as you build more features.
export const FlashcardsPage = ({ onBack }) => (
    <div className="animate-fade-in">
        <button onClick={onBack} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center mb-6">
            <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back to Features
        </button>
        <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl shadow-blue-900/20 border border-blue-800/30 text-center">
            <h2 className="text-3xl font-bold mb-4">AI-Powered Flashcards</h2>
            <p className="text-lg text-gray-400">Feature coming soon!</p>
        </div>
    </div>
);
 
// The StudySessionsPage component has been removed from this file.
// Its functionality is now provided by the new StudyLobby and StudyRoom components.

export const MindMapPage = ({ onBack }) => (
    <div className="animate-fade-in">
        <button onClick={onBack} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center mb-6">
            <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back to Features
        </button>
        <div className="bg-white/10 dark:bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-2xl shadow-blue-900/20 border border-blue-800/30 text-center">
            <h2 className="text-3xl font-bold mb-4">Mind Map Generator</h2>
            <p className="text-lg text-gray-400">Feature coming soon!</p>
        </div>
    </div>
);
