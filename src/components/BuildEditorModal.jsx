import React, { useMemo } from 'react';
import { characterData } from '../data/character_database.js';
import { weaponData } from '../data/weapon_database.js';
import { artifactSets } from '../data/artifact_sets.js';
import { artifactMainStats } from '../data/artifact_stats.js';
import { calculateTotalStats } from '../logic/stat_calculator.js';

// A component for a single artifact piece, managing its main stat and substats
const ArtifactPieceEditor = ({ pieceName, pieceData = { substats: {} }, onUpdate, mainStatOptions }) => {
    const handleMainStatChange = (e) => {
        onUpdate({ ...pieceData, mainStat: e.target.value });
    };

    const handleSubstatChange = (stat, value) => {
        const newSubstats = { ...(pieceData.substats || {}), [stat]: value };
        onUpdate({ ...pieceData, substats: newSubstats });
    };
    
    const SubstatInput = ({ label, value, onChange, isPercent = false }) => (
        <div className="flex items-center justify-between text-sm">
            <label className="text-gray-300">{label}</label>
            <input
                type="number"
                step="0.1"
                value={isPercent ? ((value || 0) * 100).toFixed(1) : (value || 0)}
                onChange={e => onChange(isPercent ? parseFloat(e.target.value) / 100 : parseFloat(e.target.value))}
                className="w-24 bg-gray-900 border border-gray-600 rounded-md p-1.5 text-right text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
        </div>
    );

    return (
        <details className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50" open>
            <summary className="font-semibold text-white cursor-pointer capitalize">{pieceName}</summary>
            <div className="mt-4 space-y-3 pt-3 border-t border-gray-600/50">
                {mainStatOptions && (
                    <div className="grid grid-cols-2 gap-4 items-center">
                        <label className="text-sm text-gray-300">Main Stat</label>
                        <select
                            value={pieceData.mainStat || ''}
                            onChange={handleMainStatChange}
                            className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm text-white"
                        >
                            {Object.entries(mainStatOptions).map(([key, stat]) => (
                                <option key={key} value={key}>{stat.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                 <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-400">Substats</h4>
                    <SubstatInput label="Crit Rate %" value={pieceData.substats?.crit_rate} onChange={val => handleSubstatChange('crit_rate', val)} isPercent/>
                    <SubstatInput label="Crit DMG %" value={pieceData.substats?.crit_dmg} onChange={val => handleSubstatChange('crit_dmg', val)} isPercent/>
                    <SubstatInput label="ATK %" value={pieceData.substats?.atk_percent} onChange={val => handleSubstatChange('atk_percent', val)} isPercent/>
                    <SubstatInput label="EM" value={pieceData.substats?.em} onChange={val => handleSubstatChange('em', val)} />
                    <SubstatInput label="Flat ATK" value={pieceData.substats?.flat_atk} onChange={val => handleSubstatChange('flat_atk', val)} />
                </div>
            </div>
        </details>
    );
};

// The main modal for editing a character's entire build
export const BuildEditorModal = ({ charKey, build, updateBuild, onClose }) => {
    if (!charKey || !build) return null;

    const charInfo = characterData[charKey];

    const totalStats = useMemo(() => {
        // Ensure that a valid weapon key exists before calculating.
        if (!build.weapon?.key) return {};
        return calculateTotalStats({
            character: charInfo,
            weapon: weaponData[build.weapon.key],
            characterBuild: build
        });
    }, [build, charInfo]);

    const handleUpdate = (path, value) => {
        const newBuild = { ...build };
        let current = newBuild;
        for (let i = 0; i < path.length - 1; i++) {
            if (current[path[i]] === undefined) {
                 current[path[i]] = {}; // Create nested object if it doesn't exist
            }
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        updateBuild(charKey, newBuild);
    };

    const handlePieceUpdate = (pieceName, newPieceData) => {
        handleUpdate(['artifacts', pieceName], newPieceData);
    };

    const StatDisplay = ({ label, value, isPercent = false, decimals = 1 }) => (
        <div className="flex justify-between bg-gray-700/50 p-2.5 rounded-md">
            <span className="text-gray-300">{label}</span>
            <span className="font-mono text-white font-semibold">{isPercent ? ((value || 0) * 100).toFixed(decimals) + '%' : (value || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>
    );
    
    const Section = ({ title, children }) => (
        <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
            <div className="space-y-4">{children}</div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 p-4">
            <div className="bg-gray-900/80 rounded-2xl shadow-xl w-full max-w-6xl text-white border-2 border-gray-700 max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                     <h2 className="text-3xl font-bold text-cyan-400 flex items-center gap-4">
                        <img src={charInfo.iconUrl} alt={charInfo.name} className="w-12 h-12 rounded-full"/>
                        {charInfo.name} Build Editor
                     </h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                </header>

                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-6">
                        <Section title="Character">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-300 block mb-1">Constellation</label>
                                    <select value={build.constellation || 0} onChange={e => handleUpdate(['constellation'], parseInt(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                        {[0,1,2,3,4,5,6].map(c => <option key={c} value={c}>C{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-300 block mb-1">Level</label>
                                    <input type="number" value={build.level || 90} readOnly className="w-full bg-gray-700/50 border border-gray-600 rounded-md p-2 text-white cursor-not-allowed" />
                                </div>
                            </div>
                        </Section>
                        <Section title="Weapon">
                            <div>
                                <label className="text-sm text-gray-300 block mb-1">Weapon</label>
                                <select value={build.weapon?.key || 'no_weapon'} onChange={e => handleUpdate(['weapon', 'key'], e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                    {Object.entries(weaponData).filter(([, w]) => w.type === 'all' || w.type === charInfo.weapon_type).map(([key, w]) => <option key={key} value={key}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-300 block mb-1">Refinement</label>
                                <select value={build.weapon?.refinement || 1} onChange={e => handleUpdate(['weapon', 'refinement'], parseInt(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                    {[1,2,3,4,5].map(r => <option key={r} value={r}>R{r}</option>)}
                                </select>
                            </div>
                        </Section>
                         <Section title="Talent Levels">
                            <div className="grid grid-cols-3 gap-3">
                                {Object.keys(build.talentLevels || {na:1, skill:1, burst:1}).map(tKey => (
                                    <div key={tKey} className="text-center">
                                        <label className="text-sm text-gray-400 block uppercase mb-1">{tKey}</label>
                                        <input type="number" min="1" max="15" value={build.talentLevels?.[tKey] || 1} onChange={e => handleUpdate(['talentLevels', tKey], parseInt(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-center text-white" />
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>

                    <div className="space-y-6">
                        <Section title="Artifacts">
                             <div className="grid grid-cols-2 gap-4">
                                <select value={build.artifacts?.set_2pc || 'no_set'} onChange={e => handleUpdate(['artifacts', 'set_2pc'], e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" title="2-Piece Set Bonus">
                                    {Object.entries(artifactSets).map(([key, set]) => <option key={key} value={key}>{set.name}</option>)}
                                </select>
                                <select value={build.artifacts?.set_4pc || 'no_set'} onChange={e => handleUpdate(['artifacts', 'set_4pc'], e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" title="4-Piece Set Bonus">
                                    {Object.entries(artifactSets).map(([key, set]) => <option key={key} value={key}>{set.name}</option>)}
                                </select>
                            </div>
                             <div className="space-y-2">
                               <ArtifactPieceEditor pieceName="flower" pieceData={build.artifacts?.flower} onUpdate={(data) => handlePieceUpdate('flower', data)} />
                               <ArtifactPieceEditor pieceName="plume" pieceData={build.artifacts?.plume} onUpdate={(data) => handlePieceUpdate('plume', data)} />
                               <ArtifactPieceEditor pieceName="sands" pieceData={build.artifacts?.sands} onUpdate={(data) => handlePieceUpdate('sands', data)} mainStatOptions={artifactMainStats.sands} />
                               <ArtifactPieceEditor pieceName="goblet" pieceData={build.artifacts?.goblet} onUpdate={(data) => handlePieceUpdate('goblet', data)} mainStatOptions={artifactMainStats.goblet} />
                               <ArtifactPieceEditor pieceName="circlet" pieceData={build.artifacts?.circlet} onUpdate={(data) => handlePieceUpdate('circlet', data)} mainStatOptions={artifactMainStats.circlet} />
                            </div>
                        </Section>
                    </div>
                    
                    <div className="space-y-3">
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

                 <footer className="p-4 border-t border-gray-700 mt-auto">
                     <button onClick={onClose} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Close</button>
                 </footer>
            </div>
        </div>
    );
};
