const defaultFinalStats = {
    hp: 0, atk: 0, def: 0, crit_rate: 0.05, crit_dmg: 0.50, em: 0, er: 1.0,
    pyro_dmg_bonus: 0, hydro_dmg_bonus: 0, dendro_dmg_bonus: 0, electro_dmg_bonus: 0,
    anemo_dmg_bonus: 0, cryo_dmg_bonus: 0, geo_dmg_bonus: 0, physical_dmg_bonus: 0,
    all_res_shred: 0, all_dmg_bonus: 0, 
    normal_attack_dmg_bonus: 0, 
    charged_attack_dmg_bonus: 0,
    plunge_attack_dmg_bonus: 0,
    skill_dmg_bonus: 0,
    burst_dmg_bonus: 0,
    def_shred: 0,
    def_ignore: 0,
};

export function calculateTotalStats(state, gameData, charKey) {
    const { character, weapon, characterBuild, team, characterBuilds, activeBuffs } = state;
    const { buffData, mainStatValues, characterData, weaponData } = gameData;
    
    if (!character || !weapon || !characterBuild) { return defaultFinalStats; }

    const modifiedCharacter = { ...character };

    if (characterBuild.constellation > 0 && charKey) {
        Object.values(buffData).forEach(buffDef => {
            if (
                buffDef.source_type === 'constellation' &&
                buffDef.is_passive &&
                buffDef.source_character === charKey &&
                characterBuild.constellation >= buffDef.constellation &&
                buffDef.effects?.base_atk_flat
            ) {
                modifiedCharacter.base_atk += buffDef.effects.base_atk_flat;
            }
        });
    }
    
    const baseStats = { 
        atk: modifiedCharacter.base_atk + weapon.base_atk, 
        hp: modifiedCharacter.base_hp, 
        def: modifiedCharacter.base_def 
    };
    
    const bonuses = {};
    const addBonus = (stat, value) => {
        if (typeof value === 'number' && !isNaN(value)) {
            bonuses[stat] = (bonuses[stat] || 0) + value;
        }
    };

    if (character.ascension_stat && character.ascension_value) { addBonus(character.ascension_stat, character.ascension_value); }
    for (const key in weapon.stats) { addBonus(key, weapon.stats[key]); }
    const weaponRefinement = weapon.refinements[characterBuild.weapon.refinement - 1] || {};
    for (const stat in weaponRefinement) { if (typeof weaponRefinement[stat] === 'number') { addBonus(stat, weaponRefinement[stat]); } }
    
    Object.values(characterBuild.artifacts).forEach(piece => {
        if (piece) {
            // --- START: CORRECTED MAIN STAT LOOKUP ---
            if (piece.mainStat) {
                let value = mainStatValues[piece.mainStat]?.value;

                // If the initial lookup fails, try the alternative key format.
                if (value === undefined) {
                    const key = piece.mainStat;
                    if (key === 'atk_flat') value = mainStatValues['flat_atk']?.value;
                    else if (key === 'flat_atk') value = mainStatValues['atk_flat']?.value;
                    else if (key === 'hp_flat') value = mainStatValues['flat_hp']?.value;
                    else if (key === 'flat_hp') value = mainStatValues['hp_flat']?.value;
                    else if (key === 'def_flat') value = mainStatValues['def_flat']?.value;
                    else if (key === 'def_flat') value = mainStatValues['def_flat']?.value;
                }

                // If a value was found (either from the original or alternate key), add it.
                if (value !== undefined) {
                    addBonus(piece.mainStat, value);
                }
            }
            // --- END: CORRECTED MAIN STAT LOOKUP ---
            
            if (piece.substats) { for (const key in piece.substats) addBonus(key, piece.substats[key]); }
        }
    });

    const { set_2pc, set_4pc } = characterBuild.artifacts;
    if (set_4pc && set_4pc !== 'no_set' && buffData[`${set_4pc}_2pc`]?.effects) { 
        for (const key in buffData[`${set_4pc}_2pc`].effects) addBonus(key, buffData[`${set_4pc}_2pc`].effects[key]);
    }
    if (set_2pc && set_2pc !== 'no_set' && buffData[`${set_2pc}_2pc`]?.effects) { 
        for (const key in buffData[`${set_2pc}_2pc`].effects) addBonus(key, buffData[`${set_2pc}_2pc`].effects[key]); 
    }

    Object.values(buffData).forEach(buffDef => {
        const isCorrectConstellation = !buffDef.constellation || characterBuild.constellation >= buffDef.constellation;
        if (buffDef.is_passive && buffDef.source_type === 'character' && buffDef.source_character === charKey && isCorrectConstellation && buffDef.effects) {
            for (const stat in buffDef.effects) {
                if (stat !== 'base_atk_flat') addBonus(stat, buffDef.effects[stat]);
            }
        }
    });

    if (team && characterBuilds) {
        team.forEach(teammateKey => {
            if (!teammateKey) return;
            const teammateBuild = characterBuilds[teammateKey];
            if (!teammateBuild) return;
            Object.values(buffData).forEach(buffDef => {
                if (buffDef.source_type === 'constellation' && buffDef.is_passive && buffDef.source_character === teammateKey && teammateBuild.constellation >= buffDef.constellation) {
                    if (buffDef.effects && !buffDef.effects.base_atk_flat) { 
                        for (const stat in buffDef.effects) addBonus(stat, buffDef.effects[stat]); 
                    }
                }
            });
        });
    }

    const elementCounts = team.reduce((acc, t_charKey) => {
        if (t_charKey && characterData[t_charKey]) { acc[characterData[t_charKey].element] = (acc[characterData[t_charKey].element] || 0) + 1; }
        return acc;
    }, {});
    if (elementCounts.pyro >= 2) addBonus('atk_percent', 0.25);
    if (elementCounts.hydro >= 2) addBonus('hp_percent', 0.25);
    if (elementCounts.dendro >= 2) addBonus('em', 50);
    if (elementCounts.geo >= 2) { addBonus('all_dmg_bonus', 0.15); addBonus('res_shred_geo', 0.20); }

    if (activeBuffs) {
        Object.entries(activeBuffs).forEach(([buffKey, buffState]) => {
            if (!buffState.active) return;
            const buffDef = buffData[buffKey];
            if (!buffDef) return;
            let enhancementMultiplier = 1.0;
            if (buffDef.enhancement_mods) {
                buffDef.enhancement_mods.forEach(mod => {
                    if (activeBuffs[mod.buff_to_check]?.active) enhancementMultiplier *= mod.multiplier;
                });
            }
            if (buffDef.effects) {
                for (const stat in buffDef.effects) {
                    if (stat !== 'base_atk_flat') addBonus(stat, buffDef.effects[stat] * enhancementMultiplier);
                }
            }
            if (buffDef.stackable && !buffDef.dynamic_effects) {
                const effectPerStack = buffDef.stackable.is_weapon_passive ? weaponRefinement : (buffDef.stackable.effects || {});
                for (const stat in effectPerStack) {
                    if (typeof effectPerStack[stat] === 'number') addBonus(stat, (effectPerStack[stat] * buffState.stacks) * enhancementMultiplier);
                }
            }
            if (buffDef.dynamic_effects && buffDef.dynamic_effects.type !== 'flat_damage_bonus') {
                const dynamic = buffDef.dynamic_effects;
                let holderBuild = characterBuilds[buffDef.source_character];
                if (!holderBuild && buffDef.source_weapon) {
                    const holderKey = team.find(c => c && characterBuilds[c]?.weapon?.key === buffDef.source_weapon);
                    if (holderKey) holderBuild = characterBuilds[holderKey];
                }
                const currentStacks = Math.min(buffState.stacks || 1, buffDef.stackable?.max_stacks || 1);
                if (!holderBuild && !['ramping_stacking_stat', 'stat_conversion', 'stack_based_lookup'].includes(dynamic.type)) return;
                switch(dynamic.type) {
                    case 'base_stat_scaling_buff': {
                        if (!holderBuild || !dynamic.scaling_stat || !dynamic.to_stat) break;
                        const holderInfo = characterData[buffDef.source_character];
                        const holderWeapon = weaponData[holderBuild.weapon.key];
                        if (!holderInfo || !holderWeapon) break;
                        let providerBaseStatValue = (dynamic.scaling_stat === 'base_atk') ? (holderInfo.base_atk + holderWeapon.base_atk) : 0;
                        let ratio = dynamic.ratio || (dynamic.talent && dynamic.values ? (dynamic.values[(holderBuild.talentLevels[dynamic.talent] || 1) - 1] || 0) : 0);
                        addBonus(dynamic.to_stat, (providerBaseStatValue * ratio) * enhancementMultiplier);
                        break;
                    }
                    case 'refinement_based_stat': {
                        if (!holderBuild) break;
                        const refIdx = (holderBuild.weapon.refinement || 1) - 1;
                        if (dynamic.stat && dynamic.values) addBonus(dynamic.stat, (dynamic.values[refIdx] || 0) * enhancementMultiplier);
                        if (dynamic.stats) dynamic.stats.forEach(s => addBonus(s.stat, (s.values[refIdx] || 0) * enhancementMultiplier));
                        break;
                    }
                    case 'stack_based_lookup': {
                        if (!dynamic.values || !dynamic.stat) break;
                        const val = dynamic.values[currentStacks - 1] || 0;
                        if (Array.isArray(dynamic.stat)) dynamic.stat.forEach(s => addBonus(s, val * enhancementMultiplier));
                        else addBonus(dynamic.stat, val * enhancementMultiplier);
                        break;
                    }
                    case 'talent_level_based_stat': {
                        if (!holderBuild || !dynamic.talent || !dynamic.stat || !dynamic.values) break;
                        const level = (holderBuild.talentLevels[dynamic.talent] || 1);
                        addBonus(dynamic.stat, (dynamic.values[level - 1] || 0) * enhancementMultiplier);
                        break;
                    }
                    case 'ramping_stacking_stat': {
                        if (!dynamic.stat) break;
                        addBonus(dynamic.stat, ((dynamic.base_value || 0) + ((dynamic.value_per_stack || 0) * currentStacks)) * enhancementMultiplier);
                        break;
                    }
                    case 'talent_level_stacking_stat': {
                        if (!holderBuild || !dynamic.talent || !dynamic.stat || !dynamic.values) break;
                        const level = (holderBuild.talentLevels[dynamic.talent] || 1);
                        addBonus(dynamic.stat, ((dynamic.values[level - 1] || 0) * currentStacks) * enhancementMultiplier);
                        break;
                    }
                    case 'stacking_stat_bonus': {
                        if (!holderBuild || holderBuild.constellation < buffDef.constellation) break;
                        const sourceBuff = activeBuffs[dynamic.buff_to_check];
                        if (sourceBuff?.active && sourceBuff.stacks > 0) addBonus(dynamic.stat, (dynamic.values[sourceBuff.stacks - 1] || 0) * enhancementMultiplier);
                        break;
                    }
                }
            }
        });
    }

    const finalStats = {};
    finalStats.hp = baseStats.hp * (1 + (bonuses.hp_percent || 0)) + (bonuses.hp_flat || 0) + (bonuses.flat_hp || 0);
    finalStats.atk = baseStats.atk * (1 + (bonuses.atk_percent || 0)) + (bonuses.flat_atk || 0) + (bonuses.atk_flat || 0);
    finalStats.def = baseStats.def * (1 + (bonuses.def_percent || 0)) + (bonuses.flat_def || 0) + (bonuses.def_flat || 0);
    
    const processedMainStats = ['hp_percent', 'hp_flat', 'flat_hp', 'atk_percent', 'flat_atk', 'atk_flat', 'def_percent', 'flat_def', 'def_flat'];
    for (const key in bonuses) {
        if (!processedMainStats.includes(key)) {
            finalStats[key] = (finalStats[key] || 0) + bonuses[key];
        }
    }
    
    if (activeBuffs) {
        Object.entries(activeBuffs).forEach(([buffKey, buffState]) => {
            if (!buffState.active) return;
            const buffDef = buffData[buffKey];
            if (!buffDef || !buffDef.dynamic_effects) return;
            const dynamic = buffDef.dynamic_effects;
            if (dynamic.type === 'stat_conversion') {
                const fromStatValue = finalStats[dynamic.from_stat] || 0;
                let ratio = dynamic.ratio || 0;
                if (dynamic.talent_level_based) {
                    const holderBuild = characterBuilds[buffDef.source_character];
                    if (holderBuild) {
                        const talentLevel = (holderBuild.talentLevels[dynamic.talent] || 1);
                        ratio = dynamic.values[talentLevel - 1] || 0;
                    }
                }
                finalStats[dynamic.to_stat] = (finalStats[dynamic.to_stat] || 0) + (fromStatValue * ratio);
            }
        });
    }

    finalStats.crit_rate = (finalStats.crit_rate || 0) + 0.05;
    finalStats.crit_dmg = (finalStats.crit_dmg || 0) + 0.50;
    finalStats.er = (finalStats.er || 0) + 1.0;

    return { ...defaultFinalStats, ...finalStats };
}