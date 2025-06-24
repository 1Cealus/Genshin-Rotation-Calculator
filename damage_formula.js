// This file contains the core damage calculation logic.
/**
 * Implements the Genshin Impact damage formula.
 * @param {object} state - Comprehensive state for a single action.
 * @returns {object} - An object with avg, crit, and nonCrit damage values.
 */
export function calculateFinalDamage(state) {
    let finalStats = { flat_atk: 0, atk_percent: 0, flat_hp: 0, hp_percent: 0, flat_def: 0, def_percent: 0, crit_rate: 0.05, crit_dmg: 0.50, em: 0, er: 1.0, reaction_bonus: 0, pyro_dmg_bonus: 0, hydro_dmg_bonus: 0, cryo_dmg_bonus: 0, electro_dmg_bonus: 0, anemo_dmg_bonus: 0, geo_dmg_bonus: 0, dendro_dmg_bonus: 0, physical_dmg_bonus: 0, all_dmg_bonus: 0, talent_dmg_bonus: 0 };
    
    const sources = [state.characterBuild.stats, state.weapon.stats, ...state.activeBuffs.map(b => b.effects)];
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

    let baseDamage = 0;
    const { multiplier, scaling_stat } = state.talent;
    if (scaling_stat === 'atk') baseDamage = multiplier * totalStats.atk;
    else if (scaling_stat === 'hp') baseDamage = multiplier * totalStats.hp;
    else if (scaling_stat === 'def') baseDamage = multiplier * totalStats.def;
    
    let additiveBaseDamage = 0;
    const levelMultiplier = 1446.85; // Level 90
    if (state.reactionType === 'aggravate') {
        additiveBaseDamage = 1.15 * levelMultiplier * (1 + (5 * totalStats.em) / (1200 + totalStats.em) + finalStats.reaction_bonus);
    } else if (state.reactionType === 'spread') {
        additiveBaseDamage = 1.25 * levelMultiplier * (1 + (5 * totalStats.em) / (1200 + totalStats.em) + finalStats.reaction_bonus);
    }

    const outgoingDamage = baseDamage + additiveBaseDamage;
    const elementalDmgBonus = finalStats[`${state.character.element}_dmg_bonus`] || 0;
    const damageBonusMultiplier = 1 + elementalDmgBonus + finalStats.all_dmg_bonus + finalStats.talent_dmg_bonus;
    const critRate = Math.max(0, Math.min(1, finalStats.crit_rate));
    const critMultiplier = 1 + finalStats.crit_dmg;
    const charLevel = state.characterBuild.level;
    let defShred = 0;
    state.activeBuffs.forEach(b => { if(b.effects.def_shred) defShred += b.effects.def_shred; });
    const enemyDefMultiplier = (charLevel + 100) / ((charLevel + 100) + (state.enemy.level + 100) * (1 - defShred));
    const damageType = state.character.element;
    let resShred = 0;
    state.activeBuffs.forEach(b => {
        if (b.effects.all_res_shred) resShred += b.effects.all_res_shred;
        if (b.effects[`res_shred_${damageType}`]) resShred += b.effects[`res_shred_${damageType}`];
    });
    let finalEnemyRes = state.enemy.base_res[damageType] - resShred;
    let enemyResMultiplier = 1 - finalEnemyRes;
    if (finalEnemyRes < 0) enemyResMultiplier = 1 - (finalEnemyRes / 2);
    else if (finalEnemyRes >= 0.75) enemyResMultiplier = 1 / (4 * finalEnemyRes + 1);
    let amplifyingReactionMultiplier = 1;
    const vapeMeltBonus = 1 + ((2.78 * totalStats.em) / (1400 + totalStats.em)) + finalStats.reaction_bonus;
    if (state.reactionType === 'vaporize_1.5') amplifyingReactionMultiplier = 1.5 * vapeMeltBonus;
    if (state.reactionType === 'vaporize_2.0') amplifyingReactionMultiplier = 2.0 * vapeMeltBonus;
    if (state.reactionType === 'melt_1.5') amplifyingReactionMultiplier = 1.5 * vapeMeltBonus;
    if (state.reactionType === 'melt_2.0') amplifyingReactionMultiplier = 2.0 * vapeMeltBonus;

    const nonCritHit = outgoingDamage * damageBonusMultiplier * enemyDefMultiplier * enemyResMultiplier * amplifyingReactionMultiplier;
    const critHit = nonCritHit * critMultiplier;
    const avgDamage = nonCritHit * (1 - critRate) + critHit * critRate;
    
    return {
        avg: avgDamage > 0 ? avgDamage : 0,
        crit: critHit > 0 ? critHit : 0,
        nonCrit: nonCritHit > 0 ? nonCritHit : 0
    };
}
