import React, { useState } from 'react';

const ArtifactSetDetailPage = ({ setKey, setInfo, onBack }) => (
     <div className="p-6">
        <button onClick={onBack} className="btn btn-secondary mb-6">&larr; Back to Artifact List</button>
        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)]">
            <h2 className="text-3xl font-bold text-[var(--color-accent-primary)]">{setInfo.name}</h2>
            <div className="text-lg mt-4 space-y-4">
                <p><strong className="text-white">2-Piece Bonus:</strong> <span className="text-[var(--color-text-secondary)]">{setInfo.bonuses?.['2']?.description}</span></p>
                <p><strong className="text-white">4-Piece Bonus:</strong> <span className="text-[var(--color-text-secondary)]">{setInfo.bonuses?.['4']?.description}</span></p>
            </div>
        </div>
    </div>
);


export const ArtifactArchivePage = ({ gameData }) => {
    const [view, setView] = useState({ page: 'list', key: null });
    const { artifactSets } = gameData;

    if (view.page === 'detail' && view.key) {
        return <ArtifactSetDetailPage 
                    setKey={view.key}
                    setInfo={artifactSets[view.key]} 
                    onBack={() => setView({ page: 'list', key: null })} 
                />;
    }

    const setList = Object.entries(artifactSets)
        .filter(([, s]) => s && s.name && s.name !== 'No Set')
        .sort(([, a], [, b]) => a.name.localeCompare(b.name));
    
    const ArtifactSetCard = ({ setInfo, onClick }) => (
        <div onClick={onClick} className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)] h-full cursor-pointer hover:border-[var(--color-accent-primary)] transition-colors">
            <h3 className="text-md font-bold text-[var(--color-accent-primary)] truncate">{setInfo.name}</h3>
            <div className="text-sm mt-2 space-y-2">
                <p><strong className="text-white">2pc:</strong> <span className="text-[var(--color-text-secondary)]">{setInfo.bonuses?.['2']?.description}</span></p>
                <p><strong className="text-white">4pc:</strong> <span className="text-[var(--color-text-secondary)]">{setInfo.bonuses?.['4']?.description}</span></p>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Artifact Set Archive</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {setList.map(([key, set]) => (
                    <ArtifactSetCard key={key} setInfo={set} onClick={() => setView({ page: 'detail', key: key })} />
                ))}
            </div>
        </div>
    );
};