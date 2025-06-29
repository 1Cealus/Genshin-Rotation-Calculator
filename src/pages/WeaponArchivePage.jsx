import React, { useState, useMemo } from 'react';

const WeaponDetailPage = ({ weaponKey, weaponInfo, onBack }) => (
    <div className="p-6">
        <button onClick={onBack} className="btn btn-secondary mb-6">&larr; Back to Weapon List</button>
        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)]">
            <h2 className="text-3xl font-bold text-[var(--color-accent-primary)]">{weaponInfo.name}</h2>
            <p className="text-md text-[var(--color-text-secondary)] capitalize mb-4">{weaponInfo.type}</p>
            <div className="grid grid-cols-2 gap-4 text-lg">
                <div><strong className="text-gray-400 block text-sm">Base ATK</strong> {weaponInfo.base_atk}</div>
                {weaponInfo.stats && Object.entries(weaponInfo.stats).map(([stat, value]) => (
                    <div key={stat}><strong className="text-gray-400 block text-sm capitalize">{stat.replace('_', ' ')}</strong> {(value * 100).toFixed(1)}%</div>
                ))}
            </div>
            <div className="mt-6">
                <h4 className="font-bold text-white mb-2">Refinements</h4>
                <ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1">
                    {weaponInfo.refinements.map((ref, i) => (
                        <li key={i}><strong className="text-white">R{i+1}:</strong> {Object.entries(ref).map(([k,v]) => `${k.replace('_',' ')} +${(v*100).toFixed(0)}%`).join(', ') || 'No passive stat bonus.'}</li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

export const WeaponArchivePage = ({ gameData }) => {
    const [view, setView] = useState({ page: 'list', key: null });
    const { weaponData } = gameData;

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [rarityFilter, setRarityFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    const filteredWeapons = useMemo(() => {
        return Object.entries(weaponData)
            .filter(([, w]) => {
                if (!w || w.name === 'No Weapon') return false;
                const searchMatch = searchTerm ? w.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
                const typeMatch = typeFilter !== 'All' ? w.type === typeFilter : true;
                const rarityMatch = rarityFilter !== 'All' ? w.rarity === parseInt(rarityFilter, 10) : true;
                return searchMatch && typeMatch && rarityMatch;
            })
            .sort(([, a], [, b]) => a.name.localeCompare(b.name));
    }, [weaponData, searchTerm, typeFilter, rarityFilter]);

    if (view.page === 'detail' && view.key) {
        return <WeaponDetailPage 
                    weaponKey={view.key}
                    weaponInfo={weaponData[view.key]} 
                    onBack={() => setView({ page: 'list', key: null })} 
                />;
    }

    const weaponTypes = [...new Set(Object.values(weaponData).map(w => w.type).filter(t => t && t !== 'all'))];

    const WeaponCard = ({ weaponInfo, onClick }) => (
        <div onClick={onClick} className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)] cursor-pointer hover:border-[var(--color-accent-primary)] transition-colors">
            <h3 className="text-md font-bold text-[var(--color-accent-primary)] truncate">{weaponInfo.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] capitalize">{weaponInfo.type}</p>
        </div>
    );

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Weapon Archive</h1>

            <div className="flex justify-between items-center gap-4 mb-8 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                <div className="relative flex-grow max-w-lg">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    {/* --- FIX IS HERE: Added all base input classes + pl-10 --- */}
                    <input 
                        type="text"
                        placeholder="Search by name..."
                        className="w-full bg-transparent border-2 border-[var(--color-border-primary)] rounded-md p-2 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-transparent transition-colors duration-200 pl-10"
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
                                <option value="3">3-Star</option>
                            </select>
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                                <option value="All">All Types</option>
                                {weaponTypes.map(wt => <option key={wt} value={wt} className="capitalize">{wt}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredWeapons.map(([key, weapon]) => (
                    <WeaponCard key={key} weaponInfo={weapon} onClick={() => setView({ page: 'detail', key: key })}/>
                ))}
            </div>
            {filteredWeapons.length === 0 && <p className="text-center text-slate-400 py-8">No weapons found matching your criteria.</p>}
        </div>
    );
};