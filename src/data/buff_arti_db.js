// This file contains all artifact set buffs.
// - ADDED: Finale of the Deep Galleries 2pc and 4pc effects.
export const artifactBuffs = {
    gilded_dreams_2pc: {
        name: "2pc Gilded Dreams",
        description: "Elemental Mastery +80.",
        source_type: "artifact_set",
        source_set: 'gilded_dreams',
        effects: { em: 80 }
    },
    deepwood_memories_2pc: {
        name: "2pc Deepwood Memories",
        description: "Dendro DMG Bonus +15%.",
        source_type: "artifact_set",
        source_set: 'deepwood_memories',
        effects: { dendro_dmg_bonus: 0.15 }
    },
    noblesse_oblige_4pc: {
        name: '4pc Noblesse Oblige',
        description: 'After using an Elemental Burst, all party members\' ATK is increased by 20% for 12s. This effect cannot stack.',
        source_type: 'artifact_set',
        source_set: 'noblesse_oblige',
        effects: { atk_percent: 0.20 }
    },
    deepwood_memories_4pc: {
        name: "4pc Deepwood Memories Shred",
        description: "After Elemental Skills or Bursts hit opponents, the targets' Dendro RES will be decreased by 30% for 8s.",
        source_type: "artifact_set",
        source_set: 'deepwood_memories',
        effects: { res_shred_dendro: 0.30 }
    },
    // --- NEW ARTIFACT BUFFS ---
    finale_of_the_deep_galleries_2pc: {
        name: "2pc Finale of the Deep Galleries",
        description: "Cryo DMG Bonus +15%.",
        source_type: "artifact_set",
        source_set: 'finale_of_the_deep_galleries',
        effects: { cryo_dmg_bonus: 0.15 }
    },
    finale_of_the_deep_galleries_4pc_na: {
        name: "4pc Finale... (NA Buff)",
        description: "When at 0 energy, Normal Attack DMG is increased by 60%. This buff is removed for 6s after dealing Burst DMG.",
        source_type: "artifact_set",
        source_set: 'finale_of_the_deep_galleries',
        effects: { normal_attack_dmg_bonus: 0.60 }
    },
    finale_of_the_deep_galleries_4pc_burst: {
        name: "4pc Finale... (Burst Buff)",
        description: "When at 0 energy, Elemental Burst DMG is increased by 60%. This buff is removed for 6s after dealing Normal Attack DMG.",
        source_type: "artifact_set",
        source_set: 'finale_of_the_deep_galleries',
        effects: { burst_dmg_bonus: 0.60 }
    }
};
