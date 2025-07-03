import { calculateTotalStats } from './stat_calculator.js';

export function calculateFinalDamage(state, gameData) {
    const { talent, character, characterBuild, activeBuffs, talentKey, config, characterKey } = state; 
    const { buffData } = gameData;
    const totalStats = calculateTotalStats(state, gameData, characterKey); 

    const talentCategory = talent.scaling_talent;
    const talentLevel = characterBuild.talentLevels?.[talentCategory] || 1;
    let baseMultiplier = talent.multipliers ? talent.multipliers[talentLevel - 1] : 0;

    if (talent.additive_mv_bonus && activeBuffs) {
        const bonusInfo = talent.additive_mv_bonus;
        const sourceBuff = activeBuffs[bonusInfo.buff_to_check];

        if (sourceBuff?.active && sourceBuff.stacks > 0) {
            const { characterBuilds } = state; 
            
            const ratioTalentHolder = characterBuilds[bonusInfo.source_character] || characterBuild;
            const ratioTalentLevel = ratioTalentHolder.talentLevels?.[bonusInfo.scaling_talent] || 1;
            const ratioPerStack = bonusInfo.values[ratioTalentLevel - 1] || 0;
            
            const bonusMultiplier = sourceBuff.stacks * ratioPerStack;
            baseMultiplier += bonusMultiplier;
        }
    }

    if (talent.additive_mv_bonus_per_point) {
        const bonusInfo = talent.additive_mv_bonus_per_point;
        const subtletyPoints = config?.serpent_subtlety_consumed || 0;
        let bonusPoints = 0;
        
        if (subtletyPoints > 50) {
            let maxBonusPoints = bonusInfo.max_points;
            if (bonusInfo.constellation_mods) {
                bonusInfo.constellation_mods.forEach(mod => {
                    if (characterBuild.constellation >= mod.con) {
                        if (mod.type === 'replace') maxBonusPoints = mod.value;
                    }
                });
            }
            bonusPoints = Math.min(subtletyPoints - 50, maxBonusPoints);
        }
        
        const bonusPerPoint = bonusInfo.scaling[talentLevel - 1] || 0;
        baseMultiplier += bonusPoints * bonusPerPoint;
    }

    let baseDamage = 0;
    const scalingStatValue = totalStats[talent.scaling_stat] || 0;
    if (talent.scaling_stat === 'atk') baseDamage = baseMultiplier * scalingStatValue;
    else if (talent.scaling_stat === 'hp') baseDamage = baseMultiplier * scalingStatValue;
    else if (talent.scaling_stat === 'def') baseDamage = baseMultiplier * scalingStatValue;


    if (talent.flat_scaling_talent) {
        const flatTalentLevel = characterBuild.talentLevels?.[talent.scaling_talent] || 1;
        const flatMultiplier = talent.flat_multipliers[flatTalentLevel - 1];
        const flatScalingStatValue = totalStats[talent.flat_scaling_talent] || 0;
        baseDamage += flatMultiplier * flatScalingStatValue;
    }
    
    let totalFlatDamageBonus = 0;
    if (activeBuffs) {
        Object.entries(activeBuffs).forEach(([buffKey, buffState]) => {
            if (!buffState.active) return;
            const buffDef = buffData[buffKey];
            if (!buffDef?.dynamic_effects || buffDef.dynamic_effects.type !== 'flat_damage_bonus') return;

            const dynamic = buffDef.dynamic_effects;
            const { characterBuilds } = state;

            const effectiveTalentType = talent.applies_talent_type_bonus || talentCategory;
            const appliesToTalent = !dynamic.applies_to_talents || dynamic.applies_to_talents.includes(talentKey);
            const appliesToType = !dynamic.applies_to_talent_type_bonus || effectiveTalentType === dynamic.applies_to_talent_type_bonus;
            
            if (appliesToTalent && appliesToType) {
                const scalingStatValue = totalStats[dynamic.scaling_stat] || 0;
                let finalMultiplier = dynamic.multiplier;

                if (dynamic.talent_level_based && dynamic.talent && dynamic.values) {
                    const holderBuild = characterBuilds[buffDef.source_character];
                    if (holderBuild) {
                        const talentLevel = (holderBuild.talentLevels[dynamic.talent] || 1);
                        finalMultiplier = dynamic.values[talentLevel - 1] || 0;
                    }
                }
                
                totalFlatDamageBonus += scalingStatValue * finalMultiplier;
            }
        });
    }

    const damageType = state.infusion || talent.element || character.element;
    
    let additiveBaseDamage = 0;
    const levelMultiplier = 1446.85;
    if (state.reactionType === 'aggravate') {
        additiveBaseDamage = 1.15 * levelMultiplier * (1 + (5 * totalStats.em) / (1200 + totalStats.em) + (totalStats.reaction_bonus || 0));
    } else if (state.reactionType === 'spread') {
        additiveBaseDamage = 1.25 * levelMultiplier * (1 + (5 * totalStats.em) / (1200 + totalStats.em) + (totalStats.reaction_bonus || 0));
    }
    
    const outgoingDamage = baseDamage + additiveBaseDamage + totalFlatDamageBonus;
    
    const elementalDmgBonus = totalStats[`${damageType}_dmg_bonus`] || 0;
    
    // MODIFIED: This section now correctly checks for all specific attack types
    const effectiveTalentType = talent.applies_talent_type_bonus || talentCategory; 
    let talentTypeDmgBonus = 0;
    if (effectiveTalentType === 'na') talentTypeDmgBonus = totalStats.normal_attack_dmg_bonus || 0;
    else if (effectiveTalentType === 'ca') talentTypeDmgBonus = totalStats.charged_attack_dmg_bonus || 0;
    else if (effectiveTalentType === 'plunge') talentTypeDmgBonus = totalStats.plunge_attack_dmg_bonus || 0;
    else if (effectiveTalentType === 'skill') talentTypeDmgBonus = totalStats.skill_dmg_bonus || 0;
    else if (effectiveTalentType === 'burst') talentTypeDmgBonus = totalStats.burst_dmg_bonus || 0;
    
    const damageBonusMultiplier = 1 + elementalDmgBonus + (totalStats.all_dmg_bonus || 0) + talentTypeDmgBonus;
    
    const critRate = Math.max(0, Math.min(1, totalStats.crit_rate));
    const critMultiplier = 1 + totalStats.crit_dmg;
    
    const defReduction = totalStats.def_shred || 0;
    const defIgnore = totalStats.def_ignore || 0;
    const enemyDefMultiplier = (characterBuild.level + 100) / 
        ((characterBuild.level + 100) + (state.enemy.level + 100) * (1 - defReduction) * (1 - defIgnore));
    
    let resShred = (totalStats.all_res_shred || 0) + (totalStats[`res_shred_${damageType}`] || 0);
    let finalEnemyRes = state.enemy.base_res[damageType] - resShred;
    let enemyResMultiplier = finalEnemyRes < 0 ? 1 - (finalEnemyRes / 2) : (finalEnemyRes >= 0.75 ? 1 / (4 * finalEnemyRes + 1) : 1 - finalEnemyRes);
    
    let amplifyingReactionMultiplier = 1;
    if (['vaporize_1.5', 'vaporize_2.0', 'melt_1.5', 'melt_2.0'].includes(state.reactionType)) {
        const baseMult = parseFloat(state.reactionType.split('_')[1]);
        const vapeMeltBonus = 1 + ((2.78 * totalStats.em) / (1400 + totalStats.em)) + (totalStats.reaction_bonus || 0);
        amplifyingReactionMultiplier = baseMult * vapeMeltBonus;
    }

    let finalDamageMultiplier = 1;
    if (activeBuffs) {
        Object.entries(activeBuffs).forEach(([buffKey, buffState]) => {
            if (!buffState.active) return;
            const buffDef = buffData[buffKey];
            if (!buffDef?.dynamic_effects || buffDef.dynamic_effects.type !== 'final_damage_multiplier') return;
            
            const dynamic = buffDef.dynamic_effects;
            const stacks = buffState.stacks || 1;
            let multipliers;

            if (dynamic.talent_keys?.includes(talentKey)) multipliers = dynamic.values;
            else if (dynamic.burst_talent_keys?.includes(talentKey)) multipliers = dynamic.burst_values;

            if (multipliers && multipliers.length >= stacks) finalDamageMultiplier *= multipliers[stacks - 1];
        });
    }

    const nonCritHit = outgoingDamage * damageBonusMultiplier * enemyDefMultiplier * enemyResMultiplier * amplifyingReactionMultiplier * finalDamageMultiplier;
    const critHit = nonCritHit * critMultiplier;
    const avgDamage = nonCritHit * (1 - critRate) + critHit * critRate;
    
    return { 
        avg: avgDamage || 0, 
        crit: critHit || 0, 
        nonCrit: nonCritHit || 0,
        damageType: damageType,
        formula: {
            baseDamage,
            scalingStat: talent.scaling_stat,
            scalingStatValue,
            baseMultiplier,
            additiveBaseDamage,
            totalFlatDamageBonus,
            damageBonusMultiplier,
            critRate,
            critDmg: totalStats.crit_dmg,
            enemyDefMultiplier,
            enemyResMultiplier,
            amplifyingReactionMultiplier,
            finalDamageMultiplier,
        }
    };
}