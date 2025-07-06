import { useState, useMemo, useEffect, useRef } from 'react';
import { db, auth, onAuthStateChanged, signOut, doc, setDoc, onSnapshot, collection, getDocs, deleteDoc, signInAnonymously, addDoc, Timestamp, updateDoc, getDoc } from '../firebase';
import { isFirebaseConfigValid } from '../config.js';
import { useModal } from '../context/ModalContext.jsx';

import { parseNotation } from '../utils/parseNotation.js';
import { calculateFinalDamage } from '../logic/damage_formula.js';
import { parseEnkaData } from '../utils/enka_parser.js';
import { getGameData } from '../data/loader.js';

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
    
    // STATE MANAGEMENT
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [sessionUid, setSessionUid] = useState(null);
    const [cachedProfile, setCachedProfile] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isGameDataLoading, setIsGameDataLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isFetchingProfile, setIsFetchingProfile] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [gameData, setGameData] = useState(null);
    const [newsItems, setNewsItems] = useState([]);
    
    const [team, setTeam] = useState(initialTeam);
    const [characterBuilds, setCharacterBuilds] = useState({});
    const [enemyKey, setEnemyKey] = useState('ruin_guard');
    const [rotation, setRotation] = useState([]);
    const [rotationDuration, setRotationDuration] = useState(20);
    const [presetName, setPresetName] = useState("My First Team");
    const [savedPresets, setSavedPresets] = useState([]);
    
    // UI STATE
    const [mainView, setMainView] = useState('rotation');
    const [activeActionTray, setActiveActionTray] = useState(null);
    const [editingActionId, setEditingActionId] = useState(null);
    const [editingBuildFor, setEditingBuildFor] = useState(null);
    const [selectedActionIds, setSelectedActionIds] = useState([]);
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const importFileRef = useRef(null);
    const [currentLeaderboardId, setCurrentLeaderboardId] = useState(null);

    // EFFECTS
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
        const unsubAuth = onAuthStateChanged(auth, u => {
            if (u && !u.isAnonymous) {
                setUser(u);
                setIsAdmin(u.uid === ADMIN_UID);
                setSessionUid(null);
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setIsUserLoading(false);
        });
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (user && db) {
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
                if (d.linkedUid) fetchAndCacheProfile(d.linkedUid);
                else setCachedProfile(null);
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
        if (!user || isUserLoading || isGameDataLoading) return;
        const debounceSave = setTimeout(() => {
            const dataToSave = { team, characterBuilds, enemyKey, rotation, rotationDuration, presetName };
            const appId = 'default-app-id';
            const mainDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
            setDoc(mainDocRef, dataToSave, { merge: true }).catch(err => console.error("Error auto-saving:", err));
        }, 1500);
        return () => clearTimeout(debounceSave);
    }, [team, characterBuilds, enemyKey, rotation, rotationDuration, presetName, user, isUserLoading, isGameDataLoading]);

    // HANDLER FUNCTIONS
    const fetchAndCacheProfile = async (uid) => {
        setIsFetchingProfile(true);
        try {
            const response = await fetch(`/api/uid/${uid}/`);
            if (!response.ok) throw new Error(`Failed to fetch data for UID ${uid}.`);
            const enkaData = await response.json();
            setCachedProfile(enkaData);
            return enkaData;
        } catch (error) {
            showModal({ title: "Profile Sync Failed", message: error.message });
            return null;
        } finally {
            setIsFetchingProfile(false);
        }
    };

    const handleUidLogin = async (uid) => {
        setIsLoggingIn(true);
        const profile = await fetchAndCacheProfile(uid);
        if (profile) {
            setSessionUid(uid);
            showModal({ title: "Quick Login Successful!", message: "Your profile is temporarily synced." });
        }
        setIsLoggingIn(false);
    };
    
    const handleLinkUid = async (uid) => {
        if (!user) return;
        if (!uid || !/^\d{9}$/.test(uid)) {
            showModal({ title: "Invalid UID", message: "Please enter a valid 9-digit UID." });
            return;
        }
        const appId = 'default-app-id';
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/calculatorData`, 'main');
        await setDoc(userDocRef, { linkedUid: uid }, { merge: true });
        showModal({ title: "UID Linked!", message: "Your UID has been linked to your account." });
    };

    const handleSignOut = () => {
        signOut(auth);
        setSessionUid(null);
        setCachedProfile(null);
        setUserData(null);
        setUser(null);
    };
    
    const handleLoadFromCache = (charKey) => {
        if (!cachedProfile || !cachedProfile.avatarInfoList) {
            showModal({ title: "No Profile Data", message: "Sync a profile first." });
            return;
        }
        const parsedBuilds = parseEnkaData(cachedProfile, gameData, charKey);
        if (parsedBuilds[charKey]) {
            setCharacterBuilds(prev => ({ ...prev, ...parsedBuilds }));
            showModal({ title: "Build Loaded", message: `${gameData.characterData[charKey].name}'s build has been loaded.` });
        } else {
            showModal({ title: "Not Found", message: `Could not find ${gameData.characterData[charKey].name} in the synced profile.` });
        }
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
    
    const calculationResults = useMemo(() => {
        if (!gameData) return [];
        return rotation.map(action => {
            const charBuild = characterBuilds[action.characterKey];
            const charInfo = gameData.characterData[action.characterKey];
            const talentInfo = charInfo?.talents?.[action.talentKey];
            if (!charBuild || !talentInfo) return { actionId: action.id, damage: {}, formula: null, repeat: 1 };
            const state = { character: charInfo, characterBuild, weapon: gameData.weaponData[charBuild.weapon?.key || 'no_weapon'], talent: talentInfo, activeBuffs: action.config.activeBuffs, reactionType: action.config.reactionType, infusion: action.config.infusion, enemy: gameData.enemyData[enemyKey], team, characterBuilds, characterKey: action.characterKey, talentKey: action.talentKey, config: action.config };
            const result = calculateFinalDamage(state, gameData);
            return { actionId: action.id, charKey: action.characterKey, talentKey: action.talentKey, damage: { avg: result.avg, crit: result.crit, nonCrit: result.nonCrit, damageType: result.damageType }, formula: result.formula, repeat: action.repeat || 1 };
        });
    }, [rotation, characterBuilds, enemyKey, team, gameData]);

    const rotationSummary = useMemo(() => {
        const totalDamage = calculationResults.reduce((sum, res) => sum + (res.damage.avg || 0) * (res.repeat || 1), 0);
        const dps = rotationDuration > 0 ? totalDamage / rotationDuration : 0;
        return { totalDamage, dps };
    }, [calculationResults, rotationDuration]);

    const handleSaveToMastersheet = async () => { /* ... */ };
    const handleCreateLeaderboard = async ({ name, designatedCharacterKey, description }) => { /* ... */ };
    const handleSavePreset = async () => { /* ... */ };
    const handleDeletePreset = async (id) => { /* ... */ };
    const handleClearAll = () => { /* ... */ };
    const handleExportData = () => { /* ... */ };
    const handleImportClick = () => { /* ... */ };
    const handleImportData = (event) => { /* ... */ };
    const handleAddSingleAction = (charKey, talentKey) => { /* ... */ };
    const handleActionRepeatChange = (actionId, newRepeat) => { /* ... */ };
    const handleDuplicateAction = (actionId) => { /* ... */ };
    const handleActionSelect = (actionId) => { /* ... */ };
    const handleBulkApplyBuffs = (buffKey, buffState) => { /* ... */ };
    const updateCharacterBuild = (charKey, newBuild) => { /* ... */ };
    const handleUpdateAction = (id, updatedAction) => { /* ... */ };
    const handleRemoveAction = (id) => { /* ... */ };

    const activeTeam = useMemo(() => team.filter(c => c), [team]);

    return {
        // State
        user, userData, sessionUid, cachedProfile, isAdmin, isUserLoading, isGameDataLoading, isLoggingIn, isFetchingProfile, isSaving,
        gameData, newsItems,
        team, characterBuilds, enemyKey, rotation, rotationDuration, presetName, savedPresets,
        mainView, activeActionTray, editingActionId, editingBuildFor, selectedActionIds, showBulkEdit,
        importFileRef, currentLeaderboardId, activeTeam,
        
        // UI State Setters
        setPage, setMainView, setActiveActionTray, setEditingActionId, setEditingBuildFor, setSelectedActionIds, setShowBulkEdit,
        setTeam, setCharacterBuilds, setEnemyKey, setRotation, setRotationDuration, setPresetName,
        setShowLoginModal, setShowCreateLeaderboardModal, setCurrentLeaderboardId,
        
        // Handlers
        handleUidLogin, handleLinkUid, handleSignOut, handleLoadFromCache,
        handleTeamChange, handleAddFromNotation, handleSaveToMastersheet, handleCreateLeaderboard,
        handleSavePreset, handleDeletePreset, handleClearAll, handleExportData, handleImportClick, handleImportData,
        handleAddSingleAction, handleActionRepeatChange, handleDuplicateAction, handleActionSelect,
        handleBulkApplyBuffs, updateCharacterBuild, handleUpdateAction, handleRemoveAction,
        
        // Memoized Values
        calculationResults, rotationSummary
    };
};
