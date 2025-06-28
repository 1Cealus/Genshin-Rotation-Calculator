import React, { useMemo } from 'react';
import { artifactSets } from '../data/artifact_sets.js';
import { artifactMainStats } from '../data/artifact_stats.js';


const ArtifactSlot = ({ slotName, piece, onChange }) => {
    const handleSetChange = (e) => {
        onChange(slotName, { ...piece, set: e.target.value });
    };

    return (
        <div className="grid grid-cols-3 gap-2 items-center">
            <label className="text-sm text-gray-300 capitalize col-span-1">{slotName}</label>
            <div className="col-span-2">
                <select 
                    value={piece.set} 
                    onChange={handleSetChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-1 text-sm text-white"
                >
                    {Object.entries(artifactSets).map(([key, set]) => (
                        <option key={key} value={key}>{set.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};


export const ArtifactEditor = ({ artifacts, onUpdate }) => {
    

    const activeSetBonuses = useMemo(() => {
        const counts = {};
        Object.values(artifacts).forEach(piece => {
            if (piece.set !== 'no_set') {
                counts[piece.set] = (counts[piece.set] || 0) + 1;
            }
        });

        const active = [];
        Object.entries(counts).forEach(([setKey, count]) => {
            const setInfo = artifactSets[setKey];
            if (count >= 2) {
                active.push({ name: `2pc ${setInfo.name}`, description: setInfo.bonuses[2].description });
            }
            if (count >= 4) {
                active.push({ name: `4pc ${setInfo.name}`, description: setInfo.bonuses[4].description });
            }
        });
        return active;
    }, [artifacts]);

    const handlePieceChange = (slotName, newPiece) => {
        onUpdate({
            ...artifacts,
            [slotName]: newPiece,
        });
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Artifact Sets</h3>
            <div className="space-y-2">
                {Object.keys(artifacts).map(slot => (
                    <ArtifactSlot
                        key={slot}
                        slotName={slot}
                        piece={artifacts[slot]}
                        onChange={handlePieceChange}
                    />
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-lg font-semibold text-gray-200 mb-2">Active Set Bonuses</h4>
                {activeSetBonuses.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                        {activeSetBonuses.map(bonus => (
                           <li key={bonus.name} className="text-cyan-300">
                               <strong className="text-white">{bonus.name}:</strong> {bonus.description}
                           </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-400">No active set bonuses.</p>
                )}
            </div>
        </div>
    );
};

