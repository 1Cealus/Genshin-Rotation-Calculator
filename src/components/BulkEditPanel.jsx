import React from 'react';
import { buffData } from '../data/buff_database.js';

export const BulkEditPanel = ({ selectedActionIds, onBulkApplyBuffs, onClose, team, characterBuilds }) => {

    const availableBuffs = React.useMemo(() => {
        const activeTeamWeapons = team.map(charKey => characterBuilds[charKey]?.weapon.key).filter(Boolean);
        const equipped4pcSets = team.map(charKey => characterBuilds[charKey]?.artifacts.set_4pc).filter(set => set && set !== 'no_set');

        return Object.entries(buffData).filter(([buffKey, buff]) => {
            if (buff.source_type === 'character') return team.includes(buff.source_character);
            if (buff.source_type === 'weapon') return activeTeamWeapons.includes(buff.source_weapon);
            if (buff.source_type === 'artifact_set' && buffKey.includes('_4pc')) return equipped4pcSets.includes(buff.source_set);
            return false;
        });
    }, [team, characterBuilds]);

    const handleApplyBuff = (buffKey, shouldApply) => {
        const buffDefinition = buffData[buffKey];
        const newBuffState = { active: shouldApply };
        if (shouldApply && buffDefinition.stackable) {
            newBuffState.stacks = buffDefinition.stackable.max_stacks; // Default to max stacks for bulk apply
        }
        onBulkApplyBuffs(buffKey, newBuffState);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900/80 rounded-2xl shadow-xl p-6 w-full max-w-lg text-white border-2 border-gray-700 flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-cyan-400">Bulk Edit {selectedActionIds.length} Actions</h2>
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Apply/Remove Buffs</h3>
                    <div className="max-h-80 overflow-y-auto bg-gray-800/50 p-3 rounded-md border border-gray-700 space-y-2">
                        {availableBuffs.map(([key, buff]) => (
                            <div key={key} className="bg-gray-700/80 p-3 rounded-md flex items-center justify-between">
                                <span className="text-sm text-gray-200">{buff.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleApplyBuff(key, true)} className="bg-green-600/80 text-xs py-1 px-3 rounded-md hover:bg-green-600">Apply</button>
                                    <button onClick={() => handleApplyBuff(key, false)} className="bg-red-500/70 text-xs py-1 px-3 rounded-md hover:bg-red-500">Remove</button>
                                </div>
                            </div>
                        ))}
                        {availableBuffs.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No team-wide buffs available.</p>}
                    </div>
                </div>
                <button onClick={onClose} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Done</button>
            </div>
        </div>
    );
};
