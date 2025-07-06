import { useState, useMemo, useEffect, useRef } from 'react';
import { db, auth, onAuthStateChanged, signOut, doc, setDoc, onSnapshot, collection, getDocs, deleteDoc, addDoc, Timestamp, updateDoc, signInAnonymously, query, where } from '../firebase';
import { isFirebaseConfigValid } from '../config.js';
import { useModal } from '../context/ModalContext.jsx';

import { parseNotation } from '../utils/parseNotation.js';
import { calculateFinalDamage } from '../logic/damage_formula.js';
import { parseEnkaData } from '../utils/enka_parser.js';
import { getGameData } from '../data/loader.js';
import { calculateTotalStats } from '../logic/stat_calculator.js';

const ADMIN_UID = "RHK4HK166oe3kiCz3iEnybYcest1";
const initialTeam = ['', '', '', ''];

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

export const useAppContext = () => {
    const { showModal } = useModal();
    
    const [page, setPage] = useState('home');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showCreateLeaderboardModal, setShowCreateLeaderboardModal] = useState(false);
    
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [sessionUid, setSessionUid] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isGameDataLoading, setIsGameDataLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isFetchingProfile, setIsFetchingProfile] = useState(false);

    const [gameData, setGameData] = useState(null);
    const [newsItems, setNewsItems] = useState([]);
    
    const [team, setTeam] = useState(initialTeam);
    const [characterBuilds, setCharacterBuilds] = useState({});
    const [enemyKey, setEnemyKey] = useState('ruin_guard');
    const [rotation, setRotation] = useState([]);
    const [rotationDuration, setRotationDuration] = useState(20);
    const [presetName, setPresetName] = useState("My First Team");
    const [savedPresets, setSavedPresets] = useState([]);
    
    const [enkaCache, setEnkaCache] = useState({});
    
    const [mainView, setMainView] = useState('rotation');
    const [activeActionTray, setActiveActionTray] = useState(null);
    const [editingActionId, setEditingActionId] = useState(null);
    const [editingBuildFor, setEditingBuildFor] = useState(null);
    const [selectedActionIds, setSelectedActionIds] = useState([]);
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const importFileRef = useRef(null);
    const [currentLeaderboardId, setCurrentLeaderboardId] = useState(null);

    useEffect(() => {
        if (!isFirebaseConfigValid) {
            showModal({ title: 'Configuration Error', message: 'Firebase configuration is missing or invalid.' });
            setIsGameDataLoading(false);
            return;
        }
        getGameData(db).then(data => {
            setGameData(data);
            setIsGameDataLoading(false);
        }).catch(err => {
            setIsGameDataLoading(false);
            showModal({ title: 'Data Loading Error', message: 'A critical error occurred while loading game data.' });
        });
        const unsubNews = onSnapshot(collection(db, 'news'), (snapshot) => {
            const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.date.seconds - a.date.seconds);
            setNewsItems(news);
        });
        return () => unsubNews();
    }, []);

    useEffect(() => {
        if (!auth) {
            setIsUserLoading(false);
            return;
        };
        const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsAdmin(currentUser.uid === ADMIN_UID && !currentUser.isAnonymous);
                setIsUserLoading(false);
            } else {
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed", error);
                    setIsUserLoading(false); 
                });
            }
        });
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (user && !user.isAnonymous && db) {
            const appId = 'default-app-id';
            const mainDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
            const presetsColRef = collection(db, `artifacts/${appId}/users/${user.uid}/presets`);

            const unsubMain = onSnapshot(mainDocRef, docSnap => {
                const d = docSnap.data() || {};
                setUserData(d);
                setTeam(d.team || initialTeam);
                setCharacterBuilds(d.characterBuilds || {});
                setEnemyKey(d.enemyKey || 'ruin_guard');
                setRotation(d.rotation || []);
                setRotationDuration(d.rotationDuration || 20);
                setPresetName(d.presetName || "My First Team");
            });

            const unsubPresets = onSnapshot(presetsColRef, snapshot => {
                setSavedPresets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });

            return () => { unsubMain(); unsubPresets(); };
        } else {
            setUserData(null);
            setSavedPresets([]);
        }
    }, [user, db]);

    useEffect(() => {
        if (!user || user.isAnonymous || isUserLoading || isGameDataLoading) return;
        const debounceSave = setTimeout(() => {
            const dataToSave = { team, characterBuilds, enemyKey, rotation, rotationDuration, presetName };
            const appId = 'default-app-id';
            const mainDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
            setDoc(mainDocRef, dataToSave, { merge: true }).catch(err => console.error("Error auto-saving:", err));
        }, 1500);
        return () => clearTimeout(debounceSave);
    }, [team, characterBuilds, enemyKey, rotation, rotationDuration, presetName, user, isUserLoading, isGameDataLoading]);

    const calculationResults = useMemo(() => {
        if (!gameData || !characterBuilds || !rotation) return [];
        return rotation.map(action => {
            const charInfo = gameData.characterData[action.characterKey];
            const charBuild = characterBuilds[action.characterKey];
            
            if (!charInfo || !charBuild) return { actionId: action.id, damage: { avg: 0, crit: 0, nonCrit: 0 }, formula: null, repeat: action.repeat || 1 };
            
            const talentInfo = charInfo.talents?.[action.talentKey];
            const weaponInfo = gameData.weaponData[charBuild.weapon?.key || 'no_weapon'];

            if (!talentInfo || !weaponInfo) return { actionId: action.id, damage: { avg: 0, crit: 0, nonCrit: 0 }, formula: null, repeat: action.repeat || 1 };
            
            const state = {
                character: charInfo, characterBuild: charBuild, weapon: weaponInfo,
                talent: talentInfo, activeBuffs: action.config.activeBuffs,
                reactionType: action.config.reactionType, infusion: action.config.infusion,
                enemy: gameData.enemyData[enemyKey], team, characterBuilds,
                characterKey: action.characterKey, talentKey: action.talentKey, config: action.config
            };
            
            const result = calculateFinalDamage(state, gameData);
            return {
                actionId: action.id, charKey: action.characterKey, talentKey: action.talentKey,
                damage: { avg: result.avg, crit: result.crit, nonCrit: result.nonCrit, damageType: result.damageType },
                formula: result.formula, repeat: action.repeat || 1
            };
        });
    }, [rotation, characterBuilds, enemyKey, team, gameData]);

    const rotationSummary = useMemo(() => {
        const totalDamage = calculationResults.reduce((sum, res) => sum + (res.damage.avg || 0) * (res.repeat || 1), 0);
        const dps = rotationDuration > 0 ? totalDamage / rotationDuration : 0;
        return { totalDamage, dps };
    }, [calculationResults, rotationDuration]);
    
    const fetchAndCacheProfile = async (uid) => {
        const cached = enkaCache[uid];
        if (cached && cached.expiresAt > Date.now()) return cached.data;
        setIsFetchingProfile(true);
        try {
            const response = await fetch(`/api/uid/${uid}/`, { headers: { 'User-Agent': 'Genshin-Rotation-Calculator/1.0.1' } });
            if (!response.ok) throw new Error(`Failed to fetch data for UID ${uid}. Make sure your characters are in your in-game showcase.`);
            const enkaData = await response.json();
            const ttl = enkaData.ttl || 60;
            setEnkaCache(prev => ({ ...prev, [uid]: { data: enkaData, expiresAt: Date.now() + ttl * 1000 } }));
            return enkaData;
        } catch (error) {
            showModal({ title: "Profile Sync Failed", message: error.message });
            return null;
        } finally {
            setIsFetchingProfile(false);
        }
    };

    const submitToAllRelevantLeaderboards = async (uid, userBuilds) => {
        if (!gameData) return;
        try {
            const appId = 'default-app-id';
            const leaderboardsRef = collection(db, `artifacts/${appId}/public/data/leaderboards`);
            const leaderboardsSnapshot = await getDocs(leaderboardsRef);
            const leaderboards = leaderboardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let submittedCount = 0;
            let updatedCount = 0;

            const submissionPromises = leaderboards.map(async (lb) => {
                const designatedCharKey = lb.designatedCharacterKey;
                if (!userBuilds[designatedCharKey]) return;

                const designatedCharacterBuild = userBuilds[designatedCharKey];
                const designatedCharInfo = gameData.characterData[designatedCharKey];
                
                let totalDamage = 0;
                lb.rotation.forEach(action => {
                    if (action.characterKey !== designatedCharKey) return;
                    
                    const state = {
                        character: designatedCharInfo, characterBuild: designatedCharacterBuild,
                        weapon: gameData.weaponData[designatedCharacterBuild.weapon?.key || 'no_weapon'],
                        talent: designatedCharInfo?.talents?.[action.talentKey],
                        activeBuffs: action.config.activeBuffs, reactionType: action.config.reactionType,
                        infusion: action.config.infusion, enemy: gameData.enemyData[lb.enemyKey],
                        team: lb.team, characterBuilds: { ...lb.characterBuilds, [designatedCharKey]: designatedCharacterBuild },
                        characterKey: action.characterKey, talentKey: action.talentKey, config: action.config,
                    };
                    const result = calculateFinalDamage(state, gameData);
                    totalDamage += (result.avg || 0) * (action.repeat || 1);
                });

                const dps = totalDamage / (lb.rotationDuration || 1);

                const statCalcState = { character: designatedCharInfo, characterBuild: designatedCharacterBuild, weapon: gameData.weaponData[designatedCharacterBuild.weapon?.key || 'no_weapon'], team: lb.team, characterBuilds: { ...lb.characterBuilds, [designatedCharKey]: designatedCharacterBuild }, activeBuffs: {} };
                const finalStats = calculateTotalStats(statCalcState, gameData, designatedCharKey);
                
                const weaponInfo = gameData.weaponData[designatedCharacterBuild.weapon.key];
                const weaponCR = weaponInfo?.stats?.crit_rate || 0;
                const weaponCD = weaponInfo?.stats?.crit_dmg || 0;
                const ascensionCR = designatedCharInfo.ascension_stat === 'crit_rate' ? designatedCharInfo.ascension_value : 0;
                const ascensionCD = designatedCharInfo.ascension_stat === 'crit_dmg' ? designatedCharInfo.ascension_value : 0;
                const artifactCR = finalStats.crit_rate - 0.05 - ascensionCR - weaponCR;
                const artifactCD = finalStats.crit_dmg - 0.50 - ascensionCD - weaponCD;
                const critValue = (artifactCR * 2 * 100) + (artifactCD * 100);

                const submissionData = {
                    uid, totalDamage, dps,
                    stats: { atk: finalStats.atk, hp: finalStats.hp, def: finalStats.def, crit_rate: finalStats.crit_rate, crit_dmg: finalStats.crit_dmg, er: finalStats.er, em: finalStats.em, cv: critValue },
                    characterBuild: designatedCharacterBuild, submittedAt: Timestamp.now(),
                };

                const entriesRef = collection(db, `artifacts/${appId}/public/data/leaderboards`, lb.id, 'entries');
                const q = query(entriesRef, where("uid", "==", uid));
                const existingEntries = await getDocs(q);

                if (existingEntries.empty) {
                    await addDoc(entriesRef, submissionData);
                    submittedCount++;
                } else {
                    const existingDoc = existingEntries.docs[0];
                    if (submissionData.dps > existingDoc.data().dps) {
                        await updateDoc(existingDoc.ref, submissionData);
                        updatedCount++;
                    }
                }
            });

            await Promise.all(submissionPromises);

            if (submittedCount > 0 || updatedCount > 0) {
                showModal({ title: "Leaderboards Updated!", message: `Submitted ${submittedCount} new score(s) and updated ${updatedCount} existing score(s).` });
            } else {
                showModal({ title: "No New Submissions", message: `Your scores were not higher than your existing entries.` });
            }
        } catch (error) {
            console.error("Error submitting to leaderboards:", error);
            showModal({ title: "Leaderboard Error", message: "An error occurred while automatically submitting scores." });
        }
    };

    const handleUidLogin = async (uid) => {
        setIsLoggingIn(true);
        const profile = await fetchAndCacheProfile(uid);
        if (profile) {
            setSessionUid(uid);
            const parsedBuilds = parseEnkaData(profile, gameData);
            if (Object.keys(parsedBuilds).length > 0) {
                 setCharacterBuilds(prev => ({ ...prev, ...parsedBuilds }));
                 showModal({ title: "Builds Loaded!", message: "Your character builds have been imported. Now checking leaderboards..." });
                 await submitToAllRelevantLeaderboards(uid, parsedBuilds);
            } else {
                 showModal({ title: "No Characters Found", message: "Could not find any supported characters in your showcase." });
            }
        }
        setIsLoggingIn(false);
    };

    const handleSignOut = () => {
        signOut(auth);
        setSessionUid(null);
    };

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
        if (errors.length > 0) showModal({ title: "Parser Errors", message: errors.join("\n") });
        if (actions.length > 0) setRotation(prev => [...prev, ...actions]);
    };

    const handleAddSingleAction = (charKey, talentKey) => {
        const action = { id: Date.now() + Math.random(), characterKey: charKey, talentKey, config: { reactionType: 'none', activeBuffs: {}, infusion: null }, repeat: 1 };
        setRotation(prev => [...prev, action]);
    };
    
    const handleActionRepeatChange = (actionId, newRepeat) => {
        setRotation(rot => rot.map(a => a.id === actionId ? { ...a, repeat: Math.max(1, parseInt(newRepeat, 10) || 1) } : a));
    };
    
    const handleDuplicateAction = (actionId) => {
        const actionToDup = rotation.find(a => a.id === actionId);
        if (actionToDup) {
            const newAction = { ...actionToDup, id: Date.now() + Math.random() };
            const index = rotation.findIndex(a => a.id === actionId);
            setRotation(rot => [...rot.slice(0, index + 1), newAction, ...rot.slice(index + 1)]);
        }
    };
    
    const handleRemoveAction = (id) => {
        setRotation(rot => rot.filter(a => a.id !== id));
    };

    const handleUpdateAction = (id, updatedAction) => {
        setRotation(rot => rot.map(a => (a.id === id ? updatedAction : a)));
    };

    const updateCharacterBuild = (charKey, newBuild) => {
        setCharacterBuilds(builds => ({ ...builds, [charKey]: newBuild }));
    };

    const handleActionSelect = (actionId) => {
        setSelectedActionIds(ids => ids.includes(actionId) ? ids.filter(id => id !== actionId) : [...ids, actionId]);
    };

    const handleBulkApplyBuffs = (buffKey, buffState) => {
        setRotation(rot => rot.map(action => {
            if (selectedActionIds.includes(action.id)) {
                const newBuffs = { ...action.config.activeBuffs };
                if (buffState.active) newBuffs[buffKey] = { ...newBuffs[buffKey], ...buffState };
                else delete newBuffs[buffKey];
                return { ...action, config: { ...action.config, activeBuffs: newBuffs } };
            }
            return action;
        }));
    };

    const handleSavePreset = async () => {
        if (!user || user.isAnonymous || !presetName.trim()) {
            showModal({ title: "Cannot Save", message: "Please log in to a full account to save presets." });
            return;
        }
        const appId = 'default-app-id';
        const presetData = { name: presetName, team, characterBuilds, rotation, rotationDuration, enemyKey };
        const presetRef = doc(db, `artifacts/${appId}/users/${user.uid}/presets`, presetName);
        await setDoc(presetRef, presetData);
        showModal({ title: 'Success', message: `Preset "${presetName}" saved.`});
    };

    const handleLoadPreset = (preset) => {
        setPresetName(preset.name);
        setTeam(preset.team);
        setCharacterBuilds(preset.characterBuilds);
        setRotation(preset.rotation || []);
        setRotationDuration(preset.rotationDuration);
        setEnemyKey(preset.enemyKey);
    };

    const handleDeletePreset = async (id) => {
        if (!user || user.isAnonymous) return;
        showModal({
            title: 'Delete Preset?', message: `Are you sure you want to permanently delete this preset?`,
            type: 'confirm',
            onConfirm: async () => {
                const appId = 'default-app-id';
                const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/presets`, id);
                await deleteDoc(docRef);
            }
        });
    };

    const handleClearAll = () => {
        showModal({
            title: "Clear Workspace?", message: "This will reset your team, builds, and rotation. Are you sure?",
            type: 'confirm',
            onConfirm: () => {
                setTeam(initialTeam); setCharacterBuilds({});
                setRotation([]); setRotationDuration(20);
                setPresetName("New Team");
            }
        })
    };
    
    const handleExportData = () => {
        const data = JSON.stringify({ team, characterBuilds, rotation, rotationDuration, enemyKey, presetName }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${presetName.replace(/\s+/g, '_') || 'genshin_build'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => { importFileRef.current.click(); };

    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                setTeam(data.team || initialTeam);
                setCharacterBuilds(data.characterBuilds || {});
                setRotation(data.rotation || []);
                setRotationDuration(data.rotationDuration || 20);
                setEnemyKey(data.enemyKey || 'ruin_guard');
                setPresetName(data.presetName || "Imported Team");
                showModal({ title: 'Success', message: 'Data imported successfully.'});
            } catch (error) {
                showModal({ title: 'Import Error', message: 'Failed to parse the file.'});
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    };
    
    const handleCreateLeaderboard = async ({ name, designatedCharacterKey, description }) => {
        const data = {
            name, designatedCharacterKey, description, team, enemyKey,
            rotation, rotationDuration, characterBuilds, createdAt: Timestamp.now(),
        };
        const appId = 'default-app-id';
        await addDoc(collection(db, `artifacts/${appId}/public/data/leaderboards`), data);
        showModal({ title: 'Success', message: 'Leaderboard created!'});
    };

    const handleSaveToMastersheet = async () => {
        if (!isAdmin || !presetName.trim()) return;
        const { totalDamage, dps } = rotationSummary;
        const data = { name: presetName, dps, totalDamage, rotationDuration, team, enemyKey, characterBuilds, rotation };
        const appId = 'default-app-id';
        await addDoc(collection(db, `artifacts/${appId}/public/data/mastersheet`), data);
        showModal({ title: 'Published!', message: 'Build has been published to the Mastersheet.' });
    };

    const activeTeam = useMemo(() => team.filter(c => c), [team]);
    
    const analyticsData = useMemo(() => {
        if (!gameData || !calculationResults) return {};
        const characterMetrics = {}, elementMetrics = {}, sourceMetrics = {};
        calculationResults.forEach(result => {
            if (!result || !result.charKey) return;
            const charInfo = gameData.characterData[result.charKey];
            if (!charInfo) return;
            const totalActionDamage = (result.damage.avg || 0) * result.repeat;
            const actionDps = totalActionDamage / rotationDuration;
            if (!characterMetrics[charInfo.name]) characterMetrics[charInfo.name] = { total: 0, dps: 0, element: charInfo.element };
            characterMetrics[charInfo.name].total += totalActionDamage;
            characterMetrics[charInfo.name].dps += actionDps;
            const damageType = result.damage.damageType || charInfo.element;
            if (!elementMetrics[damageType]) elementMetrics[damageType] = { total: 0, dps: 0 };
            elementMetrics[damageType].total += totalActionDamage;
            elementMetrics[damageType].dps += actionDps;
            const talentInfo = charInfo.talents[result.talentKey];
            const sourceName = `${charInfo.name} - ${talentInfo.name}`;
            if (!sourceMetrics[sourceName]) sourceMetrics[sourceName] = { total: 0, dps: 0, element: damageType, name: sourceName };
            sourceMetrics[sourceName].total += totalActionDamage;
            sourceMetrics[sourceName].dps += actionDps;
        });
        return { characterMetrics, elementMetrics, sourceMetrics: Object.values(sourceMetrics) };
    }, [calculationResults, rotationDuration, gameData]);

    return {
        user, userData, sessionUid, isAdmin, isUserLoading, isGameDataLoading, isLoggingIn, isFetchingProfile,
        gameData, newsItems,
        page, setPage,
        showLoginModal, setShowLoginModal,
        showCreateLeaderboardModal, setShowCreateLeaderboardModal,
        currentLeaderboardId, setCurrentLeaderboardId,
        team, setTeam,
        characterBuilds, setCharacterBuilds,
        enemyKey, setEnemyKey,
        rotation, setRotation,
        rotationDuration, setRotationDuration,
        presetName, setPresetName,
        savedPresets,
        mainView, setMainView,
        activeActionTray, setActiveActionTray,
        editingActionId, setEditingActionId,
        editingBuildFor, setEditingBuildFor,
        selectedActionIds, setSelectedActionIds,
        showBulkEdit, setShowBulkEdit,
        importFileRef,
        handleUidLogin,
        handleSignOut,
        handleTeamChange,
        updateCharacterBuild,
        handleAddFromNotation,
        handleAddSingleAction,
        handleActionRepeatChange,
        handleDuplicateAction,
        handleRemoveAction,
        handleUpdateAction,
        handleActionSelect,
        handleBulkApplyBuffs,
        onSavePreset: handleSavePreset,
        onLoadPreset: handleLoadPreset,
        onDeletePreset: handleDeletePreset,
        onClearAll: handleClearAll,
        onExport: handleExportData,
        onImport: handleImportData,
        handleCreateLeaderboard,
        onSaveToMastersheet: handleSaveToMastersheet,
        submitToAllRelevantLeaderboards,
        calculationResults,
        rotationSummary,
        activeTeam,
        analyticsData,
    };
};