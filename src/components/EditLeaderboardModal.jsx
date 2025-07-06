import React, { useState, useEffect } from 'react';

export const EditLeaderboardModal = ({ isOpen, onClose, onSave, leaderboard }) => {
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (leaderboard) {
            setDescription(leaderboard.description || '');
        }
    }, [leaderboard]);

    if (!isOpen || !leaderboard) return null;

    const handleSave = () => {
        onSave(leaderboard.id, { description });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className="bg-slate-900/80 rounded-2xl shadow-xl p-6 w-full max-w-2xl text-white border-2 border-slate-700 flex flex-col gap-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-cyan-400">Edit Leaderboard Description</h2>
                <p>Editing for: <span className="font-bold">{leaderboard.name}</span></p>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="10"
                        className="w-full"
                        placeholder="Enter combo details, team builds, rotation notes, etc."
                    ></textarea>
                </div>

                <div className="mt-4 flex justify-end gap-4">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn btn-primary">Save Changes</button>
                </div>
            </div>
        </div>
    );
};