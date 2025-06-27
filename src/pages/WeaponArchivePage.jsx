import React, { useState } from 'react';

// A detail view for a single weapon
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

// The main archive page for weapons
export const WeaponArchivePage = ({ gameData }) => {
    const [view, setView] = useState({ page: 'list', key: null });
    const { weaponData } = gameData;

    if (view.page === 'detail' && view.key) {
        return <WeaponDetailPage 
                    weaponKey={view.key}
                    weaponInfo={weaponData[view.key]} 
                    onBack={() => setView({ page: 'list', key: null })} 
                />;
    }

    const weaponList = Object.entries(weaponData)
        .filter(([, w]) => w && w.name && w.name !== 'No Weapon')
        .sort(([, a], [, b]) => a.name.localeCompare(b.name));

    const WeaponCard = ({ weaponInfo, onClick }) => (
        <div onClick={onClick} className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)] cursor-pointer hover:border-[var(--color-accent-primary)] transition-colors">
            <h3 className="text-md font-bold text-[var(--color-accent-primary)] truncate">{weaponInfo.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] capitalize">{weaponInfo.type}</p>
        </div>
    );

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Weapon Archive</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {weaponList.map(([key, weapon]) => (
                    <WeaponCard key={key} weaponInfo={weapon} onClick={() => setView({ page: 'detail', key: key })}/>
                ))}
            </div>
        </div>
    );
};