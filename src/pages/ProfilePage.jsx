import React, { useState } from 'react';
import { CharacterCard } from '../components/CharacterCard';
import { BuildEditorModal } from '../components/BuildEditorModal';

const ProfileTabs = ({ profiles, activeUid, onSelect, onClose }) => (
    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg">
        {profiles.map(profile => (
            <div 
                key={profile.uid} 
                className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors ${profile.uid === activeUid ? 'bg-slate-700' : 'bg-transparent hover:bg-slate-800'}`}
            >
                <button onClick={() => onSelect(profile.uid)} className="font-semibold text-white">{profile.name}</button>
                {/* Prevent closing the primary user's tab */}
                {profile.name !== "Guest" && profile.name !== "My Profile" && (
                    <button onClick={() => onClose(profile.uid)} className="text-slate-500 hover:text-white text-lg font-bold">&times;</button>
                )}
            </div>
        ))}
    </div>
);

const UidSearch = ({ onSearch, isFetching }) => {
    const [uid, setUid] = useState('');
    const handleSearch = () => {
        if (uid.trim()) onSearch(uid);
    };
    return (
        <div className="flex gap-2">
            <input 
                type="text" 
                value={uid} 
                onChange={e => setUid(e.target.value)} 
                placeholder="Search UID..."
                className="w-48"
                disabled={isFetching}
            />
            <button onClick={handleSearch} className="btn btn-primary" disabled={isFetching || !uid.trim()}>
                {isFetching ? '...' : 'Search'}
            </button>
        </div>
    );
};

export const ProfilePage = ({
    profiles,
    activeProfile,
    setActiveProfileUid,
    handleProfileLookup,
    handleCloseProfile,
    gameData,
    isFetchingProfile,
    updateCharacterBuild,
}) => {
    const [editingCharKey, setEditingCharKey] = useState(null);

    // --- THIS IS THE FIX ---
    // Changed `activeProfile?.builds` to `activeProfile?.characterBuilds` to match the data structure.
    const characterBuilds = activeProfile?.characterBuilds || {};
    const savedCharacters = Object.keys(characterBuilds);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <ProfileTabs profiles={profiles} activeUid={activeProfile?.uid} onSelect={setActiveProfileUid} onClose={handleCloseProfile} />
                <UidSearch onSearch={handleProfileLookup} isFetching={isFetchingProfile} />
            </div>

            <h1 className="text-4xl font-extrabold text-white mb-6">
                {activeProfile ? `${activeProfile.name}'s Builds` : 'My Builds'}
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {savedCharacters.length > 0 ? savedCharacters.map(charKey => (
                    <CharacterCard
                        key={charKey}
                        charInfo={gameData.characterData[charKey]}
                        onClick={() => setEditingCharKey(charKey)}
                    />
                )) : (
                     <p className="text-center text-slate-400 py-8 col-span-full">No character builds found for this profile. Use the search to import builds via UID.</p>
                )}
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