import React, { useState, useMemo, useEffect } from 'react';
import { db, auth, onAuthStateChanged, signOut, doc, setDoc, onSnapshot } from './firebase';
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

export default function App() {
    if (!isFirebaseConfigValid) return <FirebaseConfigError />;

    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [team, setTeam] = useState(['skirk', 'furina', 'mona', 'escoffier']);
    const [characterBuilds, setCharacterBuilds] = useState({});
    const [enemyKey, setEnemyKey] = useState('ruin_guard');
    const [rotation, setRotation] = useState([]);
    const [rotationDuration, setRotationDuration] = useState(20);
    
    const [mainView, setMainView] = useState('rotation');
    const [activeActionTray, setActiveActionTray] = useState(null);
    const [editingActionId, setEditingActionId] = useState(null);
    const [editingBuildFor, setEditingBuildFor] = useState(null);
    const [selectedActionIds, setSelectedActionIds] = useState([]);
    const [showBulkEdit, setShowBulkEdit] = useState(false);

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

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => { setUser(u); if (!u) setIsLoading(false); });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!user) return;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
        const unsub = onSnapshot(docRef, docSnap => {
            if (docSnap.exists()) {
                const d = docSnap.data();
                setTeam(d.team || ['skirk', 'furina', 'mona', 'escoffier']); 
                const loadedBuilds = d.characterBuilds || {};
                (d.team || []).forEach(charKey => {
                    if (charKey && !loadedBuilds[charKey]) {
                        loadedBuilds[charKey] = createDefaultBuild(charKey);
                    }
                });
                setCharacterBuilds(loadedBuilds);
                setEnemyKey(d.enemyKey || 'ruin_guard'); 
                // Ensure loaded rotation actions have a 'repeat' property
                const loadedRotation = (d.rotation || []).map(action => ({ ...action, repeat: action.repeat || 1 }));
                setRotation(loadedRotation);
                setRotationDuration(d.rotationDuration || 20);
            } else {
                const defaultBuilds = {};
                team.forEach(charKey => { if (charKey) defaultBuilds[charKey] = createDefaultBuild(charKey); });
                setCharacterBuilds(defaultBuilds);
            }
            setIsLoading(false);
        }, err => { console.error("Firestore error:", err); setIsLoading(false); });
        return () => unsub();
    }, [user]);

    useEffect(() => {
        if (!user || isLoading) return;
        const handler = setTimeout(async () => {
            setIsSaving(true);
            const data = { team, characterBuilds, enemyKey, rotation, rotationDuration };
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
                await setDoc(docRef, data, { merge: true });
            } catch (error) { console.error("Save error:", error); } 
            finally { setTimeout(() => setIsSaving(false), 500); }
        }, 2000);
        return () => clearTimeout(handler);
    }, [team, characterBuilds, enemyKey, rotation, rotationDuration, user, isLoading]);

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
                if (buffState.active) {
                    newAction.config.activeBuffs[buffKey] = { ...newAction.config.activeBuffs[buffKey], ...buffState};
                } else {
                    delete newAction.config.activeBuffs[buffKey];
                }
                return newAction;
            }
            return action;
        }));
    };

    const updateCharacterBuild = (charKey, newBuild) => setCharacterBuilds(prev => ({ ...prev, [charKey]: newBuild }));
    const handleUpdateAction = (id, updatedAction) => setRotation(r => r.map(a => a.id === id ? updatedAction : a));
    const handleRemoveAction = (id) => setRotation(r => r.filter(a => a.id !== id));

    const calculationResults = useMemo(() => rotation.map(action => {
        if (!action.characterKey || !action.talentKey || !characterBuilds[action.characterKey]) return { actionId: action.id, damage: { avg: 0, crit: 0, nonCrit: 0 }, repeat: 1 };
        const state = { character: characterData[action.characterKey], characterBuild: characterBuilds[action.characterKey], weapon: weaponData[characterBuilds[action.characterKey]?.weapon?.key || 'no_weapon'], talent: characterData[action.characterKey].talents[action.talentKey], activeBuffs: action.config.activeBuffs, reactionType: action.config.reactionType, infusion: action.config.infusion, enemy: enemyData[enemyKey], team, characterBuilds, talentKey: action.talentKey, config: action.config };
        const damage = calculateFinalDamage(state);
        return { actionId: action.id, charKey: action.characterKey, talentKey: action.talentKey, damage, repeat: action.repeat };
    }), [rotation, characterBuilds, enemyKey, team]);

    const analyticsData = useMemo(() => {
        const characterDps = {}, elementDps = {}, sourceDps = []; let totalDamage = 0;
        calculationResults.forEach(res => {
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
            <div className="flex max-w-[1700px] mx-auto p-4 gap-6 h-[calc(100vh-2rem)]">
                <div className="w-full max-w-sm lg:max-w-md flex-shrink-0"><Sidebar team={team} handleTeamChange={handleTeamChange} setEditingBuildFor={setEditingBuildFor} enemyKey={enemyKey} setEnemyKey={setEnemyKey} user={user} onSignOut={() => signOut(auth)} isSaving={isSaving} /></div>
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
                                        const damage = result?.damage || {};
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
