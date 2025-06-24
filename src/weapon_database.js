// This file contains all weapon-specific data.
// - Weapons now have a 'refinements' array to store passive effects for R1-R5.
export const weaponData = {
    no_weapon: { 
        name: 'No Weapon', 
        base_atk: 0, 
        stats: {}, 
        refinements: [{}, {}, {}, {}, {}] 
    },
    serpent_spine: {
        name: 'Serpent Spine', 
        base_atk: 510, 
        stats: { crit_rate: 0.276 },
        refinements: [
            { all_dmg_bonus: 0.06 }, // R1
            { all_dmg_bonus: 0.07 }, // R2
            { all_dmg_bonus: 0.08 }, // R3
            { all_dmg_bonus: 0.09 }, // R4
            { all_dmg_bonus: 0.10 }  // R5
        ]
    },
    light_of_foliar_incision: { 
        name: 'Light of Foliar Incision', 
        base_atk: 542, 
        stats: { crit_dmg: 0.882 },
        refinements: [{}, {}, {}, {}, {}] // Example for non-scaling passive
    },
    // Add other weapons here...
};
