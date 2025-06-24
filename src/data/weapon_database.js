// This file contains all weapon-specific data.
// - ADDED: `type` property to each weapon for filtering.
export const weaponData = {
    no_weapon: { 
        name: 'No Weapon', 
        type: 'all', // Can be equipped by anyone
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
    }
};
