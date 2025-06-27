import React, { useState } from 'react';

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

    if (view.page === 'detail' && view.key) {
        return <EnemyDetailPage 
                    enemyKey={view.key}
                    enemyInfo={enemyData[view.key]} 
                    onBack={() => setView({ page: 'list', key: null })} 
                />;
    }

    const enemyList = Object.entries(enemyData)
        .filter(([, e]) => e && e.name)
        .sort(([, a], [, b]) => a.name.localeCompare(b.name));

    const EnemyCard = ({ enemyInfo, onClick }) => (
        <div onClick={onClick} className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)] cursor-pointer hover:border-[var(--color-accent-primary)] transition-colors">
            <h3 className="text-md font-bold text-[var(--color-accent-primary)] truncate">{enemyInfo.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Level {enemyInfo.level}</p>
        </div>
    );

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Enemy Archive</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {enemyList.map(([key, enemy]) => (
                    <EnemyCard key={key} enemyInfo={enemy} onClick={() => setView({ page: 'detail', key: key })} />
                ))}
            </div>
        </div>
    );
};