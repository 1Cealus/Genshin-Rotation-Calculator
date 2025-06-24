import React from 'react';
import { characterData } from './character_database.js';
import { weaponData } from './weapon_database.js';

const StatInput = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">{label}</label>
        <input
            type="number"
            step="0.1"
            value={value}
            onChange={onChange}
            className="w-24 bg-gray-700 border border-gray-600 rounded-md p-1 text-right text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
    </div>
);

export const CharacterBuildPanel = ({ charKey, build, updateBuild }) => {
    if (!charKey || !build) return null;
    
    const handleStatChange = (stat, isPercent = false) => (e) => {
        const value = parseFloat(e.target.value) || 0;
        const newStats = { ...build.stats };
        if (isPercent) {
             newStats[stat] = value / 100;
        } else {
             newStats[stat] = value;
        }
        updateBuild(charKey, { ...build, stats: newStats });
    };

    const handleWeaponChange = (e) => {
        updateBuild(charKey, { ...build, weapon: e.target.value });
    };
    
    const statFields = [ { label: "Flat HP", key: "flat_hp" }, { label: "HP%", key: "hp_percent", percent: true }, { label: "Flat ATK", key: "flat_atk" }, { label: "ATK%", key: "atk_percent", percent: true }, { label: "Flat DEF", key: "flat_def" }, { label: "DEF%", key: "def_percent", percent: true }, { label: "Crit Rate %", key: "crit_rate", percent: true }, { label: "Crit DMG %", key: "crit_dmg", percent: true }, { label: "EM", key: "em" }, { label: "ER %", key: "er", percent: true }, { label: "Pyro DMG %", key: "pyro_dmg_bonus", percent: true }, { label: "Hydro DMG %", key: "hydro_dmg_bonus", percent: true }, { label: "Dendro DMG %", key: "dendro_dmg_bonus", percent: true }, { label: "Electro DMG %", key: "electro_dmg_bonus", percent: true }, { label: "Anemo DMG %", key: "anemo_dmg_bonus", percent: true }, { label: "Cryo DMG %", key: "cryo_dmg_bonus", percent: true }, { label: "Geo DMG %", key: "geo_dmg_bonus", percent: true }, { label: "Physical DMG %", key: "physical_dmg_bonus", percent: true } ];

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">{characterData[charKey].name} Build</h3>
            <div className="mb-4">
                <label className="text-sm text-gray-300 block mb-1">Weapon</label>
                <select value={build.weapon} onChange={handleWeaponChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                    {Object.keys(weaponData).map(wKey => <option key={wKey} value={wKey}>{weaponData[wKey].name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {statFields.map(field => (
                     <StatInput 
                        key={field.key} 
                        label={field.label}
                        value={field.percent ? ((build.stats[field.key] || 0) * 100).toFixed(1) : (build.stats[field.key] || 0)}
                        onChange={handleStatChange(field.key, field.percent)}
                    />
                ))}
            </div>
        </div>
    );
};
