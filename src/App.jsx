import React, { useState, useMemo, useEffect } from 'react';
import { characterData } from './data/character_database.js';
import { weaponData } from './data/weapon_database.js';
import { enemyData } from './data/enemy_database.js';
import { calculateFinalDamage } from './logic/damage_formula.js';
import { BuildEditorModal } from './components/BuildEditorModal.jsx'; // Use the new build modal
import { ActionControlPanel } from './components/ActionControlPanel.jsx';
import { AddActionModal } from './components/AddActionModal.jsx';

export default function App() {
    const [team, setTeam] = useState(['alhaitham', '', '', '']);
    const [characterBuilds, setCharacterBuilds] = useState({});
    const [enemyKey, setEnemyKey] = useState('ruin_guard');
    const [rotation, setRotation] = useState([]);
    const [rotationDuration, setRotationDuration] = useState(20);
    const [editingActionId, setEditingActionId] = useState(null);
    const [isAddingActionFor, setIsAddingActionFor] = useState(null);
    const [editingBuildFor, setEditingBuildFor] = useState(null); // State for the build editor modal

    const createDefaultBuild = (charKey) => {
        const createEmptyPiece = () => ({ substats: { crit_rate: 0, crit_dmg: 0, atk_percent: 0, em: 0, flat_atk: 0 }});
        return {
            level: 90,
            weapon: { key: 'no_weapon', refinement: 1 },
            talentLevels: { na: 9, skill: 9, burst: 9 },
            artifacts: {
                set_2pc: 'no_set',
                set_4pc: 'no_set',
                flower: { mainStat: 'hp_flat', ...createEmptyPiece() },
                plume: { mainStat: 'atk_flat', ...createEmptyPiece() },
                sands: { mainStat: 'atk_percent', ...createEmptyPiece() },
                goblet: { mainStat: charInfo.element + '_dmg_bonus', ...createEmptyPiece() },
                circlet: { mainStat: 'crit_rate', ...createEmptyPiece() }
            },
        };
    };
    
    const charInfo = characterData[editingBuildFor] || {};

    useEffect(() => {
        const newBuilds = { ...characterBuilds };
        let buildsChanged = false;
        team.forEach(charKey => {
            if (charKey && !newBuilds[charKey]) {
                newBuilds[charKey] = createDefaultBuild(charKey);
                buildsChanged = true;
            }
        });
        if(buildsChanged) {
            setCharacterBuilds(newBuilds);
        }
    }, [team]);

    const handleTeamChange = (index, charKey) => {
        const newTeam = [...team];
        newTeam[index] = charKey;
        setTeam(newTeam);
    };

    const updateCharacterBuild = (charKey, newBuild) => {
        setCharacterBuilds(prev => ({ ...prev, [charKey]: newBuild }));
    };

    const handleAddActionClick = (charKey) => {
        setIsAddingActionFor(charKey);
    };

    const handleConfirmAddAction = (charKey, talentKey) => {
        if (!charKey || !talentKey) return;
        const newAction = {
            id: Date.now(),
            characterKey: charKey,
            talentKey: talentKey,
            config: { reactionType: 'none', activeBuffs: {}, infusion: null }
        };
        setRotation(prevRotation => [...prevRotation, newAction]);
    };

    const handleUpdateAction = (id, updatedAction) => setRotation(rotation.map(a => a.id === id ? updatedAction : a));
    const handleRemoveAction = (id) => setRotation(rotation.filter(a => a.id !== id));

    const calculationResults = useMemo(() => {
        return rotation.map(action => {
            if (!action.characterKey || !action.talentKey || !characterBuilds[action.characterKey]) {
                return { actionId: action.id, damage: { avg: 0, crit: 0, nonCrit: 0 } };
            }
            const build = characterBuilds[action.characterKey];
            const state = {
                character: characterData[action.characterKey],
                characterBuild: build,
                weapon: weaponData[build.weapon.key],
                talent: characterData[action.characterKey].talents[action.talentKey],
                activeBuffs: action.config.activeBuffs,
                reactionType: action.config.reactionType,
                infusion: action.config.infusion,
                enemy: enemyData[enemyKey],
            };
            const damage = calculateFinalDamage(state);
            return { actionId: action.id, damage };
        });
    }, [rotation, characterBuilds, enemyKey]);

    const rotationSummary = useMemo(() => {
        const totalDamage = calculationResults.reduce((sum, res) => sum + res.damage.avg, 0);
        return {
            totalDamage,
            dps: totalDamage / (rotationDuration || 1)
        }
    }, [calculationResults, rotationDuration]);

    const editingAction = useMemo(() => rotation.find(a => a.id === editingActionId), [rotation, editingActionId]);
    const activeTeam = useMemo(() => team.filter(c => c), [team]);

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-cyan-400">Genshin Manual Rotation Calculator</h1>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gray-800 p-4 rounded-lg">
                             <h2 className="text-2xl font-semibold mb-4 text-gray-200 border-b-2 border-gray-700 pb-2">Configuration</h2>
                             <div className="space-y-4">
                                <select value={enemyKey} onChange={e => setEnemyKey(e.target.value)} className="w-full bg-gray-700 rounded p-2">
                                    {Object.keys(enemyData).map(key => <option key={key} value={key}>{enemyData[key].name}</option>)}
                                </select>
                                <div className="space-y-2">
                                    {team.map((charKey, i) => <select key={i} value={charKey} onChange={e => handleTeamChange(i, e.target.value)} className="w-full bg-gray-700 rounded p-2"><option value="">Slot {i+1}</option>{Object.keys(characterData).map(cKey => <option key={cKey} value={cKey}>{characterData[cKey].name}</option>)}</select>)}
                                </div>
                             </div>
                        </div>
                        {activeTeam.map(charKey => 
                             characterBuilds[charKey] && (
                                <div key={charKey} className="bg-gray-800 p-4 rounded-lg">
                                     <h3 className="text-xl font-bold text-cyan-400 mb-4">{characterData[charKey].name}</h3>
                                     <button onClick={() => setEditingBuildFor(charKey)} className="w-full bg-cyan-600 hover:bg-cyan-700 font-bold py-2 px-4 rounded-lg">
                                         Edit Build
                                     </button>
                                </div>
                             )
                        )}
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                         <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-semibold text-gray-200">Rotation Builder</h2>
                                <div className="flex gap-2">
                                    {activeTeam.map(c => <button key={c} onClick={() => handleAddActionClick(c)} className="bg-cyan-600 hover:bg-cyan-700 font-bold py-2 px-2 rounded-lg text-xs">+ {characterData[c].name.split(' ')[0]}</button>)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                {rotation.map(action => {
                                    const result = calculationResults.find(res => res.actionId === action.id);
                                    const damage = result ? result.damage : { avg: 0, crit: 0, nonCrit: 0 };
                                    return (
                                        <div key={action.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between gap-2">
                                            <div className="flex-grow">
                                                <p className="font-semibold text-lg">{characterData[action.characterKey].name} - <span className="text-cyan-400">{characterData[action.characterKey].talents[action.talentKey].name}</span></p>
                                                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                                                    <span>Crit: <span className="text-white font-mono">{damage.crit.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></span>
                                                    <span>Non-Crit: <span className="text-white font-mono">{damage.nonCrit.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-xl text-white">{damage.avg.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                                                <p className="text-xs text-gray-400">Avg</p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => setEditingActionId(action.id)} className="bg-gray-600 text-xs py-1 px-3 rounded">Edit</button>
                                                <button onClick={() => handleRemoveAction(action.id)} className="bg-red-500 hover:bg-red-600 text-xs py-1 px-3 rounded">Del</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-around items-center bg-gray-700 p-4 rounded-lg">
                                <div className="text-center"><p className="text-gray-400 text-sm">Total Damage</p><p className="text-3xl font-bold text-cyan-400">{rotationSummary.totalDamage.toLocaleString(undefined, {maximumFractionDigits: 0})}</p></div>
                                <input type="number" value={rotationDuration} onChange={e => setRotationDuration(parseFloat(e.target.value) || 1)} className="w-20 bg-gray-800 p-1 text-center text-white" />
                                <div className="text-center"><p className="text-gray-400 text-sm">DPS</p><p className="text-3xl font-bold text-white">{rotationSummary.dps.toLocaleString(undefined, {maximumFractionDigits: 0})}</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isAddingActionFor && (
                <AddActionModal
                    charKey={isAddingActionFor}
                    onAdd={handleConfirmAddAction}
                    onClose={() => setIsAddingActionFor(null)}
                />
            )}

            {editingBuildFor && characterBuilds[editingBuildFor] && (
                 <BuildEditorModal
                    charKey={editingBuildFor}
                    build={characterBuilds[editingBuildFor]}
                    updateBuild={updateCharacterBuild}
                    onClose={() => setEditingBuildFor(null)}
                />
            )}
            
            {editingAction && 
                <ActionControlPanel 
                    action={editingAction} 
                    team={activeTeam}
                    characterBuilds={characterBuilds}
                    updateAction={handleUpdateAction} 
                    closePanel={() => setEditingActionId(null)} 
                />
            }
        </div>
    );
}
