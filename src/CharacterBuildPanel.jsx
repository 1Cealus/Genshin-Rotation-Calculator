import React from 'react';
import { characterData } from './character_database.js';
import { weaponData } from './weapon_database.js';

export const CharacterBuildPanel = ({ charKey, build, updateBuild }) => {
    if (!charKey || !build) return null;

    const handleStatChange = (stat, isPercent = false) => (e) => {
        const value = parseFloat(e.target.value) || 0;
        updateBuild(charKey, { ...build, stats: { ...build.stats, [stat]: isPercent ? value / 100 : value } });
    };

    const handleWeaponChange = (e) => {
        updateBuild(charKey, { ...build, weapon: { ...build.weapon, key: e.target.value } });
    };

    const handleRefinementChange = (e) => {
        updateBuild(charKey, { ...build, weapon: { ...build.weapon, refinement: parseInt(e.target.value) } });
    };

    const handleTalentLevelChange = (talent) => (e) => {
        updateBuild(charKey, { ...build, talentLevels: { ...build.talentLevels, [talent]: parseInt(e.target.value) } });
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">{characterData[charKey].name} Build</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-sm text-gray-300 block mb-1">Weapon</label>
                    <select value={build.weapon.key} onChange={handleWeaponChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                        {Object.keys(weaponData).map(wKey => <option key={wKey} value={wKey}>{weaponData[wKey].name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm text-gray-300 block mb-1">Refinement</label>
                    <select value={build.weapon.refinement} onChange={handleRefinementChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                        {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>R{r}</option>)}
                    </select>
                </div>
            </div>
            <div className="mb-4">
                <label className="text-sm text-gray-300 block mb-1">Talent Levels</label>
                <div className="grid grid-cols-3 gap-2">
                    {Object.keys(characterData[charKey].talents).map(tKey => (
                        <div key={tKey}>
                            <label className="text-xs text-gray-400 block uppercase">{tKey}</label>
                            <input type="number" min="1" max="15" value={build.talentLevels[tKey]} onChange={handleTalentLevelChange(tKey)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-1 text-center text-white" />
                        </div>
                    ))}
                </div>
            </div>
            <details>
                <summary className="text-gray-300 cursor-pointer">Edit Substats</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-2">
                     {[ { label: "Flat ATK", key: "flat_atk" }, { label: "ATK%", key: "atk_percent", percent: true }, { label: "Crit Rate %", key: "crit_rate", percent: true }, { label: "Crit DMG %", key: "crit_dmg", percent: true } ].map(field => (
                        <div key={field.key} className="flex items-center justify-between">
                            <label className="text-sm text-gray-300">{field.label}</label>
                            <input type="number" step="0.1" value={field.percent ? ((build.stats[field.key] || 0) * 100).toFixed(1) : (build.stats[field.key] || 0)} onChange={handleStatChange(field.key, field.percent)} className="w-24 bg-gray-700 border border-gray-600 rounded-md p-1 text-right text-white" />
                        </div>
                    ))}
                </div>
            </details>
        </div>
    );
};
