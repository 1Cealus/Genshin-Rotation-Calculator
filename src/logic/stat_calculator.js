// This file now contains ONLY the logic for calculating total stats.
import { buffData } from '../data/buff_database.js';
import { mainStatValues } from '../data/main_stat_values.js';

export function calculateTotalStats(state) {
    const { character, weapon, characterBuild, team, characterBuilds } = state;
    if (!character || !weapon || !characterBuild) {
        return {}; // Return empty object if essential data is missing
    }
    
    const baseStats = { atk: character.base_atk + weapon.base_atk, hp: character.base_hp, def: character.base_def };
    const bonuses = {};

    const addBonus = (stat, value) => {
        bonuses[stat] = (bonuses[stat] || 0) + value;
    };

    // 1. Weapon Stats
    for (const key in weapon.stats) addBonus(key, weapon.stats[key]);
    const weaponRefinement = weapon.refinements[characterBuild.weapon.refinement - 1] || {};
    if (weaponRefinement.effects) {
        for (const key in weaponRefinement.effects) addBonus(key, weaponRefinement.effects[key]);
    }

    // 2. Artifact Main Stats
    Object.values(characterBuild.artifacts).forEach(piece => {
        if (piece && piece.mainStat && mainStatValues[piece.mainStat]) {
            addBonus(piece.mainStat, mainStatValues[piece.mainStat]);
        }
    });

    // 3. Artifact Substats
    Object.values(characterBuild.artifacts).forEach(piece => {
        if (piece && piece.substats) {
            for (const key in piece.substats) addBonus(key, piece.substats[key]);
        }
    });

    // 4. Artifact Set Bonuses
    const { set_2pc, set_4pc } = characterBuild.artifacts;
    if (set_4pc !== 'no_set') {
        if (buffData[`${set_4pc}_2pc`]) for (const key in buffData[`${set_4pc}_2pc`].effects) addBonus(key, buffData[`${set_4pc}_2pc`].effects[key]);
        if (buffData[`${set_4pc}_4pc`]) for (const key in buffData[`${set_4pc}_4pc`].effects) addBonus(key, buffData[`${set_4pc}_4pc`].effects[key]);
    } else if (set_2pc !== 'no_set') {
         if (buffData[`${set_2pc}_2pc`]) for (const key in buffData[`${set_2pc}_2pc`].effects) addBonus(key, buffData[`${set_2pc}_2pc`].effects[key]);
    }

    // 5. Active Action-Specific Buffs (passed in for damage formula, not for stat display)
    if (state.activeBuffs) {
        Object.entries(state.activeBuffs).forEach(([key, buffState]) => {
            if (!buffState.active) return;
            const buffDef = buffData[key];
            if (buffDef.effects) {
                for (const stat in buffDef.effects) addBonus(stat, buffDef.effects[stat]);
            }
            if (buffDef.stackable) {
                const effectPerStack = buffDef.stackable.is_weapon_passive ? weaponRefinement : (buffDef.stackable.effects || {});
                for (const stat in effectPerStack) {
                    addBonus(stat, effectPerStack[stat] * buffState.stacks);
                }
            }
        });
    }

    // 6. Constellation Effects
    // This section checks for constellation effects from teammates that might affect the active character
    if (team && characterBuilds) {
        team.forEach(charKey => {
            if (!charKey) return;
            const teammateBuild = characterBuilds[charKey];
            if (!teammateBuild) return;

            // Example: Yelan C4 increases party members' Max HP
            if (charKey === 'yelan' && teammateBuild.constellation >= 4) {
                 // Note: This is a simplified implementation. The actual buff depends on stacks from her E.
                 // For now, we'll assume a certain number of stacks for demonstration.
                 // A more advanced implementation would track these stacks in the rotation state.
                 const yelanC4Stacks = 4; // Assuming max stacks for simplicity
                 addBonus('hp_percent', 0.10 * yelanC4Stacks);
            }
        });
    }


    // Calculate final stats
    const finalStats = {};
    finalStats.hp = baseStats.hp * (1 + (bonuses.hp_percent || 0)) + (bonuses.hp_flat || 0);
    finalStats.atk = baseStats.atk * (1 + (bonuses.atk_percent || 0)) + (bonuses.flat_atk || 0);
    finalStats.def = baseStats.def * (1 + (bonuses.def_percent || 0)) + (bonuses.flat_def || 0);
    
    // Copy remaining bonuses
    for (const key in bonuses) {
        if (!['atk_percent', 'flat_atk', 'hp_percent', 'hp_flat', 'def_percent', 'flat_def'].includes(key)) {
            finalStats[key] = (finalStats[key] || 0) + bonuses[key];
        }
    }
    
    // Add base character stats that are always present
    finalStats.crit_rate = (finalStats.crit_rate || 0) + 0.05;
    finalStats.crit_dmg = (finalStats.crit_dmg || 0) + 0.50;
    finalStats.er = (finalStats.er || 0) + 1.0;

    return finalStats;
}
