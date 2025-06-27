// This file contains all character-specific data.
// - REFACTORED: Skirk's burst bonus is now a data object for the generic formula.
// - ADDED: Skirk's constellation talents.
export const characterData = {
    alhaitham: {
        name: 'Alhaitham',
        alias: ['al', 'haitham'],
        iconUrl: 'https://gensh.honeyhunterworld.com/img/alhatham_078_icon.webp',
        weapon_type: 'sword',
        base_atk: 313, base_hp: 13348, base_def: 782,
        element: 'dendro',
        ascension_stat: 'dendro_dmg_bonus',
        ascension_value: 0.288,
        talents: {
            na1: { name: 'NA 1-Hit', alias: ['n1'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.475, 0.513, 0.552, 0.600, 0.639, 0.687, 0.745, 0.803, 0.860, 0.927, 0.994, 1.060, 1.127, 1.194, 1.261], element: 'physical', can_be_infused: true },
            na2: { name: 'NA 2-Hit', alias: ['n2'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.485, 0.524, 0.563, 0.612, 0.651, 0.700, 0.759, 0.818, 0.877, 0.945, 1.013, 1.081, 1.149, 1.217, 1.285], element: 'physical', can_be_infused: true },
            na3: { name: 'NA 3-Hit', alias: ['n3'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.654, 0.706, 0.759, 0.825, 0.878, 0.942, 1.018, 1.095, 1.171, 1.259, 1.346, 1.432, 1.518, 1.605, 1.691], element: 'physical', can_be_infused: true },
            ca: { name: 'Charged Attack', alias: ['ca'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [1.071, 1.157, 1.244, 1.352, 1.439, 1.549, 1.689, 1.830, 1.971, 2.134, 2.297, 2.460, 2.623, 2.786, 2.949], element: 'physical', can_be_infused: true },
            skill_cast: { name: 'Elemental Skill Cast', alias: ['e'], scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [1.944, 2.089, 2.235, 2.429, 2.575, 2.721, 2.915, 3.109, 3.303, 3.548, 3.792, 4.037, 4.331, 4.625, 4.918], element: 'dendro' },
            skill_projection_1: { name: '1 Mirror Projection', alias: ['p1'], scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [0.688, 0.740, 0.791, 0.860, 0.911, 0.962, 1.032, 1.102, 1.173, 1.259, 1.346, 1.432, 1.518, 1.605, 1.691], flat_scaling_talent: 'em', flat_multipliers: [1.376, 1.480, 1.582, 1.720, 1.822, 1.924, 2.064, 2.204, 2.346, 2.518, 2.692, 2.864, 3.036, 3.209, 3.382], element: 'dendro' },
            skill_projection_2: { name: '2 Mirror Projection', alias: ['p2'], scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [1.376, 1.480, 1.582, 1.720, 1.822, 1.924, 2.064, 2.204, 2.346, 2.518, 2.692, 2.864, 3.036, 3.209, 3.382], flat_scaling_talent: 'em', flat_multipliers: [2.752, 2.960, 3.164, 3.440, 3.644, 3.848, 4.128, 4.408, 4.692, 5.036, 5.384, 5.728, 6.072, 6.418, 6.764], element: 'dendro' },
            skill_projection_3: { name: '3 Mirror Projection', alias: ['p3'], scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [2.064, 2.220, 2.373, 2.580, 2.733, 2.886, 3.096, 3.306, 3.519, 3.777, 4.038, 4.296, 4.554, 4.814, 5.076], flat_scaling_talent: 'em', flat_multipliers: [4.128, 4.440, 4.746, 5.160, 5.466, 5.772, 6.192, 6.612, 7.038, 7.554, 8.076, 8.592, 9.108, 9.628, 10.152], element: 'dendro' },
            burst_cast: { name: 'Burst Initial Cast', alias: ['q'], scaling_stat: 'atk', scaling_talent: 'burst', multipliers: [1.216, 1.307, 1.400, 1.520, 1.612, 1.702, 1.824, 1.946, 2.067, 2.218, 2.368, 2.518, 2.698, 2.878, 3.057], element: 'dendro' },
        }
    },
    yelan: {
        name: 'Yelan',
        alias: ['yelan'],
        iconUrl: 'https://gensh.honeyhunterworld.com/img/yelan_060_icon.webp',
        weapon_type: 'bow',
        base_atk: 244, base_hp: 14450, base_def: 548,
        element: 'hydro',
        ascension_stat: 'crit_rate',
        ascension_value: 0.192,
        talents: {
            na1: { name: 'NA 1-Hit', alias: ['n1'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.403, 0.436, 0.468, 0.509, 0.541, 0.58, 0.627, 0.674, 0.721, 0.777, 0.832, 0.888, 0.943, 1.0, 1.056], element: 'physical' },
            skill: { name: 'Elemental Skill', alias: ['e'], scaling_stat: 'hp', scaling_talent: 'skill', multipliers: [0.228, 0.245, 0.262, 0.285, 0.302, 0.319, 0.342, 0.365, 0.387, 0.415, 0.443, 0.47, 0.503, 0.536, 0.568], element: 'hydro' },
            burst: { name: 'Exquisite Throw (per hit)', alias: ['q'], scaling_stat: 'hp', scaling_talent: 'burst', multipliers: [0.052, 0.056, 0.06, 0.065, 0.069, 0.073, 0.078, 0.083, 0.088, 0.094, 0.1, 0.106, 0.113, 0.119, 0.126], element: 'hydro' },
        }
    },
    furina: {
        name: 'Furina',
        alias: ['furina'],
        iconUrl: 'https://gensh.honeyhunterworld.com/img/furina_089_icon.webp',
        weapon_type: 'sword',
        base_atk: 244, base_hp: 15307, base_def: 621,
        element: 'hydro',
        ascension_stat: 'crit_rate',
        ascension_value: 0.192,
        talents: {
            na1: { name: 'NA 1-Hit', alias: ['n1'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.437, 0.472, 0.508, 0.552, 0.588, 0.632, 0.686, 0.741, 0.796, 0.859, 0.923, 0.986, 1.05, 1.113, 1.176], element: 'physical' },
            ca: { name: 'Charged Attack', alias: ['ca'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.88, 0.95, 1.02, 1.11, 1.18, 1.27, 1.37, 1.48, 1.58, 1.7, 1.82, 1.94, 2.06, 2.18, 2.3], element: 'physical'},
            skill_chevalmarin: { name: 'Salon Member: Chevalmarin', alias: ['e_seahorse', 'e1'], scaling_stat: 'hp', scaling_talent: 'skill', multipliers: [0.055, 0.059, 0.063, 0.069, 0.073, 0.078, 0.084, 0.09, 0.096, 0.103, 0.11, 0.117, 0.125, 0.132, 0.14], element: 'hydro' },
            skill_usher: { name: 'Salon Member: Usher', alias: ['e_usher', 'e2'], scaling_stat: 'hp', scaling_talent: 'skill', multipliers: [0.101, 0.109, 0.117, 0.127, 0.135, 0.144, 0.156, 0.167, 0.179, 0.192, 0.205, 0.218, 0.233, 0.247, 0.262], element: 'hydro' },
            skill_crabaletta: { name: 'Salon Member: Crabaletta', alias: ['e_crab', 'e3'], scaling_stat: 'hp', scaling_talent: 'skill', multipliers: [0.14, 0.151, 0.162, 0.175, 0.186, 0.199, 0.215, 0.23, 0.246, 0.264, 0.281, 0.298, 0.318, 0.337, 0.357], element: 'hydro' },
            burst_cast: { name: 'Burst Cast', alias: ['q'], scaling_stat: 'hp', scaling_talent: 'burst', multipliers: [0.187, 0.201, 0.215, 0.234, 0.248, 0.263, 0.281, 0.299, 0.317, 0.338, 0.359, 0.38, 0.404, 0.428, 0.452], element: 'hydro' },
        }
    },
    mona: {
        name: 'Mona',
        alias: ['mona'],
        iconUrl: 'https://gensh.honeyhunterworld.com/img/mona_041_icon.webp',
        weapon_type: 'catalyst',
        base_atk: 287, base_hp: 10409, base_def: 653,
        element: 'hydro',
        ascension_stat: 'er',
        ascension_value: 0.32,
        talents: {
            na1: { name: 'NA 1-Hit', alias: ['n1'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.378, 0.406, 0.434, 0.472, 0.5, 0.536, 0.582, 0.628, 0.674, 0.728, 0.782, 0.836, 0.89, 0.944, 0.998], element: 'hydro' },
            ca: { name: 'Charged Attack', alias: ['ca'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [1.49, 1.6, 1.71, 1.86, 1.97, 2.11, 2.29, 2.46, 2.64, 2.85, 3.06, 3.26, 3.47, 3.68, 3.89], element: 'hydro'},
            skill_explode: { name: 'Skill Explosion', alias: ['e'], scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [1.32, 1.42, 1.52, 1.65, 1.75, 1.85, 2.0, 2.15, 2.29, 2.46, 2.63, 2.8, 2.99, 3.17, 3.35], element: 'hydro' },
            burst_bubble: { name: 'Burst Bubble Explosion', alias: ['q'], scaling_stat: 'atk', scaling_talent: 'burst', multipliers: [4.42, 4.75, 5.08, 5.53, 5.86, 6.19, 6.63, 7.07, 7.51, 8.06, 8.6, 9.15, 9.79, 10.43, 11.07], element: 'hydro' },
        }
    },
    skirk: {
        name: 'Skirk',
        alias: ['skirk'],
        iconUrl: 'https://gensh.honeyhunterworld.com/img/skirknew_114_icon.webp',
        weapon_type: 'sword',
        base_atk: 342, base_hp: 14695, base_def: 799,
        element: 'cryo',
        ascension_stat: 'crit_dmg',
        ascension_value: 0.384,
        talents: {
            na1: { name: 'Normal Attack: 1-Hit', alias: ['n1'], description: 'First Hit of Skirks Normal Attack', scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.5, 0.54, 0.58, 0.63, 0.67, 0.71, 0.77, 0.83, 0.89, 0.95, 1.01, 1.08, 1.15, 1.22, 1.29], element: 'physical' },
            ca: { name: 'Normal Attack: CA', alias: ['ca'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [1.3, 1.4, 1.5, 1.65, 1.75, 1.86, 2.01, 2.17, 2.32, 2.5, 2.67, 2.84, 3.03, 3.21, 3.4], element: 'physical' },
            skill_cast: { name: 'Skill Cast (Havoc: Warp)', alias: ['e'], scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], element: 'cryo' },
            skill_na1: { name: 'Seven-Phase Flash: 1-Hit', alias: ['s1'], scaling_stat: 'atk', scaling_talent: 'skill', applies_talent_type_bonus: 'na', multipliers: [1.328, 1.428, 1.527, 1.66, 1.758, 1.859, 1.992, 2.125, 2.258, 2.424, 2.59, 2.756, 2.922, 3.088, 3.254], element: 'cryo'},
            skill_na2: { name: 'Seven-Phase Flash: 2-Hit', alias: ['s2'], scaling_stat: 'atk', scaling_talent: 'skill', applies_talent_type_bonus: 'na', multipliers: [1.198, 1.288, 1.378, 1.498, 1.587, 1.677, 1.797, 1.917, 2.036, 2.186, 2.336, 2.486, 2.635, 2.785, 2.935], element: 'cryo'},
            skill_na3a: { name: 'Seven-Phase Flash: 3-Hit (1/2)', alias: ['s3a'], scaling_stat: 'atk', scaling_talent: 'skill', applies_talent_type_bonus: 'na', multipliers: [0.757, 0.814, 0.871, 0.946, 1.003, 1.06, 1.136, 1.211, 1.287, 1.381, 1.475, 1.57, 1.664, 1.758, 1.853], element: 'cryo'},
            skill_na3b: { name: 'Seven-Phase Flash: 3-Hit (2/2)', alias: ['s3b'], scaling_stat: 'atk', scaling_talent: 'skill', applies_talent_type_bonus: 'na', multipliers: [0.757, 0.814, 0.871, 0.946, 1.003, 1.06, 1.136, 1.211, 1.287, 1.381, 1.475, 1.57, 1.664, 1.758, 1.853], element: 'cryo'},
            skill_na4a: { name: 'Seven-Phase Flash: 4-Hit (1/2)', alias: ['s4a'], scaling_stat: 'atk', scaling_talent: 'skill', applies_talent_type_bonus: 'na', multipliers: [0.805, 0.865, 0.926, 1.006, 1.067, 1.127, 1.208, 1.288, 1.369, 1.469, 1.57, 1.67, 1.771, 1.871, 1.972], element: 'cryo'},
            skill_na4b: { name: 'Seven-Phase Flash: 4-Hit (2/2)', alias: ['s4b'], scaling_stat: 'atk', scaling_talent: 'skill', applies_talent_type_bonus: 'na', multipliers: [0.805, 0.865, 0.926, 1.006, 1.067, 1.127, 1.208, 1.288, 1.369, 1.469, 1.57, 1.67, 1.771, 1.871, 1.972], element: 'cryo'},
            skill_na5: { name: 'Seven-Phase Flash: 5-Hit', alias: ['s5'], scaling_stat: 'atk', scaling_talent: 'skill', applies_talent_type_bonus: 'na', multipliers: [1.966, 2.113, 2.261, 2.458, 2.605, 2.752, 2.949, 3.146, 3.342, 3.588, 3.834, 4.08, 4.326, 4.572, 4.818], element: 'cryo'},
            skill_ca: { name: 'Seven-Phase Flash: CA', alias: ['sca'], scaling_stat: 'atk', scaling_talent: 'skill', applies_talent_type_bonus: 'na', multipliers: [0.445, 0.478, 0.512, 0.556, 0.59, 0.623, 0.668, 0.712, 0.757, 0.812, 0.868, 0.923, 0.979, 1.034, 1.09], element: 'cryo'},
            burst_ruin_slash: { 
                name: 'Havoc: Ruin (Slash)', alias: ['q_ruin_slash'], scaling_stat: 'atk', scaling_talent: 'burst', 
                multipliers: [2.21, 2.37, 2.54, 2.76, 2.93, 3.1, 3.32, 3.54, 3.76, 4.03, 4.3, 4.57, 4.89, 5.21, 5.53], 
                additive_mv_bonus_per_point: {
                    scaling: [0.3478, 0.3739, 0.40, 0.4348, 0.4626, 0.4904, 0.5256, 0.5608, 0.596, 0.6402, 0.6844, 0.7286, 0.782, 0.8354, 0.8888],
                    max_points: 12,
                    constellation_mods: [{ con: 2, type: 'replace', value: 22 }]
                },
                element: 'cryo' 
            },
            burst_ruin_final_slash: { name: 'Havoc: Ruin (Final)', alias: ['q_ruin_final'], scaling_stat: 'atk', scaling_talent: 'burst', multipliers: [3.683, 3.959, 4.235, 4.603, 4.89, 5.177, 5.545, 5.913, 6.281, 6.74, 7.199, 7.658, 8.209, 8.76, 9.311], element: 'cryo' },
            burst_extinction_cast: { name: 'Havoc: Extinction', alias: ['q_extinction'], scaling_stat: 'atk', scaling_talent: 'burst', multipliers: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], rift_bonus: [0.08, 0.12, 0.16, 0.20], element: 'cryo' },
            a4_passive: { name: "Death's Crossing", alias: ['a4'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
            c1_crystal_blade: { name: "C1: Crystal Blade", alias: ['c1'], scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0], element: 'cryo' },
            c6_havoc_sever_ruin: { name: "C6: Havoc Sever (Ruin)", alias: ['c6_ruin'], scaling_stat: 'atk', scaling_talent: 'burst', multipliers: [7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5], element: 'cryo' },
            c6_havoc_sever_na: { name: "C6: Havoc Sever (NA)", alias: ['c6_na'], scaling_stat: 'atk', scaling_talent: 'skill', applies_talent_type_bonus: 'na', multipliers: [1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8], element: 'cryo' },
        }
    },
    escoffier: {
        name: 'Escoffier',
        alias: ['escoffier'],
        iconUrl: 'https://gensh.honeyhunterworld.com/img/escoffier_112_icon.webp',
        weapon_type: 'polearm',
        base_atk: 347, base_hp: 13348, base_def: 731,
        element: 'cryo',
        ascension_stat: 'crit_rate',
        ascension_value: 0.192,
        talents: {
            na1: { name: 'NA 1-Hit', alias: ['n1'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0.45, 0.48, 0.52, 0.56, 0.6, 0.64, 0.69, 0.74, 0.79, 0.84, 0.9, 0.96, 1.02, 1.08, 1.14], element: 'physical' },
            skill_mek: { name: 'Cooking Mek Damage', alias: ['e'], scaling_stat: 'atk', scaling_talent: 'skill', multipliers: [0.8, 0.86, 0.92, 1.0, 1.06, 1.12, 1.2, 1.28, 1.36, 1.45, 1.55, 1.64, 1.75, 1.85, 1.96], element: 'cryo' },
            burst_cast: { name: 'Burst Cast', alias: ['q'], scaling_stat: 'atk', scaling_talent: 'burst', multipliers: [3.0, 3.23, 3.45, 3.75, 3.98, 4.2, 4.5, 4.8, 5.1, 5.48, 5.85, 6.23, 6.6, 6.98, 7.35], element: 'cryo' },
            a1_passive: { name: "RES Shred", alias: ['a1'], scaling_stat: 'atk', scaling_talent: 'na', multipliers: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
        }
    },
};
