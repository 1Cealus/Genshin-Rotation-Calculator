// src/components/CharacterCard.jsx

import React from 'react';

const elementBorders = {
    pyro: 'border-red-500',
    hydro: 'border-blue-500',
    dendro: 'border-green-500',
    electro: 'border-purple-500',
    anemo: 'border-teal-400',
    cryo: 'border-sky-400',
    geo: 'border-yellow-500',
    physical: 'border-gray-400'
};

export const CharacterCard = ({ charInfo, onClick }) => {
    const borderColor = elementBorders[charInfo.element] || 'border-gray-600';

    return (
        <div onClick={onClick} className="bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden shadow-lg border-2 border-transparent hover:border-[var(--color-accent-primary)] transition-all duration-200 cursor-pointer group">
            <div className={`relative p-2 border-b-4 ${borderColor}`}>
                <img 
                    src={charInfo.iconUrl} 
                    alt={charInfo.name} 
                    className="w-full h-auto aspect-square object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/128x128/161B22/E6EDF3?text=N/A'; }}
                />
            </div>
            <div className="p-3">
                <h3 className="text-white font-bold text-lg text-center truncate group-hover:text-[var(--color-accent-primary)]">{charInfo.name}</h3>
            </div>
        </div>
    );
};