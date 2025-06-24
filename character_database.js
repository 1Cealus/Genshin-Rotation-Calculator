// This file contains all character-specific data.
export const characterData = {
    alhaitham: {
        name: 'Alhaitham',
        base_atk: 313, base_hp: 13348, base_def: 782,
        element: 'dendro',
        talents: {
            na1: { name: 'Normal Attack 1-Hit', multiplier: 0.475, scaling_stat: 'atk' },
            ca: { name: 'Charged Attack', multiplier: 1.07, scaling_stat: 'atk' },
            skill_cast: { name: 'Elemental Skill', multiplier: 1.94, scaling_stat: 'atk' },
            skill_mirror: { name: 'Projection Attack (1 Mirror)', multiplier: 0.688, scaling_stat: 'atk' },
            burst_4_hits: { name: 'Elemental Burst (4 Hits)', multiplier: 1.22, scaling_stat: 'atk' },
        }
    },
    kazuha: {
        name: 'Kaedehara Kazuha',
        base_atk: 297, base_hp: 13348, base_def: 807,
        element: 'anemo',
        talents: {
            skill_press: { name: 'Skill (Press)', multiplier: 1.92, scaling_stat: 'atk' },
            skill_plunge: { name: 'Plunging Attack (Midare Ranzan)', multiplier: 2.04, scaling_stat: 'atk' },
            burst_cast: { name: 'Burst (Cast)', multiplier: 2.62, scaling_stat: 'atk' },
        }
    },
    zhongli: {
        name: 'Zhongli',
        base_atk: 251, base_hp: 14695, base_def: 738,
        element: 'geo',
        talents: {
            skill_hold: { name: 'Skill (Hold)', multiplier: 0.8, scaling_stat: 'hp' },
            burst: { name: 'Elemental Burst', multiplier: 4.01, scaling_stat: 'atk' },
        }
    },
    yelan: {
        name: 'Yelan',
        base_atk: 244, base_hp: 14450, base_def: 548,
        element: 'hydro',
        talents: {
            skill: { name: 'Elemental Skill', multiplier: 0.38, scaling_stat: 'hp' },
            burst_hit: { name: 'Exquisite Throw (1 Hit)', multiplier: 0.073, scaling_stat: 'hp' },
        }
    },
};
