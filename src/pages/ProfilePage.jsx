// src/pages/ProfilePage.jsx
import React from 'react';
import { CharacterCard } from '../components/CharacterCard';
import { BuildEditorModal } from '../components/BuildEditorModal';

export const ProfilePage = ({ characterBuilds, gameData, updateCharacterBuild }) => {
    const [editingCharKey, setEditingCharKey] = useState(null);

    const savedCharacters = Object.keys(characterBuilds).filter(key => characterBuilds[key]);

    return (
        <div className="p-6">
            <h1 className="text-4xl font-extrabold text-white mb-6">My Builds</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {savedCharacters.map(charKey => (
                    <CharacterCard
                        key={charKey}
                        charInfo={gameData.characterData[charKey]}
                        onClick={() => setEditingCharKey(charKey)}
                    />
                ))}
            </div>
            {editingCharKey && (
                <BuildEditorModal
                    charKey={editingCharKey}
                    build={characterBuilds[editingCharKey]}
                    updateBuild={updateCharacterBuild}
                    onClose={() => setEditingCharKey(null)}
                    gameData={gameData}
                />
            )}
        </div>
    );
};