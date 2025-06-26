// This file contains all weapon-specific data.
// - CORRECTED: Azurelight implementation.
export const weaponData = {
    no_weapon: { 
        name: 'No Weapon', 
        type: 'all',
        base_atk: 0, 
        stats: {}, 
        refinements: [{}, {}, {}, {}, {}] 
    },
    serpent_spine: {
        name: 'Serpent Spine', 
        type: 'claymore',
        base_atk: 510, 
        stats: { crit_rate: 0.276 },
        refinements: [
            { all_dmg_bonus: 0.06 }, { all_dmg_bonus: 0.07 }, { all_dmg_bonus: 0.08 },
            { all_dmg_bonus: 0.09 }, { all_dmg_bonus: 0.10 }
        ]
    },
    light_of_foliar_incision: { 
        name: 'Light of Foliar Incision', 
        type: 'sword',
        base_atk: 542, 
        stats: { crit_dmg: 0.882 },
        refinements: [{}] 
    },
    favonius_lance: {
        name: 'Favonius Lance',
        type: 'polearm',
        base_atk: 565,
        stats: { er: 0.306 },
        refinements: [{}]
    },
    aqua_simulacra: {
        name: 'Aqua Simulacra',
        type: 'bow',
        base_atk: 542,
        stats: { crit_dmg: 0.882 },
        refinements: [{}]
    },
    splendor_of_tranquil_waters: {
        name: 'Splendor of Tranquil Waters',
        type: 'sword',
        base_atk: 542,
        stats: { crit_dmg: 0.882 },
        refinements: [
            { skill_dmg_bonus: 0.08 }, { skill_dmg_bonus: 0.1 }, { skill_dmg_bonus: 0.12 },
            { skill_dmg_bonus: 0.14 }, { skill_dmg_bonus: 0.16 }
        ]
    },
    skyward_atlas: {
        name: 'Skyward Atlas',
        type: 'catalyst',
        base_atk: 674,
        stats: { atk_percent: 0.331 },
        refinements: [
            { all_dmg_bonus: 0.12 }, { all_dmg_bonus: 0.15 }, { all_dmg_bonus: 0.18 },
            { all_dmg_bonus: 0.21 }, { all_dmg_bonus: 0.24 }
        ]
    },
    azurelight: {
        name: 'Azurelight',
        type: 'sword',
        base_atk: 674, // Corrected Base ATK
        stats: { crit_rate: 0.221 }, // Corrected Substat
        // The passive is now implemented as selectable buffs, not direct stats.
        refinements: [{}, {}, {}, {}, {}] 
    },
    seasoned_symphony: {
        name: 'Seasoned Symphony',
        type: 'polearm',
        base_atk: 608,
        stats: { atk_percent: 0.496 },
        refinements: [
            { atk_percent: 0.12 }, { atk_percent: 0.15 }, { atk_percent: 0.18 },
            { atk_percent: 0.21 }, { atk_percent: 0.24 }
        ]
    },
    festering_desire: {
        name: 'Festering Desire',
        type: 'sword',
        base_atk: 510,
        stats: { er: 0.459 },
        refinements: [
            { skill_dmg_bonus: 0.16, skill_crit_rate: 0.06 },
            { skill_dmg_bonus: 0.20, skill_crit_rate: 0.075 },
            { skill_dmg_bonus: 0.24, skill_crit_rate: 0.09 },
            { skill_dmg_bonus: 0.28, skill_crit_rate: 0.105 },
            { skill_dmg_bonus: 0.32, skill_crit_rate: 0.12 }
        ]
    },
    thrilling_tales_of_dragon_slayers: {
        name: 'Thrilling Tales of Dragon Slayers',
        type: 'catalyst',
        base_atk: 401,
        stats: { hp_percent: 0.352 },
        refinements: [{}, {}, {}, {}, {}] 
    }
};
