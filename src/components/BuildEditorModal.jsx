import React, { useState, useMemo, useEffect } from 'react';
import { characterData } from '../data/character_database.js';
import { weaponData } from '../data/weapon_database.js';
import { artifactSets } from '../data/artifact_sets.js';
import { artifactMainStats } from '../data/artifact_stats.js';
import { calculateTotalStats } from '../logic/stat_calculator.js';

// Substat Input: Manages its own state to prevent re-renders on every keystroke.
const SubstatInput = ({ label, value, onChange, isPercent = false }) => {
    const [localValue, setLocalValue] = useState(isPercent ? ((value || 0) * 100).toFixed(1) : (value || 0));

    useEffect(() => {
        const newValue = isPercent ? ((value || 0) * 100).toFixed(1) : (value || 0);
        if (parseFloat(localValue) !== parseFloat(newValue)) {
            setLocalValue(newValue);
        }
    }, [value, isPercent]);

    const handleLocalChange = (e) => setLocalValue(e.target.value);

    const commitChange = () => {
        const numericValue = parseFloat(localValue) || 0;
        onChange(isPercent ? numericValue / 100 : numericValue);
    };

    return (
        <div>
            <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{label}</label>
            <input
                type="number"
                step="0.1"
                value={localValue}
                onChange={handleLocalChange}
                onBlur={commitChange}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                className="w-full text-sm p-1.5 text-right" // Uses global dark style
            />
        </div>
    );
};

// Artifact Piece Editor: Now with a more compact substat grid
const ArtifactPieceEditor = ({ pieceName, pieceData = { substats: {} }, onUpdate, mainStatOptions, isOpen, onToggle }) => {
    const handleMainStatChange = (e) => onUpdate({ ...pieceData, mainStat: e.target.value });
    const handleSubstatChange = (stat, value) => {
        const newSubstats = { ...(pieceData.substats || {}), [stat]: value };
        onUpdate({ ...pieceData, substats: newSubstats });
    };

    return (
        <details className="bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]" open={isOpen} onToggle={onToggle}>
            <summary className="font-semibold text-white cursor-pointer capitalize p-3 hover:bg-[var(--color-border-primary)]/50 rounded-t-lg">
                {pieceName}
            </summary>
            <div className="p-3 mt-1 border-t border-[var(--color-border-primary)]">
                {mainStatOptions && (
                    <div className="flex gap-4 items-center mb-4">
                        <label className="text-sm text-[var(--color-text-secondary)] whitespace-nowrap">Main Stat</label>
                        <select
                            value={pieceData.mainStat || ''}
                            onChange={handleMainStatChange}
                            className="w-full text-sm"
                        >
                            {Object.entries(mainStatOptions).map(([key, stat]) => (
                                <option key={key} value={key}>{stat.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                 <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <h4 className="text-sm font-bold text-[var(--color-text-secondary)] col-span-2">Substats</h4>
                    <SubstatInput label="Crit Rate %" value={pieceData.substats?.crit_rate} onChange={val => handleSubstatChange('crit_rate', val)} isPercent />
                    <SubstatInput label="Crit Dmg %" value={pieceData.substats?.crit_dmg} onChange={val => handleSubstatChange('crit_dmg', val)} isPercent />
                    <SubstatInput label="ATK %" value={pieceData.substats?.atk_percent} onChange={val => handleSubstatChange('atk_percent', val)} isPercent />
                    <SubstatInput label="Flat ATK" value={pieceData.substats?.flat_atk} onChange={val => handleSubstatChange('flat_atk', val)} />
                    <SubstatInput label="HP %" value={pieceData.substats?.hp_percent} onChange={val => handleSubstatChange('hp_percent', val)} isPercent />
                    <SubstatInput label="Flat HP" value={pieceData.substats?.flat_hp} onChange={val => handleSubstatChange('flat_hp', val)} />
                    <SubstatInput label="DEF %" value={pieceData.substats?.def_percent} onChange={val => handleSubstatChange('def_percent', val)} isPercent />
                    <SubstatInput label="Flat DEF" value={pieceData.substats?.flat_def} onChange={val => handleSubstatChange('flat_def', val)} />
                    <SubstatInput label="Energy Recharge %" value={pieceData.substats?.er} onChange={val => handleSubstatChange('er', val)} isPercent />
                    <SubstatInput label="Elemental Mastery" value={pieceData.substats?.em} onChange={val => handleSubstatChange('em', val)} />
                </div>
            </div>
        </details>
    );
};

// The main modal for editing a character's entire build
export const BuildEditorModal = ({ charKey, build, updateBuild, onClose }) => {
    if (!charKey || !build) return null;
    
    const [openPiece, setOpenPiece] = useState('flower'); 

    const charInfo = characterData[charKey];

    const totalStats = useMemo(() => {
        if (!build.weapon?.key) return {};
        const state = { character: charInfo, weapon: weaponData[build.weapon.key], characterBuild: build, team: [], characterBuilds: {}, activeBuffs: {} };
        return calculateTotalStats(state);
    }, [build, charInfo]);

    const handleUpdate = (path, value) => {
        const newBuild = JSON.parse(JSON.stringify(build)); // Deep copy
        let current = newBuild;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]] = current[path[i]] || {};
        }
        current[path[path.length - 1]] = value;
        updateBuild(charKey, newBuild);
    };

    const handlePieceUpdate = (pieceName, newPieceData) => {
        handleUpdate(['artifacts', pieceName], newPieceData);
    };
    
    const StatDisplay = ({ label, value, isPercent = false, decimals = 1 }) => (
        <div className="flex justify-between bg-[var(--color-bg-primary)] p-2.5 rounded-md border border-transparent">
            <span className="text-[var(--color-text-secondary)]">{label}</span>
            <span className="font-mono text-white font-semibold">{isPercent ? ((value || 0) * 100).toFixed(decimals) + '%' : (value || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>
    );
    
    const Section = ({ title, children }) => (
        <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)]">
            <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
            <div className="space-y-4">{children}</div>
        </div>
    );

    const artifactPieces = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-[var(--color-bg-secondary)]/95 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-6xl text-white border border-[var(--color-border-primary)] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--color-border-primary)] flex justify-between items-center flex-shrink-0">
                     <h2 className="text-2xl font-bold text-[var(--color-accent-primary)] flex items-center gap-4">
                        <img src={charInfo.iconUrl} alt={charInfo.name} className="w-12 h-12 rounded-full"/>
                        {charInfo.name} Build Editor
                     </h2>
                     <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-white text-3xl">&times;</button>
                </header>

                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-6 md:col-span-1">
                        <Section title="Character">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Constellation</label>
                                    <select value={build.constellation || 0} onChange={e => handleUpdate(['constellation'], parseInt(e.target.value))}>
                                        {[0,1,2,3,4,5,6].map(c => <option key={c} value={c}>C{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Level</label>
                                    <input type="number" value={build.level || 90} readOnly className="cursor-not-allowed opacity-70" />
                                </div>
                            </div>
                        </Section>
                        <Section title="Weapon">
                            <div>
                                <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Weapon</label>
                                <select value={build.weapon?.key || 'no_weapon'} onChange={e => handleUpdate(['weapon', 'key'], e.target.value)}>
                                    {Object.entries(weaponData).filter(([, w]) => w.type === 'all' || w.type === charInfo.weapon_type).map(([key, w]) => <option key={key} value={key}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-[var(--color-text-secondary)] block mb-1">Refinement</label>
                                <select value={build.weapon?.refinement || 1} onChange={e => handleUpdate(['weapon', 'refinement'], parseInt(e.target.value))}>
                                    {[1,2,3,4,5].map(r => <option key={r} value={r}>R{r}</option>)}
                                </select>
                            </div>
                        </Section>
                         <Section title="Talent Levels">
                            <div className="grid grid-cols-3 gap-3">
                                {['na', 'skill', 'burst'].map(tKey => (
                                    <div key={tKey} className="text-center">
                                        <label className="text-sm text-[var(--color-text-secondary)] block uppercase mb-1">{tKey}</label>
                                        <input type="number" min="1" max="15" value={build.talentLevels?.[tKey] || 1} onChange={e => handleUpdate(['talentLevels', tKey], parseInt(e.target.value))} className="text-center" />
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>

                    <div className="space-y-6 md:col-span-1">
                        <Section title="Artifacts">
                             <div className="grid grid-cols-2 gap-4">
                                <select value={build.artifacts?.set_2pc || 'no_set'} onChange={e => handleUpdate(['artifacts', 'set_2pc'], e.target.value)} title="2-Piece Set Bonus">
                                    <option value="no_set">2-Piece: None</option>
                                    {Object.entries(artifactSets).filter(([k]) => k !== 'no_set').map(([key, set]) => <option key={key} value={key}>{set.name}</option>)}
                                </select>
                                <select value={build.artifacts?.set_4pc || 'no_set'} onChange={e => handleUpdate(['artifacts', 'set_4pc'], e.target.value)} title="4-Piece Set Bonus">
                                    <option value="no_set">4-Piece: None</option>
                                    {Object.entries(artifactSets).filter(([k]) => k !== 'no_set').map(([key, set]) => <option key={key} value={key}>{set.name}</option>)}
                                </select>
                            </div>
                             <div className="space-y-2">
                               {artifactPieces.map(pieceName => (
                                   <ArtifactPieceEditor
                                       key={pieceName}
                                       pieceName={pieceName}
                                       pieceData={build.artifacts?.[pieceName]}
                                       onUpdate={(data) => handlePieceUpdate(pieceName, data)}
                                       mainStatOptions={artifactMainStats[pieceName]}
                                       isOpen={openPiece === pieceName}
                                       onToggle={(e) => {
                                           if (e.target.open) setOpenPiece(pieceName);
                                           else if (openPiece === pieceName) e.preventDefault();
                                       }}
                                   />
                               ))}
                            </div>
                        </Section>
                    </div>
                    
                    <div className="space-y-3 md:col-span-1">
                         <Section title="Total Stats">
                           <StatDisplay label="Max HP" value={totalStats.hp} />
                           <StatDisplay label="Total ATK" value={totalStats.atk} />
                           <StatDisplay label="Total DEF" value={totalStats.def} />
                           <StatDisplay label="Crit Rate" value={totalStats.crit_rate} isPercent={true} />
                           <StatDisplay label="Crit DMG" value={totalStats.crit_dmg} isPercent={true} />
                           <StatDisplay label="Elemental Mastery" value={totalStats.em} />
                           <StatDisplay label="Energy Recharge" value={totalStats.er} isPercent={true} />
                           <StatDisplay label="Pyro DMG" value={totalStats.pyro_dmg_bonus} isPercent={true} />
                           <StatDisplay label="Hydro DMG" value={totalStats.hydro_dmg_bonus} isPercent={true} />
                           <StatDisplay label="Dendro DMG" value={totalStats.dendro_dmg_bonus} isPercent={true} />
                           <StatDisplay label="Electro DMG" value={totalStats.electro_dmg_bonus} isPercent={true} />
                           <StatDisplay label="Anemo DMG" value={totalStats.anemo_dmg_bonus} isPercent={true} />
                           <StatDisplay label="Cryo DMG" value={totalStats.cryo_dmg_bonus} isPercent={true} />
                           <StatDisplay label="Geo DMG" value={totalStats.geo_dmg_bonus} isPercent={true} />
                           <StatDisplay label="Physical DMG" value={totalStats.physical_dmg_bonus} isPercent={true} />
                        </Section>
                    </div>
                </div>

                 <footer className="p-4 border-t border-[var(--color-border-primary)] mt-auto flex-shrink-0">
                     <button onClick={onClose} className="btn btn-primary w-full">Close</button>
                 </footer>
            </div>
        </div>
    );
};

