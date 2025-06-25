import React from 'react';
import { characterData } from '../data/character_database';
import { enemyData } from '../data/enemy_database';

// A single team slot component
const TeamSlot = ({ charKey, onSelect, availableCharacters }) => {
    const charInfo = charKey ? characterData[charKey] : null;

    // This conditional class is the key fix.
    // It makes the select's text transparent when a character is chosen, hiding the native text.
    const selectClassName = `appearance-none w-full h-20 bg-gray-800/60 border-2 border-dashed border-gray-600 rounded-lg p-2 pl-24 text-lg font-bold focus:outline-none focus:border-cyan-500 transition-all ${
        charInfo ? 'text-transparent' : 'text-gray-500' // Make text transparent if char selected
    }`;

    return (
        <div className="relative">
            <select
                value={charKey || ""}
                onChange={onSelect}
                className={selectClassName}
            >
                <option value="">Empty Slot</option>
                {Object.entries(availableCharacters).map(([key, char]) => (
                    <option key={key} value={key}>{char.name}</option>
                ))}
            </select>
            {charInfo ? (
                // This is the custom visual overlay that shows when a character is selected.
                <div className="absolute inset-0 flex items-center pointer-events-none p-2">
                    <img 
                        src={charInfo.iconUrl} 
                        alt={charInfo.name} 
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/64x64/2d3748/e2e8f0?text=??'; }}
                    />
                    <span className="ml-3 text-white font-bold text-lg">{charInfo.name}</span>
                </div>
            ) : (
                // This shows the "Empty Slot" text in the middle when no character is selected.
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="text-gray-500 font-bold text-lg">Empty Slot</span>
                </div>
            )}
        </div>
    );
};


export const Sidebar = ({ 
    team, 
    handleTeamChange, 
    characterBuilds, 
    setEditingBuildFor,
    enemyKey,
    setEnemyKey,
    user,
    onSignOut,
    isSaving,
}) => {
    const activeTeam = team.filter(c => c);

    return (
        <aside className="bg-gray-900/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 flex flex-col gap-8 h-full">
            {/* User & Auth Section */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold text-white text-lg">
                        {user.isAnonymous ? 'Anonymous User' : user.email}
                    </p>
                    <p className="text-xs text-gray-400">UID: {user.uid}</p>
                </div>
                <div className='flex items-center gap-2'>
                    <span className={`text-xs transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-0'} text-gray-400`}>Saving...</span>
                    <button onClick={onSignOut} className="bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Team Selection */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Team Setup</h2>
                <div className="space-y-3">
                    {team.map((charKey, i) => (
                        <TeamSlot 
                            key={i} 
                            charKey={charKey} 
                            onSelect={e => handleTeamChange(i, e.target.value)}
                            availableCharacters={characterData}
                        />
                    ))}
                </div>
            </div>

            {/* Character Build Cards */}
            <div>
                 <h2 className="text-2xl font-bold text-white mb-4">Character Builds</h2>
                 <div className="space-y-4">
                    {activeTeam.map(charKey => 
                        characterBuilds[charKey] && (
                            <div key={charKey} className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50 flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <img 
                                        src={characterData[charKey].iconUrl} 
                                        alt={characterData[charKey].name} 
                                        className="w-12 h-12 object-cover rounded-full border-2 border-cyan-500"
                                        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/48x48/2d3748/e2e8f0?text=??'; }}
                                    />
                                    <h3 className="text-lg font-bold text-white">{characterData[charKey].name}</h3>
                                 </div>
                                 <button onClick={() => setEditingBuildFor(charKey)} className="bg-cyan-600/80 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                     Edit Build
                                 </button>
                            </div>
                        )
                    )}
                 </div>
            </div>
            
            {/* Enemy Selection */}
            <div className="mt-auto"> {/* This pushes the enemy selector to the bottom */}
                <h2 className="text-2xl font-bold text-white mb-4">Target Enemy</h2>
                <select 
                    value={enemyKey} 
                    onChange={e => setEnemyKey(e.target.value)} 
                    className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    {Object.keys(enemyData).map(key => <option key={key} value={key}>{enemyData[key].name}</option>)}
                </select>
            </div>
        </aside>
    );
};
