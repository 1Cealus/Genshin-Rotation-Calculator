// This file contains all weapon-specific data.
// - ADDED: Weapons for Furina, Mona, Skirk, and Escoffier.
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
    // --- NEW WEAPONS ---
    splendor_of_tranquil_waters: {
        name: 'Splendor of Tranquil Waters',
        type: 'sword',
        base_atk: 542,
        stats: { crit_dmg: 0.882 },
        // Simplified passive for calculation
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
        base_atk: 608,
        stats: { crit_rate: 0.331 },
        refinements: [
            { atk_percent: 0.20 }, { atk_percent: 0.25 }, { atk_percent: 0.30 },
            { atk_percent: 0.35 }, { atk_percent: 0.40 }
        ]
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
    }
};
