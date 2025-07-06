import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, getDocs, query, orderBy } from '../firebase';
import { useModal } from '../context/ModalContext';

const CharacterAccordionHeader = ({ charInfo, leaderboardCount, isExpanded, onClick }) => (
    <div
        onClick={onClick}
        className="bg-slate-800/60 rounded-lg p-6 flex items-center gap-6 cursor-pointer hover:bg-slate-700/80 transition-colors"
    >
        <img
            src={charInfo.iconUrl}
            alt={charInfo.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-slate-600"
        />
        <div className="flex-grow">
            <h3 className="text-3xl font-bold text-white">{charInfo.name} Leaderboards</h3>
            <p className="text-md text-slate-400">{leaderboardCount} leaderboard(s) available</p>
        </div>
        <svg
            className={`w-8 h-8 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    </div>
);

export const LeaderboardListPage = ({ gameData, setPage, setLeaderboardId }) => {
    const [leaderboards, setLeaderboards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCharKey, setExpandedCharKey] = useState(null); // State to track which character is expanded
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

    const toggleExpand = (charKey) => {
        setExpandedCharKey(prevKey => (prevKey === charKey ? null : charKey));
    };

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Leaderboards</h1>
            <p className="text-slate-400 mb-8 max-w-2xl">Compete by submitting your UID to a specific challenge. Only the artifacts and weapon of the designated character will be used from your profile.</p>

            {loading ? (
                <p>Loading Leaderboards...</p>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedLeaderboards).map(([charKey, lbs]) => (
                        <div key={charKey} className="bg-slate-900/50 rounded-lg">
                            <CharacterAccordionHeader
                                charInfo={gameData.characterData[charKey]}
                                leaderboardCount={lbs.length}
                                isExpanded={expandedCharKey === charKey}
                                onClick={() => toggleExpand(charKey)}
                            />
                            {expandedCharKey === charKey && (
                                <div className="p-4 space-y-3">
                                    {lbs.map(lb => (
                                        <div key={lb.id} className="bg-slate-800 p-3 rounded-md flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-white">{lb.name}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="text-xs text-slate-400">Team:</span>
                                                    {lb.team.map(tk => (
                                                        <img key={tk} src={gameData.characterData[tk]?.iconUrl} alt={gameData.characterData[tk]?.name} title={gameData.characterData[tk]?.name} className="w-6 h-6 rounded-full" />
                                                    ))}
                                                </div>
                                            </div>
                                            <button onClick={() => handleViewLeaderboard(lb.id)} className="btn btn-primary text-xs">View Rankings</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {leaderboards.length === 0 && <p className="text-center text-slate-400 py-8">No leaderboards have been created yet.</p>}
                </div>
            )}
        </div>
    );
};