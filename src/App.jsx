// src/App.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { db, auth, onAuthStateChanged, signOut, doc, setDoc, onSnapshot, collection, getDocs, deleteDoc, signInAnonymously } from './firebase';
import { isFirebaseConfigValid } from './config.js';

// Component Imports
import { NavigationSidebar } from './components/NavigationSidebar';
import { LoginModal } from './components/Login';

// Page Imports
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { AdminPage } from './pages/AdminPage';
import { ArchivePage } from './pages/ArchivePage';

// Utility and Data Imports
import { parseNotation } from './utils/parseNotation.js';
import { calculateFinalDamage } from './logic/damage_formula.js';
import { getGameData } from './data/loader.js'; // Import the new data loader

const ADMIN_UID = "RHK4HK166oe3kiCz3iEnybYcest1";
const LoadingScreen = ({ text }) => (<div className="bg-brand-dark min-h-screen flex items-center justify-center text-white text-xl">{text}</div>);

const createDefaultBuild = (charKey, characterData) => {
    if (!characterData || !characterData[charKey]) return null;
    
    const charInfo = characterData[charKey];
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

export default function App() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isGameDataLoading, setIsGameDataLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [page, setPage] = useState('home');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [newsItems, setNewsItems] = useState([]);
    const [gameData, setGameData] = useState(null);
    
    // Archive Page State
    const [archiveView, setArchiveView] = useState({ page: 'list', key: null });

    // Calculator State
    const [team, setTeam] = useState(initialTeam);
    const [characterBuilds, setCharacterBuilds] = useState({});
    const [enemyKey, setEnemyKey] = useState('ruin_guard');
    const [rotation, setRotation] = useState([]);
    const [rotationDuration, setRotationDuration] = useState(20);
    const [presetName, setPresetName] = useState("My First Team");
    const [savedPresets, setSavedPresets] = useState([]);
    const [mainView, setMainView] = useState('rotation');
    const [activeActionTray, setActiveActionTray] = useState(null);
    const [editingActionId, setEditingActionId] = useState(null);
    const [editingBuildFor, setEditingBuildFor] = useState(null);
    const [selectedActionIds, setSelectedActionIds] = useState([]);
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const importFileRef = useRef(null);
    
    useEffect(() => {
        if (!isFirebaseConfigValid) {
            alert("Firebase configuration is missing or invalid. Please check your .env file.");
            setIsGameDataLoading(false);
            return;
        }

        getGameData(db).then(data => {
            setGameData(data);
            setIsGameDataLoading(false);
        }).catch(err => {
            setIsGameDataLoading(false);
            alert("A critical error occurred while loading game data from Firestore. Please check the console.");
            console.error(err);
        });

        const newsColRef = collection(db, 'news');
        const unsubNews = onSnapshot(newsColRef, (snapshot) => {
            const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                                    .sort((a, b) => b.date.seconds - a.date.seconds);
            setNewsItems(news);
        });
        
        return () => unsubNews();
    }, []);

    useEffect(() => {
        if (!auth || !db || isGameDataLoading || !gameData) return;

        const unsubAuth = onAuthStateChanged(auth, u => {
            if (u) {
                setUser(u);
                setIsAdmin(u.uid === ADMIN_UID);
                const appId = 'default-app-id';
                
                const mainDocRef = doc(db, `artifacts/${appId}/users/${u.uid}/calculatorData`, 'main');
                const unsubMain = onSnapshot(mainDocRef, docSnap => {
                    if (docSnap.exists()) {
                        const d = docSnap.data();
                        setTeam(d.team || initialTeam);
                        setCharacterBuilds(d.characterBuilds || {});
                        setEnemyKey(d.enemyKey || 'ruin_guard');
                        setRotation(d.rotation || []);
                        setRotationDuration(d.rotationDuration || 20);
                        setPresetName(d.presetName || "My First Team");
                    } else {
                        const newBuilds = {};
                        initialTeam.forEach(c => {
                            if (c) newBuilds[c] = createDefaultBuild(c, gameData.characterData);
                        });
                        setTeam(initialTeam);
                        setCharacterBuilds(newBuilds);
                    }
                    setIsUserLoading(false);
                });

                const presetsColRef = collection(db, `artifacts/${appId}/users/${u.uid}/presets`);
                const unsubPresets = onSnapshot(presetsColRef, (snapshot) => {
                    setSavedPresets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });
                
                return () => { unsubMain(); unsubPresets(); };
            } else {
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed:", error);
                    setIsUserLoading(false);
                });
            }
        });
        return () => unsubAuth();
    }, [isGameDataLoading, gameData]);

    useEffect(() => {
        if (page !== 'archive') {
            setArchiveView({ page: 'list', key: null });
        }
    }, [page]);
    
    const handleTeamChange = (index, charKey) => {
        const newTeam = [...team];
        newTeam[index] = charKey;
        setTeam(newTeam);
        if (charKey && !characterBuilds[charKey]) {
            setCharacterBuilds(prev => ({...prev, [charKey]: createDefaultBuild(charKey, gameData.characterData)}));
        }
    };
    
    const handleAddFromNotation = (notationString, charKey) => {
        const { actions, errors } = parseNotation(notationString, charKey, gameData.characterData);
        if (errors.length > 0) alert("Parser Errors:\n" + errors.join("\n"));
        if (actions.length > 0) setRotation(prev => [...prev, ...actions]);
    };

    const calculationResults = useMemo(() => {
        if (!gameData) return [];
        return rotation.map(action => {
            const charBuild = characterBuilds[action.characterKey];
            const charInfo = gameData.characterData[action.characterKey];
            const talentInfo = charInfo?.talents?.[action.talentKey];

            if (!action.characterKey || !action.talentKey || !charBuild || !talentInfo) {
                return { actionId: action.id, damage: { avg: 0, crit: 0, nonCrit: 0, damageType: 'physical' }, repeat: 1 };
            }
            
            const state = {
                character: charInfo,
                characterBuild: charBuild,
                weapon: gameData.weaponData[charBuild.weapon?.key || 'no_weapon'],
                talent: talentInfo,
                activeBuffs: action.config.activeBuffs,
                reactionType: action.config.reactionType,
                infusion: action.config.infusion,
                enemy: gameData.enemyData[enemyKey],
                team,
                characterBuilds,
                talentKey: action.talentKey,
                config: action.config,
            };

            const damage = calculateFinalDamage(state, gameData);
            return { actionId: action.id, charKey: action.characterKey, talentKey: action.talentKey, damage, repeat: action.repeat || 1 };
        });
    }, [rotation, characterBuilds, enemyKey, team, gameData]);

    const analyticsData = useMemo(() => {
        if (!gameData) return { characterDps: {}, elementDps: {}, sourceDps: [], totalDamage: 0 };
        const characterDps = {}, elementDps = {}, sourceDps = [];
        let totalDamage = 0;
        calculationResults.forEach(res => {
            if (!res || !res.charKey || !res.talentKey) return;
            const charName = gameData.characterData[res.charKey]?.name;
            if(!charName) return;
            const talentName = gameData.characterData[res.charKey].talents[res.talentKey].name;
            const damageType = res.damage.damageType;
            const actionTotalDamage = (res.damage.avg || 0) * (res.repeat || 1);
            characterDps[charName] = (characterDps[charName] || 0) + actionTotalDamage;
            elementDps[damageType] = (elementDps[damageType] || 0) + actionTotalDamage;
            sourceDps.push({ name: `${charName} - ${talentName} (x${res.repeat})`, value: actionTotalDamage, element: damageType });
            totalDamage += actionTotalDamage;
        });
        sourceDps.sort((a, b) => b.value - a.value);
        return { characterDps, elementDps, sourceDps, totalDamage };
    }, [calculationResults, gameData]);

    const handleSavePreset = async () => { if (!presetName) { alert("Please enter a name for the preset."); return; } if (!user) return; setIsSaving(true); const dataToSave = { name: presetName, team, characterBuilds, rotation, enemyKey, rotationDuration }; try { const appId = 'default-app-id'; const presetDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/presets`, presetName); await setDoc(presetDocRef, dataToSave); alert(`Preset "${presetName}" saved successfully!`); } catch (error) { console.error("Save preset error:", error); alert("Failed to save preset. Check Firebase rules."); } finally { setIsSaving(false); } };
    const handleLoadPreset = (preset) => { if (!preset) return; setTeam(preset.team); setCharacterBuilds(preset.characterBuilds); setRotation(preset.rotation.map(a => ({ ...a, repeat: a.repeat || 1 }))); setEnemyKey(preset.enemyKey); setRotationDuration(preset.rotationDuration); setPresetName(preset.name); };
    const handleDeletePreset = async (presetId) => { if (!presetId || !user) return; if (window.confirm(`Are you sure you want to delete the preset "${presetId}"?`)) { try { const appId = 'default-app-id'; const presetDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/presets`, presetId); await deleteDoc(presetDocRef); } catch (error) { console.error("Delete preset error: ", error); alert("Failed to delete preset."); } } };
    const handleClearAll = () => { if (window.confirm("Are you sure you want to clear the current workspace? This will not delete your saved presets.")) { const newBuilds = {}; initialTeam.forEach(c => { if(c) newBuilds[c] = createDefaultBuild(c, gameData.characterData); }); setTeam(initialTeam); setCharacterBuilds(newBuilds); setRotation([]); setEnemyKey('ruin_guard'); setRotationDuration(20); setPresetName("New Team"); setSelectedActionIds([]); } };
    const handleExportData = () => { const dataToExport = { team, characterBuilds, rotation, enemyKey, rotationDuration, presetName }; const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`; const link = document.createElement("a"); const safePresetName = presetName.replace(/[^a-z0-9]/gi, '_').toLowerCase(); link.href = jsonString; link.download = `${safePresetName || 'genshin-rotation-data'}.json`; link.click(); };
    const handleImportClick = () => { importFileRef.current.click(); };
    const handleImportData = (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const d = JSON.parse(e.target.result); if (d.team && d.characterBuilds && d.rotation) { setTeam(d.team); setCharacterBuilds(d.characterBuilds); setRotation(d.rotation.map(a => ({ ...a, repeat: a.repeat || 1 }))); setEnemyKey(d.enemyKey || 'ruin_guard'); setRotationDuration(d.rotationDuration || 20); setPresetName(d.presetName || "Imported Team"); event.target.value = null; } else { alert("Invalid data file format."); } } catch (error) { alert("Error parsing file."); console.error("Import error:", error); } }; reader.readAsText(file); };
    const handleAddSingleAction = (charKey, talentKey) => { if (charKey && talentKey) { setRotation(prev => [...prev, { id: Date.now() + Math.random(), characterKey: charKey, talentKey, config: { reactionType: 'none', activeBuffs: {}, infusion: null }, repeat: 1 }]); } };
    const handleActionRepeatChange = (actionId, newRepeat) => { const repeatCount = Math.max(1, parseInt(newRepeat, 10) || 1); setRotation(r => r.map(a => a.id === actionId ? { ...a, repeat: repeatCount } : a)); };
    const handleDuplicateAction = (actionId) => { const actionIndex = rotation.findIndex(a => a.id === actionId); if (actionIndex > -1) { const actionToDuplicate = rotation[actionIndex]; const newAction = JSON.parse(JSON.stringify(actionToDuplicate)); newAction.id = Date.now() + Math.random(); const newRotation = [...rotation]; newRotation.splice(actionIndex + 1, 0, newAction); setRotation(newRotation); } };
    const handleActionSelect = (actionId) => setSelectedActionIds(prev => prev.includes(actionId) ? prev.filter(id => id !== actionId) : [...prev, actionId]);
    const handleBulkApplyBuffs = (buffKey, buffState) => { setRotation(prevRotation => prevRotation.map(action => { if (selectedActionIds.includes(action.id)) { const newAction = JSON.parse(JSON.stringify(action)); if (buffState.active) { newAction.config.activeBuffs[buffKey] = { ...newAction.config.activeBuffs[buffKey], ...buffState}; } else { delete newAction.config.activeBuffs[buffKey]; } return newAction; } return action; })); };
    const updateCharacterBuild = (charKey, newBuild) => setCharacterBuilds(prev => ({ ...prev, [charKey]: newBuild }));
    const handleUpdateAction = (id, updatedAction) => setRotation(r => r.map(a => a.id === id ? updatedAction : a));
    const handleRemoveAction = (id) => setRotation(r => r.filter(a => a.id !== id));
    
    const rotationSummary = useMemo(() => ({ totalDamage: analyticsData.totalDamage, dps: analyticsData.totalDamage / (rotationDuration || 1) }), [analyticsData.totalDamage, rotationDuration]);
    const activeTeam = useMemo(() => team.filter(c => c), [team]);
    
    if (isUserLoading || isGameDataLoading) {
        return <LoadingScreen text="Loading Game & User Data..." />;
    }

    const calculatorPageProps = {
        team, handleTeamChange, setEditingBuildFor,
        enemyKey, setEnemyKey, user, gameData,
        isSaving,
        onExport: handleExportData, onImport: handleImportClick, onClearAll: handleClearAll,
        presetName, setPresetName, savedPresets,
        onSavePreset: handleSavePreset, onLoadPreset: handleLoadPreset, onDeletePreset: handleDeletePreset,
        rotation, rotationDuration, setRotationDuration,
        mainView, setMainView,
        activeActionTray, setActiveActionTray,
        editingActionId, setEditingActionId,
        editingBuildFor,
        selectedActionIds, setSelectedActionIds,
        showBulkEdit, setShowBulkEdit,
        calculationResults, analyticsData, rotationSummary,
        activeTeam,
        handleAddFromNotation, handleAddSingleAction,
        handleActionRepeatChange, handleDuplicateAction,
        handleActionSelect, handleBulkApplyBuffs,
        updateCharacterBuild, handleUpdateAction, handleRemoveAction,
        characterBuilds,
    };

    return (
        <div className="bg-brand-dark min-h-screen text-white flex h-screen overflow-hidden">
            <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImportData} />
            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
            
            <NavigationSidebar 
                user={user}
                isAdmin={isAdmin}
                page={page}
                setPage={setPage}
                onLoginClick={() => setShowLoginModal(true)}
                onSignOut={() => signOut(auth).catch(error => console.error("Sign out failed:", error))}
            />
            
            <main className="flex-grow flex-1 flex flex-col overflow-y-auto">
                {page === 'home' && <HomePage setPage={setPage} newsItems={newsItems} />}
                {page === 'calculator' && user && gameData && <div className="h-full"><CalculatorPage {...calculatorPageProps} /></div>}
                {page === 'admin' && isAdmin && <AdminPage newsItems={newsItems}/>}
                {page === 'archive' && gameData && <ArchivePage archiveView={archiveView} setArchiveView={setArchiveView} gameData={gameData} />}
            </main>
        </div>
    );
}