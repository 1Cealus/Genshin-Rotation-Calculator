import React from 'react';
import { characterData } from './character_database.js';
import { buffData } from './buff_database.js';

export const ActionControlPanel = ({ action, team, updateAction, closePanel }) => {
    const handleCharacterChange = (e) => {
        updateAction(action.id, { ...action, characterKey: e.target.value, talentKey: '' });
    };

    const handleTalentChange = (e) => {
        updateAction(action.id, { ...action, talentKey: e.target.value });
    };

    const handleReactionChange = (e) => {
        updateAction(action.id, { ...action, config: { ...action.config, reactionType: e.target.value } });
    };

    const handleBuffToggle = (buffKey) => {
        const currentBuffs = action.config.activeBuffs;
        const newBuffs = currentBuffs.includes(buffKey)
            ? currentBuffs.filter(b => b !== buffKey)
            : [...currentBuffs, buffKey];
        updateAction(action.id, { ...action, config: { ...action.config, activeBuffs: newBuffs } });
    };

    const availableTalents = action.characterKey ? characterData[action.characterKey].talents : {};

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl text-white border-2 border-cyan-500">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Configure Action</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Character</label>
                        <select value={action.characterKey} onChange={handleCharacterChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                            <option value="">Select Character...</option>
                            {team.map(charKey => <option key={charKey} value={charKey}>{characterData[charKey].name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Talent / Attack</label>
                        <select value={action.talentKey} onChange={handleTalentChange} disabled={!action.characterKey} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 disabled:opacity-50">
                            <option value="">Select Talent...</option>
                            {Object.keys(availableTalents).map(tKey => <option key={tKey} value={tKey}>{availableTalents[tKey].name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Reaction</label>
                        <select value={action.config.reactionType} onChange={handleReactionChange} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                             <option value="none">No Reaction</option>
                             <option value="vaporize_1.5">Vaporize (1.5x)</option>
                             <option value="melt_2.0">Melt (2.0x)</option>
                             <option value="aggravate">Aggravate</option>
                             <option value="spread">Spread</option>
                        </select>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Buffs & Debuffs</h3>
                    <div className="max-h-64 overflow-y-auto bg-gray-900/50 p-3 rounded-md border border-gray-700 space-y-2">
                        {Object.entries(buffData).map(([key, buff]) => (
                            <div key={key} className="flex items-center bg-gray-700 p-2 rounded-md">
                                <input
                                    type="checkbox"
                                    id={`buff-${action.id}-${key}`}
                                    checked={action.config.activeBuffs.includes(key)}
                                    onChange={() => handleBuffToggle(key)}
                                    className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                />
                                <label htmlFor={`buff-${action.id}-${key}`} className="ml-3 text-sm text-gray-300">{buff.name} <span className="text-xs text-gray-400">({buff.source})</span></label>
                            </div>
                        ))}
                    </div>
                </div>
                
                <button onClick={closePanel} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Done</button>
            </div>
        </div>
    );
};
