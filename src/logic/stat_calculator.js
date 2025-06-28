const defaultFinalStats = {
    hp: 0, atk: 0, def: 0, crit_rate: 0.05, crit_dmg: 0.50, em: 0, er: 1.0,
    pyro_dmg_bonus: 0, hydro_dmg_bonus: 0, dendro_dmg_bonus: 0, electro_dmg_bonus: 0,
    anemo_dmg_bonus: 0, cryo_dmg_bonus: 0, geo_dmg_bonus: 0, physical_dmg_bonus: 0,
    all_res_shred: 0, all_dmg_bonus: 0, normal_attack_dmg_bonus: 0, burst_dmg_bonus: 0,
};

export function calculateTotalStats(state, gameData) {
    const { character, weapon, characterBuild, team, characterBuilds, activeBuffs } = state;
    const { buffData, mainStatValues, characterData } = gameData;
    
    if (!character || !weapon || !characterBuild) { return defaultFinalStats; }
    
    const baseStats = { atk: character.base_atk + weapon.base_atk, hp: character.base_hp, def: character.base_def };
    const bonuses = {};
    const addBonus = (stat, value) => { bonuses[stat] = (bonuses[stat] || 0) + value; };

    // Sections 1, 2, 3 are unchanged
    if (character.ascension_stat && character.ascension_value) { addBonus(character.ascension_stat, character.ascension_value); }
    for (const key in weapon.stats) { addBonus(key, weapon.stats[key]); }
    const weaponRefinement = weapon.refinements[characterBuild.weapon.refinement - 1] || {};
    for (const stat in weaponRefinement) { if (typeof weaponRefinement[stat] === 'number') { addBonus(stat, weaponRefinement[stat]); } }
    Object.values(characterBuild.artifacts).forEach(piece => {
        if (piece) {
            if (piece.mainStat && mainStatValues[piece.mainStat]) { addBonus(piece.mainStat, mainStatValues[piece.mainStat].value); }
            if (piece.substats) { for (const key in piece.substats) addBonus(key, piece.substats[key]); }
        }
    });
    const { set_2pc, set_4pc } = characterBuild.artifacts;
    if (set_4pc && set_4pc !== 'no_set' && buffData[`${set_4pc}_2pc`]?.effects) { for (const key in buffData[`${set_4pc}_2pc`].effects) addBonus(key, buffData[`${set_4pc}_2pc`].effects[key]);
    } else if (set_2pc && set_2pc !== 'no_set' && buffData[`${set_2pc}_2pc`]?.effects) { for (const key in buffData[`${set_2pc}_2pc`].effects) addBonus(key, buffData[`${set_2pc}_2pc`].effects[key]); }

    // 4. Team-wide PASSIVE constellation buffs
    if (team && characterBuilds) {
        team.forEach(teammateKey => {
            if (!teammateKey) return;
            const teammateBuild = characterBuilds[teammateKey];
            if (!teammateBuild) return;
            
            Object.values(buffData).forEach(buffDef => {
                if (buffDef.source_type === 'constellation' && buffDef.is_passive && buffDef.source_character === teammateKey && teammateBuild.constellation >= buffDef.constellation) {
                    if (buffDef.effects) { for (const stat in buffDef.effects) addBonus(stat, buffDef.effects[stat]); }
                }
            });
        });
    }

    // 5. Active Action-Specific Buffs (manually ticked buffs)
    if (activeBuffs) {
        Object.entries(activeBuffs).forEach(([buffKey, buffState]) => {
            if (!buffState.active) return;
            const buffDef = buffData[buffKey];
            if (!buffDef) return;

            if (buffDef.effects) for (const stat in buffDef.effects) addBonus(stat, buffDef.effects[stat]);

            if (buffDef.stackable && !buffDef.dynamic_effects) {
                const effectPerStack = buffDef.stackable.is_weapon_passive ? weaponRefinement : (buffDef.stackable.effects || {});
                for (const stat in effectPerStack) {
                    if (typeof effectPerStack[stat] === 'number') addBonus(stat, effectPerStack[stat] * buffState.stacks);
                }
            }

            if (buffDef.dynamic_effects && buffDef.dynamic_effects.type !== 'flat_damage_bonus') {
                const dynamic = buffDef.dynamic_effects;
                const holderBuild = characterBuilds[buffDef.source_character] || characterBuilds[team.find(c => characterBuilds[c]?.weapon.key === buffDef.source_weapon)];
                let maxStacks = buffDef.stackable?.max_stacks || 1;
                const currentStacks = Math.min(buffState.stacks || 1, maxStacks);

                if (!holderBuild && !['ramping_stacking_stat', 'stat_conversion', 'stack_based_lookup'].includes(dynamic.type)) return;

                switch(dynamic.type) {
                    // --- NEW CASE TO HANDLE THIS TYPE OF BUFF ---
                    case 'stack_based_lookup': {
                        if (!dynamic.values || !dynamic.stat) break;
                        const bonusValue = dynamic.values[currentStacks - 1] || 0; // -1 because stacks are 1-based
                        
                        if (Array.isArray(dynamic.stat)) {
                            dynamic.stat.forEach(s => addBonus(s, bonusValue));
                        } else {
                            addBonus(dynamic.stat, bonusValue);
                        }
                        break;
                    }
                    case 'stat_conversion': break; // Placeholder for now
                    case 'ramping_stacking_stat': {
                        const baseValue = dynamic.base_value || 0;
                        const valuePerStack = dynamic.value_per_stack || 0;
                        const totalBonus = baseValue + (valuePerStack * currentStacks);
                        addBonus(dynamic.stat, totalBonus);
                        break;
                    }
                    case 'team_composition': {
                        let count = team.filter(memberKey => memberKey && characterData[memberKey] && dynamic.elements.includes(characterData[memberKey].element)).length;
                        if (count > 0 && dynamic.values[count - 1]) addBonus(dynamic.effect, dynamic.values[count - 1]);
                        break;
                    }
                    case 'refinement_based_stat': {
                        const refinementIndex = (holderBuild.weapon.refinement || 1) - 1;
                        if (dynamic.stat && dynamic.values) addBonus(dynamic.stat, dynamic.values[refinementIndex] || 0);
                        if (dynamic.stats) dynamic.stats.forEach(statEffect => addBonus(statEffect.stat, statEffect.values[refinementIndex] || 0));
                        break;
                    }
                    case 'talent_level_based_stat': {
                        const talentLevel = (holderBuild.talentLevels[dynamic.talent] || 1);
                        addBonus(dynamic.stat, dynamic.values[talentLevel - 1] || 0);
                        break;
                    }
                    case 'talent_level_stacking_stat': {
                         const talentLevel = (holderBuild.talentLevels[dynamic.talent] || 1);
                         const bonusPerStack = dynamic.values[talentLevel - 1] || 0;
                         let effectiveness = 1.0;

                         if (buffDef.constellation_mods) {
                             buffDef.constellation_mods.forEach(mod => {
                                 if (holderBuild.constellation >= mod.con) {
                                     if(mod.stat === 'max_stacks' && mod.type === 'add') maxStacks += mod.value;
                                     if(mod.stat === 'stack_effectiveness' && mod.type === 'multiply') effectiveness = mod.value;
                                 }
                             });
                         }
                         
                         addBonus(dynamic.stat, (bonusPerStack * currentStacks) * effectiveness);
                         break;
                    }
                    case 'stacking_stat_bonus': {
                        if (holderBuild.constellation >= buffDef.constellation) {
                            const sourceBuff = activeBuffs[dynamic.buff_to_check];
                            if (sourceBuff?.active && sourceBuff.stacks > 0) {
                                const bonusValue = dynamic.values[sourceBuff.stacks - 1] || 0;
                                addBonus(dynamic.stat, bonusValue);
                            }
                        }
                        break;
                    }
                }
            }
        });
    }

    const finalStats = {};
    finalStats.hp = baseStats.hp * (1 + (bonuses.hp_percent || 0)) + (bonuses.hp_flat || 0);
    finalStats.atk = baseStats.atk * (1 + (bonuses.atk_percent || 0)) + (bonuses.flat_atk || 0);
    finalStats.def = baseStats.def * (1 + (bonuses.def_percent || 0)) + (bonuses.flat_def || 0);
    
    for (const key in bonuses) {
        if (!['atk_percent', 'flat_atk', 'hp_percent', 'hp_flat', 'def_percent', 'flat_def'].includes(key)) {
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
                    const talentLevel = (holderBuild.talentLevels[dynamic.talent] || 1);
                    ratio = dynamic.values[talentLevel - 1] || 0;
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