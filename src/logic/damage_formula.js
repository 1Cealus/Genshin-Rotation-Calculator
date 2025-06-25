import { characterData } from '../data/character_database.js';
import { calculateTotalStats } from './stat_calculator.js';

export function calculateFinalDamage(state) {
    // We now pass the full state to calculateTotalStats to include action-specific buffs
    const totalStats = calculateTotalStats(state); 
    const { talent, characterBuild } = state;

    // Determine the talent level from the build (e.g., 'na', 'skill', or 'burst')
    const talentCategory = talent.scaling_talent;
    // Get the specific level for that talent category from the character's build (e.g., 9)
    const talentLevel = characterBuild.talentLevels[talentCategory];

    // Select the correct multiplier from the array, adjusting for 0-based index.
    const multiplier = talent.multipliers ? talent.multipliers[talentLevel - 1] : 0;

    let baseDamage = 0;
    
    if (talent.scaling_stat === 'atk') baseDamage = multiplier * totalStats.atk;
    else if (talent.scaling_stat === 'hp') baseDamage = multiplier * totalStats.hp;
    else if (talent.scaling_stat === 'def') baseDamage = multiplier * totalStats.def;

    // Handle flat scaling, also using the new multipliers array structure
    if (talent.flat_scaling_talent && talent.flat_multipliers) {
        const flatMultiplier = talent.flat_multipliers[talentLevel - 1];
        const flatScalingStatValue = totalStats[talent.flat_scaling_talent] || 0;
        baseDamage += flatMultiplier * flatScalingStatValue;
    }
    
    // Handle Infusions to determine final damage type
    const damageType = state.infusion || talent.element || state.character.element;
    
    // Calculate additive base damage for reactions like Spread and Aggravate
    let additiveBaseDamage = 0;
    const levelMultiplier = 1446.85; // A constant for level 90 characters
    if (state.reactionType === 'aggravate') {
        additiveBaseDamage = 1.15 * levelMultiplier * (1 + (5 * (totalStats.em || 0)) / (1200 + (totalStats.em || 0)) + (totalStats.reaction_bonus || 0));
    } else if (state.reactionType === 'spread') {
        additiveBaseDamage = 1.25 * levelMultiplier * (1 + (5 * (totalStats.em || 0)) / (1200 + (totalStats.em || 0)) + (totalStats.reaction_bonus || 0));
    }
    
    const outgoingDamage = baseDamage + additiveBaseDamage;
    
    // --- Standard DMG Formula Multipliers ---

    // 1. DMG Bonus Multiplier
    const elementalDmgBonus = totalStats[`${damageType}_dmg_bonus`] || 0;
    const damageBonusMultiplier = 1 + elementalDmgBonus + (totalStats.all_dmg_bonus || 0);
    
    // 2. Crit Multiplier
    const critRate = Math.max(0, Math.min(1, totalStats.crit_rate));
    const critMultiplier = 1 + totalStats.crit_dmg;
    
    // 3. Enemy DEF Multiplier
    const enemyDefMultiplier = (state.characterBuild.level + 100) / ((state.characterBuild.level + 100) + (state.enemy.level + 100) * (1 - (totalStats.def_shred || 0)));
    
    // 4. Enemy RES Multiplier
    let resShred = (totalStats.all_res_shred || 0) + (totalStats[`res_shred_${damageType}`] || 0);
    let finalEnemyRes = state.enemy.base_res[damageType] - resShred;
    let enemyResMultiplier;
    if (finalEnemyRes < 0) {
        enemyResMultiplier = 1 - (finalEnemyRes / 2);
    } else if (finalEnemyRes >= 0.75) {
        enemyResMultiplier = 1 / (4 * finalEnemyRes + 1);
    } else {
        enemyResMultiplier = 1 - finalEnemyRes;
    }
    
    // 5. Amplifying Reaction Multiplier (Vape/Melt)
    let amplifyingReactionMultiplier = 1;
    if (['vaporize_1.5', 'vaporize_2.0', 'melt_1.5', 'melt_2.0'].includes(state.reactionType)) {
        const baseMult = parseFloat(state.reactionType.split('_')[1]);
        const vapeMeltBonus = 1 + ((2.78 * (totalStats.em || 0)) / (1400 + (totalStats.em || 0))) + (totalStats.reaction_bonus || 0);
        amplifyingReactionMultiplier = baseMult * vapeMeltBonus;
    }

    // --- Final Damage Calculation ---
    const nonCritHit = outgoingDamage * damageBonusMultiplier * enemyDefMultiplier * enemyResMultiplier * amplifyingReactionMultiplier;
    const critHit = nonCritHit * critMultiplier;
    const avgDamage = nonCritHit * (1 - critRate) + critHit * critRate;
    
    // Return calculated damages, ensuring no NaN values
    return { avg: avgDamage || 0, crit: critHit || 0, nonCrit: nonCritHit || 0 };
}
