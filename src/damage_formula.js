// This file contains the updated core damage calculation logic.
import { buffData } from './buff_database.js';
import { weaponData } from './weapon_database.js';

export function calculateFinalDamage(state) {
    // 1. STAT AGGREGATION
    let finalStats = { flat_atk: 0, atk_percent: 0, flat_hp: 0, hp_percent: 0, flat_def: 0, def_percent: 0, crit_rate: 0.05, crit_dmg: 0.50, em: 0, er: 1.0, reaction_bonus: 0, pyro_dmg_bonus: 0, hydro_dmg_bonus: 0, cryo_dmg_bonus: 0, electro_dmg_bonus: 0, anemo_dmg_bonus: 0, geo_dmg_bonus: 0, dendro_dmg_bonus: 0, physical_dmg_bonus: 0, all_dmg_bonus: 0, def_shred: 0, all_res_shred: 0 };
    
    const weaponRefinement = state.weapon.refinements[state.characterBuild.weapon.refinement - 1] || {};
    const sources = [state.characterBuild.stats, state.weapon.stats, weaponRefinement.effects];

    Object.entries(state.activeBuffs).forEach(([key, buffState]) => {
        if (!buffState.active) return;
        const buffDef = buffData[key];
        if (buffDef.effects) {
            sources.push(buffDef.effects);
        }
        if (buffDef.stackable) {
            let effectPerStack;
            if (buffDef.stackable.is_weapon_passive) {
                effectPerStack = weaponRefinement;
            } else {
                effectPerStack = buffDef.stackable.effects;
            }
            if (effectPerStack) {
                const stackedEffect = {};
                for (const stat in effectPerStack) {
                    stackedEffect[stat] = (stackedEffect[stat] || 0) + effectPerStack[stat] * buffState.stacks;
                }
                sources.push(stackedEffect);
            }
        }
    });

    sources.forEach(source => {
        if (!source) return;
        for (const key in source) {
            finalStats[key] = (finalStats[key] || 0) + source[key];
        }
    });

    const totalStats = {
        atk: (state.character.base_atk + state.weapon.base_atk) * (1 + finalStats.atk_percent) + finalStats.flat_atk,
        hp: state.character.base_hp * (1 + finalStats.hp_percent) + finalStats.flat_hp,
        def: state.character.base_def * (1 + finalStats.def_percent) + finalStats.flat_def,
        em: finalStats.em
    };

    // 2. BASE DAMAGE CALCULATION
    const talentInfo = state.talent;
    const talentLevel = state.characterBuild.talentLevels[state.talentKey] || 1;
    const multiplier = talentInfo.multipliers[talentLevel - 1];

    let baseDamage = 0;
    if (talentInfo.scaling_stat === 'atk') baseDamage = multiplier * totalStats.atk;
    else if (talentInfo.scaling_stat === 'hp') baseDamage = multiplier * totalStats.hp;
    else if (talentInfo.scaling_stat === 'def') baseDamage = multiplier * totalStats.def;

    // 3. ADDITIVE REACTIONS (Quicken, Spread, Aggravate)
    let additiveBaseDamage = 0;
    const levelMultiplier = 1446.85; // For Level 90
    if (state.reactionType === 'aggravate') {
        additiveBaseDamage = 1.15 * levelMultiplier * (1 + (5 * totalStats.em) / (1200 + totalStats.em) + finalStats.reaction_bonus);
    } else if (state.reactionType === 'spread') {
        additiveBaseDamage = 1.25 * levelMultiplier * (1 + (5 * totalStats.em) / (1200 + totalStats.em) + finalStats.reaction_bonus);
    }
    const outgoingDamage = baseDamage + additiveBaseDamage;

    // 4. MULTIPLIERS
    const damageType = state.character.element;
    const elementalDmgBonus = finalStats[`${damageType}_dmg_bonus`] || 0;
    const damageBonusMultiplier = 1 + elementalDmgBonus + finalStats.all_dmg_bonus + (damageType === 'physical' ? finalStats.physical_dmg_bonus : 0);

    const critRate = Math.max(0, Math.min(1, finalStats.crit_rate));
    const critMultiplier = 1 + finalStats.crit_dmg;

    const enemyDefMultiplier = (state.characterBuild.level + 100) / ((state.characterBuild.level + 100) + (state.enemy.level + 100) * (1 - finalStats.def_shred));

    const resShred = (finalStats.all_res_shred || 0) + (finalStats[`res_shred_${damageType}`] || 0);
    let finalEnemyRes = state.enemy.base_res[damageType] - resShred;
    let enemyResMultiplier = finalEnemyRes < 0 ? 1 - (finalEnemyRes / 2) : (finalEnemyRes >= 0.75 ? 1 / (4 * finalEnemyRes + 1) : 1 - finalEnemyRes);

    let amplifyingReactionMultiplier = 1;
    if (['vaporize_1.5', 'vaporize_2.0', 'melt_1.5', 'melt_2.0'].includes(state.reactionType)) {
        const baseMult = parseFloat(state.reactionType.split('_')[1]);
        const vapeMeltBonus = 1 + ((2.78 * totalStats.em) / (1400 + totalStats.em)) + (finalStats.reaction_bonus || 0);
        amplifyingReactionMultiplier = baseMult * vapeMeltBonus;
    }
    
    // 5. FINAL DAMAGE
    const nonCritHit = outgoingDamage * damageBonusMultiplier * enemyDefMultiplier * enemyResMultiplier * amplifyingReactionMultiplier;
    const critHit = nonCritHit * critMultiplier;
    const avgDamage = nonCritHit * (1 - critRate) + critHit * critRate;
    
    return {
        avg: avgDamage || 0,
        crit: critHit || 0,
        nonCrit: nonCritHit || 0
    };
}
