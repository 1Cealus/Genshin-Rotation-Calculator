import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, getDocs, query, orderBy, doc, deleteDoc } from '../firebase';
import { useModal } from '../context/ModalContext';

// A sub-component to render a single row in our mastersheet table
const PresetRow = ({ preset, gameData, onLoadPreset, setPage, isAdmin, handleDelete }) => {
    const { characterData, weaponData } = gameData;
    const { id, name, team, dps, totalDamage, rotationDuration, characterBuilds } = preset;

    const handleLoad = () => {
        onLoadPreset(preset);
        setPage('calculator');
    };

    const confirmDelete = () => {
        handleDelete(id, name);
    };

    return (
        <div className="bg-slate-800/60 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-slate-700/60 transition-colors">
            <div className="flex-grow">
                <h3 className="font-bold text-lg text-white">{name}</h3>
                <div className="flex items-center gap-4 mt-2">
                    {team.map(charKey => {
                        if (!charKey || !characterData[charKey]) return null;
                        
                        const constellation = characterBuilds[charKey]?.constellation;
                        const weapon = characterBuilds[charKey]?.weapon?.key ? weaponData[characterBuilds[charKey].weapon.key] : null;

                        return (
                            <div key={charKey} className="flex flex-col items-center" title={`${characterData[charKey].name} - C${constellation || 0}`}>
                                <div className="relative">
                                    <img src={characterData[charKey].iconUrl} alt={characterData[charKey].name} className="w-12 h-12 rounded-full border-2 border-slate-600" />
                                    {constellation > 0 && (
                                        <div className="absolute -bottom-1 -right-1 bg-slate-900/80 backdrop-blur-sm rounded-full w-5 h-5 flex items-center justify-center border border-slate-500">
                                            <span className="text-white text-xs font-bold" style={{ textShadow: '0 0 3px black' }}>
                                                {constellation}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {weapon &&
                                    <img 
                                        src={weapon.iconUrl} 
                                        alt={weapon.name}
                                        title={weapon.name}
                                        className="w-8 h-8 rounded-full -mt-4 border-2 border-slate-900 bg-slate-700"
                                        onError={(e) => e.target.style.visibility = 'hidden'}
                                    />
                                }
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                    <div className="text-2xl font-bold text-cyan-400">{dps.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                    <div className="text-xs text-slate-400">DPS</div>
                </div>
                <div>
                    <div className="text-xl font-semibold text-white">{totalDamage.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                    <div className="text-xs text-slate-400">Total Damage</div>
                </div>
                <div>
                    <div className="text-xl font-semibold text-white">{rotationDuration}s</div>
                    <div className="text-xs text-slate-400">Duration</div>
                </div>
            </div>
            
            <div className="flex gap-2">
                {isAdmin && (
                    <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
                )}
                <button onClick={handleLoad} className="btn btn-primary">Load</button>
            </div>
        </div>
    );
}


export const MastersheetPage = ({ gameData, onLoadPreset, setPage, isAdmin }) => {
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const { showModal } = useModal();

    useEffect(() => {
        const fetchMastersheet = async () => {
            setLoading(true);
            try {
                const appId = 'default-app-id';
                const mastersheetCollectionRef = collection(db, `artifacts/${appId}/public/data/mastersheet`);
                const q = query(mastersheetCollectionRef, orderBy('dps', 'desc'));
                const snapshot = await getDocs(q);
                
                const presetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPresets(presetsData);
            } catch (error) {
                console.error("Error fetching mastersheet:", error);
                showModal({ title: 'Loading Error', message: 'Could not load mastersheet data.' });
            } finally {
                setLoading(false);
            }
        };

        fetchMastersheet();
    }, []);

    const displayedPresets = useMemo(() => {
        let processedPresets = [...presets];

        if (searchTerm.trim() !== '') {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            processedPresets = processedPresets.filter(preset => {
                const presetNameMatch = preset.name.toLowerCase().includes(lowercasedSearchTerm);
                if (presetNameMatch) return true;

                const characterNameMatch = preset.team.some(charKey => 
                    gameData.characterData[charKey]?.name.toLowerCase().includes(lowercasedSearchTerm)
                );
                return characterNameMatch;
            });
        }

        processedPresets.sort((a, b) => {
            return sortOrder === 'desc' ? b.dps - a.dps : a.dps - b.dps;
        });

        return processedPresets;
    }, [presets, searchTerm, sortOrder, gameData]);

    const handleDelete = (presetId, presetName) => {
        showModal({
            title: 'Delete Preset?',
            message: `Are you sure you want to permanently delete "${presetName}" from the Mastersheet? This cannot be undone.`,
            type: 'confirm',
            onConfirm: async () => {
                try {
                    const appId = 'default-app-id';
                    const docRef = doc(db, `artifacts/${appId}/public/data/mastersheet`, presetId);
                    await deleteDoc(docRef);
                    setPresets(currentPresets => currentPresets.filter(p => p.id !== presetId));
                    showModal({ title: 'Success', message: `"${presetName}" has been deleted.` });
                } catch (error) {
                    console.error("Error deleting mastersheet preset:", error);
                    showModal({ title: 'Error', message: 'Could not delete the preset.' });
                }
            }
        });
    };

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Mastersheet Builds</h1>
            <p className="text-slate-400 mb-8 max-w-2xl">A curated list of optimized and interesting team builds. Click 'Load' on any entry to import it directly into your calculator.</p>
            
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <input 
                    type="text"
                    placeholder="Search by preset name or character..."
                    className="flex-grow"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button 
                    onClick={() => setSortOrder(current => current === 'desc' ? 'asc' : 'desc')}
                    className="btn btn-secondary w-full md:w-auto"
                >
                    Sort by DPS ({sortOrder === 'desc' ? 'High to Low' : 'Low to High'})
                </button>
            </div>
            
            {loading ? (
                <p>Loading Mastersheet...</p>
            ) : (
                <div className="space-y-4">
                    {displayedPresets.length > 0 ? (
                        displayedPresets.map(preset => (
                            <PresetRow 
                                key={preset.id} 
                                preset={preset} 
                                gameData={gameData} 
                                onLoadPreset={onLoadPreset}
                                setPage={setPage}
                                isAdmin={isAdmin}
                                handleDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <p className="text-center text-slate-400 py-8">No presets found matching your criteria.</p>
                    )}
                </div>
            )}
        </div>
    );
};