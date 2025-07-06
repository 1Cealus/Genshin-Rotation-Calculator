import React, { useState, useMemo, useEffect, useRef } from 'react';
import { db, auth, onAuthStateChanged, signOut, doc, setDoc, onSnapshot, collection, getDocs, deleteDoc, signInAnonymously, addDoc, Timestamp, updateDoc } from './firebase';
import { isFirebaseConfigValid } from './config.js';
import { useModal } from './context/ModalContext.jsx';

// Component Imports
import { NavigationSidebar } from './components/NavigationSidebar';
import { LoginModal } from './components/Login';
import { CreateLeaderboardModal } from './components/CreateLeaderboardModal.jsx';
import { EditLeaderboardModal } from './components/EditLeaderboardModal.jsx';


// Page Imports
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { AdminPage } from './pages/AdminPage';
import { CharacterArchivePage } from './pages/CharacterArchivePage';
import { WeaponArchivePage } from './pages/WeaponArchivePage';
import { ArtifactArchivePage } from './pages/ArtifactArchivePage';
import { EnemyArchivePage } from './pages/EnemyArchivePage';
import { MastersheetPage } from './pages/MastersheetPage';
import { LeaderboardListPage } from './pages/LeaderboardListPage.jsx';
import { LeaderboardDetailPage } from './pages/LeaderboardDetailPage.jsx';


// Utility and Data Imports
import { parseNotation } from './utils/parseNotation.js';
import { calculateFinalDamage } from './logic/damage_formula.js';
import { parseEnkaData } from './utils/enka_parser.js';
import { getGameData } from './data/loader.js';

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

const initialTeam = ['', '', '', ''];

export default function App() {
    const { showModal } = useModal();
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isGameDataLoading, setIsGameDataLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [page, setPage] = useState('home');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showCreateLeaderboardModal, setShowCreateLeaderboardModal] = useState(false);
    const [newsItems, setNewsItems] = useState([]);
    const [gameData, setGameData] = useState(null);

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
    
    const [isFetchingProfile, setIsFetchingProfile] = useState(false);
    const [currentLeaderboardId, setCurrentLeaderboardId] = useState(null);

    useEffect(() => {
        if (!isFirebaseConfigValid) {
            showModal({ title: 'Configuration Error', message: 'Firebase configuration is missing or invalid. Please check your .env file.' });
            setIsGameDataLoading(false);
            return;
        }

        getGameData(db).then(data => {
            setGameData(data);
            setIsGameDataLoading(false);
        }).catch(err => {
            setIsGameDataLoading(false);
            showModal({ title: 'Data Loading Error', message: 'A critical error occurred while loading game data from Firestore. Please check the console and ensure the data was uploaded correctly.' });
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
        if (isGameDataLoading || !gameData) return;

        const { buffData } = gameData;
        const activeTeamCharacters = team.filter(Boolean);
        const activeTeamWeapons = activeTeamCharacters.map(c => characterBuilds[c]?.weapon.key).filter(Boolean);

        const newRotation = rotation
            .filter(action => activeTeamCharacters.includes(action.characterKey))
            .map(action => {
                const newAction = JSON.parse(JSON.stringify(action));
                const currentBuffs = newAction.config.activeBuffs;
                const cleanedBuffs = {};

                Object.keys(currentBuffs).forEach(buffKey => {
                    const buffDef = buffData[buffKey];
                    if (!buffDef) return;

                    let isBuffStillValid = true;

                    if (buffDef.source_type === 'character' || buffDef.source_type === 'constellation') {
                        if (!activeTeamCharacters.includes(buffDef.source_character)) {
                            isBuffStillValid = false;
                        }
                        if (buffDef.source_type === 'constellation') {
                            const sourceCharBuild = characterBuilds[buffDef.source_character];
                            if (!sourceCharBuild || sourceCharBuild.constellation < buffDef.constellation) {
                                isBuffStillValid = false;
                            }
                        }
                    } else if (buffDef.source_type === 'weapon') {
                        if (!activeTeamWeapons.includes(buffDef.source_weapon)) {
                            isBuffStillValid = false;
                        }
                    }

                    if (isBuffStillValid) {
                        cleanedBuffs[buffKey] = currentBuffs[buffKey];
                    }
                });

                newAction.config.activeBuffs = cleanedBuffs;
                return newAction;
            });

        if (JSON.stringify(newRotation) !== JSON.stringify(rotation)) {
            setRotation(newRotation);
        }

    }, [team, characterBuilds, gameData, isGameDataLoading]);

    useEffect(() => {
        if (isUserLoading || isGameDataLoading || !user || user.isAnonymous) {
            return;
        }

        const debounceSave = setTimeout(() => {
            const dataToSave = {
                team,
                characterBuilds,
                enemyKey,
                rotation,
                rotationDuration,
                presetName
            };
            
            const appId = 'default-app-id';
            const mainDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
            
            setDoc(mainDocRef, dataToSave).catch(err => {
                console.error("Error auto-saving workspace:", err);
            });

        }, 1500);

        return () => clearTimeout(debounceSave);

    }, [team, characterBuilds, enemyKey, rotation, rotationDuration, presetName, user, isUserLoading, isGameDataLoading]);
    
    const handleTeamChange = (index, charKey) => {
        const newTeam = [...team];
        newTeam[index] = charKey;
        setTeam(newTeam);
        if (charKey && !characterBuilds[charKey]) {
            setCharacterBuilds(prev => ({...prev, [charKey]: createDefaultBuild(charKey, gameData.characterData)}));
        }
    };

    const handleFetchEnkaData = async (uid, designatedCharacterKey = null) => {
        if (!uid || !/^\d{9}$/.test(uid)) {
            showModal({ title: 'Invalid UID', message: 'Please enter a valid 9-digit Genshin Impact UID.' });
            return;
        }
        setIsFetchingProfile(true);
        try {
            const response = await fetch(`/api/uid/${uid}/`);

            if (response.status === 404) throw new Error(`Player with UID ${uid} not found. Make sure the UID is correct and the player exists.`);
            if (response.status === 429) throw new Error('You are being rate-limited by the API. Please try again in a few minutes.');
            if (!response.ok) throw new Error(`Failed to fetch data. Status: ${response.status}`);

            const data = await response.json();
            
            if (!data.avatarInfoList || data.avatarInfoList.length === 0) {
                throw new Error("No characters found in the showcase. Make sure you have characters displayed on your in-game profile!");
            }

            const parsedBuilds = parseEnkaData(data, gameData, designatedCharacterKey);
            
            setCharacterBuilds(prev => ({ ...prev, ...parsedBuilds }));

            showModal({ title: 'Success!', message: `Successfully imported builds for ${Object.keys(parsedBuilds).length} character(s) from UID ${uid}.` });

        } catch (error) {
            showModal({ title: 'Import Error', message: error.message });
            console.error("Enka.Network fetch error:", error);
        } finally {
            setIsFetchingProfile(false);
        }
    };
    
    const handleAddFromNotation = (notationString, charKey) => {
        const { actions, errors } = parseNotation(notationString, charKey, gameData.characterData);
        if (errors.length > 0) showModal({ title: "Parser Errors", message: errors.join("\n") });
        if (actions.length > 0) setRotation(prev => [...prev, ...actions]);
    };

    const calculationResults = useMemo(() => {
        if (!gameData) return [];
        return rotation.map(action => {
            const charBuild = characterBuilds[action.characterKey];
            const charInfo = gameData.characterData[action.characterKey];
            const talentInfo = charInfo?.talents?.[action.talentKey];

            if (!action.characterKey || !action.talentKey || !charBuild || !talentInfo) {
                return { actionId: action.id, damage: { avg: 0, crit: 0, nonCrit: 0, damageType: 'physical' }, formula: null, repeat: 1 };
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
                characterKey: action.characterKey,
                talentKey: action.talentKey,
                config: action.config,
            };

            const result = calculateFinalDamage(state, gameData);
            return { 
                actionId: action.id, 
                charKey: action.characterKey, 
                talentKey: action.talentKey, 
                damage: { 
                    avg: result.avg, 
                    crit: result.crit, 
                    nonCrit: result.nonCrit, 
                    damageType: result.damageType 
                }, 
                formula: result.formula,
                repeat: action.repeat || 1 
            };
        });
    }, [rotation, characterBuilds, enemyKey, team, gameData]);

    const analyticsData = useMemo(() => {
        if (!gameData) return {};
        
        const characterMetrics = {};
        const elementMetrics = {};
        const sourceMetrics = [];
        let grandTotalDamage = 0;

        calculationResults.forEach(res => {
            if (!res || !res.charKey || !res.talentKey) return;
            
            const charInfo = gameData.characterData[res.charKey];
            if(!charInfo || !charInfo.name) return;

            const charName = charInfo.name;
            const charElement = charInfo.element;

            const talentName = gameData.characterData[res.charKey].talents[res.talentKey].name;
            const damageType = res.damage.damageType;
            const actionTotalDamage = (res.damage.avg || 0) * (res.repeat || 1);
            
            grandTotalDamage += actionTotalDamage;

            if (!characterMetrics[charName]) {
                characterMetrics[charName] = { total: 0, element: charElement };
            }
            if (!elementMetrics[damageType]) {
                elementMetrics[damageType] = { total: 0 };
            }

            characterMetrics[charName].total += actionTotalDamage;
            elementMetrics[damageType].total += actionTotalDamage;
            
            sourceMetrics.push({ 
                name: `${charName} - ${talentName} (x${res.repeat})`, 
                total: actionTotalDamage, 
                element: damageType 
            });
        });

        const duration = rotationDuration > 0 ? rotationDuration : 1;

        for (const char in characterMetrics) {
            characterMetrics[char].dps = characterMetrics[char].total / duration;
        }
        for (const elem in elementMetrics) {
            elementMetrics[elem].dps = elementMetrics[elem].total / duration;
        }
        sourceMetrics.forEach(source => {
            source.dps = source.total / duration;
        });

        sourceMetrics.sort((a, b) => b.total - a.total);

        return { 
            characterMetrics, 
            elementMetrics, 
            sourceMetrics, 
            totalDamage: grandTotalDamage, 
            totalDps: grandTotalDamage / duration 
        };
    }, [calculationResults, gameData, rotationDuration]);
    
    const rotationSummary = useMemo(() => ({ 
        totalDamage: analyticsData.totalDamage || 0, 
        dps: analyticsData.totalDps || 0
    }), [analyticsData.totalDamage, analyticsData.totalDps]);

    const handleSavePreset = async () => { 
        if (!presetName) { showModal({ title: "Save Error", message: "Please enter a name for the preset." }); return; } 
        if (!user) return; 
        setIsSaving(true); 
        const dataToSave = { name: presetName, team, characterBuilds, rotation, enemyKey, rotationDuration }; 
        try { 
            const appId = 'default-app-id'; 
            const presetDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/presets`, presetName); 
            await setDoc(presetDocRef, dataToSave); 
            showModal({ title: "Success", message: `Preset "${presetName}" saved successfully!` });
        } catch (error) { 
            console.error("Save preset error:", error); 
            showModal({ title: "Save Error", message: "Failed to save preset. Check Firebase rules." });
        } finally { 
            setIsSaving(false); 
        } 
    };
    
    const handleSaveToMastersheet = async () => {
        if (!isAdmin) {
            showModal({ title: "Permission Denied", message: "You do not have permission to perform this action." });
            return;
        }
        if (!presetName) {
            showModal({ title: "Publish Error", message: "Please enter a name for the mastersheet entry." });
            return;
        }

        setIsSaving(true);
        const dataToSave = {
            name: presetName,
            team,
            characterBuilds,
            rotation,
            rotationDuration,
            enemyKey,
            totalDamage: rotationSummary.totalDamage,
            dps: rotationSummary.dps,
            savedAt: new Date()
        };

        try {
            const appId = 'default-app-id';
            const mastersheetCollectionRef = collection(db, `artifacts/${appId}/public/data/mastersheet`);
            await addDoc(mastersheetCollectionRef, dataToSave);
            showModal({ title: "Success", message: `Preset "${presetName}" published to the Mastersheet successfully!` });
        } catch (error) {
            console.error("Save to mastersheet error:", error);
            showModal({ title: "Publish Error", message: "Failed to publish to mastersheet." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateLeaderboard = async ({ name, designatedCharacterKey, description }) => {
        if (!isAdmin) {
            showModal({ title: "Permission Denied", message: "You do not have permission to perform this action." });
            return;
        }
        setIsSaving(true);
        const leaderboardData = {
            name,
            designatedCharacterKey,
            description,
            team,
            characterBuilds,
            rotation,
            rotationDuration,
            enemyKey,
            createdAt: Timestamp.now(),
        };

        try {
            const appId = 'default-app-id';
            const leaderboardsCollectionRef = collection(db, `artifacts/${appId}/public/data/leaderboards`);
            await addDoc(leaderboardsCollectionRef, leaderboardData);
            showModal({ title: "Success", message: `Leaderboard "${name}" has been created!` });
        } catch (error) {
            console.error("Create leaderboard error:", error);
            showModal({ title: "Creation Error", message: "Failed to create leaderboard." });
        } finally {
            setIsSaving(false);
        }
    };


    const handleLoadPreset = (preset) => { if (!preset) return; setTeam(preset.team); setCharacterBuilds(preset.characterBuilds); setRotation(preset.rotation.map(a => ({ ...a, repeat: a.repeat || 1 }))); setEnemyKey(preset.enemyKey); setRotationDuration(preset.rotationDuration); setPresetName(preset.name); };
    
    const handleDeletePreset = async (presetId) => {
        if (!presetId || !user) return;
        const presetToDelete = savedPresets.find(p => p.id === presetId);
        
        showModal({
            title: 'Delete Preset?',
            message: `Are you sure you want to delete your personal preset "${presetToDelete?.name || presetId}"?`,
            type: 'confirm',
            onConfirm: async () => {
                try {
                    const appId = 'default-app-id';
                    const presetDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/presets`, presetId);
                    await deleteDoc(presetDocRef);
                } catch (error) {
                    console.error("Delete preset error: ", error);
                    showModal({ title: 'Error', message: 'Failed to delete preset.' });
                }
            }
        });
    };

    const handleClearAll = () => {
        showModal({
            title: 'Clear Workspace?',
            message: 'Are you sure you want to clear the current team and rotation? This will not delete your saved presets.',
            type: 'confirm',
            onConfirm: () => {
                const newBuilds = {};
                initialTeam.forEach(c => { if(c) newBuilds[c] = createDefaultBuild(c, gameData.characterData); });
                setTeam(initialTeam);
                setCharacterBuilds(newBuilds);
                setRotation([]);
                setEnemyKey('ruin_guard');
                setRotationDuration(20);
                setPresetName("New Team");
                setSelectedActionIds([]);
            }
        });
    };

    const handleExportData = () => { const dataToExport = { team, characterBuilds, rotation, enemyKey, rotationDuration, presetName }; const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`; const link = document.createElement("a"); const safePresetName = presetName.replace(/[^a-z0-9]/gi, '_').toLowerCase(); link.href = jsonString; link.download = `${safePresetName || 'genshin-rotation-data'}.json`; link.click(); };
    const handleImportClick = () => { importFileRef.current.click(); };
    const handleImportData = (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const d = JSON.parse(e.target.result); if (d.team && d.characterBuilds && d.rotation) { setTeam(d.team); setCharacterBuilds(d.characterBuilds); setRotation(d.rotation.map(a => ({ ...a, repeat: a.repeat || 1 }))); setEnemyKey(d.enemyKey || 'ruin_guard'); setRotationDuration(d.rotationDuration || 20); setPresetName(d.presetName || "Imported Team"); event.target.value = null; } else { showModal({title: "Import Error", message: "Invalid data file format."}); } } catch (error) { showModal({title: "Import Error", message: "Error parsing file."}); console.error("Import error:", error); } }; reader.readAsText(file); };
    const handleAddSingleAction = (charKey, talentKey) => { if (charKey && talentKey) { setRotation(prev => [...prev, { id: Date.now() + Math.random(), characterKey: charKey, talentKey, config: { reactionType: 'none', activeBuffs: {}, infusion: null }, repeat: 1 }]); } };
    const handleActionRepeatChange = (actionId, newRepeat) => { const repeatCount = Math.max(1, parseInt(newRepeat, 10) || 1); setRotation(r => r.map(a => a.id === actionId ? { ...a, repeat: repeatCount } : a)); };
    const handleDuplicateAction = (actionId) => { const actionIndex = rotation.findIndex(a => a.id === actionId); if (actionIndex > -1) { const actionToDuplicate = rotation[actionIndex]; const newAction = JSON.parse(JSON.stringify(actionToDuplicate)); newAction.id = Date.now() + Math.random(); const newRotation = [...rotation]; newRotation.splice(actionIndex + 1, 0, newAction); setRotation(newRotation); } };
    const handleActionSelect = (actionId) => setSelectedActionIds(prev => prev.includes(actionId) ? prev.filter(id => id !== actionId) : [...prev, actionId]);
    const handleBulkApplyBuffs = (buffKey, buffState) => { setRotation(prevRotation => prevRotation.map(action => { if (selectedActionIds.includes(action.id)) { const newAction = JSON.parse(JSON.stringify(action)); if (buffState.active) { newAction.config.activeBuffs[buffKey] = { ...newAction.config.activeBuffs[buffKey], ...buffState}; } else { delete newAction.config.activeBuffs[buffKey]; } return newAction; } return action; })); };
    const updateCharacterBuild = (charKey, newBuild) => setCharacterBuilds(prev => ({ ...prev, [charKey]: newBuild }));
    const handleUpdateAction = (id, updatedAction) => setRotation(r => r.map(a => a.id === id ? updatedAction : a));
    const handleRemoveAction = (id) => setRotation(r => r.filter(a => a.id !== id));
    
    const activeTeam = useMemo(() => team.filter(c => c), [team]);
    
    if (isUserLoading || isGameDataLoading) {
        return <LoadingScreen text="Loading Game & User Data..." />;
    }

    const calculatorPageProps = {
        team, handleTeamChange, setEditingBuildFor,
        enemyKey, setEnemyKey, user, gameData, isFetchingProfile,
        isSaving, isAdmin,
        onExport: handleExportData, onImport: handleImportClick, onClearAll: handleClearAll,
        presetName, setPresetName, savedPresets,
        onSavePreset: handleSavePreset, onLoadPreset: handleLoadPreset, onDeletePreset: handleDeletePreset,
        onSaveToMastersheet: handleSaveToMastersheet,
        onShowCreateLeaderboardModal: () => setShowCreateLeaderboardModal(true),
        rotation, rotationDuration, setRotationDuration,
        mainView, setMainView,
        activeActionTray, setActiveActionTray,
        editingActionId, setEditingActionId,
        editingBuildFor,
        selectedActionIds, setSelectedActionIds,
        showBulkEdit, setShowBulkEdit,
        calculationResults, analyticsData, rotationSummary,
        activeTeam, handleFetchEnkaData,
        handleAddFromNotation, handleAddSingleAction,
        handleActionRepeatChange, handleDuplicateAction,
        handleActionSelect, handleBulkApplyBuffs,
        updateCharacterBuild, handleUpdateAction, handleRemoveAction,
        characterBuilds,
    };

    const renderPage = () => {
        switch(page) {
            case 'home':
                return <HomePage setPage={setPage} newsItems={newsItems} />;
            case 'calculator':
                 if (user && gameData) {
                    return <div className="h-full"><CalculatorPage {...calculatorPageProps} /></div>;
                }
                return null;
            case 'admin':
                return isAdmin && <AdminPage newsItems={newsItems}/>;
            case 'characters':
                return gameData && <CharacterArchivePage gameData={gameData} />;
            case 'weapons':
                return gameData && <WeaponArchivePage gameData={gameData} />;
            case 'artifacts':
                return gameData && <ArtifactArchivePage gameData={gameData} />;
            case 'enemies':
                return gameData && <EnemyArchivePage gameData={gameData} />;
            case 'mastersheet':
                return gameData && <MastersheetPage gameData={gameData} onLoadPreset={handleLoadPreset} setPage={setPage} isAdmin={isAdmin} />;
            case 'leaderboards':
                return gameData && <LeaderboardListPage gameData={gameData} setPage={setPage} setLeaderboardId={setCurrentLeaderboardId} />;
            case 'leaderboardDetail':
                 return gameData && <LeaderboardDetailPage leaderboardId={currentLeaderboardId} gameData={gameData} setPage={setPage} user={user} isAdmin={isAdmin} />;
            default:
                return <HomePage setPage={setPage} newsItems={newsItems} />;
        }
    }


    return (
        <div className="bg-brand-dark min-h-screen text-white flex h-screen overflow-hidden">
            <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImportData} />
            {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
            {showCreateLeaderboardModal && isAdmin && (
                <CreateLeaderboardModal
                    isOpen={showCreateLeaderboardModal}
                    onClose={() => setShowCreateLeaderboardModal(false)}
                    onCreate={handleCreateLeaderboard}
                    team={activeTeam}
                    gameData={gameData}
                />
            )}
            
            <NavigationSidebar 
                user={user}
                isAdmin={isAdmin}
                page={page}
                setPage={setPage}
                onLoginClick={() => setShowLoginModal(true)}
                onSignOut={() => signOut(auth).catch(error => console.error("Sign out failed:", error))}
            />
            
            <main className="flex-grow flex-1 flex flex-col overflow-y-auto">
                {renderPage()}
            </main>
        </div>
    );
}