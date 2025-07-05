import React, { useState, useMemo, useEffect, useRef } from 'react';

const CharacterPicker = ({ onSelect, availableCharacters, usedCharacters }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const pickerRef = useRef(null);

    const filteredCharacters = useMemo(() => {
        return Object.entries(availableCharacters)
            .filter(([key, char]) => 
                !usedCharacters.includes(key) &&
                char.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort(([, a], [, b]) => a.name.localeCompare(b.name));
    }, [searchTerm, availableCharacters, usedCharacters]);

    const handleSelect = (charKey) => {
        onSelect({ target: { value: charKey } }); 
        setIsOpen(false);
        setSearchTerm('');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={pickerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-[72px] bg-transparent border-2 border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-accent-primary)] rounded-lg text-lg font-bold focus:outline-none focus:border-[var(--color-accent-primary)] transition-all flex items-center justify-center text-[var(--color-text-secondary)] font-semibold"
            >
                + Add Character
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg shadow-2xl z-20 p-2 flex flex-col gap-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing
                        className="p-2"
                        autoFocus
                    />
                    <div className="max-h-60 overflow-y-auto">
                        {filteredCharacters.length > 0 ? (
                            filteredCharacters.map(([key, char]) => (
                                <button
                                    key={key}
                                    onClick={() => handleSelect(key)}
                                    className="w-full text-left p-2 rounded-md text-white font-semibold hover:bg-[var(--color-accent-primary)] hover:text-slate-900 transition-colors"
                                >
                                    {char.name}
                                </button>
                            ))
                        ) : (
                            <p className="p-2 text-center text-sm text-[var(--color-text-secondary)]">No characters found.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


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
             <CharacterPicker 
                onSelect={onSelect}
                availableCharacters={availableCharacters}
                usedCharacters={usedCharacters}
             />
        );
    }
};

const ActiveResonances = ({ team, characterData }) => {
    const resonances = useMemo(() => {
        const elementCounts = team.reduce((acc, charKey) => {
            if (charKey && characterData[charKey]) {
                const element = characterData[charKey].element;
                acc[element] = (acc[element] || 0) + 1;
            }
            return acc;
        }, {});

        const activeResonances = [];
        if (elementCounts.pyro >= 2) activeResonances.push({ name: 'Fervent Flames', color: 'text-red-400' });
        if (elementCounts.hydro >= 2) activeResonances.push({ name: 'Soothing Water', color: 'text-sky-400' });
        if (elementCounts.cryo >= 2) activeResonances.push({ name: 'Shattering Ice', color: 'text-cyan-400' });
        if (elementCounts.geo >= 2) activeResonances.push({ name: 'Enduring Rock', color: 'text-yellow-400' });
        if (elementCounts.dendro >= 2) activeResonances.push({ name: 'Sprawling Greenery', color: 'text-green-400' });
        
        return activeResonances;
    }, [team, characterData]);

    if (resonances.length === 0) {
        return null;
    }

    return (
        <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
            <h4 className="text-sm font-bold text-white mb-2">Active Resonances</h4>
            <div className="space-y-1">
                {resonances.map(res => (
                    <div key={res.name} className={`text-xs font-semibold ${res.color}`}>{res.name}</div>
                ))}
            </div>
        </div>
    );
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
                <select onChange={(e) => { const preset = savedPresets.find(p => p.id === e.target.value); if (preset) onLoadPreset(preset);}} className="w-full">
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
    enemyKey, setEnemyKey, user, gameData, isAdmin,
    onExport, onImport, onClearAll,
    isFetchingProfile, handleFetchEnkaData,
    presetName, setPresetName, savedPresets,
    onSavePreset, onLoadPreset, onDeletePreset, onSaveToMastersheet
}) => {
    const [showPresets, setShowPresets] = useState(false);
    const [uid, setUid] = useState('');
    const { characterData, enemyData } = gameData;

    const handleUidFetch = () => {
        handleFetchEnkaData(uid);
    }

    return (
        <aside className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border-primary)] flex flex-col gap-6 h-full">
            {/* UID Fetcher Section */}
            <div className="flex-shrink-0">
                 <h2 className="text-2xl font-bold text-white mb-3">Profile Import</h2>
                 <div className="p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)] space-y-2">
                    <label className="text-sm text-[var(--color-text-secondary)] block">
                        Import builds via UID (Enka.Network)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                            placeholder="Enter 9-digit UID..."
                            disabled={isFetchingProfile}
                        />
                        <button onClick={handleUidFetch} className="btn btn-primary" disabled={isFetchingProfile}>
                            {isFetchingProfile ? '...' : 'Fetch'}
                        </button>
                    </div>
                 </div>
            </div>

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
                    <div className="pt-2">
                        <ActiveResonances team={team} characterData={characterData} />
                    </div>
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
                {isAdmin && (
                    <button onClick={onSaveToMastersheet} className="btn btn-primary w-full mt-2">
                        Publish to Mastersheet
                    </button>
                )}
            </div>
        </aside>
    );
};