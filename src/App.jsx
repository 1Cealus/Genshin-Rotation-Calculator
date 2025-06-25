import React, { useState, useMemo, useEffect } from 'react';

// Import the validation flag directly. This is the key change for the error check.
import { isFirebaseConfigValid } from './config.js';
// All other firebase imports now come from the central firebase.js file
import { db, auth, onAuthStateChanged, signOut, doc, setDoc, onSnapshot } from './firebase';

import { Login } from './components/Login.jsx';
import { characterData } from './data/character_database.js';
import { weaponData } from './data/weapon_database.js';
import { enemyData } from './data/enemy_database.js';
import { calculateFinalDamage } from './logic/damage_formula.js';
import { BuildEditorModal } from './components/BuildEditorModal.jsx';
import { ActionControlPanel } from './components/ActionControlPanel.jsx';
import { AddActionModal } from './components/AddActionModal.jsx';


// A component to show a clear error message if Firebase config is missing.
const FirebaseConfigError = () => (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 text-white">
        <div className="w-full max-w-lg p-8 space-y-4 bg-red-900/80 rounded-xl shadow-lg border-2 border-red-500 text-center">
            <h1 className="text-2xl font-bold text-red-300">Firebase Configuration Error</h1>
            <p className="text-red-200">
                Your Firebase environment variables are missing. Please ensure you have a <code>.env.local</code> file in the root of your project.
            </p>
            <p className="text-red-200">
                Make sure it contains all the required <code>VITE_FIREBASE_*</code> keys and that you have restarted the Vite development server.
            </p>
        </div>
    </div>
);


export default function App() {
    // --- Render Logic ---
    // THIS IS THE NEW, MORE RELIABLE CHECK.
    // If the config is invalid, we show the error immediately and stop.
    if (!isFirebaseConfigValid) {
        return <FirebaseConfigError />;
    }

    // --- State Declarations ---
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [team, setTeam] = useState(['alhaitham', '', '', '']);
    const [characterBuilds, setCharacterBuilds] = useState({});
    const [enemyKey, setEnemyKey] = useState('ruin_guard');
    const [rotation, setRotation] = useState([]);
    const [rotationDuration, setRotationDuration] = useState(20);
    
    const [editingActionId, setEditingActionId] = useState(null);
    const [isAddingActionFor, setIsAddingActionFor] = useState(null);
    const [editingBuildFor, setEditingBuildFor] = useState(null);

    // --- Authentication Effect ---
    useEffect(() => {
        // This will only run if the config was valid, so 'auth' will exist.
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });
        return () => unsubscribe(); // Cleanup on unmount
    }, []);

    // --- Firestore Data Loading ---
    useEffect(() => {
        if (!user || !db) return; // Don't run if no user or no db connection
        
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
        
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTeam(data.team || ['alhaitham', '', '', '']);
                setCharacterBuilds(data.characterBuilds || {});
                setEnemyKey(data.enemyKey || 'ruin_guard');
                setRotation(data.rotation || []);
                setRotationDuration(data.rotationDuration || 20);
            } else {
                console.log("No saved data found for this user. Starting fresh.");
                // Set to default state if no data is found
                setTeam(['alhaitham', '', '', '']);
                setCharacterBuilds({});
                // ... etc for other states
            }
        }, (error) => {
            console.error("Firestore snapshot error:", error);
        });

        return () => unsubscribe(); // Detach listener on unmount or user change
    }, [user]);

    // --- Firestore Data Saving ---
    useEffect(() => {
        if (!user || isLoading || !db) return; // Don't save if no user, loading, or no db

        const saveData = async () => {
            setIsSaving(true);
            const dataToSave = {
                team,
                characterBuilds,
                enemyKey,
                rotation,
                rotationDuration,
            };
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
                await setDoc(docRef, dataToSave, { merge: true });
            } catch (error) {
                console.error("Error saving data to Firestore:", error);
            } finally {
                setIsSaving(false);
            }
        };

        // Debounce saving to avoid excessive writes
        const handler = setTimeout(saveData, 1500);
        return () => clearTimeout(handler);

    }, [team, characterBuilds, enemyKey, rotation, rotationDuration, user, isLoading]);

    // --- Helper Functions and Memos ---
    const createDefaultBuild = (charKey) => {
        const charInfo = characterData[charKey] || {};
        const createEmptyPiece = () => ({ substats: { crit_rate: 0, crit_dmg: 0, atk_percent: 0, em: 0, flat_atk: 0 }});
        return {
            level: 90,
            constellation: 0,
            weapon: { key: 'no_weapon', refinement: 1 },
            talentLevels: { na: 9, skill: 9, burst: 9 },
            artifacts: {
                set_2pc: 'no_set',
                set_4pc: 'no_set',
                flower: { mainStat: 'hp_flat', ...createEmptyPiece() },
                plume: { mainStat: 'atk_flat', ...createEmptyPiece() },
                sands: { mainStat: 'atk_percent', ...createEmptyPiece() },
                goblet: { mainStat: (charInfo.element || 'physical') + '_dmg_bonus', ...createEmptyPiece() },
                circlet: { mainStat: 'crit_rate', ...createEmptyPiece() }
            },
        };
    };

    useEffect(() => {
        const newBuilds = { ...characterBuilds };
        let buildsChanged = false;
        team.forEach(charKey => {
            if (charKey && !newBuilds[charKey]) {
                newBuilds[charKey] = createDefaultBuild(charKey);
                buildsChanged = true;
            }
        });
        if (buildsChanged) {
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

    const handleAddActionClick = (charKey) => setIsAddingActionFor(charKey);
    const handleConfirmAddAction = (charKey, talentKey) => {
        if (!charKey || !talentKey) return;
        const newAction = { id: Date.now(), characterKey: charKey, talentKey, config: { reactionType: 'none', activeBuffs: {}, infusion: null }};
        setRotation(prev => [...prev, newAction]);
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
                team,
                characterBuilds
            };
            const damage = calculateFinalDamage(state);
            return { actionId: action.id, damage };
        });
    }, [rotation, characterBuilds, enemyKey, team]);

    const rotationSummary = useMemo(() => {
        const totalDamage = calculationResults.reduce((sum, res) => sum + res.damage.avg, 0);
        return { totalDamage, dps: totalDamage / (rotationDuration || 1) };
    }, [calculationResults, rotationDuration]);

    const editingAction = useMemo(() => rotation.find(a => a.id === editingActionId), [rotation, editingActionId]);
    const activeTeam = useMemo(() => team.filter(c => c), [team]);
    
    if (isLoading) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">Loading...</div>;
    }

    if (!user) {
        return <Login />;
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-4xl font-bold text-cyan-400">Genshin Manual Rotation Calculator</h1>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400">{isSaving ? 'Saving...' : 'Saved'}</span>
                            <button onClick={() => signOut(auth)} className="bg-red-600 hover:bg-red-700 font-bold py-2 px-4 rounded-lg text-sm">Sign Out</button>
                        </div>
                    </div>
                     <p className="text-xs text-gray-500 mt-2">User ID: {user.uid} ({user.isAnonymous ? 'Anonymous' : user.email})</p>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
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
                    {/* Right Column */}
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

            {/* Modals */}
            {isAddingActionFor && <AddActionModal charKey={isAddingActionFor} onAdd={handleConfirmAddAction} onClose={() => setIsAddingActionFor(null)}/>}
            {editingBuildFor && characterBuilds[editingBuildFor] && <BuildEditorModal charKey={editingBuildFor} build={characterBuilds[editingBuildFor]} updateBuild={updateCharacterBuild} onClose={() => setEditingBuildFor(null)}/>}
            {editingAction && <ActionControlPanel action={editingAction} team={activeTeam} characterBuilds={characterBuilds} updateAction={handleUpdateAction} closePanel={() => setEditingActionId(null)}/>}
        </div>
    );
}
