import React, { useMemo } from 'react';
import { characterData } from '../data/character_database.js';
import { weaponData } from '../data/weapon_database.js';
import { artifactSets } from '../data/artifact_sets.js';
import { artifactMainStats } from '../data/artifact_stats.js';
import { calculateTotalStats } from '../logic/stat_calculator.js'; // We'll move stat logic to its own file

// A component for a single artifact piece, managing its main stat and substats
const ArtifactPieceEditor = ({ pieceName, pieceData, onUpdate, mainStatOptions }) => {
    const handleMainStatChange = (e) => {
        onUpdate({ ...pieceData, mainStat: e.target.value });
    };

    const handleSubstatChange = (stat, value) => {
        const newSubstats = { ...pieceData.substats, [stat]: value };
        onUpdate({ ...pieceData, substats: newSubstats });
    };
    
    const SubstatInput = ({ label, value, onChange }) => (
        <div className="flex items-center justify-between text-sm">
            <label className="text-gray-300">{label}</label>
            <input
                type="number"
                step="0.1"
                value={value}
                onChange={onChange}
                className="w-20 bg-gray-900 border border-gray-600 rounded-md p-1 text-right text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
        </div>
    );

    return (
        <details className="bg-gray-700/50 p-3 rounded-lg">
            <summary className="font-semibold text-white cursor-pointer capitalize">{pieceName}</summary>
            <div className="mt-3 space-y-3">
                {mainStatOptions && (
                    <div className="grid grid-cols-2 gap-2 items-center">
                        <label className="text-sm text-gray-300">Main Stat</label>
                        <select
                            value={pieceData.mainStat}
                            onChange={handleMainStatChange}
                            className="w-full bg-gray-800 border border-gray-600 rounded-md p-1 text-sm text-white"
                        >
                            {Object.entries(mainStatOptions).map(([key, stat]) => (
                                <option key={key} value={key}>{stat.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                 <div className="space-y-2 pt-2 border-t border-gray-600/50">
                    <h4 className="text-sm font-bold text-gray-400">Substats</h4>
                    <SubstatInput label="Crit Rate %" value={(pieceData.substats.crit_rate * 100).toFixed(1)} onChange={e => handleSubstatChange('crit_rate', parseFloat(e.target.value) / 100)} />
                    <SubstatInput label="Crit DMG %" value={(pieceData.substats.crit_dmg * 100).toFixed(1)} onChange={e => handleSubstatChange('crit_dmg', parseFloat(e.target.value) / 100)} />
                    <SubstatInput label="ATK%" value={(pieceData.substats.atk_percent * 100).toFixed(1)} onChange={e => handleSubstatChange('atk_percent', parseFloat(e.target.value) / 100)} />
                    <SubstatInput label="EM" value={pieceData.substats.em} onChange={e => handleSubstatChange('em', parseFloat(e.target.value))} />
                    <SubstatInput label="Flat ATK" value={pieceData.substats.flat_atk} onChange={e => handleSubstatChange('flat_atk', parseFloat(e.target.value))} />
                </div>
            </div>
        </details>
    );
};

// The main modal for editing a character's entire build
export const BuildEditorModal = ({ charKey, build, updateBuild, onClose }) => {
    if (!charKey) return null;

    const charInfo = characterData[charKey];

    const totalStats = useMemo(() => {
        return calculateTotalStats({
            character: charInfo,
            weapon: weaponData[build.weapon.key],
            characterBuild: build
        });
    }, [build, charInfo]);


    const handleWeaponChange = (e) => {
        updateBuild(charKey, { ...build, weapon: { ...build.weapon, key: e.target.value } });
    };

    const handleRefinementChange = (e) => {
        updateBuild(charKey, { ...build, weapon: { ...build.weapon, refinement: parseInt(e.target.value) } });
    };

    const handleTalentLevelChange = (talent) => (e) => {
        updateBuild(charKey, { ...build, talentLevels: { ...build.talentLevels, [talent]: parseInt(e.target.value) } });
    };

    const handleSetChange = (type, setKey) => {
        const newArtifacts = { ...build.artifacts, [type]: setKey };
        updateBuild(charKey, { ...build, artifacts: newArtifacts });
    };

    const handlePieceUpdate = (pieceName, newPieceData) => {
        const newArtifacts = { ...build.artifacts, [pieceName]: newPieceData };
        updateBuild(charKey, { ...build, artifacts: newArtifacts });
    };

    const StatDisplay = ({ label, value, isPercent = false, decimals = 1 }) => (
        <div className="flex justify-between bg-gray-700/50 p-2 rounded">
            <span className="text-gray-300">{label}</span>
            <span className="font-mono text-white">{isPercent ? (value * 100).toFixed(decimals) + '%' : value.toFixed(0)}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl text-white border-2 border-cyan-500 max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-700">
                     <h2 className="text-2xl font-bold text-cyan-400">{charInfo.name} Build Editor</h2>
                </header>

                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left side: Config */}
                    <div className="space-y-6">
                        {/* Weapon Section */}
                        <div className="space-y-3">
                             <h3 className="text-xl font-semibold text-gray-200">Weapon</h3>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-300 block mb-1">Weapon</label>
                                    <select value={build.weapon.key} onChange={handleWeaponChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                        {Object.entries(weaponData).filter(([key, weapon]) => weapon.type === 'all' || weapon.type === charInfo.weapon_type).map(([wKey, weapon]) => <option key={wKey} value={wKey}>{weapon.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-300 block mb-1">Refinement</label>
                                    <select value={build.weapon.refinement} onChange={handleRefinementChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                        {[1,2,3,4,5].map(r => <option key={r} value={r}>R{r}</option>)}
                                    </select>
                                </div>
                             </div>
                        </div>

                         {/* Talent Section */}
                        <div className="space-y-3">
                            <h3 className="text-xl font-semibold text-gray-200">Talent Levels</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.keys(build.talentLevels).map(tKey => (
                                    <div key={tKey}>
                                        <label className="text-xs text-gray-400 block uppercase">{tKey}</label>
                                        <input type="number" min="1" max="15" value={build.talentLevels[tKey]} onChange={handleTalentLevelChange(tKey)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-1 text-center text-white" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Artifact Section */}
                        <div className="space-y-3">
                             <h3 className="text-xl font-semibold text-gray-200">Artifacts</h3>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-300 block mb-1">2-Piece Set</label>
                                    <select value={build.artifacts.set_2pc} onChange={e => handleSetChange('set_2pc', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                        {Object.entries(artifactSets).map(([key, set]) => <option key={key} value={key}>{set.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-300 block mb-1">4-Piece Set</label>
                                    <select value={build.artifacts.set_4pc} onChange={e => handleSetChange('set_4pc', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                        {Object.entries(artifactSets).map(([key, set]) => <option key={key} value={key}>{set.name}</option>)}
                                    </select>
                                </div>
                            </div>
                             <div className="space-y-2 pt-3">
                               <ArtifactPieceEditor pieceName="flower" pieceData={build.artifacts.flower} onUpdate={(data) => handlePieceUpdate('flower', data)} />
                               <ArtifactPieceEditor pieceName="plume" pieceData={build.artifacts.plume} onUpdate={(data) => handlePieceUpdate('plume', data)} />
                               <ArtifactPieceEditor pieceName="sands" pieceData={build.artifacts.sands} onUpdate={(data) => handlePieceUpdate('sands', data)} mainStatOptions={artifactMainStats.sands} />
                               <ArtifactPieceEditor pieceName="goblet" pieceData={build.artifacts.goblet} onUpdate={(data) => handlePieceUpdate('goblet', data)} mainStatOptions={artifactMainStats.goblet} />
                               <ArtifactPieceEditor pieceName="circlet" pieceData={build.artifacts.circlet} onUpdate={(data) => handlePieceUpdate('circlet', data)} mainStatOptions={artifactMainStats.circlet} />
                            </div>
                        </div>
                    </div>

                    {/* Right side: Stats */}
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-gray-200">Total Stats</h3>
                        <div className="space-y-2">
                           <StatDisplay label="Max HP" value={totalStats.hp} />
                           <StatDisplay label="Total ATK" value={totalStats.atk} />
                           <StatDisplay label="Total DEF" value={totalStats.def} />
                           <StatDisplay label="Crit Rate" value={totalStats.crit_rate} isPercent={true} />
                           <StatDisplay label="Crit DMG" value={totalStats.crit_dmg} isPercent={true} />
                           <StatDisplay label="Elemental Mastery" value={totalStats.em} />
                           <StatDisplay label="Energy Recharge" value={totalStats.er} isPercent={true} />
                           <StatDisplay label="Dendro DMG Bonus" value={totalStats.dendro_dmg_bonus} isPercent={true} />
                           <StatDisplay label="Hydro DMG Bonus" value={totalStats.hydro_dmg_bonus} isPercent={true} />
                           {/* Add other stats as needed */}
                        </div>
                    </div>
                </div>

                 <footer className="p-4 border-t border-gray-700 mt-auto">
                     <button onClick={onClose} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg">Close</button>
                 </footer>
            </div>
        </div>
    );
};
