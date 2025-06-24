// This file defines all artifact sets and their bonuses.
export const artifactSets = {
    // Note: An empty set is provided for placeholder slots.
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
    // Add other artifact sets here...
};
