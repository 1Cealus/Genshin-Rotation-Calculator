import React, { useState } from 'react';

export const CreateLeaderboardModal = ({
    isOpen,
    onClose,
    onCreate,
    team,
    gameData
}) => {
    const [leaderboardName, setLeaderboardName] = useState('');
    const [designatedCharacter, setDesignatedCharacter] = useState(team.find(c => c) || '');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const activeTeam = team.filter(c => c && gameData.characterData[c]);

    const handleSubmit = () => {
        if (!leaderboardName.trim() || !designatedCharacter) {
            alert('Please provide a leaderboard name and select a designated character.');
            return;
        }
        onCreate({
            name: leaderboardName,
            designatedCharacterKey: designatedCharacter,
            description: description
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className="bg-slate-900/80 rounded-2xl shadow-xl p-6 w-full max-w-lg text-white border-2 border-slate-700 flex flex-col gap-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-cyan-400">Create New Leaderboard</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Leaderboard Name</label>
                    <input
                        type="text"
                        placeholder="e.g., Hu Tao - Vape N1C"
                        value={leaderboardName}
                        onChange={(e) => setLeaderboardName(e.target.value)}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Designated Character</label>
                    <p className="text-xs text-gray-400 mb-2">Select the character whose damage will be scored for this leaderboard.</p>
                    <select
                        value={designatedCharacter}
                        onChange={(e) => setDesignatedCharacter(e.target.value)}
                        className="w-full"
                    >
                        <option value="" disabled>Select a character</option>
                        {activeTeam.map(charKey => (
                            <option key={charKey} value={charKey}>
                                {gameData.characterData[charKey].name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="5"
                        className="w-full"
                        placeholder="Enter combo details, team builds, rotation notes, etc. This supports HTML."
                    ></textarea>
                </div>

                <div className="mt-4 flex justify-end gap-4">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} className="btn btn-primary">Create Leaderboard</button>
                </div>
            </div>
        </div>
    );
};