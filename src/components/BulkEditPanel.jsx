import React, { useState, useMemo, useEffect } from 'react';

const BulkBuffControl = ({ buffKey, buff, selectedActions, onBulkApplyBuffs }) => {
    const [status, setStatus] = useState('off');
    const [stacks, setStacks] = useState(1);
    const [isStacksMixed, setIsStacksMixed] = useState(false);

    useEffect(() => {
        if (!selectedActions || selectedActions.length === 0) return;
        
        const activeActions = selectedActions.filter(a => a.config.activeBuffs[buffKey]?.active);
        const activeCount = activeActions.length;

        if (activeCount === 0) {
            setStatus('off');
        } else if (activeCount === selectedActions.length) {
            setStatus('on');
        } else {
            setStatus('mixed');
        }

        if (buff.stackable) {
            if (activeCount > 0) {
                const firstStackValue = activeActions[0].config.activeBuffs[buffKey].stacks;
                const allHaveSameStacks = activeActions.every(a => a.config.activeBuffs[buffKey].stacks === firstStackValue);
                if (allHaveSameStacks) {
                    setStacks(firstStackValue);
                    setIsStacksMixed(false);
                } else {
                    setIsStacksMixed(true);
                }
            } else {
                setStacks(1);
                setIsStacksMixed(false);
            }
        }
    }, [selectedActions, buffKey, buff.stackable]);

    const handleToggle = () => {
        const shouldApply = status !== 'on'; 
        onBulkApplyBuffs(buffKey, { active: shouldApply, stacks: stacks || 1 });
    };

    const handleStackChange = (e) => {
        const newStacks = Math.max(1, Math.min(parseInt(e.target.value) || 1, buff.stackable.max_stacks));
        setStacks(newStacks);
        onBulkApplyBuffs(buffKey, { active: true, stacks: newStacks });
    };

    const toggleClasses = {
        on: 'bg-green-500',
        off: 'bg-gray-600',
        mixed: 'bg-yellow-500'
    };

    return (
        <div className="bg-gray-700/80 p-3 rounded-md flex items-center justify-between">
            <div>
                <p className="text-sm font-semibold text-gray-200">{buff.name}</p>
                {buff.description && <p className="text-xs text-gray-400 max-w-xs">{buff.description}</p>}
            </div>
            <div className="flex items-center gap-3">
                {buff.stackable && (
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400">Stacks:</label>
                        <input 
                            type="number" 
                            min="1" 
                            max={buff.stackable.max_stacks} 
                            value={isStacksMixed ? '' : stacks}
                            placeholder={isStacksMixed ? 'Mixed' : ''}
                            onChange={handleStackChange}
                            className="w-20 bg-gray-800 text-white p-1 rounded-md text-center border border-gray-600 placeholder-gray-500" 
                        />
                    </div>
                )}
                <button onClick={handleToggle} className={`w-24 text-white text-xs font-bold py-2 rounded-md transition-colors ${toggleClasses[status]}`}>
                    {status.toUpperCase()}
                </button>
            </div>
        </div>
    );
};


export const BulkEditPanel = ({ rotation, selectedActionIds, onBulkApplyBuffs, onClose, team, characterBuilds, gameData }) => {
    const { buffData } = gameData;

    const availableBuffs = useMemo(() => {
        const activeTeamWeapons = team.map(charKey => characterBuilds[charKey]?.weapon.key).filter(Boolean);
        const equipped4pcSets = team.map(charKey => characterBuilds[charKey]?.artifacts.set_4pc).filter(set => set && set !== 'no_set');

        // --- NEW LOGIC STARTS HERE ---
        // First, determine if all selected actions belong to a single character.
        const selectedChars = new Set(
            rotation
                .filter(action => selectedActionIds.includes(action.id))
                .map(action => action.characterKey)
        );

        const isSingleCharacterSelection = selectedChars.size === 1;
        const singleCharacterKey = isSingleCharacterSelection ? selectedChars.values().next().value : null;

        return Object.entries(buffData).filter(([buffKey, buff]) => {
            // Check if the buff provider is on the team
            let isAvailableOnTeam = false;
            if (buff.source_type === 'character' || buff.source_type === 'constellation') {
                isAvailableOnTeam = team.includes(buff.source_character);
            } else if (buff.source_type === 'weapon') {
                isAvailableOnTeam = activeTeamWeapons.includes(buff.source_weapon);
            } else if (buff.source_type === 'artifact_set' && buffKey.includes('_4pc')) {
                isAvailableOnTeam = equipped4pcSets.includes(buff.source_set);
            }
            if (!isAvailableOnTeam) return false;


            // Now, filter based on teamwide status
            if (buff.teamwide === false) { // This is a self-only buff
                // If multiple characters are selected, don't show self-only buffs
                if (!isSingleCharacterSelection) return false;
                
                // If one character is selected, only show if they are the source of the buff
                const characterBuild = characterBuilds[singleCharacterKey];
                if ((buff.source_type === 'character' || buff.source_type === 'constellation') && buff.source_character !== singleCharacterKey) return false;
                if (buff.source_type === 'weapon' && characterBuild?.weapon?.key !== buff.source_weapon) return false;
                if (buff.source_type === 'artifact_set') {
                    const sets = [characterBuild?.artifacts?.set_2pc, characterBuild?.artifacts?.set_4pc];
                    if (!sets.includes(buff.source_set)) return false;
                }
            }

            // If we reach here, the buff is team-wide OR it's a valid self-only buff for the selection.
            return true;
        });
    }, [team, characterBuilds, buffData, rotation, selectedActionIds]);

    const selectedActions = useMemo(() => 
        rotation.filter(action => selectedActionIds.includes(action.id)),
        [rotation, selectedActionIds]
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900/80 rounded-2xl shadow-xl p-6 w-full max-w-2xl text-white border-2 border-gray-700 flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-cyan-400">Bulk Edit {selectedActionIds.length} Actions</h2>
                <div>
                    <div className="max-h-96 overflow-y-auto bg-gray-800/50 p-3 rounded-md border border-gray-700 space-y-2">
                        {availableBuffs.map(([key, buff]) => (
                            <BulkBuffControl
                                key={key}
                                buffKey={key}
                                buff={buff}
                                selectedActions={selectedActions}
                                onBulkApplyBuffs={onBulkApplyBuffs}
                            />
                        ))}
                        {availableBuffs.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No common buffs available for this selection.</p>}
                    </div>
                </div>
                <button onClick={onClose} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Done</button>
            </div>
        </div>
    );
};