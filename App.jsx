import React, { useState, useMemo } from 'react';
import { characterData } from './character_database.js';
import { weaponData } from './weapon_database.js';
import { enemyData } from './enemy_database.js';
import { buffData } from './buff_database.js';
import { calculateFinalDamage } from './damage_formula.js';
import { CharacterBuildPanel } from './CharacterBuildPanel.jsx';
import { ActionControlPanel } from './ActionControlPanel.jsx';

// --- MAIN APP COMPONENT ---
export default function App() {
    // --- STATE MANAGEMENT ---
    // Team starts with 4 empty slots
    const [team, setTeam] = useState(['', '', '', '']);
    // Character builds are stored in an object, keyed by character ID
    const [characterBuilds, setCharacterBuilds] = useState({});
    const [enemyKey, setEnemyKey] = useState('ruin_guard');
    const [rotation, setRotation] = useState([]);
    const [rotationDuration, setRotationDuration] = useState(20);
    const [editingActionId, setEditingActionId] = useState(null);

    // --- CALLBACKS & HANDLERS ---

    // Handles selecting a character for a team slot
    const handleTeamChange = (index, charKey) => {
        const newTeam = [...team];
        newTeam[index] = charKey;
        setTeam(newTeam);

        // If a new character is selected and doesn't have a build yet, create a default one.
        if (charKey && !characterBuilds[charKey]) {
            const defaultStats = { flat_atk: 0, atk_percent: 0, hp_percent: 0, crit_rate: 0.05, crit_dmg: 0.50, em: 0, pyro_dmg_bonus: 0, hydro_dmg_bonus: 0, dendro_dmg_bonus: 0, electro_dmg_bonus: 0, anemo_dmg_bonus: 0, cryo_dmg_bonus: 0, geo_dmg_bonus: 0, physical_dmg_bonus: 0 };
            const defaultBuild = { level: 90, weapon: 'no_weapon', stats: defaultStats };
            setCharacterBuilds(prev => ({ ...prev, [charKey]: defaultBuild }));
        }
    };

    const updateCharacterBuild = (charKey, newBuild) => {
        setCharacterBuilds(prev => ({ ...prev, [charKey]: newBuild }));
    };

    const handleAddAction = () => {
        const newAction = {
            id: Date.now(),
            characterKey: team.find(c => c) || '', // Defaults to the first available character
            talentKey: '',
            config: { reactionType: 'none', activeBuffs: [] }
        };
        setRotation([...rotation, newAction]);
        setEditingActionId(newAction.id);
    };

    const handleUpdateAction = (id, updatedAction) => {
        setRotation(rotation.map(a => a.id === id ? updatedAction : a));
    };

    const handleRemoveAction = (id) => {
        setRotation(rotation.filter(a => a.id !== id));
    };
    
    const handleMoveAction = (index, direction) => {
        const newRotation = [...rotation];
        const targetIndex = index + direction;
        if(targetIndex < 0 || targetIndex >= newRotation.length) return;
        [newRotation[index], newRotation[targetIndex]] = [newRotation[targetIndex], newRotation[index]]; // Swap
        setRotation(newRotation);
    };
    
    // --- MEMOIZED CALCULATIONS ---
    const calculationResults = useMemo(() => {
        const enemy = enemyData[enemyKey];
        const results = rotation.map(action => {
            if (!action.characterKey || !action.talentKey || !characterBuilds[action.characterKey]) {
                return { action, damage: { avg: 0, crit: 0, nonCrit: 0 } };
            }
            
            const state = {
                character: characterData[action.characterKey],
                characterBuild: characterBuilds[action.characterKey],
                weapon: weaponData[characterBuilds[action.characterKey].weapon],
                talent: characterData[action.characterKey].talents[action.talentKey],
                activeBuffs: action.config.activeBuffs.map(key => buffData[key]),
                reactionType: action.config.reactionType,
                enemy: enemy,
            };

            const damage = calculateFinalDamage(state);
            return { action, damage };
        });

        const totalDamage = results.reduce((sum, res) => sum + res.damage.avg, 0);
        const dps = totalDamage / (rotationDuration || 1);

        return { actionResults: results, totalDamage, dps };

    }, [rotation, characterBuilds, enemyKey, rotationDuration]);
    
    const editingAction = useMemo(() => rotation.find(a => a.id === editingActionId), [rotation, editingActionId]);

    // --- RENDER ---
    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-cyan-400">Genshin Impact Manual Rotation Calculator</h1>
                    <p className="text-gray-400 mt-2">Build your rotation, action by action, for high-precision damage calculation.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Setup */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gray-800 p-4 rounded-lg">
                             <h2 className="text-2xl font-semibold mb-4 text-gray-200 border-b-2 border-gray-700 pb-2">Configuration</h2>
                             <div className="space-y-4">
                                <div>
                                     <label className="block text-sm font-medium text-gray-300 mb-1">Target</label>
                                     <select value={enemyKey} onChange={e => setEnemyKey(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                        {Object.keys(enemyData).map(key => <option key={key} value={key}>{enemyData[key].name} (Lvl {enemyData[key].level})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Team Setup</label>
                                    <div className="space-y-2">
                                        {team.map((charKey, index) => (
                                            <select key={index} value={charKey} onChange={e => handleTeamChange(index, e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                                                <option value="">Slot {index + 1}: N/A</option>
                                                {Object.keys(characterData).map(cKey => <option key={cKey} value={cKey}>{characterData[cKey].name}</option>)}
                                            </select>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                        
                        {team.map(charKey => charKey && characterBuilds[charKey] ? (
                            <CharacterBuildPanel key={charKey} charKey={charKey} build={characterBuilds[charKey]} updateBuild={updateCharacterBuild} />
                        ) : null)}
                    </div>

                    {/* Right Column: Rotation Builder & Results */}
                    <div className="lg:col-span-2 space-y-6">
                         <div className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold text-gray-200">Rotation Builder</h2>
                                <button onClick={handleAddAction} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50" disabled={!team.some(c=>c)}>+ Add Action</button>
                            </div>
                            <div className="space-y-2">
                                {rotation.length === 0 && <p className="text-center text-gray-500 py-8">Your rotation is empty. Select a team and add actions to begin.</p>}
                                {calculationResults.actionResults.map(({action, damage}, index) => (
                                    <div key={action.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-grow">
                                            <div className="flex flex-col">
                                                 <button onClick={() => handleMoveAction(index, -1)} disabled={index === 0} className="text-gray-400 hover:text-white disabled:opacity-25">&#9650;</button>
                                                 <button onClick={() => handleMoveAction(index, 1)} disabled={index === rotation.length - 1} className="text-gray-400 hover:text-white disabled:opacity-25">&#9660;</button>
                                            </div>
                                            <span className="font-bold text-cyan-400 w-8 text-center">{index + 1}</span>
                                            <div className="flex-grow">
                                                <p className="font-semibold">{action.characterKey ? characterData[action.characterKey]?.name : 'N/A'}</p>
                                                <p className="text-sm text-gray-400">{action.talentKey ? characterData[action.characterKey]?.talents[action.talentKey]?.name : 'No Talent Selected'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-white">{damage.avg.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                                                <p className="text-xs text-gray-400">Avg. Damage</p>
                                            </div>
                                            <button onClick={() => setEditingActionId(action.id)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded">Configure</button>
                                            <button onClick={() => handleRemoveAction(action.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">&times;</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-2xl font-semibold text-gray-200 mb-4">Rotation Summary</h2>
                            <div className="flex flex-col sm:flex-row justify-around items-center bg-gray-700 p-4 rounded-lg">
                                <div className="text-center">
                                    <p className="text-gray-400 text-sm">Total Rotation Damage</p>
                                    <p className="text-3xl font-bold text-cyan-400">{calculationResults.totalDamage.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                                </div>
                                 <div className="flex items-center gap-2 my-4 sm:my-0">
                                    <label className="text-gray-400 text-sm">Duration (s)</label>
                                    <input 
                                        type="number" 
                                        value={rotationDuration}
                                        onChange={e => setRotationDuration(parseFloat(e.target.value))}
                                        className="w-20 bg-gray-800 border border-gray-600 rounded-md p-1 text-center text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-400 text-sm">Rotation DPS</p>
                                    <p className="text-3xl font-bold text-white">{calculationResults.dps.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {editingAction && <ActionControlPanel action={editingAction} team={team.filter(c => c)} updateAction={handleUpdateAction} closePanel={() => setEditingActionId(null)} />}
        </div>
    );
}
