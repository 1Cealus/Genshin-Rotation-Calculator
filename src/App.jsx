import React, { useState, useMemo, useEffect, useRef } from 'react';
import { db, auth, onAuthStateChanged, signOut, doc, setDoc, onSnapshot, collection, getDocs, deleteDoc, signInAnonymously } from './firebase';
import { isFirebaseConfigValid } from './config.js';

import { Header } from './components/Header';
import { LoginModal } from './components/Login';
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { AdminPage } from './pages/AdminPage'; // New Admin Page

import { parseNotation } from './utils/parseNotation.js';
import { characterData } from './data/character_database.js';
import { weaponData } from './data/weapon_database.js';
import { enemyData } from './data/enemy_database.js';
import { calculateFinalDamage } from './logic/damage_formula.js';

const ADMIN_UID = "RHK4HK166oe3kiCz3iEnybYcest1";
const LoadingScreen = ({ text }) => (<div className="bg-brand-dark min-h-screen flex items-center justify-center text-white text-xl">{text}</div>);

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
    if (c) initialBuilds[c] = createDefaultBuild(c);
});

export default function App() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [page, setPage] = useState('home');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [newsItems, setNewsItems] = useState([]);

    // ... (rest of the state variables remain the same)
    const [team, setTeam] = useState(initialTeam);
    const [characterBuilds, setCharacterBuilds] = useState(initialBuilds);
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

    // Fetch news items on initial load
    useEffect(() => {
        if (!db) return;
        const newsColRef = collection(db, 'news');
        const unsubNews = onSnapshot(newsColRef, (snapshot) => {
            const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                                    .sort((a,b) => b.date.seconds - a.date.seconds); // Sort by date descending
            setNewsItems(news);
        });
        return () => unsubNews();
    }, []);

    // --- Authentication and Data Loading ---
    useEffect(() => {
        if (!auth) return setIsLoading(false);
        const unsubAuth = onAuthStateChanged(auth, u => {
            if (u) {
                setUser(u);
                setIsAdmin(u.uid === ADMIN_UID);
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const mainDocRef = doc(db, `artifacts/${appId}/users/${u.uid}/calculatorData`, 'main');
                const unsubMain = onSnapshot(mainDocRef, docSnap => {
                    if (docSnap.exists()) {
                        const d = docSnap.data();
                        setTeam(d.team || initialTeam);
                        setCharacterBuilds(d.characterBuilds || initialBuilds);
                        setEnemyKey(d.enemyKey || 'ruin_guard');
                        setRotation(d.rotation || []);
                        setRotationDuration(d.rotationDuration || 20);
                        setPresetName(d.presetName || "My First Team");
                    } else {
                        setTeam(initialTeam);
                        setCharacterBuilds(initialBuilds);
                    }
                     setIsLoading(false);
                });
                const presetsColRef = collection(db, `artifacts/${appId}/users/${u.uid}/presets`);
                const unsubPresets = onSnapshot(presetsColRef, (snapshot) => {
                    setSavedPresets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });
                return () => { unsubMain(); unsubPresets(); };
            } else {
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed:", error);
                    setIsLoading(false);
                });
            }
        });
        return () => unsubAuth();
    }, []);

    // ... (Autosave and other handlers remain the same)
    const handleSavePreset = async () => { if (!presetName) { alert("Please enter a name for the preset."); return; } if (!user) return; setIsSaving(true); const dataToSave = { name: presetName, team, characterBuilds, rotation, enemyKey, rotationDuration }; try { const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; const presetDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/presets`, presetName); await setDoc(presetDocRef, dataToSave); alert(`Preset "${presetName}" saved successfully!`); } catch (error) { console.error("Save preset error:", error); alert("Failed to save preset. Check Firebase rules."); } finally { setIsSaving(false); } };
    const handleLoadPreset = (preset) => { if (!preset) return; setTeam(preset.team); setCharacterBuilds(preset.characterBuilds); setRotation(preset.rotation.map(a => ({ ...a, repeat: a.repeat || 1 }))); setEnemyKey(preset.enemyKey); setRotationDuration(preset.rotationDuration); setPresetName(preset.name); };
    const handleDeletePreset = async (presetId) => { if (!presetId || !user) return; if (window.confirm(`Are you sure you want to delete the preset "${presetId}"?`)) { try { const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; const presetDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/presets`, presetId); await deleteDoc(presetDocRef); } catch (error) { console.error("Delete preset error: ", error); alert("Failed to delete preset."); } } };
    const handleClearAll = () => { if (window.confirm("Are you sure you want to clear the current workspace? This will not delete your saved presets.")) { const newBuilds = {}; initialTeam.forEach(c => { if(c) newBuilds[c] = createDefaultBuild(c); }); setTeam(initialTeam); setCharacterBuilds(newBuilds); setRotation([]); setEnemyKey('ruin_guard'); setRotationDuration(20); setPresetName("New Team"); setSelectedActionIds([]); } };
    const handleExportData = () => { const dataToExport = { team, characterBuilds, rotation, enemyKey, rotationDuration, presetName }; const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`; const link = document.createElement("a"); const safePresetName = presetName.replace(/[^a-z0-9]/gi, '_').toLowerCase(); link.href = jsonString; link.download = `${safePresetName || 'genshin-rotation-data'}.json`; link.click(); };
    const handleImportClick = () => { importFileRef.current.click(); };
    const handleImportData = (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const d = JSON.parse(e.target.result); if (d.team && d.characterBuilds && d.rotation) { setTeam(d.team); setCharacterBuilds(d.characterBuilds); setRotation(d.rotation.map(a => ({ ...a, repeat: a.repeat || 1 }))); setEnemyKey(d.enemyKey || 'ruin_guard'); setRotationDuration(d.rotationDuration || 20); setPresetName(d.presetName || "Imported Team"); event.target.value = null; } else { alert("Invalid data file format."); } } catch (error) { alert("Error parsing file."); console.error("Import error:", error); } }; reader.readAsText(file); };
    const handleTeamChange = (index, charKey) => { const newTeam = [...team]; newTeam[index] = charKey; setTeam(newTeam); if (charKey && !characterBuilds[charKey]) { setCharacterBuilds(prev => ({...prev, [charKey]: createDefaultBuild(charKey)})); } };
    const handleAddFromNotation = (notationString, charKey) => { const { actions, errors } = parseNotation(notationString, charKey); if (errors.length > 0) alert("Parser Errors:\n" + errors.join("\n")); if (actions.length > 0) setRotation(prev => [...prev, ...actions]); };
    const handleAddSingleAction = (charKey, talentKey) => { if (charKey && talentKey) { setRotation(prev => [...prev, { id: Date.now() + Math.random(), characterKey: charKey, talentKey, config: { reactionType: 'none', activeBuffs: {}, infusion: null }, repeat: 1 }]); } };
    const handleActionRepeatChange = (actionId, newRepeat) => { const repeatCount = Math.max(1, parseInt(newRepeat, 10) || 1); setRotation(r => r.map(a => a.id === actionId ? { ...a, repeat: repeatCount } : a)); };
    const handleDuplicateAction = (actionId) => { const actionIndex = rotation.findIndex(a => a.id === actionId); if (actionIndex > -1) { const actionToDuplicate = rotation[actionIndex]; const newAction = JSON.parse(JSON.stringify(actionToDuplicate)); newAction.id = Date.now() + Math.random(); const newRotation = [...rotation]; newRotation.splice(actionIndex + 1, 0, newAction); setRotation(newRotation); } };
    const handleActionSelect = (actionId) => setSelectedActionIds(prev => prev.includes(actionId) ? prev.filter(id => id !== actionId) : [...prev, actionId]);
    const handleBulkApplyBuffs = (buffKey, buffState) => { setRotation(prevRotation => prevRotation.map(action => { if (selectedActionIds.includes(action.id)) { const newAction = JSON.parse(JSON.stringify(action)); if (buffState.active) { newAction.config.activeBuffs[buffKey] = { ...newAction.config.activeBuffs[buffKey], ...buffState}; } else { delete newAction.config.activeBuffs[buffKey]; } return newAction; } return action; })); };
    const updateCharacterBuild = (charKey, newBuild) => setCharacterBuilds(prev => ({ ...prev, [charKey]: newBuild }));
    const handleUpdateAction = (id, updatedAction) => setRotation(r => r.map(a => a.id === id ? updatedAction : a));
    const handleRemoveAction = (id) => setRotation(r => r.filter(a => a.id !== id));
    
    // ... (memoized calculations remain the same)
    const calculationResults = useMemo(() => { return rotation.map(action => { const charBuild = characterBuilds[action.characterKey]; const charInfo = characterData[action.characterKey]; const talentInfo = charInfo?.talents?.[action.talentKey]; if (!action.characterKey || !action.talentKey || !charBuild || !talentInfo) { return { actionId: action.id, damage: { avg: 0, crit: 0, nonCrit: 0, damageType: 'physical' }, repeat: 1 }; } const state = { character: charInfo, characterBuild: charBuild, weapon: weaponData[charBuild.weapon?.key || 'no_weapon'], talent: talentInfo, activeBuffs: action.config.activeBuffs, reactionType: action.config.reactionType, infusion: action.config.infusion, enemy: enemyData[enemyKey], team, characterBuilds, talentKey: action.talentKey, config: action.config }; const damage = calculateFinalDamage(state); return { actionId: action.id, charKey: action.characterKey, talentKey: action.talentKey, damage, repeat: action.repeat }; }); }, [rotation, characterBuilds, enemyKey, team]);
    const analyticsData = useMemo(() => { const characterDps = {}, elementDps = {}, sourceDps = []; let totalDamage = 0; calculationResults.forEach(res => { if (!res || !res.charKey || !res.talentKey) return; const charName = characterData[res.charKey]?.name; if(!charName) return; const talentName = characterData[res.charKey].talents[res.talentKey].name; const damageType = res.damage.damageType; const actionTotalDamage = (res.damage.avg || 0) * (res.repeat || 1); characterDps[charName] = (characterDps[charName] || 0) + actionTotalDamage; elementDps[damageType] = (elementDps[damageType] || 0) + actionTotalDamage; sourceDps.push({ name: `${charName} - ${talentName} (x${res.repeat})`, value: actionTotalDamage, element: damageType }); totalDamage += actionTotalDamage; }); sourceDps.sort((a, b) => b.value - a.value); return { characterDps, elementDps, sourceDps, totalDamage }; }, [calculationResults]);
    const rotationSummary = useMemo(() => ({ totalDamage: analyticsData.totalDamage, dps: analyticsData.totalDamage / (rotationDuration || 1) }), [analyticsData.totalDamage, rotationDuration]);
    const activeTeam = useMemo(() => team.filter(c => c), [team]);

    if (isLoading) {
        return <LoadingScreen text="Initializing..." />;
    }

    const calculatorPageProps = {
        team, handleTeamChange, setEditingBuildFor,
        enemyKey, setEnemyKey, user,
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
        <div className="bg-brand-dark min-h-screen">
            <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImportData} />
            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

            <Header 
                user={user}
                isAdmin={isAdmin}
                setPage={setPage}
                onLoginClick={() => setShowLoginModal(true)}
                onSignOut={() => signOut(auth).catch(error => console.error("Sign out failed:", error))}
            />
            
            {page === 'home' && <HomePage setPage={setPage} newsItems={newsItems} />}
            {page === 'calculator' && user && <CalculatorPage {...calculatorPageProps} />}
            {page === 'admin' && isAdmin && <AdminPage newsItems={newsItems}/>}
        </div>
    );
}
