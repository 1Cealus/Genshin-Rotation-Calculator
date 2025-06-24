// This file contains all buff and debuff data.
// - ADDED: `source_set` to link artifact buffs to their set.
export const buffData = {
    // Weapon Buffs
    serpent_spine_stacks: {
        name: 'Serpent Spine Stacks',
        description: 'For every 4s a character is on the field, they will deal 6/7/8/9/10% more DMG and take 3/2.7/2.4/2.1/1.8% more DMG. This effect has a maximum of 5 stacks.',
        source_type: 'weapon',
        source_weapon: 'serpent_spine', 
        stackable: { max_stacks: 5, is_weapon_passive: true }
    },

    // Character Buffs
    zhongli_shield: { 
        name: 'Zhongli Shield', 
        description: 'Characters protected by the Jade Shield will decrease the Elemental RES and Physical RES of opponents in a small AoE by 20%.',
        source_type: 'character', 
        source_character: 'zhongli',
        effects: { all_res_shred: 0.20 } 
    },
    yelan_a4: {
        name: 'Yelan A4',
        description: 'So long as an Exquisite Throw is in play, your own active character deals 1% more DMG. This increases by a further 3.5% DMG every second. The maximum increase to DMG dealt is 50%.',
        source_type: 'character',
        source_character: 'yelan',
        effects: { all_dmg_bonus: 0.50 } 
    },

    // Artifact Set Buffs
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
};
