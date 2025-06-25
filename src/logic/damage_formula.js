import { calculateTotalStats } from './stat_calculator.js';

export function calculateFinalDamage(state) {
    const totalStats = calculateTotalStats(state); 
    const { talent, characterBuild } = state;

    const talentCategory = talent.scaling_talent;
    const talentLevel = characterBuild.talentLevels[talentCategory];
    const multiplier = talent.multipliers ? talent.multipliers[talentLevel - 1] : 0;

    let baseDamage = 0;
    
    if (talent.scaling_stat === 'atk') baseDamage = multiplier * totalStats.atk;
    else if (talent.scaling_stat === 'hp') baseDamage = multiplier * totalStats.hp;
    else if (talent.scaling_stat === 'def') baseDamage = multiplier * totalStats.def;

    if (talent.flat_scaling_talent && talent.flat_multipliers) {
        const flatMultiplier = talent.flat_multipliers[talentLevel - 1];
        const flatScalingStatValue = totalStats[talent.flat_scaling_talent] || 0;
        baseDamage += flatMultiplier * flatScalingStatValue;
    }
    
    const damageType = state.infusion || talent.element || state.character.element;
    
    let additiveBaseDamage = 0;
    const levelMultiplier = 1446.85;
    if (state.reactionType === 'aggravate') {
        additiveBaseDamage = 1.15 * levelMultiplier * (1 + (5 * (totalStats.em || 0)) / (1200 + (totalStats.em || 0)) + (totalStats.reaction_bonus || 0));
    } else if (state.reactionType === 'spread') {
        additiveBaseDamage = 1.25 * levelMultiplier * (1 + (5 * (totalStats.em || 0)) / (1200 + (totalStats.em || 0)) + (totalStats.reaction_bonus || 0));
    }
    
    const outgoingDamage = baseDamage + additiveBaseDamage;
    const elementalDmgBonus = totalStats[`${damageType}_dmg_bonus`] || 0;
    const damageBonusMultiplier = 1 + elementalDmgBonus + (totalStats.all_dmg_bonus || 0);
    const critRate = Math.max(0, Math.min(1, totalStats.crit_rate));
    const critMultiplier = 1 + totalStats.crit_dmg;
    const enemyDefMultiplier = (state.characterBuild.level + 100) / ((state.characterBuild.level + 100) + (state.enemy.level + 100) * (1 - (totalStats.def_shred || 0)));
    
    let resShred = (totalStats.all_res_shred || 0) + (totalStats[`res_shred_${damageType}`] || 0);
    let finalEnemyRes = state.enemy.base_res[damageType] - resShred;
    let enemyResMultiplier;
    if (finalEnemyRes < 0) enemyResMultiplier = 1 - (finalEnemyRes / 2);
    else if (finalEnemyRes >= 0.75) enemyResMultiplier = 1 / (4 * finalEnemyRes + 1);
    else enemyResMultiplier = 1 - finalEnemyRes;
    
    let amplifyingReactionMultiplier = 1;
    if (['vaporize_1.5', 'vaporize_2.0', 'melt_1.5', 'melt_2.0'].includes(state.reactionType)) {
        const baseMult = parseFloat(state.reactionType.split('_')[1]);
        const vapeMeltBonus = 1 + ((2.78 * (totalStats.em || 0)) / (1400 + (totalStats.em || 0))) + (totalStats.reaction_bonus || 0);
        amplifyingReactionMultiplier = baseMult * vapeMeltBonus;
    }

    const nonCritHit = outgoingDamage * damageBonusMultiplier * enemyDefMultiplier * enemyResMultiplier * amplifyingReactionMultiplier;
    const critHit = nonCritHit * critMultiplier;
    const avgDamage = nonCritHit * (1 - critRate) + critHit * critRate;
    
    // Return calculated damages and the final damage type for analytics
    return { 
        avg: avgDamage || 0, 
        crit: critHit || 0, 
        nonCrit: nonCritHit || 0,
        damageType: damageType // ADDED THIS LINE
    };
}
