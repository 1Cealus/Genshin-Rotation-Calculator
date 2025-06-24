import React, { useState } from 'react';
import { characterData } from './character_database.js';
import { buffData } from './buff_database.js';

export const ActionControlPanel = ({ action, team, updateAction, closePanel }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleTalentChange = (e) => {
        updateAction(action.id, { ...action, talentKey: e.target.value });
    };

    const handleReactionChange = (e) => {
        updateAction(action.id, { ...action, config: { ...action.config, reactionType: e.target.value } });
    };

    const handleBuffToggle = (buffKey) => {
        const newBuffs = { ...action.config.activeBuffs };
        if (newBuffs[buffKey]?.active) {
            newBuffs[buffKey].active = false;
        } else {
            newBuffs[buffKey] = { active: true, stacks: buffData[buffKey].stackable ? 1 : undefined };
        }
        updateAction(action.id, { ...action, config: { ...action.config, activeBuffs: newBuffs } });
    };

    const handleStackChange = (buffKey, value) => {
        const stacks = Math.max(1, Math.min(parseInt(value) || 1, buffData[buffKey].stackable.max_stacks));
        const newBuffs = { ...action.config.activeBuffs, [buffKey]: { ...action.config.activeBuffs[buffKey], stacks } };
        updateAction(action.id, { ...action, config: { ...action.config, activeBuffs: newBuffs } });
    };

    const availableTalents = characterData[action.characterKey].talents;
    const filteredBuffs = Object.entries(buffData).filter(([key, buff]) => buff.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl text-white border-2 border-cyan-500">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Configure Action for {characterData[action.characterKey].name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Talent / Attack</label>
                        <select value={action.talentKey} onChange={handleTalentChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                            {Object.keys(availableTalents).map(tKey => <option key={tKey} value={tKey}>{availableTalents[tKey].name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Reaction</label>
                        <select value={action.config.reactionType} onChange={handleReactionChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                            <option value="none">No Reaction</option>
                            <option value="vaporize_1.5">Vaporize (1.5x)</option>
                            <option value="vaporize_2.0">Vaporize (2.0x)</option>
                            <option value="melt_1.5">Melt (1.5x)</option>
                            <option value="melt_2.0">Melt (2.0x)</option>
                            <option value="aggravate">Aggravate</option>
                            <option value="spread">Spread</option>
                        </select>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Buffs & Debuffs</h3>
                    <input type="text" placeholder="Search buffs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 mb-2" />
                    <div className="max-h-64 overflow-y-auto bg-gray-900/50 p-3 rounded-md border-gray-700 space-y-2">
                        {filteredBuffs.map(([key, buff]) => (
                            <div key={key} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                                <div className="flex items-center">
                                    <input type="checkbox" id={`buff-${key}`} checked={!!action.config.activeBuffs[key]?.active} onChange={() => handleBuffToggle(key)} className="h-4 w-4 rounded" />
                                    <label htmlFor={`buff-${key}`} className="ml-3 text-sm text-gray-300">{buff.name}</label>
                                </div>
                                {buff.stackable && action.config.activeBuffs[key]?.active && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs">Stacks:</label>
                                        <input type="number" min="1" max={buff.stackable.max_stacks} value={action.config.activeBuffs[key].stacks} onChange={e => handleStackChange(key, e.target.value)} className="w-16 bg-gray-800 text-white p-1 rounded-md text-center" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                
                <button onClick={closePanel} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg">Done</button>
            </div>
        </div>
    );
};
