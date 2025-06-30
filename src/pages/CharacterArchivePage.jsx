import React, { useState, useMemo } from 'react';
import { CharacterCard } from '../components/CharacterCard.jsx';
import { CharacterDetailPage } from './CharacterDetailPage.jsx';

export const CharacterArchivePage = ({ gameData }) => {
    const [view, setView] = useState({ page: 'list', key: null });
    const { characterData } = gameData;
    
    // State for filters, search, and popover visibility
    const [searchTerm, setSearchTerm] = useState('');
    const [elementFilter, setElementFilter] = useState('All');
    const [weaponFilter, setWeaponFilter] = useState('All');
    const [rarityFilter, setRarityFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    const filteredCharacters = useMemo(() => {
        return Object.entries(characterData)
            .filter(([, char]) => {
                if (!char || !char.name) return false;
                const searchMatch = searchTerm ? char.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
                const elementMatch = elementFilter !== 'All' ? char.element === elementFilter : true;
                const weaponMatch = weaponFilter !== 'All' ? char.weapon_type === weaponFilter : true;
                const rarityMatch = rarityFilter !== 'All' ? char.rarity === parseInt(rarityFilter, 10) : true;
                return searchMatch && elementMatch && weaponMatch && rarityMatch;
            })
            .sort(([, a], [, b]) => a.name.localeCompare(b.name));
    }, [characterData, searchTerm, elementFilter, weaponFilter, rarityFilter]);
    
    if (view.page === 'detail' && view.key) {
        return <CharacterDetailPage 
                    charKey={view.key} 
                    onBack={() => setView({ page: 'list', key: null })} 
                    gameData={gameData} 
               />;
    }

    const weaponTypes = [...new Set(Object.values(characterData).map(c => c.weapon_type).filter(Boolean))];
    const elements = [...new Set(Object.values(characterData).map(c => c.element).filter(Boolean))];

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Character Archive</h1>

            <div className="flex justify-between items-center gap-4 mb-8 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                {/* --- UPDATED: Removed icon and related classes --- */}
                <div className="flex-grow max-w-lg">
                    <input 
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <button onClick={() => setShowFilters(!showFilters)} className="btn btn-secondary flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                        Filters
                    </button>
                    {showFilters && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-10 p-4 space-y-4">
                            <h4 className="font-bold text-white">Filter by:</h4>
                            <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)}>
                                <option value="All">All Rarities</option>
                                <option value="5">5-Star</option>
                                <option value="4">4-Star</option>
                            </select>
                            <select value={elementFilter} onChange={e => setElementFilter(e.target.value)}>
                                <option value="All">All Elements</option>
                                {elements.map(el => <option key={el} value={el} className="capitalize">{el}</option>)}
                            </select>
                            <select value={weaponFilter} onChange={e => setWeaponFilter(e.target.value)}>
                                <option value="All">All Weapons</option>
                                {weaponTypes.map(wt => <option key={wt} value={wt} className="capitalize">{wt}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {filteredCharacters.map(([key, charInfo]) => (
                    <CharacterCard 
                        key={key} 
                        charInfo={charInfo} 
                        onClick={() => setView({ page: 'detail', key: key })}
                    />
                ))}
            </div>
             {filteredCharacters.length === 0 && <p className="text-center text-slate-400 py-8">No characters found matching your criteria.</p>}
        </div>
    );
};