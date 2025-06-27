import React, { useState, useMemo, useEffect } from 'react';
import { characterData } from '../data/character_database.js';
import { weaponData } from '../data/weapon_database.js';
import { artifactSets } from '../data/artifact_sets.js';
import { artifactMainStats } from '../data/artifact_stats.js';
import { calculateTotalStats } from '../logic/stat_calculator.js';

// Substat Input: Improved with better UX and dark styling
const SubstatInput = ({ label, value, onChange, isPercent = false }) => {
    const [localValue, setLocalValue] = useState(isPercent ? ((value || 0) * 100).toFixed(1) : (value || 0));
    const [isFocused, setIsFocused] = useState(false);

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
        setIsFocused(false);
    };

    return (
        <div className="relative">
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">{label}</label>
            <input
                type="number"
                step="0.1"
                value={localValue}
                onChange={handleLocalChange}
                onFocus={() => setIsFocused(true)}
                onBlur={commitChange}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                className={`w-full text-sm p-2.5 rounded-lg border-2 text-right font-medium transition-all duration-200 bg-slate-700 text-white
                    ${isFocused 
                        ? 'border-blue-400 bg-slate-600 shadow-lg shadow-blue-400/20' 
                        : 'border-slate-600 hover:border-slate-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-400/30`}
            />
        </div>
    );
};

// Artifact Piece Editor: Enhanced with dark theme
const ArtifactPieceEditor = ({ pieceName, pieceData = { substats: {} }, onUpdate, mainStatOptions, isOpen, onToggle }) => {
    const handleMainStatChange = (e) => onUpdate({ ...pieceData, mainStat: e.target.value });
    const handleSubstatChange = (stat, value) => {
        const newSubstats = { ...(pieceData.substats || {}), [stat]: value };
        onUpdate({ ...pieceData, substats: newSubstats });
    };

    return (
        <details 
            className="bg-slate-800 rounded-xl border-2 border-slate-700 shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-300" 
            open={isOpen} 
            onToggle={onToggle}
        >
            <summary className="font-bold text-white cursor-pointer capitalize p-4 hover:bg-slate-700 rounded-t-xl transition-colors duration-200 flex items-center justify-between">
                <span className="text-lg">{pieceName}</span>
                <svg className={`w-5 h-5 transition-transform duration-200 text-gray-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </summary>
            <div className="p-4 border-t-2 border-slate-700">
                {mainStatOptions && (
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Main Stat</label>
                        <select
                            value={pieceData.mainStat || ''}
                            onChange={handleMainStatChange}
                            className="w-full text-sm p-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-200 hover:border-slate-500"
                        >
                            {Object.entries(mainStatOptions).map(([key, stat]) => (
                                <option key={key} value={key}>{stat.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-200 pb-2 border-b border-slate-600">Substats</h4>
                    <div className="grid grid-cols-2 gap-4">
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
        <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-slate-600 hover:shadow-lg transition-all duration-200">
            <span className="text-gray-300 font-medium">{label}</span>
            <span className="font-mono text-white font-bold text-lg">
                {isPercent ? ((value || 0) * 100).toFixed(decimals) + '%' : (value || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
            </span>
        </div>
    );
    
    const Section = ({ title, children }) => (
        <div className="bg-slate-800 p-6 rounded-xl border-2 border-slate-700 shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-5 pb-2 border-b-2 border-slate-700">{title}</h3>
            <div className="space-y-4">{children}</div>
        </div>
    );

    const artifactPieces = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-7xl border-2 border-slate-700 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-6 border-b-2 border-slate-700 flex justify-between items-center flex-shrink-0 bg-slate-800 rounded-t-2xl">
                     <h2 className="text-3xl font-bold text-white flex items-center gap-4">
                        <img src={charInfo.iconUrl} alt={charInfo.name} className="w-14 h-14 rounded-full border-2 border-blue-400 shadow-lg shadow-blue-400/30"/>
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            {charInfo.name} Build Editor
                        </span>
                     </h2>
                     <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white text-4xl hover:bg-slate-700 rounded-full w-12 h-12 flex items-center justify-center transition-colors duration-200"
                     >
                        &times;
                     </button>
                </header>

                <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-900">
                    <div className="space-y-6 lg:col-span-1">
                        <Section title="Character">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-300 block mb-2">Constellation</label>
                                    <select 
                                        value={build.constellation || 0} 
                                        onChange={e => handleUpdate(['constellation'], parseInt(e.target.value))}
                                        className="w-full p-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-200 hover:border-slate-500"
                                    >
                                        {[0,1,2,3,4,5,6].map(c => <option key={c} value={c}>C{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-300 block mb-2">Level</label>
                                    <input 
                                        type="number" 
                                        value={build.level || 90} 
                                        readOnly 
                                        className="w-full p-3 rounded-lg border-2 border-slate-700 bg-slate-800 text-gray-400 cursor-not-allowed opacity-70" 
                                    />
                                </div>
                            </div>
                        </Section>
                        
                        <Section title="Weapon">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-300 block mb-2">Weapon</label>
                                    <select 
                                        value={build.weapon?.key || 'no_weapon'} 
                                        onChange={e => handleUpdate(['weapon', 'key'], e.target.value)}
                                        className="w-full p-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-200 hover:border-slate-500"
                                    >
                                        {Object.entries(weaponData).filter(([, w]) => w.type === 'all' || w.type === charInfo.weapon_type).map(([key, w]) => <option key={key} value={key}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-300 block mb-2">Refinement</label>
                                    <select 
                                        value={build.weapon?.refinement || 1} 
                                        onChange={e => handleUpdate(['weapon', 'refinement'], parseInt(e.target.value))}
                                        className="w-full p-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-200 hover:border-slate-500"
                                    >
                                        {[1,2,3,4,5].map(r => <option key={r} value={r}>R{r}</option>)}
                                    </select>
                                </div>
                            </div>
                        </Section>
                        
                        <Section title="Talent Levels">
                            <div className="grid grid-cols-3 gap-4">
                                {['na', 'skill', 'burst'].map(tKey => (
                                    <div key={tKey} className="text-center">
                                        <label className="text-sm font-semibold text-gray-300 block uppercase mb-2">{tKey}</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="15" 
                                            value={build.talentLevels?.[tKey] || 1} 
                                            onChange={e => handleUpdate(['talentLevels', tKey], parseInt(e.target.value))} 
                                            className="w-full p-3 text-center rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-200 font-bold text-lg hover:border-slate-500" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>

                    <div className="space-y-6 lg:col-span-1">
                        <Section title="Artifacts">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-300 block mb-2">2-Piece Set</label>
                                        <select 
                                            value={build.artifacts?.set_2pc || 'no_set'} 
                                            onChange={e => handleUpdate(['artifacts', 'set_2pc'], e.target.value)}
                                            className="w-full p-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-200 hover:border-slate-500"
                                        >
                                            <option value="no_set">None</option>
                                            {Object.entries(artifactSets).filter(([k]) => k !== 'no_set').map(([key, set]) => <option key={key} value={key}>{set.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-300 block mb-2">4-Piece Set</label>
                                        <select 
                                            value={build.artifacts?.set_4pc || 'no_set'} 
                                            onChange={e => handleUpdate(['artifacts', 'set_4pc'], e.target.value)}
                                            className="w-full p-3 rounded-lg border-2 border-slate-600 bg-slate-700 text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-200 hover:border-slate-500"
                                        >
                                            <option value="no_set">None</option>
                                            {Object.entries(artifactSets).filter(([k]) => k !== 'no_set').map(([key, set]) => <option key={key} value={key}>{set.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-3">
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
                            </div>
                        </Section>
                    </div>
                    
                    <div className="space-y-4 lg:col-span-1">
                         <Section title="Total Stats">
                           <div className="space-y-3">
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
                           </div>
                        </Section>
                    </div>
                </div>

                 <footer className="p-6 border-t-2 border-slate-700 flex-shrink-0 bg-slate-800 rounded-b-2xl">
                     <button 
                        onClick={onClose} 
                        className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5"
                     >
                        Close
                     </button>
                 </footer>
            </div>
        </div>
    );
};