import React, { useState, useMemo } from 'react';
import { characterData } from '../data/character_database.js';

// The TalentCard component now shows multipliers by default
const TalentCard = ({ name, description, attributes }) => (
    <div className="bg-[var(--color-bg-primary)] p-4 rounded-lg border border-[var(--color-border-primary)] h-full flex flex-col">
        <h4 className="text-md font-bold text-[var(--color-accent-primary)] mb-2">{name}</h4>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4 flex-grow" dangerouslySetInnerHTML={{ __html: description }}></p>
        
        {attributes.length > 0 && (
            // UPDATED: Added the "open" attribute to make this visible by default
            <details open className="mt-auto">
                <summary className="text-sm font-semibold text-white cursor-pointer hover:text-[var(--color-accent-primary)]">Multipliers</summary>
                <div className="text-xs space-y-1 mt-2">
                    {attributes.map((attr, index) => (
                        <div key={index} className="flex justify-between border-b border-dashed border-[var(--color-border-primary)]/50 py-1">
                            <span className="text-[var(--color-text-secondary)]">{attr.label}</span>
                            <span className="text-white font-mono">{attr.value}</span>
                        </div>
                    ))}
                </div>
            </details>
        )}
    </div>
);

const TabButton = ({ label, isActive, onClick }) => (
     <button 
        onClick={onClick}
        className={`px-4 py-2 font-semibold text-sm rounded-md transition-colors ${isActive ? 'bg-[var(--color-accent-primary)] text-slate-900' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-border-primary)] hover:text-white'}`}
     >
        {label}
    </button>
)

export const CharacterDetailPage = ({ charKey, onBack }) => {
    const [subPage, setSubPage] = useState('talents');
    const [displayTalentLevel, setDisplayTalentLevel] = useState(9);
    const [activeTab, setActiveTab] = useState('All');

    const charInfo = characterData[charKey];

    const getTalentAttributes = (talent) => {
        const talentLevelIndex = displayTalentLevel - 1;
        const attributes = [];

        if (talent.multipliers && talent.multipliers[talentLevelIndex] !== undefined) {
             let label = talent.scaling_stat === 'hp' ? 'HP%' : 'DMG%';
             let value = talent.multipliers[talentLevelIndex] * 100;
             attributes.push({ label, value: `${value.toFixed(1)}%` });
        }
        if (talent.flat_multipliers && talent.flat_multipliers[talentLevelIndex] !== undefined) {
             attributes.push({ label: 'Flat DMG Additive', value: `${(talent.flat_multipliers[talentLevelIndex] * 100).toFixed(1)}%` });
        }
        return attributes;
    };
    
    const getTalentCategory = (key) => {
        if (key.startsWith('na') || key.startsWith('ca')) return 'Normal Attack';
        if (key.startsWith('skill')) return 'Skill';
        if (key.startsWith('burst')) return 'Burst';
        if (key.startsWith('a') || key.startsWith('p')) return 'Passive';
        return 'Other';
    };

    const filteredTalents = useMemo(() => {
        if (!charInfo) return [];
        const allTalents = Object.entries(charInfo.talents).map(([key, value]) => ({...value, key}));

        if (activeTab === 'All') return allTalents;
        return allTalents.filter(talent => getTalentCategory(talent.key) === activeTab);

    }, [charInfo, activeTab]);

    if (!charInfo) return <div className="p-6 text-white">Character not found.</div>;

    return (
        <div className="p-4 md:p-6">
            <button onClick={onBack} className="btn btn-secondary mb-6">
                &larr; Back to Character List
            </button>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Navigation */}
                <div className="lg:w-1/4 xl:w-1/5 flex-shrink-0">
                    <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)] sticky top-6">
                        <div className="flex items-center gap-4 mb-4">
                            <img src={charInfo.iconUrl} alt={charInfo.name} className="w-16 h-16 rounded-full" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">{charInfo.name}</h2>
                                <p className="text-sm text-[var(--color-text-secondary)] capitalize">{charInfo.element}</p>
                            </div>
                        </div>
                        <nav className="space-y-1">
                            <button onClick={() => setSubPage('profile')} className={`w-full text-left p-3 rounded font-semibold ${subPage === 'profile' ? 'bg-[var(--color-accent-primary)] text-slate-900' : 'hover:bg-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:text-white'}`}>Profile</button>
                            <button onClick={() => setSubPage('talents')} className={`w-full text-left p-3 rounded font-semibold ${subPage === 'talents' ? 'bg-[var(--color-accent-primary)] text-slate-900' : 'hover:bg-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:text-white'}`}>Talents</button>
                        </nav>
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-grow">
                    {subPage === 'profile' && (
                        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-primary)]">
                            <h3 className="text-2xl font-bold mb-4">Profile</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div><strong className="text-[var(--color-text-secondary)]">Base HP:</strong> {charInfo.base_hp}</div>
                                <div><strong className="text-[var(--color-text-secondary)]">Base ATK:</strong> {charInfo.base_atk}</div>
                                <div><strong className="text-[var(--color-text-secondary)]">Base DEF:</strong> {charInfo.base_def}</div>
                                <div><strong className="text-[var(--color-text-secondary)] capitalize">Ascension:</strong> {(charInfo.ascension_stat || '').replace(/_/g, ' ')}</div>
                            </div>
                        </div>
                    )}
                    {subPage === 'talents' && (
                        <div className="space-y-6">
                            <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)]">
                                <label htmlFor="talentLevel" className="block text-lg font-bold text-white mb-2">Display Talent Level: {displayTalentLevel}</label>
                                <input 
                                    type="range" 
                                    id="talentLevel" 
                                    min="1" 
                                    max="15" 
                                    value={displayTalentLevel}
                                    onChange={(e) => setDisplayTalentLevel(Number(e.target.value))}
                                    className="w-full h-2 bg-[var(--color-border-primary)] rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                                {['All', 'Normal Attack', 'Skill', 'Burst', 'Passive'].map(tabName => (
                                    <TabButton key={tabName} label={tabName} isActive={activeTab === tabName} onClick={() => setActiveTab(tabName)} />
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredTalents.map(talent => (
                                    <TalentCard 
                                        key={talent.name} 
                                        name={talent.name} 
                                        description={talent.description || "No description available."} 
                                        attributes={getTalentAttributes(talent)} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};