// This file defines all artifact sets and their bonuses.
// - ADDED: Finale of the Deep Galleries set information.
export const artifactSets = {
    no_set: {
        name: 'No Set',
        bonuses: {},
    },
    gilded_dreams: {
        name: 'Gilded Dreams',
        bonuses: {
            2: { description: "Elemental Mastery +80" },
            4: { description: "After triggering a Reaction, grants ATK or EM based on team's elemental types." }
        }
    },
    deepwood_memories: {
        name: 'Deepwood Memories',
        bonuses: {
            2: { description: "Dendro DMG Bonus +15%" },
            4: { description: "After Elemental Skills or Bursts hit opponents, the targets' Dendro RES will be decreased by 30% for 8s." }
        }
    },
    finale_of_the_deep_galleries: {
        name: 'Finale of the Deep Galleries',
        bonuses: {
            2: { description: "Cryo DMG Bonus +15%" },
            4: { description: "When at 0 Energy, Normal/Burst DMG is increased by 60%. This effect changes based on the last ability used." }
        }
    },
};
