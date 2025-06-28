import React, { useState, useMemo } from 'react';

export const ActionControlPanel = ({ action, team, characterBuilds, updateAction, closePanel, gameData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { buffData, characterData } = gameData;

    const availableBuffs = useMemo(() => {
        const activeTeamWeapons = team.map(charKey => characterBuilds[charKey]?.weapon.key).filter(Boolean);
        const equipped4pcSets = team.map(charKey => characterBuilds[charKey]?.artifacts.set_4pc).filter(set => set && set !== 'no_set');

        return Object.entries(buffData).filter(([buffKey, buff]) => {
            let isAvailable = false;
            // First, check if the buff is even possible with the current team
            if (buff.source_type === 'character' && team.includes(buff.source_character)) isAvailable = true;
            if (buff.source_type === 'weapon' && activeTeamWeapons.includes(buff.source_weapon)) isAvailable = true;
            if (buff.source_type === 'constellation' && team.includes(buff.source_character)) {
                 const build = characterBuilds[buff.source_character];
                 isAvailable = build && build.constellation >= buff.constellation;
            }
            if (buff.source_type === 'artifact_set' && buffKey.includes('_4pc') && equipped4pcSets.includes(buff.source_set)) isAvailable = true;
            
            if (!isAvailable) return false;

            // Now, filter based on whether it's team-wide or self-only
            if (buff.teamwide === false) { // This is a self-only buff
                const actionCharacterBuild = characterBuilds[action.characterKey];
                
                // Check character-sourced self-buffs
                if ((buff.source_type === 'character' || buff.source_type === 'constellation') && buff.source_character !== action.characterKey) {
                    return false;
                }
                // Check weapon-sourced self-buffs
                if (buff.source_type === 'weapon' && actionCharacterBuild?.weapon?.key !== buff.source_weapon) {
                    return false;
                }
                // Check artifact-sourced self-buffs
                if (buff.source_type === 'artifact_set') {
                    const characterSets = [actionCharacterBuild?.artifacts?.set_2pc, actionCharacterBuild?.artifacts?.set_4pc];
                    if (!characterSets.includes(buff.source_set)) {
                        return false;
                    }
                }
            }
            
            // If it's a team-wide buff (or teamwide is not specified), it's always shown
            return true;
        });
    }, [team, characterBuilds, buffData, action.characterKey]);

    const filteredBuffs = useMemo(() => {
        if (!searchTerm) return availableBuffs;
        return availableBuffs.filter(([, buff]) => 
            buff.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, availableBuffs]);

    const handleUpdateConfig = (key, value) => {
        const newConfig = { ...action.config, [key]: value };
        updateAction(action.id, { ...action, config: newConfig });
    };

    const handleBuffToggle = (buffKey) => {
        const newBuffs = { ...action.config.activeBuffs };
        const buffDefinition = buffData[buffKey];

        if (newBuffs[buffKey]?.active) {
            delete newBuffs[buffKey];
        } else {
            const newBuffState = { active: true };
            if (buffDefinition.stackable) {
                newBuffState.stacks = 1; 
            }
            newBuffs[buffKey] = newBuffState;
        }
        handleUpdateConfig('activeBuffs', newBuffs);
    };

    const handleStackChange = (buffKey, value) => {
        const stacks = Math.max(1, Math.min(parseInt(value) || 1, buffData[buffKey].stackable.max_stacks));
        const newBuffs = { ...action.config.activeBuffs, [buffKey]: { ...action.config.activeBuffs[buffKey], stacks } };
        handleUpdateConfig('activeBuffs', newBuffs);
    };

    const talentInfo = characterData[action.characterKey].talents[action.talentKey];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900/80 rounded-2xl shadow-xl p-6 w-full max-w-2xl text-white border-2 border-gray-700 flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-cyan-400">Configure: {talentInfo.name}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Reaction</label>
                        <select value={action.config.reactionType} onChange={e => handleUpdateConfig('reactionType', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                            <option value="none">No Reaction</option>
                            <option value="vaporize_1.5">Vaporize (1.5x)</option>
                            <option value="vaporize_2.0">Vaporize (2.0x)</option>
                            <option value="melt_1.5">Melt (1.5x)</option>
                            <option value="melt_2.0">Melt (2.0x)</option>
                            <option value="aggravate">Aggravate</option>
                            <option value="spread">Spread</option>
                        </select>
                    </div>
                     {talentInfo.can_be_infused && (
                        <div className="flex items-center justify-center bg-gray-800 p-2 rounded-md border border-gray-600">
                            <input type="checkbox" id={`infusion-${action.id}`} checked={action.config.infusion === 'dendro'} onChange={e => handleUpdateConfig('infusion', e.target.checked ? 'dendro' : null)} className="h-4 w-4 rounded bg-gray-900 border-gray-500 text-cyan-500 focus:ring-cyan-600" />
                            <label htmlFor={`infusion-${action.id}`} className="ml-3 text-sm text-gray-200">Dendro Infusion</label>
                        </div>
                    )}
                </div>
                
                {action.characterKey === 'skirk' && ['burst_ruin_slash', 'burst_ruin_final_slash'].includes(action.talentKey) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Serpent's Subtlety Consumed</label>
                        <input type="number" min="50" value={action.config.serpent_subtlety_consumed || 50} onChange={e => handleUpdateConfig('serpent_subtlety_consumed', parseInt(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2"/>
                    </div>
                )}
                {action.characterKey === 'skirk' && action.talentKey === 'burst_extinction_cast' && (
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Void Rifts Absorbed</label>
                        <input type="number" min="0" max="3" value={action.config.activeBuffs?.skirk_all_shall_wither?.stacks || 0} onChange={e => handleStackChange('skirk_all_shall_wither', parseInt(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2"/>
                    </div>
                )}


                <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Available Buffs & Debuffs</h3>
                    <input type="text" placeholder="Search buffs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-800 border-gray-600 rounded-md p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    <div className="max-h-64 overflow-y-auto bg-gray-800/50 p-3 rounded-md border border-gray-700 space-y-2">
                        {filteredBuffs.map(([key, buff]) => (
                            <div key={key} className="bg-gray-700/80 p-3 rounded-md">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input type="checkbox" id={`buff-${key}-${action.id}`} checked={!!action.config.activeBuffs[key]?.active} onChange={() => handleBuffToggle(key)} className="h-4 w-4 rounded bg-gray-900 border-gray-500 text-cyan-500 focus:ring-cyan-600" />
                                        <label htmlFor={`buff-${key}-${action.id}`} className="ml-3 text-sm text-gray-200">{buff.name}</label>
                                    </div>
                                    {buff.stackable && action.config.activeBuffs[key]?.active && (
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-400">Stacks:</label>
                                            <input type="number" min="1" max={buff.stackable.max_stacks} value={action.config.activeBuffs[key].stacks || 1} onChange={e => handleStackChange(key, e.target.value)} className="w-16 bg-gray-800 text-white p-1 rounded-md text-center border border-gray-600" />
                                        </div>
                                    )}
                                </div>
                                {action.config.activeBuffs[key]?.active && buff.description && (
                                    <p className="mt-2 text-xs text-gray-400 pl-7">{buff.description}</p>
                                )}
                            </div>
                        ))}
                         {filteredBuffs.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No available buffs match for the current team.</p>}
                    </div>
                </div>
                
                <button onClick={closePanel} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Done</button>
            </div>
        </div>
    );
};