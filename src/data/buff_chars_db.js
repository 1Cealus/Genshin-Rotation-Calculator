// This file contains all character-specific buffs (talents, etc.)
// - REFACTORED: Furina's C1/C2 logic is now data-driven via constellation_mods.
import { characterData } from "./character_database";

export const characterBuffs = {
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
    skirk_deaths_crossing: {
        name: "Skirk: Death's Crossing",
        description: "Each \"Death's Crossing\" stack increases the DMG of Seven-Phase Flash and Havoc: Ruin.",
        source_type: 'character',
        source_character: 'skirk',
        stackable: { max_stacks: 3, },
        dynamic_effects: {
            type: 'final_damage_multiplier',
            talent_keys: ['skill_na1', 'skill_na2', 'skill_na3a', 'skill_na3b', 'skill_na4a', 'skill_na4b', 'skill_na5', 'skill_ca'],
            burst_talent_keys: ['burst_ruin_slash', 'burst_ruin_final_slash'],
            values: [1.1, 1.2, 1.7],
            burst_values: [1.05, 1.15, 1.6]
        }
    },
    skirk_c4_atk_bonus: {
        name: "Skirk C4: ATK Bonus",
        description: "Each Death's Crossing stack also increases Skirk's ATK.",
        source_type: 'character',
        source_character: 'skirk',
        constellation: 4,
        dynamic_effects: {
            type: 'stacking_stat_bonus',
            buff_to_check: 'skirk_deaths_crossing',
            stat: 'atk_percent',
            values: [0.10, 0.20, 0.40] // Bonus for 1, 2, 3 stacks
        }
    },
    skirk_all_shall_wither: {
        name: "Skirk: All Shall Wither",
        description: "Increases Normal Attack damage based on Void Rifts absorbed during Havoc: Extinction.",
        source_type: 'character',
        source_character: 'skirk',
        stackable: { max_stacks: 3 },
        applies_to_talent_type_bonus: 'na',
        flat_damage_calculation: (totalStats, config, characterBuild, buffState) => {
            const riftsAbsorbed = buffState.stacks || 0;
            const talentInfo = characterData.skirk.talents.burst_extinction_cast;
            if (!talentInfo?.rift_bonus) return 0;
            const riftBonusMultipliers = talentInfo.rift_bonus;
            const riftBonusMultiplier = riftBonusMultipliers[riftsAbsorbed] || 0;
            return riftBonusMultiplier * totalStats.atk;
        }
    },
    escoffier_res_shred: {
        name: "Escoffier: RES Shred",
        description: "Decreases opponents' RES based on the number of Cryo/Hydro characters in the party.",
        source_type: 'character',
        source_character: 'escoffier',
        dynamic_effects: {
            type: 'team_composition',
            elements: ['cryo', 'hydro'],
            effect: 'all_res_shred',
            values: [0.05, 0.10, 0.15, 0.55]
        }
    },
    mona_omen: {
        name: "Mona: Stellaris Phantasm (Omen)",
        description: "Applies Omen to enemies, increasing the DMG they take based on Mona's Burst talent level.",
        source_type: 'character',
        source_character: 'mona',
        dynamic_effects: {
            type: 'talent_level_based_stat',
            talent: 'burst',
            stat: 'all_dmg_bonus',
            values: [0.42, 0.452, 0.483, 0.525, 0.557, 0.588, 0.63, 0.672, 0.714, 0.756, 0.808, 0.861, 0.924, 0.987, 1.05]
        }
    },
    furina_fanfare: {
        name: "Furina: Let the People Rejoice",
        description: "Increases DMG dealt by all party members based on the number of Fanfare stacks. Max stacks is 300 (400 at C1).",
        source_type: 'character',
        source_character: 'furina',
        stackable: { max_stacks: 300 },
        constellation_mods: [
            { con: 1, stat: 'max_stacks', value: 100, type: 'add' },
            { con: 2, stat: 'stack_effectiveness', value: 2.5, type: 'multiply' }
        ],
        dynamic_effects: {
            type: 'talent_level_stacking_stat',
            talent: 'burst',
            stat: 'all_dmg_bonus',
            values: [ 0.0007, 0.0008, 0.0009, 0.0010, 0.0011, 0.0012, 0.0014, 0.0016, 0.0018, 0.0020, 0.0022, 0.0025, 0.0028 ]
        }
    },
};
