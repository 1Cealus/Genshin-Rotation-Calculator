// src/pages/ArchivePage.jsx
import React from 'react';
import { CharacterCard } from '../components/CharacterCard.jsx';
import { CharacterDetailPage } from './CharacterDetailPage.jsx';

export const ArchivePage = ({ archiveView, setArchiveView, gameData }) => {
    const { characterData } = gameData;

    if (archiveView.page === 'detail' && archiveView.key) {
        return <CharacterDetailPage 
                    charKey={archiveView.key} 
                    onBack={() => setArchiveView({ page: 'list', key: null })} 
                    gameData={gameData} 
               />;
    }

    const characterList = Object.values(characterData).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Character Archive</h1>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {characterList.map(charInfo => (
                    <CharacterCard 
                        key={charInfo.name} 
                        charInfo={charInfo} 
                        onClick={() => setArchiveView({ page: 'detail', key: Object.keys(characterData).find(key => characterData[key] === charInfo) })}
                    />
                ))}
            </div>
        </div>
    );
};