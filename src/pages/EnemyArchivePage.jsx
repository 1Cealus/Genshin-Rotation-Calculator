import React, { useState, useMemo } from 'react';

const EnemyDetailPage = ({ enemyKey, enemyInfo, onBack }) => (
    <div className="p-6">
        <button onClick={onBack} className="btn btn-secondary mb-6">&larr; Back to Enemy List</button>
        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)]">
            <h2 className="text-3xl font-bold text-[var(--color-accent-primary)]">{enemyInfo.name}</h2>
            <p className="text-md text-[var(--color-text-secondary)] capitalize mb-4">Level {enemyInfo.level}</p>
            <div className="mt-6">
                <h4 className="font-bold text-white mb-2">Base Resistances</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {enemyInfo.base_res && Object.entries(enemyInfo.base_res).map(([element, value]) => (
                        <div key={element} className="flex justify-between bg-slate-800 p-2 rounded">
                            <span className="capitalize text-[var(--color-text-secondary)]">{element}</span>
                            <span className="font-mono text-white">{(value * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export const EnemyArchivePage = ({ gameData }) => {
    const [view, setView] = useState({ page: 'list', key: null });
    const { enemyData } = gameData;

    const [searchTerm, setSearchTerm] = useState('');

    const filteredEnemies = useMemo(() => {
        return Object.entries(enemyData)
            .filter(([, e]) => {
                if (!e || !e.name) return false;
                return searchTerm ? e.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
            })
            .sort(([, a], [, b]) => a.name.localeCompare(b.name));
    }, [enemyData, searchTerm]);

    if (view.page === 'detail' && view.key) {
        return <EnemyDetailPage 
                    enemyKey={view.key}
                    enemyInfo={enemyData[view.key]} 
                    onBack={() => setView({ page: 'list', key: null })} 
                />;
    }

    const EnemyCard = ({ enemyInfo, onClick }) => (
        <div onClick={onClick} className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)] cursor-pointer hover:border-[var(--color-accent-primary)] transition-colors">
            <h3 className="text-md font-bold text-[var(--color-accent-primary)] truncate">{enemyInfo.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Level {enemyInfo.level}</p>
        </div>
    );

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Enemy Archive</h1>

            <div className="flex justify-start items-center gap-4 mb-8 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                <div className="relative flex-grow max-w-lg">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                     {/* --- FIX IS HERE: Added all base input classes + pl-10 --- */}
                     <input 
                        type="text"
                        placeholder="Search by enemy name..."
                        className="w-full bg-transparent border-2 border-[var(--color-border-primary)] rounded-md p-2 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-transparent transition-colors duration-200 pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredEnemies.map(([key, enemy]) => (
                    <EnemyCard key={key} enemyInfo={enemy} onClick={() => setView({ page: 'detail', key: key })} />
                ))}
            </div>
             {filteredEnemies.length === 0 && <p className="text-center text-slate-400 py-8">No enemies found matching your criteria.</p>}
        </div>
    );
};