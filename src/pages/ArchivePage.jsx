// src/pages/ArchivePage.jsx

import React from 'react';
import { characterData } from '../data/character_database.js';
import { CharacterCard } from '../components/CharacterCard.jsx';
import { CharacterDetailPage } from './CharacterDetailPage.jsx'; // Import the new detail page

export const ArchivePage = ({ archiveView, setArchiveView }) => {
    // Show the detail page if a character key is set
    if (archiveView.page === 'detail' && archiveView.key) {
        return <CharacterDetailPage charKey={archiveView.key} onBack={() => setArchiveView({ page: 'list', key: null })} />;
    }

    // Otherwise, show the character list
    const characterList = Object.values(characterData).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">Character Archive</h1>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {characterList.map(charInfo => (
                    <CharacterCard 
                        key={charInfo.name} 
                        charInfo={charInfo} 
                        // When a card is clicked, update the view state to show the details for that character
                        onClick={() => setArchiveView({ page: 'detail', key: charInfo.alias[0] || charInfo.name.toLowerCase() })}
                    />
                ))}
            </div>
        </div>
    );
};