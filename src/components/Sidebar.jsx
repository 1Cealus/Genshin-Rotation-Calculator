// src/components/Sidebar.jsx
import React, { useState } from 'react';

const TeamSlot = ({ charKey, onSelect, onEdit, onRemove, availableCharacters, usedCharacters, characterData }) => {
    const charInfo = charKey ? characterData[charKey] : null;

    if (charInfo) {
        return (
            <div className="bg-[var(--color-bg-secondary)] p-3 rounded-lg flex items-center justify-between transition-all duration-300 hover:bg-[var(--color-border-primary)] border border-[var(--color-border-primary)] shadow-md">
                <div className="flex items-center gap-3">
                    <img 
                        src={charInfo.iconUrl} 
                        alt={charInfo.name} 
                        className="w-12 h-12 object-cover rounded-full border-2 border-[var(--color-accent-primary)]/50"
                        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/48x48/2d3748/e2e8f0?text=??'; }}
                    />
                    <span className="font-bold text-white text-lg">{charInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onEdit} className="btn btn-secondary text-xs py-2 px-3">Edit</button>
                    <button onClick={onRemove} className="btn btn-danger text-xs p-2">
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
                    className="appearance-none w-full h-[72px] bg-transparent border-2 border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-accent-primary)] rounded-lg p-2 text-lg font-bold focus:outline-none focus:border-[var(--color-accent-primary)] transition-all text-center text-transparent"
                >
                    <option value="" disabled className="bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                        + Add Character
                    </option>
                    {Object.entries(availableCharacters)
                        .filter(([key]) => !usedCharacters.includes(key))
                        .map(([key, char]) => (
                        <option key={key} value={key} className="bg-[var(--color-bg-secondary)] text-white font-semibold">
                            {char.name}
                        </option>
                    ))}
                </select>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="text-[var(--color-text-secondary)] font-semibold">+ Add Character</span>
                </div>
            </div>
        );
    }
};

const PresetManager = ({ savedPresets = [], onLoadPreset, onDeletePreset, onSavePreset, presetName, setPresetName, onImport, onExport }) => {
    return (
        <div className="space-y-3 p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
             <div>
                <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Current Setup Name</label>
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Enter setup name..."
                    />
                     <button onClick={onSavePreset} className="btn btn-success">
                        Save
                    </button>
                </div>
             </div>
             <div className="relative">
                <select onChange={(e) => onLoadPreset(savedPresets.find(p => p.id === e.target.value))} className="w-full">
                    <option value="" className="bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">Load a Preset...</option>
                    {savedPresets.map(preset => <option key={preset.id} value={preset.id} className="bg-[var(--color-bg-secondary)] text-white">{preset.name}</option>)}
                </select>
            </div>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={onImport} className="btn btn-secondary">
                    Import File
                </button>
                <button onClick={onExport} className="btn btn-secondary">
                    Export File
                </button>
             </div>
             {savedPresets.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                    <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase">Manage Saved Presets</h4>
                    {savedPresets.map(preset => (
                        <div key={preset.id} className="flex justify-between items-center bg-[var(--color-bg-secondary)] p-2 rounded">
                            <span className="text-sm truncate">{preset.name}</span>
                            <button onClick={() => onDeletePreset(preset.id)} className="btn btn-danger text-xs px-2 py-1">Del</button>
                        </div>
                    ))}
                </div>
             )}
        </div>
    );
};

export const Sidebar = ({ 
    team, handleTeamChange, setEditingBuildFor,
    enemyKey, setEnemyKey, user, gameData,
    onExport, onImport, onClearAll,
    presetName, setPresetName, savedPresets,
    onSavePreset, onLoadPreset, onDeletePreset,
}) => {
    const [showPresets, setShowPresets] = useState(false);
    const { characterData, enemyData } = gameData;

    return (
        <aside className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border-primary)] flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-4 flex-grow min-h-0">
                <h2 className="text-2xl font-bold text-white flex-shrink-0">Team & Builds</h2>
                <div className="space-y-3 overflow-y-auto pr-2 flex-grow">
                    {team.map((charKey, i) => (
                        <TeamSlot 
                            key={charKey ? `${charKey}-${i}` : `empty-${i}`}
                            charKey={charKey} 
                            onSelect={e => handleTeamChange(i, e.target.value)}
                            onEdit={() => setEditingBuildFor(charKey)}
                            onRemove={() => handleTeamChange(i, '')}
                            availableCharacters={characterData}
                            usedCharacters={team}
                            characterData={characterData}
                        />
                    ))}
                </div>
            </div>
            
            <div className="flex-shrink-0">
                <h2 className="text-2xl font-bold text-white mb-3">Target Enemy</h2>
                <select 
                    value={enemyKey} 
                    onChange={e => setEnemyKey(e.target.value)} 
                >
                    {Object.keys(enemyData).map(key => <option key={key} value={key} className="bg-[var(--color-bg-secondary)] font-semibold">{enemyData[key].name}</option>)}
                </select>
            </div>

            <div className="flex-shrink-0 space-y-2 mt-auto pt-4 border-t border-[var(--color-border-primary)]">
                {showPresets && (
                     <PresetManager 
                        savedPresets={savedPresets} 
                        onLoadPreset={onLoadPreset} 
                        onDeletePreset={onDeletePreset}
                        onSavePreset={onSavePreset}
                        presetName={presetName}
                        setPresetName={setPresetName}
                        onImport={onImport}
                        onExport={onExport}
                    />
                )}
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowPresets(!showPresets)} className="btn btn-secondary">
                        {showPresets ? 'Hide' : 'Show'} Presets
                    </button>
                    <button onClick={onClearAll} className="btn btn-danger">
                        Clear Workspace
                    </button>
                </div>
            </div>
        </aside>
    );
};