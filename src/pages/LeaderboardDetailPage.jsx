import React, { useState, useEffect, useMemo } from 'react';
import { db, doc, getDoc, collection, addDoc, getDocs, query, orderBy, Timestamp, updateDoc } from '../firebase';
import { useModal } from '../context/ModalContext';
import { calculateFinalDamage } from '../logic/damage_formula.js';
import { calculateTotalStats } from '../logic/stat_calculator.js';
import { parseEnkaData } from '../utils/enka_parser.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { EditLeaderboardModal } from '../components/EditLeaderboardModal.jsx';

export const LeaderboardDetailPage = ({ leaderboardId, gameData, setPage, user, isAdmin }) => {
    const [leaderboard, setLeaderboard] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uid, setUid] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const { showModal } = useModal();

    const fetchLeaderboardData = async () => {
        setLoading(true);
        try {
            const appId = 'default-app-id';
            const lbDocRef = doc(db, `artifacts/${appId}/public/data/leaderboards`, leaderboardId);
            const lbDocSnap = await getDoc(lbDocRef);

            if (!lbDocSnap.exists()) throw new Error("Leaderboard not found.");
            
            const lbData = { id: lbDocSnap.id, ...lbDocSnap.data() };
            setLeaderboard(lbData);

            const entriesRef = collection(lbDocRef, 'entries');
            const q = query(entriesRef, orderBy('dps', 'desc'));
            const entriesSnap = await getDocs(q);
            const entriesData = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEntries(entriesData);

        } catch (error) {
            console.error("Error fetching leaderboard details:", error);
            showModal({ title: 'Loading Error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!leaderboardId) {
            setPage('leaderboards');
            return;
        }
        fetchLeaderboardData();
    }, [leaderboardId]);

    const handleUpdateDescription = async (id, data) => {
        const appId = 'default-app-id';
        const lbDocRef = doc(db, `artifacts/${appId}/public/data/leaderboards`, id);
        await updateDoc(lbDocRef, data);
        fetchLeaderboardData();
    };
    
    const handleSubmission = async () => {
        if (!uid || !/^\d{9}$/.test(uid)) {
            showModal({ title: 'Invalid UID', message: 'Please enter a valid 9-digit Genshin Impact UID.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/uid/${uid}/`);
            if (!response.ok) throw new Error(`Failed to fetch data for UID ${uid}. Make sure your characters are in your in-game showcase.`);
            const enkaData = await response.json();
            
            const { designatedCharacterKey, rotationDuration } = leaderboard;
            const designatedCharInfo = gameData.characterData[designatedCharacterKey];
            const parsedBuilds = parseEnkaData(enkaData, gameData, designatedCharacterKey);

            if (!parsedBuilds[designatedCharacterKey]) {
                throw new Error(`The character required for this leaderboard (${designatedCharInfo.name}) was not found in your showcase.`);
            }

            const finalCharacterBuilds = { ...leaderboard.characterBuilds, ...parsedBuilds };
            const designatedCharacterBuild = finalCharacterBuilds[designatedCharacterKey];

            let totalDamage = 0;
            leaderboard.rotation.forEach(action => {
                if (action.characterKey !== designatedCharacterKey) return;
                
                const state = {
                    character: designatedCharInfo,
                    characterBuild: designatedCharacterBuild,
                    weapon: gameData.weaponData[designatedCharacterBuild.weapon?.key || 'no_weapon'],
                    talent: designatedCharInfo?.talents?.[action.talentKey],
                    activeBuffs: action.config.activeBuffs,
                    reactionType: action.config.reactionType,
                    infusion: action.config.infusion,
                    enemy: gameData.enemyData[leaderboard.enemyKey],
                    team: leaderboard.team,
                    characterBuilds: finalCharacterBuilds,
                    characterKey: action.characterKey,
                    talentKey: action.talentKey,
                    config: action.config,
                };
                const result = calculateFinalDamage(state, gameData);
                totalDamage += (result.avg || 0) * (action.repeat || 1);
            });

            const dps = totalDamage / (rotationDuration || 1);

            const statCalcState = {
                character: designatedCharInfo,
                characterBuild: designatedCharacterBuild,
                weapon: gameData.weaponData[designatedCharacterBuild.weapon?.key || 'no_weapon'],
                team: leaderboard.team,
                characterBuilds: finalCharacterBuilds,
                activeBuffs: {},
            };
            const finalStats = calculateTotalStats(statCalcState, gameData, designatedCharacterKey);
            
            // Corrected CV Calculation:
            // 1. Start with total Crit Rate and Crit Damage from stats.
            // 2. Subtract character's base stats (5% CR, 50% CD).
            // 3. Subtract character's ascension stats, if they are crit.
            let artifactCR = finalStats.crit_rate - 0.05;
            let artifactCD = finalStats.crit_dmg - 0.50;

            if (designatedCharInfo.ascension_stat === 'crit_rate') {
                artifactCR -= designatedCharInfo.ascension_value;
            } else if (designatedCharInfo.ascension_stat === 'crit_dmg') {
                artifactCD -= designatedCharInfo.ascension_value;
            }
            
            let critValue = (artifactCR * 2 + artifactCD) * 100;
            if (['crit_rate', 'crit_dmg'].includes(designatedCharacterBuild.circletMainStat)) {
                critValue += 62.2;
            }

            const appId = 'default-app-id';
            const entriesRef = collection(db, `artifacts/${appId}/public/data/leaderboards`, leaderboardId, 'entries');
            await addDoc(entriesRef, {
                uid,
                totalDamage,
                dps,
                stats: {
                    atk: finalStats.atk,
                    hp: finalStats.hp,
                    def: finalStats.def,
                    crit_rate: finalStats.crit_rate,
                    crit_dmg: finalStats.crit_dmg,
                    er: finalStats.er,
                    em: finalStats.em,
                    cv: critValue,
                },
                characterBuild: designatedCharacterBuild,
                submittedAt: Timestamp.now(),
            });

            showModal({ title: "Success!", message: `Your DPS of ${dps.toLocaleString()} has been submitted!`});
            fetchLeaderboardData();
            setUid('');

        } catch (error) {
            showModal({ title: 'Submission Error', message: error.message });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const chartData = useMemo(() => {
        if (!entries || entries.length === 0) return [];
        return entries
            .slice()
            .sort((a, b) => b.dps - a.dps)
            .map((entry, index) => ({
                rank: index + 1,
                dps: entry.dps,
            }));
    }, [entries]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (!leaderboard) return <div className="p-6">Leaderboard not found.</div>;
    
    const { characterData } = gameData;
    const designatedCharInfo = characterData[leaderboard.designatedCharacterKey];

    return (
        <div className="p-6">
            <EditLeaderboardModal 
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleUpdateDescription}
                leaderboard={leaderboard}
            />
            <button onClick={() => setPage('leaderboards')} className="btn btn-secondary mb-6">&larr; Back to Leaderboards</button>
            
            <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)] mb-8">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <h1 className="text-4xl font-extrabold text-white">{leaderboard.name}</h1>
                        <p className="text-lg text-cyan-400 mt-1">Scoring DPS for: {designatedCharInfo.name}</p>
                        
                         <div className="flex items-center gap-2 mt-4">
                            <span className="text-sm text-slate-400">Team:</span>
                            {leaderboard.team.map(charKey => {
                                if (!charKey || !characterData[charKey]) return null;
                                return (
                                    <img key={charKey} src={characterData[charKey].iconUrl} alt={characterData[charKey].name} title={characterData[charKey].name} className="w-9 h-9 rounded-full" />
                                );
                            })}
                        </div>

                        <div className="text-xs text-slate-300 mt-4 prose" dangerouslySetInnerHTML={{ __html: leaderboard.description }}></div>
                        {isAdmin && (
                            <button onClick={() => setShowEditModal(true)} className="btn btn-secondary mt-4 text-xs">Edit Description</button>
                        )}
                    </div>
                    <div className="md:col-span-1 flex items-center justify-center">
                         <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="rank" stroke="#64748b" tickFormatter={(tick) => `Top ${Math.round((tick / chartData.length) * 100)}%`} />
                                <YAxis stroke="#64748b" domain={['dataMin', 'dataMax']} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                    labelStyle={{ color: '#cbd5e1' }}
                                    formatter={(value) => [value.toLocaleString(undefined, {maximumFractionDigits: 0}), 'DPS']}
                                />
                                <Line type="monotone" dataKey="dps" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700 mb-8">
                <h3 className="text-xl font-bold text-white mb-3">Submit Your Score</h3>
                 <div className="flex gap-2">
                    <input
                        type="text"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        placeholder="Enter your 9-digit UID..."
                        disabled={isSubmitting}
                        className="flex-grow"
                    />
                    <button onClick={handleSubmission} className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Rankings</h2>
                <div className="space-y-1">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-slate-400 font-bold uppercase">
                        <div className="col-span-1">#</div>
                        <div className="col-span-2">Owner</div>
                        <div className="col-span-3">Crit Ratio</div>
                        <div className="col-span-1 text-right">ATK</div>
                        <div className="col-span-1 text-right">HP</div>
                        <div className="col-span-1 text-right">ER</div>
                        <div className="col-span-3 text-right">DPS</div>
                    </div>
                    {entries.map((entry, index) => (
                        <div key={entry.id} className="grid grid-cols-12 gap-4 items-center bg-slate-800 p-4 rounded-lg text-sm">
                            <div className="col-span-1 font-bold text-slate-400">#{index + 1}</div>
                            <div className="col-span-11 md:col-span-2 font-semibold text-white">UID: {entry.uid}</div>
                            <div className="col-span-6 md:col-span-3">
                                <span className="font-mono text-white">{(entry.stats.crit_rate * 100).toFixed(1)} / {(entry.stats.crit_dmg * 100).toFixed(1)}</span>
                                <span className="ml-2 text-xs text-cyan-400 font-bold">{entry.stats.cv.toFixed(1)}cv</span>
                            </div>
                            <div className="col-span-3 md:col-span-1 text-right font-mono text-white">{Math.round(entry.stats.atk)}</div>
                            <div className="col-span-3 md:col-span-1 text-right font-mono text-white">{Math.round(entry.stats.hp)}</div>
                            <div className="col-span-3 md:col-span-1 text-right font-mono text-white">{(entry.stats.er * 100).toFixed(1)}%</div>
                            <div className="col-span-6 md:col-span-3 text-right text-xl font-bold text-cyan-300">{Math.round(entry.dps).toLocaleString()}</div>
                        </div>
                    ))}
                    {entries.length === 0 && <p className="text-center text-slate-400 py-8">No entries yet. Be the first!</p>}
                 </div>
            </div>
        </div>
    );
};