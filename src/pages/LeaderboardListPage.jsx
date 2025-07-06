import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, getDocs, query, orderBy } from '../firebase';
import { useModal } from '../context/ModalContext';

const CharacterLeaderboardGroup = ({ charKey, leaderboards, gameData, onViewLeaderboard }) => {
    const [showAll, setShowAll] = useState(false);
    const { characterData } = gameData;
    const charInfo = characterData[charKey];

    const sortedLeaderboards = useMemo(() => {
        // This can be expanded with more complex sorting later if needed
        return leaderboards.sort((a, b) => b.name.localeCompare(a.name));
    }, [leaderboards]);

    const displayedLeaderboards = showAll ? sortedLeaderboards : sortedLeaderboards.slice(0, 3);

    return (
        <div className="bg-slate-800/60 rounded-lg border border-[var(--color-border-primary)] flex flex-col md:flex-row overflow-hidden">
            <div className="md:w-1/4 flex-shrink-0">
                <img src={charInfo.gachaSplashUrl || charInfo.imageUrl} alt={charInfo.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-6 flex-grow">
                <h3 className="text-2xl font-bold text-white mb-4">{charInfo.name} Leaderboards</h3>
                <div className="space-y-3">
                    {displayedLeaderboards.map(lb => (
                        <div key={lb.id} className="bg-slate-800 p-3 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-white">{lb.name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-slate-400">Team:</span>
                                    {lb.team.map(tk => (
                                        <img key={tk} src={characterData[tk]?.iconUrl} alt={characterData[tk]?.name} title={characterData[tk]?.name} className="w-6 h-6 rounded-full" />
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => onViewLeaderboard(lb.id)} className="btn btn-secondary text-xs">View Rankings</button>
                        </div>
                    ))}
                    {sortedLeaderboards.length > 3 && (
                        <button onClick={() => setShowAll(!showAll)} className="text-sm text-cyan-400 hover:text-cyan-300 w-full text-left mt-2">
                            {showAll ? 'Show Fewer...' : `Show all ${sortedLeaderboards.length} leaderboards...`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const LeaderboardListPage = ({ gameData, setPage, setLeaderboardId }) => {
    const [leaderboards, setLeaderboards] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showModal } = useModal();

    useEffect(() => {
        const fetchLeaderboards = async () => {
            setLoading(true);
            try {
                const appId = 'default-app-id';
                const ref = collection(db, `artifacts/${appId}/public/data/leaderboards`);
                const q = query(ref, orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLeaderboards(data);
            } catch (error) {
                console.error("Error fetching leaderboards:", error);
                showModal({ title: 'Loading Error', message: 'Could not load leaderboards data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboards();
    }, []);
    
    const groupedLeaderboards = useMemo(() => {
        const groups = {};
        leaderboards.forEach(lb => {
            const key = lb.designatedCharacterKey;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(lb);
        });
        return groups;
    }, [leaderboards]);

    const handleViewLeaderboard = (id) => {
        setLeaderboardId(id);
        setPage('leaderboardDetail');
    };

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Leaderboards</h1>
            <p className="text-slate-400 mb-8 max-w-2xl">Compete by submitting your UID to a specific challenge. Only the artifacts and weapon of the designated character will be used from your profile.</p>

            {loading ? (
                <p>Loading Leaderboards...</p>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedLeaderboards).map(([charKey, lbs]) => (
                        <CharacterLeaderboardGroup
                            key={charKey}
                            charKey={charKey}
                            leaderboards={lbs}
                            gameData={gameData}
                            onViewLeaderboard={handleViewLeaderboard}
                        />
                    ))}
                    {leaderboards.length === 0 && <p className="text-center text-slate-400 py-8">No leaderboards have been created yet.</p>}
                </div>
            )}
        </div>
    );
};