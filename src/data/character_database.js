// This file contains all character-specific data.
// - UPDATED: Talent multipliers are now arrays representing levels 1-15.
// - ADDED: `can_be_infused` flag to Alhaitham's Normal and Charged attacks.
// - ADDED: A default `element` property to each talent for damage type calculation.
export const characterData = {
    alhaitham: {
        name: 'Alhaitham',
        weapon_type: 'sword',
        base_atk: 313, base_hp: 13348, base_def: 782,
        element: 'dendro',
        talents: {
            na1: { name: 'NA 1-Hit', scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.475, 0.513, 0.552, 0.600, 0.639, 0.687, 0.745, 0.803, 0.860, 0.927, 0.994, 1.060, 1.127, 1.194, 1.261], element: 'physical', can_be_infused: true },
            na2: { name: 'NA 2-Hit', scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.485, 0.524, 0.563, 0.612, 0.651, 0.700, 0.759, 0.818, 0.877, 0.945, 1.013, 1.081, 1.149, 1.217, 1.285], element: 'physical', can_be_infused: true },
            na3: { name: 'NA 3-Hit', scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.654, 0.706, 0.759, 0.825, 0.878, 0.942, 1.018, 1.095, 1.171, 1.259, 1.346, 1.432, 1.518, 1.605, 1.691], element: 'physical', can_be_infused: true },
            ca: { name: 'Charged Attack', scaling_stat: 'atk', scaling_talent: 'na', multipliers: [1.071, 1.157, 1.244, 1.352, 1.439, 1.549, 1.689, 1.830, 1.971, 2.134, 2.297, 2.460, 2.623, 2.786, 2.949], element: 'physical', can_be_infused: true },
            skill_cast: { name: 'Elemental Skill Cast', scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [1.944, 2.089, 2.235, 2.429, 2.575, 2.721, 2.915, 3.109, 3.303, 3.548, 3.792, 4.037, 4.331, 4.625, 4.918], element: 'dendro' },
            skill_projection_1: { name: '1 Mirror Projection', scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [0.688, 0.740, 0.791, 0.860, 0.911, 0.962, 1.032, 1.102, 1.173, 1.259, 1.346, 1.432, 1.518, 1.605, 1.691], flat_scaling_talent: 'em', flat_multipliers: [1.376, 1.480, 1.582, 1.720, 1.822, 1.924, 2.064, 2.204, 2.346, 2.518, 2.692, 2.864, 3.036, 3.209, 3.382], element: 'dendro' },
            skill_projection_2: { name: '2 Mirror Projection', scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [1.376, 1.480, 1.582, 1.720, 1.822, 1.924, 2.064, 2.204, 2.346, 2.518, 2.692, 2.864, 3.036, 3.209, 3.382], flat_scaling_talent: 'em', flat_multipliers: [2.752, 2.960, 3.164, 3.440, 3.644, 3.848, 4.128, 4.408, 4.692, 5.036, 5.384, 5.728, 6.072, 6.418, 6.764], element: 'dendro' },
            skill_projection_3: { name: '3 Mirror Projection', scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [2.064, 2.220, 2.373, 2.580, 2.733, 2.886, 3.096, 3.306, 3.519, 3.777, 4.038, 4.296, 4.554, 4.814, 5.076], flat_scaling_talent: 'em', flat_multipliers: [4.128, 4.440, 4.746, 5.160, 5.466, 5.772, 6.192, 6.612, 7.038, 7.554, 8.076, 8.592, 9.108, 9.628, 10.152], element: 'dendro' },
            burst_cast: { name: 'Burst Initial Cast', scaling_stat: 'atk', scaling_talent: 'burst', multipliers: [1.216, 1.307, 1.400, 1.520, 1.612, 1.702, 1.824, 1.946, 2.067, 2.218, 2.368, 2.518, 2.698, 2.878, 3.057], element: 'dendro' },
        }
    },
    yelan: {
        name: 'Yelan',
        weapon_type: 'bow',
        base_atk: 244, base_hp: 14450, base_def: 548,
        element: 'hydro',
        talents: {
            na1: { name: 'NA 1-Hit', scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.403, 0.436, 0.468, 0.509, 0.541, 0.58, 0.627, 0.674, 0.721, 0.777, 0.832, 0.888, 0.943, 1.0, 1.056], element: 'physical' },
            skill: { name: 'Elemental Skill', scaling_stat: 'hp', scaling_talent: 'skill', multipliers: [0.228, 0.245, 0.262, 0.285, 0.302, 0.319, 0.342, 0.365, 0.387, 0.415, 0.443, 0.47, 0.503, 0.536, 0.568], element: 'hydro' },
            burst: { name: 'Exquisite Throw (per hit)', scaling_stat: 'hp', scaling_talent: 'burst', multipliers: [0.052, 0.056, 0.06, 0.065, 0.069, 0.073, 0.078, 0.083, 0.088, 0.094, 0.1, 0.106, 0.113, 0.119, 0.126], element: 'hydro' },
        }
    },
};
