import React, { useState, useMemo, useEffect } from 'react';
import { characterData } from './character_database.js';
import { weaponData } from './weapon_database.js';
import { enemyData } from './enemy_database.js';
import { calculateFinalDamage } from './damage_formula.js';
import { CharacterBuildPanel } from './CharacterBuildPanel.jsx';
import { ActionControlPanel } from './ActionControlPanel.jsx';

export default function App() {
    const [team, setTeam] = useState(['', '', '', '']);
    const [characterBuilds, setCharacterBuilds] = useState({});
    const [enemyKey, setEnemyKey] = useState('ruin_guard');
    const [rotation, setRotation] = useState([]);
    const [rotationDuration, setRotationDuration] = useState(20);
    const [editingActionId, setEditingActionId] = useState(null);

    const createDefaultBuild = (charKey) => {
        return {
            level: 90,
            weapon: { key: 'no_weapon', refinement: 1 },
            talentLevels: { na: 9, skill: 9, burst: 9 },
            stats: { flat_atk: 311, atk_percent: 0.466, crit_rate: 0.331, crit_dmg: 0.662, em: 0, pyro_dmg_bonus: 0, hydro_dmg_bonus: 0, dendro_dmg_bonus: 0, electro_dmg_bonus: 0, anemo_dmg_bonus: 0, cryo_dmg_bonus: 0, geo_dmg_bonus: 0, physical_dmg_bonus: 0 }
        };
    };

    useEffect(() => {
        const initialBuilds = {};
        team.forEach(charKey => {
            if (charKey && !initialBuilds[charKey]) {
                initialBuilds[charKey] = createDefaultBuild(charKey);
            }
        });
        setCharacterBuilds(initialBuilds);
    }, []);

    const handleTeamChange = (index, charKey) => {
        const newTeam = [...team];
        newTeam[index] = charKey;
        setTeam(newTeam);
        if (charKey && !characterBuilds[charKey]) {
            setCharacterBuilds(prev => ({ ...prev, [charKey]: createDefaultBuild(charKey) }));
        }
    };

    const updateCharacterBuild = (charKey, newBuild) => {
        setCharacterBuilds(prev => ({ ...prev, [charKey]: newBuild }));
    };

    const handleAddAction = (charKey) => {
        if (!charKey) return;
        const newAction = {
            id: Date.now(),
            characterKey: charKey,
            talentKey: 'na', // Default to normal attack
            config: { reactionType: 'none', activeBuffs: {} }
        };
        setRotation([...rotation, newAction]);
    };

    const handleUpdateAction = (id, updatedAction) => setRotation(rotation.map(a => a.id === id ? updatedAction : a));
    const handleRemoveAction = (id) => setRotation(rotation.filter(a => a.id !== id));

    const calculationResults = useMemo(() => {
        const results = rotation.map(action => {
            if (!action.characterKey || !action.talentKey || !characterBuilds[action.characterKey]) {
                return { action, damage: { avg: 0, crit: 0, nonCrit: 0 } };
            }
            const build = characterBuilds[action.characterKey];
            const state = {
                character: characterData[action.characterKey],
                characterBuild: build,
                weapon: weaponData[build.weapon.key],
                talent: characterData[action.characterKey].talents[action.talentKey],
                activeBuffs: action.config.activeBuffs,
                reactionType: action.config.reactionType,
                enemy: enemyData[enemyKey],
                talentKey: action.talentKey,
            };
            const damage = calculateFinalDamage(state);
            return { action, damage };
        });
        const totalDamage = results.reduce((sum, res) => sum + res.damage.avg, 0);
        return { actionResults: results, totalDamage, dps: totalDamage / (rotationDuration || 1) };
    }, [rotation, characterBuilds, enemyKey, rotationDuration]);

    const editingAction = useMemo(() => rotation.find(a => a.id === editingActionId), [rotation, editingActionId]);

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-cyan-400">Genshin Manual Rotation Calculator v2</h1>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        {/* Configuration and Builds */}
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
                        {team.map(charKey => charKey && characterBuilds[charKey] ? <CharacterBuildPanel key={charKey} charKey={charKey} build={characterBuilds[charKey]} updateBuild={updateCharacterBuild} /> : null)}
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        {/* Rotation Builder */}
                         <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-semibold text-gray-200">Rotation Builder</h2>
                                <div className="flex gap-2">
                                    {team.map(c => c && <button key={c} onClick={() => handleAddAction(c)} className="bg-cyan-600 hover:bg-cyan-700 font-bold py-2 px-2 rounded-lg text-xs">+ {characterData[c].name.split(' ')[0]}</button>)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                {calculationResults.actionResults.map(({action, damage}) => (
                                    <div key={action.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between gap-2">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-lg">{characterData[action.characterKey].name} - <span className="text-cyan-400">{characterData[action.characterKey].talents[action.talentKey].name}</span></p>
                                            <div className="flex gap-4 text-xs text-gray-400 mt-1">
                                                <span>Crit: <span className="text-white font-mono">{damage.crit.toLocaleString(0)}</span></span>
                                                <span>Non-Crit: <span className="text-white font-mono">{damage.nonCrit.toLocaleString(0)}</span></span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-xl text-white">{damage.avg.toLocaleString(0)}</p>
                                            <p className="text-xs text-gray-400">Avg</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => setEditingActionId(action.id)} className="bg-gray-600 text-xs py-1 px-3 rounded">Edit</button>
                                            <button onClick={() => handleRemoveAction(action.id)} className="bg-red-600 text-xs py-1 px-3 rounded">Del</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Summary */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-around items-center bg-gray-700 p-4 rounded-lg">
                                <div className="text-center"><p className="text-gray-400 text-sm">Total Damage</p><p className="text-3xl font-bold text-cyan-400">{calculationResults.totalDamage.toLocaleString(0)}</p></div>
                                <input type="number" value={rotationDuration} onChange={e => setRotationDuration(parseFloat(e.target.value))} className="w-20 bg-gray-800 p-1 text-center text-white" />
                                <div className="text-center"><p className="text-gray-400 text-sm">DPS</p><p className="text-3xl font-bold text-white">{calculationResults.dps.toLocaleString(0)}</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {editingAction && <ActionControlPanel action={editingAction} team={team.filter(c=>c)} updateAction={handleUpdateAction} closePanel={() => setEditingActionId(null)} />}
        </div>
    );
}
