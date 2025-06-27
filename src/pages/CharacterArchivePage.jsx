import React, { useState } from 'react';
import { CharacterCard } from '../components/CharacterCard.jsx';
import { CharacterDetailPage } from './CharacterDetailPage.jsx';

export const CharacterArchivePage = ({ gameData }) => {
    // State is now managed inside this component
    const [view, setView] = useState({ page: 'list', key: null });
    const { characterData } = gameData;
    
    // The detail page is shown if a character key is set
    if (view.page === 'detail' && view.key) {
        return <CharacterDetailPage 
                    charKey={view.key} 
                    onBack={() => setView({ page: 'list', key: null })} 
                    gameData={gameData} 
               />;
    }

    const characterList = Object.entries(characterData)
        .filter(([, char]) => char && char.name) // Defensive filter
        .sort(([, a], [, b]) => a.name.localeCompare(b.name));

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Character Archive</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {characterList.map(([key, charInfo]) => (
                    <CharacterCard 
                        key={key} 
                        charInfo={charInfo} 
                        onClick={() => setView({ page: 'detail', key: key })}
                    />
                ))}
            </div>
        </div>
    );
};