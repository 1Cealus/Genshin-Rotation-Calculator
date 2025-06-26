import React, { useState } from 'react';
import { characterData } from '../data/character_database';
import { enemyData } from '../data/enemy_database';

const TeamSlot = ({ charKey, onSelect, onEdit, onRemove, availableCharacters, usedCharacters }) => {
    const charInfo = charKey ? characterData[charKey] : null;

    if (charInfo) {
        return (
            <div className="bg-gray-800/60 p-3 rounded-lg flex items-center justify-between transition-all duration-300 hover:bg-gray-800 border border-gray-700/50 shadow-md">
                <div className="flex items-center gap-3">
                    <img 
                        src={charInfo.iconUrl} 
                        alt={charInfo.name} 
                        className="w-12 h-12 object-cover rounded-full border-2 border-cyan-500/50"
                        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/48x48/2d3748/e2e8f0?text=??'; }}
                    />
                    <span className="font-bold text-white text-lg">{charInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onEdit} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-3 text-xs rounded-md transition-colors">Edit</button>
                    <button onClick={onRemove} className="bg-red-600/50 hover:bg-red-600 text-white font-bold p-2 text-xs rounded-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    } else {
        return (
            <div className="relative">
                <select
                    value=""
                    onChange={onSelect}
                    className="appearance-none w-full h-[72px] bg-gray-800/40 border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-lg p-2 text-lg font-bold focus:outline-none focus:border-cyan-500 transition-all text-center text-transparent"
                >
                    <option value="" disabled className="bg-gray-700 text-gray-400">
                        + Add Character
                    </option>
                    {Object.entries(availableCharacters)
                        .filter(([key]) => !usedCharacters.includes(key))
                        .map(([key, char]) => (
                        <option key={key} value={key} className="bg-gray-800 text-white font-semibold">
                            {char.name}
                        </option>
                    ))}
                </select>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="text-gray-500 font-semibold">+ Add Character</span>
                </div>
            </div>
        );
    }
};

const PresetManager = ({ savedPresets = [], onLoadPreset, onDeletePreset }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleLoad = (preset) => {
        onLoadPreset(preset);
        setIsOpen(false);
    }

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 w-full text-xs rounded-md transition-colors">
                Load Preset ({savedPresets.length})
            </button>
            {isOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {savedPresets.length > 0 ? (
                        savedPresets.map(preset => (
                            <div key={preset.id} className="flex items-center justify-between p-2 hover:bg-gray-700">
                                <span className="text-sm text-white truncate">{preset.name}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleLoad(preset)} className="bg-blue-600 text-xs px-2 py-1 rounded">Load</button>
                                    <button onClick={() => onDeletePreset(preset.id)} className="bg-red-600 text-xs px-2 py-1 rounded">Del</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="p-2 text-sm text-gray-400 text-center">No saved presets.</p>
                    )}
                </div>
            )}
        </div>
    )
}

export const Sidebar = ({ 
    team, handleTeamChange, setEditingBuildFor,
    enemyKey, setEnemyKey, user, onSignOut, isSaving,
    onExport, onImport, onClearAll,
    presetName, setPresetName, savedPresets,
    onSavePreset, onLoadPreset, onDeletePreset,
}) => {

    return (
        <aside className="bg-gray-900/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 flex flex-col gap-6 h-full">
            {/* Top section */}
            <div className="flex-shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-white text-lg truncate" title={user.email}>
                            {user.isAnonymous ? 'Anonymous User' : user.email}
                        </p>
                        <p className="text-xs text-gray-400">UID: {user.uid.substring(0, 10)}...</p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <span className={`text-xs transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-0'} text-gray-400`}>Saving...</span>
                        <button onClick={onSignOut} className="bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Preset Management */}
            <div className="flex-shrink-0 space-y-3">
                 <h2 className="text-xl font-bold text-white">Preset Management</h2>
                 <div>
                    <label className="text-sm text-gray-300 block mb-1">Current Setup Name</label>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="Enter setup name..."
                            className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                         <button onClick={onSavePreset} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 text-sm rounded-md transition-colors">
                            Save
                        </button>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <PresetManager savedPresets={savedPresets} onLoadPreset={onLoadPreset} onDeletePreset={onDeletePreset} />
                    <button onClick={onExport} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 text-xs rounded-md transition-colors">
                        Export to File
                    </button>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={onImport} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 text-xs rounded-md transition-colors">
                        Import from File
                    </button>
                    <button onClick={onClearAll} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 text-xs rounded-md transition-colors">
                        Clear Workspace
                    </button>
                 </div>
            </div>


            {/* Team Builds */}
            <div className="flex flex-col gap-4 flex-grow min-h-0">
                <h2 className="text-2xl font-bold text-white flex-shrink-0">Team & Builds</h2>
                <div className="space-y-3 overflow-y-auto pr-2 flex-grow">
                    {team.map((charKey, i) => (
                        <TeamSlot 
                            key={charKey ? `${charKey}-${i}` : `empty-${i}`} // FIX: Provide a more stable key
                            charKey={charKey} 
                            onSelect={e => handleTeamChange(i, e.target.value)}
                            onEdit={() => setEditingBuildFor(charKey)}
                            onRemove={() => handleTeamChange(i, '')}
                            availableCharacters={characterData}
                            usedCharacters={team}
                        />
                    ))}
                </div>
            </div>
            
            {/* Target Enemy */}
            <div className="flex-shrink-0">
                <h2 className="text-2xl font-bold text-white mb-3">Target Enemy</h2>
                <select 
                    value={enemyKey} 
                    onChange={e => setEnemyKey(e.target.value)} 
                    className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    {Object.keys(enemyData).map(key => <option key={key} value={key} className="bg-gray-800 font-semibold">{enemyData[key].name}</option>)}
                </select>
            </div>
        </aside>
    );
};
