import React from 'react';
import { characterData } from '../data/character_database.js';

/**
 * A modal that allows the user to select a specific talent for a character 
 * before adding it to the rotation.
 */
export const AddActionModal = ({ charKey, onAdd, onClose }) => {
    if (!charKey) return null;

    const charInfo = characterData[charKey];

    const handleTalentSelect = (talentKey) => {
        // Call the onAdd function passed from App.jsx with the character and chosen talent
        onAdd(charKey, talentKey);
        // Close the modal
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-white border-2 border-cyan-500">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Add Action for {charInfo.name}</h2>
                <p className="text-gray-300 mb-4">Select the talent to add to the rotation:</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {Object.entries(charInfo.talents).map(([key, talent]) => (
                        <button
                            key={key}
                            onClick={() => handleTalentSelect(key)}
                            className="w-full text-left bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {talent.name}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="w-full mt-6 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
            </div>
        </div>
    );
};
