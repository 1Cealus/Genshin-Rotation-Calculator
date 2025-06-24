// This file contains all character-specific data.
// - ADDED: `can_be_infused` flag to Alhaitham's Normal and Charged attacks.
// - ADDED: A default `element` property to each talent for damage type calculation.
export const characterData = {
    alhaitham: {
        name: 'Alhaitham',
        weapon_type: 'sword',
        base_atk: 313, base_hp: 13348, base_def: 782,
        element: 'dendro',
        talents: {
            na1: { name: 'NA 1-Hit', scaling_stat: 'atk', scaling_talent: 'na', multiplier: 0.475, element: 'physical', can_be_infused: true },
            na2: { name: 'NA 2-Hit', scaling_stat: 'atk', scaling_talent: 'na', multiplier: 0.485, element: 'physical', can_be_infused: true },
            na3: { name: 'NA 3-Hit', scaling_stat: 'atk', scaling_talent: 'na', multiplier: 0.654, element: 'physical', can_be_infused: true },
            ca: { name: 'Charged Attack', scaling_stat: 'atk', scaling_talent: 'na', multiplier: 1.071, element: 'physical', can_be_infused: true },
            skill_cast: { name: 'Elemental Skill Cast', scaling_stat: 'atk', scaling_talent: 'skill', multiplier: 1.944, element: 'dendro' },
            skill_projection_1: { name: '1 Mirror Projection', scaling_stat: 'atk', scaling_talent: 'skill', multiplier: 0.688, flat_scaling_talent: 'em', flat_multiplier: 1.376, element: 'dendro' },
            skill_projection_2: { name: '2 Mirror Projection', scaling_stat: 'atk', scaling_talent: 'skill', multiplier: 1.376, flat_scaling_talent: 'em', flat_multiplier: 2.752, element: 'dendro' },
            skill_projection_3: { name: '3 Mirror Projection', scaling_stat: 'atk', scaling_talent: 'skill', multiplier: 2.064, flat_scaling_talent: 'em', flat_multiplier: 4.128, element: 'dendro' },
            burst_cast: { name: 'Burst Initial Cast', scaling_stat: 'atk', scaling_talent: 'burst', multiplier: 1.216, element: 'dendro' },
        }
    },
    yelan: {
        name: 'Yelan',
        weapon_type: 'bow',
        base_atk: 244, base_hp: 14450, base_def: 548,
        element: 'hydro',
        talents: {
            na1: { name: 'NA 1-Hit', scaling_stat: 'atk', scaling_talent: 'na', multiplier: 0.403, element: 'physical' },
            skill: { name: 'Elemental Skill', scaling_stat: 'hp', scaling_talent: 'skill', multiplier: 0.38, element: 'hydro' },
            burst: { name: 'Exquisite Throw (per hit)', scaling_stat: 'hp', scaling_talent: 'burst', multiplier: 0.073, element: 'hydro' },
        }
    },
};
