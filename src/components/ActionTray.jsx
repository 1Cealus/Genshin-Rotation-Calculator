import React, { useState } from 'react';
import { characterData } from '../data/character_database';

export const ActionTray = ({ charKey, onAddNotation, onAddSingle, onClose }) => {
    const [notation, setNotation] = useState('');
    const charInfo = characterData[charKey];

    const handleNotationAdd = () => {
        if (!notation) return;
        onAddNotation(notation, charKey);
        setNotation(''); // Clear input after adding
    };

    return (
        <div className="bg-gray-800/80 p-4 rounded-lg mt-4 border border-cyan-500/50">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <img src={charInfo.iconUrl} alt={charInfo.name} className="w-12 h-12 rounded-full" />
                    <h3 className="text-xl font-bold text-white">Add Actions for {charInfo.name}</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            {/* Notation Input for this specific character */}
            <div className="mb-4">
                 <label className="text-sm text-gray-300 block mb-1">Add via Notation</label>
                 <div className="flex gap-2">
                    <input
                        type="text"
                        value={notation}
                        onChange={(e) => setNotation(e.target.value)}
                        placeholder="e.g., e s1 s2 s3a s3b s4a s4b s5 q"
                        className="flex-grow bg-gray-700/80 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button onClick={handleNotationAdd} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors" >
                        Add
                    </button>
                 </div>
            </div>

            {/* Clickable Action List */}
            <div>
                 <label className="text-sm text-gray-300 block mb-1">Or Click to Add</label>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(charInfo.talents).map(([talentKey, talent]) => (
                        <button 
                            key={talentKey}
                            onClick={() => onAddSingle(charKey, talentKey)}
                            className="bg-gray-700/80 hover:bg-gray-700 p-2 rounded-lg text-left transition-colors"
                        >
                            <p className="font-semibold text-white text-sm">{talent.name}</p>
                            {/* FIX: Add a fallback for talents that might not have an alias array */}
                            <p className="text-xs text-cyan-400 font-mono">Alias: {(talent.alias || []).join(', ')}</p>
                        </button>
                    ))}
                 </div>
            </div>
        </div>
    );
};
