// This file contains all character-specific data.
// - Talent multipliers are now arrays representing levels 1-10.
// - Talents are grouped by 'na', 'skill', and 'burst'.
export const characterData = {
    alhaitham: {
        name: 'Alhaitham',
        base_atk: 313, base_hp: 13348, base_def: 782,
        element: 'dendro',
        talents: {
            na: { name: 'Normal Attack', scaling_stat: 'atk', multipliers: [0.475, 0.513, 0.552, 0.607, 0.645, 0.694, 0.758, 0.823, 0.887, 0.959, 1.03, 1.11, 1.19, 1.27, 1.35] },
            skill: { name: 'Elemental Skill', scaling_stat: 'atk', multipliers: [1.94, 2.08, 2.23, 2.42, 2.57, 2.71, 2.9, 3.09, 3.28, 3.48, 3.67, 3.87, 4.11, 4.36, 4.6] },
            burst: { name: 'Elemental Burst (per hit)', scaling_stat: 'atk', multipliers: [1.22, 1.31, 1.4, 1.52, 1.62, 1.71, 1.84, 1.97, 2.1, 2.23, 2.36, 2.49, 2.65, 2.81, 2.98] },
        }
    },
    yelan: {
        name: 'Yelan',
        base_atk: 244, base_hp: 14450, base_def: 548,
        element: 'hydro',
        talents: {
            na: { name: 'Normal Attack', scaling_stat: 'atk', multipliers: [0.4, 0.38, 0.48, 0.32, 0.34, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85] },
            skill: { name: 'Elemental Skill', scaling_stat: 'hp', multipliers: [0.38, 0.41, 0.43, 0.48, 0.5, 0.53, 0.58, 0.62, 0.66, 0.7, 0.74, 0.78, 0.83, 0.88, 0.93] },
            burst: { name: 'Exquisite Throw (per hit)', scaling_stat: 'hp', multipliers: [0.073, 0.078, 0.083, 0.091, 0.096, 0.101, 0.11, 0.118, 0.126, 0.134, 0.142, 0.15, 0.159, 0.168, 0.177] },
        }
    },
    // Add other characters here...
};
