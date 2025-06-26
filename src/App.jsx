import React, { useState, useMemo, useEffect, useRef } from 'react';
// FIXED: Added collection, getDocs, deleteDoc to the firebase import
import { db, auth, onAuthStateChanged, signOut, doc, setDoc, onSnapshot, collection, getDocs, deleteDoc } from './firebase';
import { isFirebaseConfigValid } from './config.js';
import { parseNotation } from './utils/parseNotation.js';

// Components
import { Login } from './components/Login.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import { ActionTray } from './components/ActionTray.jsx';
import { BulkEditPanel } from './components/BulkEditPanel.jsx';
import { BuildEditorModal } from './components/BuildEditorModal.jsx';
import { ActionControlPanel } from './components/ActionControlPanel.jsx';

// Data and Logic
import { characterData } from './data/character_database.js';
import { weaponData } from './data/weapon_database.js';
import { enemyData } from './data/enemy_database.js';
import { calculateFinalDamage } from './logic/damage_formula.js';

const FirebaseConfigError = () => (<div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 text-white"><div className="w-full max-w-lg p-8 space-y-4 bg-red-900/80 rounded-xl shadow-lg border-2 border-red-500 text-center"><h1 className="text-2xl font-bold text-red-300">Firebase Config Error</h1><p>Firebase environment variables are missing or invalid.</p></div></div>);
const LoadingScreen = ({ text }) => (<div className="bg-gray-800 min-h-screen flex items-center justify-center text-white text-xl">{text}</div>);

const createDefaultBuild = (charKey) => {
    const charInfo = characterData[charKey] || {};
    return {
        level: 90, constellation: 0,
        weapon: { key: 'no_weapon', refinement: 1 },
        talentLevels: { na: 9, skill: 9, burst: 9 },
        artifacts: {
            set_2pc: 'no_set', set_4pc: 'no_set',
            flower: { mainStat: 'hp_flat', substats: {} },
            plume: { mainStat: 'atk_flat', substats: {} },
            sands: { mainStat: 'atk_percent', substats: {} },
            goblet: { mainStat: (charInfo.element || 'physical') + '_dmg_bonus', substats: {} },
            circlet: { mainStat: 'crit_rate', substats: {} }
        },
    };
};

const initialTeam = ['skirk', 'furina', 'mona', 'escoffier'];
const initialBuilds = {};
initialTeam.forEach(c => {
    if(c) initialBuilds[c] = createDefaultBuild(c);
});

export default function App() {
    if (!isFirebaseConfigValid) return <FirebaseConfigError />;

    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Main state
    const [team, setTeam] = useState(initialTeam);
    const [characterBuilds, setCharacterBuilds] = useState(initialBuilds);
    const [enemyKey, setEnemyKey] = useState('ruin_guard');
    const [rotation, setRotation] = useState([]);
    const [rotationDuration, setRotationDuration] = useState(20);

    // Preset management state
    const [presetName, setPresetName] = useState("My First Team");
    const [savedPresets, setSavedPresets] = useState([]);

    // UI state
    const [mainView, setMainView] = useState('rotation');
    const [activeActionTray, setActiveActionTray] = useState(null);
    const [editingActionId, setEditingActionId] = useState(null);
    const [editingBuildFor, setEditingBuildFor] = useState(null);
    const [selectedActionIds, setSelectedActionIds] = useState([]);
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    
    const importFileRef = useRef(null);

    // --- Firebase Auth and Data Sync ---
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => { setUser(u); if (!u) setIsLoading(false); });
        return () => unsub();
    }, []);

    // Effect for loading the user's main workspace and presets
    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        // Load main data
        const mainDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
        const unsubMain = onSnapshot(mainDocRef, docSnap => {
            if (docSnap.exists()) {
                const d = docSnap.data();
                setTeam(d.team || initialTeam); 
                const loadedBuilds = d.characterBuilds || {};
                (d.team || []).forEach(charKey => {
                    if (charKey && !loadedBuilds[charKey]) {
                        loadedBuilds[charKey] = createDefaultBuild(charKey);
                    }
                });
                setCharacterBuilds(loadedBuilds);
                setEnemyKey(d.enemyKey || 'ruin_guard'); 
                setRotation((d.rotation || []).map(action => ({ ...action, repeat: action.repeat || 1 })));
                setRotationDuration(d.rotationDuration || 20);
                setPresetName(d.presetName || "My First Team");
            } else {
                setCharacterBuilds(initialBuilds);
                setTeam(initialTeam);
                setRotation([]);
            }
            setIsLoading(false);
        }, err => { console.error("Firestore main data error:", err); setIsLoading(false); });
        
        // Load presets
        const presetsColRef = collection(db, `artifacts/${appId}/users/${user.uid}/presets`);
        const unsubPresets = onSnapshot(presetsColRef, (snapshot) => {
            const presets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSavedPresets(presets);
        }, err => { console.error("Firestore presets error:", err); });


        return () => {
            unsubMain();
            unsubPresets();
        };
    }, [user]);

    // Autosave effect for the main workspace
    useEffect(() => {
        if (!user || isLoading || !isFirebaseConfigValid) return;
        const handler = setTimeout(async () => {
            setIsSaving(true);
            const dataToSave = { team, characterBuilds, enemyKey, rotation, rotationDuration, presetName };
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const mainDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
                await setDoc(mainDocRef, dataToSave, { merge: true });
            } catch (error) { console.error("Autosave error:", error); } 
            finally { setTimeout(() => setIsSaving(false), 500); }
        }, 2000);
        return () => clearTimeout(handler);
    }, [team, characterBuilds, enemyKey, rotation, rotationDuration, presetName, user, isLoading]);

    // --- Data Management Functions ---
    const handleExportData = () => {
        const dataToExport = { team, characterBuilds, rotation, enemyKey, rotationDuration, presetName };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
        const link = document.createElement("a");
        const safePresetName = presetName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.href = jsonString;
        link.download = `${safePresetName || 'genshin-rotation-data'}.json`;
        link.click();
    };

    const handleImportClick = () => { importFileRef.current.click(); };

    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const d = JSON.parse(e.target.result);
                if (d.team && d.characterBuilds && d.rotation) {
                    setTeam(d.team);
                    setCharacterBuilds(d.characterBuilds);
                    setRotation(d.rotation.map(a => ({ ...a, repeat: a.repeat || 1 })));
                    setEnemyKey(d.enemyKey || 'ruin_guard');
                    setRotationDuration(d.rotationDuration || 20);
                    setPresetName(d.presetName || "Imported Team");
                    event.target.value = null; 
                } else { alert("Invalid data file format."); }
            } catch (error) { alert("Error parsing file."); console.error("Import error:", error); }
        };
        reader.readAsText(file);
    };

    const handleSavePreset = async () => {
        if (!presetName) { alert("Please enter a name for the preset."); return; }
        if (!user) return;
        setIsSaving(true);
        const dataToSave = { name: presetName, team, characterBuilds, rotation, enemyKey, rotationDuration };
        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const presetDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/presets`, presetName);
            await setDoc(presetDocRef, dataToSave);
            alert(`Preset "${presetName}" saved successfully!`);
        } catch (error) { console.error("Save preset error:", error); alert("Failed to save preset."); }
        finally { setIsSaving(false); }
    };
    
    const handleLoadPreset = (preset) => {
        if (!preset) return;
        setTeam(preset.team);
        setCharacterBuilds(preset.characterBuilds);
        setRotation(preset.rotation.map(a => ({ ...a, repeat: a.repeat || 1 })));
        setEnemyKey(preset.enemyKey);
        setRotationDuration(preset.rotationDuration);
        setPresetName(preset.name);
    };
    
    const handleDeletePreset = async (presetId) => {
        if (!presetId || !user) return;
        if (window.confirm(`Are you sure you want to delete the preset "${presetId}"?`)) {
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const presetDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/presets`, presetId);
                await deleteDoc(presetDocRef);
            } catch (error) {
                console.error("Delete preset error: ", error);
                alert("Failed to delete preset.");
            }
        }
    };

    const handleClearAll = () => {
       if (window.confirm("Are you sure you want to clear the current workspace? This will not delete your saved presets.")) {
           const newBuilds = {};
            initialTeam.forEach(c => { if(c) newBuilds[c] = createDefaultBuild(c); });
           setTeam(initialTeam);
           setCharacterBuilds(newBuilds);
           setRotation([]);
           setEnemyKey('ruin_guard');
           setRotationDuration(20);
           setPresetName("New Team");
           setSelectedActionIds([]);
       }
    };


    // --- App Logic ---
    const handleTeamChange = (index, charKey) => {
        const newTeam = [...team];
        newTeam[index] = charKey;
        setTeam(newTeam);
        if (charKey && !characterBuilds[charKey]) {
            setCharacterBuilds(prev => ({...prev, [charKey]: createDefaultBuild(charKey)}));
        }
    };

    const handleAddFromNotation = (notationString, charKey) => {
        const { actions, errors } = parseNotation(notationString, charKey);
        if (errors.length > 0) alert("Parser Errors:\n" + errors.join("\n"));
        if (actions.length > 0) setRotation(prev => [...prev, ...actions]);
    };

    const handleAddSingleAction = (charKey, talentKey) => {
        if (charKey && talentKey) {
            setRotation(prev => [...prev, { id: Date.now() + Math.random(), characterKey: charKey, talentKey, config: { reactionType: 'none', activeBuffs: {}, infusion: null }, repeat: 1 }]);
        }
    };
    
    const handleActionRepeatChange = (actionId, newRepeat) => {
        const repeatCount = Math.max(1, parseInt(newRepeat, 10) || 1);
        setRotation(r => r.map(a => a.id === actionId ? { ...a, repeat: repeatCount } : a));
    };

    const handleDuplicateAction = (actionId) => {
        const actionIndex = rotation.findIndex(a => a.id === actionId);
        if (actionIndex > -1) {
            const actionToDuplicate = rotation[actionIndex];
            const newAction = JSON.parse(JSON.stringify(actionToDuplicate));
            newAction.id = Date.now() + Math.random();
            const newRotation = [...rotation];
            newRotation.splice(actionIndex + 1, 0, newAction);
            setRotation(newRotation);
        }
    };

    const handleActionSelect = (actionId) => setSelectedActionIds(prev => prev.includes(actionId) ? prev.filter(id => id !== actionId) : [...prev, actionId]);
    
    const handleBulkApplyBuffs = (buffKey, buffState) => {
        setRotation(prevRotation => prevRotation.map(action => {
            if (selectedActionIds.includes(action.id)) {
                const newAction = JSON.parse(JSON.stringify(action));
                if (buffState.active) { newAction.config.activeBuffs[buffKey] = { ...newAction.config.activeBuffs[buffKey], ...buffState}; }
                else { delete newAction.config.activeBuffs[buffKey]; }
                return newAction;
            }
            return action;
        }));
    };

    const updateCharacterBuild = (charKey, newBuild) => setCharacterBuilds(prev => ({ ...prev, [charKey]: newBuild }));
    const handleUpdateAction = (id, updatedAction) => setRotation(r => r.map(a => a.id === id ? updatedAction : a));
    const handleRemoveAction = (id) => setRotation(r => r.filter(a => a.id !== id));

    const calculationResults = useMemo(() => {
        // FIXED: Add checks to prevent crash on initial render before data is ready
        return rotation.map(action => {
            const charBuild = characterBuilds[action.characterKey];
            const charInfo = characterData[action.characterKey];
            const talentInfo = charInfo?.talents?.[action.talentKey];

            if (!action.characterKey || !action.talentKey || !charBuild || !talentInfo) {
                return { actionId: action.id, damage: { avg: 0, crit: 0, nonCrit: 0, damageType: 'physical' }, repeat: 1 };
            }

            const state = { 
                character: charInfo, 
                characterBuild: charBuild, 
                weapon: weaponData[charBuild.weapon?.key || 'no_weapon'], 
                talent: talentInfo, 
                activeBuffs: action.config.activeBuffs, 
                reactionType: action.config.reactionType, 
                infusion: action.config.infusion, 
                enemy: enemyData[enemyKey], 
                team, 
                characterBuilds, 
                talentKey: action.talentKey, 
                config: action.config 
            };
            const damage = calculateFinalDamage(state);
            return { actionId: action.id, charKey: action.characterKey, talentKey: action.talentKey, damage, repeat: action.repeat };
        });
    }, [rotation, characterBuilds, enemyKey, team]);

    const analyticsData = useMemo(() => {
        const characterDps = {}, elementDps = {}, sourceDps = []; let totalDamage = 0;
        calculationResults.forEach(res => {
            if (!res || !res.charKey || !res.talentKey) return; // Add check for valid result
            const charName = characterData[res.charKey]?.name;
            if(!charName) return;
            const talentName = characterData[res.charKey].talents[res.talentKey].name;
            const damageType = res.damage.damageType;
            const actionTotalDamage = (res.damage.avg || 0) * (res.repeat || 1);
            characterDps[charName] = (characterDps[charName] || 0) + actionTotalDamage;
            elementDps[damageType] = (elementDps[damageType] || 0) + actionTotalDamage;
            sourceDps.push({ name: `${charName} - ${talentName} (x${res.repeat})`, value: actionTotalDamage, element: damageType });
            totalDamage += actionTotalDamage;
        });
        sourceDps.sort((a, b) => b.value - a.value);
        return { characterDps, elementDps, sourceDps, totalDamage };
    }, [calculationResults]);

    const rotationSummary = useMemo(() => ({ totalDamage: analyticsData.totalDamage, dps: analyticsData.totalDamage / (rotationDuration || 1) }), [analyticsData.totalDamage, rotationDuration]);
    const activeTeam = useMemo(() => team.filter(c => c), [team]);
    const editingAction = useMemo(() => rotation.find(a => a.id === editingActionId), [rotation, editingActionId]);
    
    if (isLoading) return <LoadingScreen text="Loading Account Data..." />;
    if (!user) return <Login />;

    return (
        <div className="bg-gray-800 min-h-screen text-white font-sans" style={{ backgroundImage: `url('https://upload-os-bbs.hoyolab.com/upload/2023/10/18/f3747f313361208453474d2847ohl2_5134262145558913928.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
            <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImportData} />
            <div className="flex max-w-[1700px] mx-auto p-4 gap-6 h-[calc(100vh-2rem)]">
                <div className="w-full max-w-sm lg:max-w-md flex-shrink-0">
                    <Sidebar 
                        team={team} handleTeamChange={handleTeamChange} setEditingBuildFor={setEditingBuildFor} 
                        enemyKey={enemyKey} setEnemyKey={setEnemyKey} user={user} 
                        onSignOut={() => signOut(auth)} isSaving={isSaving}
                        onExport={handleExportData} onImport={handleImportClick} onClearAll={handleClearAll}
                        presetName={presetName} setPresetName={setPresetName} savedPresets={savedPresets}
                        onSavePreset={handleSavePreset} onLoadPreset={handleLoadPreset} onDeletePreset={handleDeletePreset}
                    />
                </div>
                <main className="flex-grow bg-gray-900/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 flex flex-col gap-6">
                    <div className="flex justify-center bg-gray-800/60 p-1 rounded-lg flex-shrink-0"><button onClick={() => setMainView('rotation')} className={`px-6 py-2 rounded-md transition-colors w-1/2 ${mainView === 'rotation' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}>Rotation</button><button onClick={() => setMainView('analytics')} className={`px-6 py-2 rounded-md transition-colors w-1/2 ${mainView === 'analytics' ? 'bg-cyan-600' : 'hover:bg-gray-700'}`}>Analytics</button></div>
                    {mainView === 'rotation' ? (
                        <div className="flex flex-col gap-6 flex-grow min-h-0">
                            <div className="bg-gray-800/60 p-4 rounded-lg flex flex-col flex-grow min-h-0">
                                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                    <h2 className="text-2xl font-semibold text-white">Rotation Builder ({rotation.length})</h2>
                                    <div className="flex items-center gap-2">
                                        {selectedActionIds.length > 0 ? (<button onClick={() => setShowBulkEdit(true)} className="bg-purple-600 hover:bg-purple-700 font-bold py-2 px-3 rounded-lg text-xs">Bulk Edit ({selectedActionIds.length})</button>) : (<><span className='text-sm text-gray-400'>Add:</span>{activeTeam.map(c => (<button key={c} onClick={() => setActiveActionTray(activeActionTray === c ? null : c)} className={`font-bold py-2 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${activeActionTray === c ? 'bg-cyan-500' : 'bg-cyan-600/80 hover:bg-cyan-600'}`}><img src={characterData[c].iconUrl} alt={characterData[c].name} className="w-5 h-5 rounded-full"/>{characterData[c].name.split(' ')[0]}</button>))} </>)}
                                    </div>
                                </div>
                                {activeActionTray && (<div className="flex-shrink-0"><ActionTray charKey={activeActionTray} onAddNotation={handleAddFromNotation} onAddSingle={handleAddSingleAction} onClose={() => setActiveActionTray(null)} /></div>)}
                                <div className="space-y-2 mt-4 overflow-y-auto pr-2 flex-grow">
                                    {rotation.map(action => {
                                        const result = calculationResults.find(res => res.actionId === action.id);
                                        const damage = result?.damage || {avg: 0, crit: 0, nonCrit: 0};
                                        const char = characterData[action.characterKey];
                                        const totalDamageForAction = (damage.avg || 0) * (action.repeat || 1);
                                        return (
                                            <div key={action.id} className="bg-gray-700/80 p-3 rounded-lg flex items-center justify-between gap-2 transition-all hover:bg-gray-700">
                                                <input type="checkbox" checked={selectedActionIds.includes(action.id)} onChange={() => handleActionSelect(action.id)} className="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 rounded text-cyan-500 focus:ring-cyan-600 shrink-0"/>
                                                <div className="flex items-center gap-3 flex-grow min-w-0"><img src={char.iconUrl} alt={char.name} className="w-10 h-10 rounded-full shrink-0" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/2d3748/e2e8f0?text=??'; }} /><div><p className="font-semibold truncate">{char.name} - <span className="text-cyan-300">{char.talents[action.talentKey].name}</span></p><div className="flex gap-4 text-xs text-gray-400 mt-1"><span>Crit: <span className="text-gray-200 font-mono">{(damage.crit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span><span>Non-Crit: <span className="text-gray-200 font-mono">{(damage.nonCrit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span></div></div></div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs text-gray-400">x</span>
                                                    <input type="number" min="1" value={action.repeat || 1} onChange={(e) => handleActionRepeatChange(action.id, e.target.value)} className="w-12 bg-gray-800 text-white p-1 rounded-md text-center border border-gray-600 text-sm" />
                                                </div>
                                                <div className="text-right shrink-0 w-28">
                                                    <p className="font-bold text-xl text-white">{totalDamageForAction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                                    <p className="text-xs text-gray-400">Avg: {(damage.avg || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                                </div>
                                                <div className="flex flex-col gap-1 shrink-0">
                                                    <button onClick={() => handleDuplicateAction(action.id)} className="bg-blue-600/80 text-xs py-1 px-3 rounded-md hover:bg-blue-600">Dup</button>
                                                    <button onClick={() => setEditingActionId(action.id)} className="bg-gray-600/80 text-xs py-1 px-3 rounded-md hover:bg-gray-600">Edit</button>
                                                    <button onClick={() => handleRemoveAction(action.id)} className="bg-red-500/70 hover:bg-red-500 text-xs py-1 px-3 rounded-md">Del</button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {rotation.length === 0 && <p className="text-center text-gray-500 py-8">No actions in rotation.</p>}
                                </div>
                            </div>
                            <div className="bg-gray-800/60 p-4 rounded-lg flex-shrink-0"><div className="flex justify-around items-center bg-gray-700/80 p-4 rounded-lg"><div className="text-center"><p className="text-gray-300 text-sm">Total Rotation Damage</p><p className="text-3xl font-bold text-cyan-400">{rotationSummary.totalDamage.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div><div className='flex items-center gap-2'><span className='text-gray-300 text-sm'>Duration (s):</span><input type="number" value={rotationDuration} onChange={e => setRotationDuration(parseFloat(e.target.value) || 1)} className="w-20 bg-gray-800 p-2 text-center rounded-md border border-gray-600" /></div><div className="text-center"><p className="text-gray-300 text-sm">DPS</p><p className="text-3xl font-bold text-white">{rotationSummary.dps.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div></div></div>
                        </div>
                    ) : (
                        <div className="flex-grow min-h-0 overflow-y-auto pr-2">
                             <AnalyticsDashboard analyticsData={analyticsData} />
                        </div>
                    )}
                </main>
            </div>
            {editingBuildFor && characterBuilds[editingBuildFor] && <BuildEditorModal charKey={editingBuildFor} build={characterBuilds[editingBuildFor]} updateBuild={updateCharacterBuild} onClose={() => setEditingBuildFor(null)}/>}
            {editingAction && <ActionControlPanel action={editingAction} team={activeTeam} characterBuilds={characterBuilds} updateAction={handleUpdateAction} closePanel={() => setEditingActionId(null)}/>}
            {showBulkEdit && <BulkEditPanel rotation={rotation} selectedActionIds={selectedActionIds} onBulkApplyBuffs={handleBulkApplyBuffs} onClose={() => {setShowBulkEdit(false); setSelectedActionIds([])}} team={activeTeam} characterBuilds={characterBuilds} />}
        </div>
    );
}
