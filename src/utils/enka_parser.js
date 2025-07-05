// This utility will parse the JSON response from the Enka.Network API
// and transform it into the character build format that the calculator uses.

// Maps Enka.Network's stat names to the calculator's internal stat keys.
const statMap = {
    FIGHT_PROP_HP: 'flat_hp',
    FIGHT_PROP_ATTACK: 'flat_atk',
    FIGHT_PROP_DEFENSE: 'flat_def',
    FIGHT_PROP_HP_PERCENT: 'hp_percent',
    FIGHT_PROP_ATTACK_PERCENT: 'atk_percent',
    FIGHT_PROP_DEFENSE_PERCENT: 'def_percent',
    FIGHT_PROP_CRITICAL: 'crit_rate',
    FIGHT_PROP_CRITICAL_HURT: 'crit_dmg',
    FIGHT_PROP_CHARGE_EFFICIENCY: 'er',
    FIGHT_PROP_HEAL_ADD: 'healing_bonus',
    FIGHT_PROP_ELEMENT_MASTERY: 'em',
    FIGHT_PROP_PHYSICAL_ADD_HURT: 'physical_dmg_bonus',
    FIGHT_PROP_FIRE_ADD_HURT: 'pyro_dmg_bonus',
    FIGHT_PROP_ELEC_ADD_HURT: 'electro_dmg_bonus',
    FIGHT_PROP_WATER_ADD_HURT: 'hydro_dmg_bonus',
    FIGHT_PROP_WIND_ADD_HURT: 'anemo_dmg_bonus',
    FIGHT_PROP_ICE_ADD_HURT: 'cryo_dmg_bonus',
    FIGHT_PROP_ROCK_ADD_HURT: 'geo_dmg_bonus',
    FIGHT_PROP_GRASS_ADD_HURT: 'dendro_dmg_bonus'
};

// Maps Enka.Network's equipment slot names to the calculator's internal names.
const equipTypeMap = {
    EQUIP_BRACER: 'flower',
    EQUIP_NECKLACE: 'plume',
    EQUIP_SHOES: 'sands',
    EQUIP_RING: 'goblet',
    EQUIP_DRESS: 'circlet',
};

const findKeyByName = (name, dataObject) => {
    if (!name || !dataObject) return null;
    const lowerCaseName = name.toLowerCase();
    const entry = Object.entries(dataObject).find(([, value]) => value.name && value.name.toLowerCase() === lowerCaseName);
    return entry ? entry[0] : null;
};

const findKeyById = (id, dataObject) => {
    if (!id || !dataObject) return null;
    const entry = Object.entries(dataObject).find(([, value]) => value.id === id);
    return entry ? entry[0] : null;
};


export const parseEnkaData = (enkaData, gameData) => {
    if (!enkaData.avatarInfoList) {
        throw new Error('Invalid Enka.Network data: avatarInfoList is missing.');
    }

    const newCharacterBuilds = {};

    enkaData.avatarInfoList.forEach(avatar => {
        const charId = avatar.avatarId;
        const charKey = Object.keys(gameData.characterData).find(key => gameData.characterData[key].id === charId);

        if (!charKey) {
            console.warn(`[Parser] Skipping character with official ID ${charId} because no matching character was found in local game data.`);
            return; 
        }
        
        console.log(`[Parser] Found character: ${gameData.characterData[charKey].name} (ID: ${charId}). Parsing build...`);

        const characterBuild = {
            level: avatar.propMap['4001'].val || 90,
            constellation: avatar.talentIdList?.length || 0,
            weapon: { key: 'no_weapon', refinement: 1 },
            talentLevels: { na: 1, skill: 1, burst: 1 },
            artifacts: {},
        };

        if (avatar.skillLevelMap) {
            const charTalentInfo = gameData.characterData[charKey].talents;
            const talentKeyMap = {};
            if(charTalentInfo){
                Object.keys(charTalentInfo).forEach(tKey => {
                    const talentId = charTalentInfo[tKey].id;
                    if(talentId) talentKeyMap[talentId] = tKey;
                });
            }
            
            characterBuild.talentLevels = {
                 na: gameData.characterData[charKey]?.default_talents?.na || 1,
                 skill: gameData.characterData[charKey]?.default_talents?.skill || 1,
                 burst: gameData.characterData[charKey]?.default_talents?.burst || 1,
            };

            for (const [skillId, level] of Object.entries(avatar.skillLevelMap)) {
                const internalTalentKey = talentKeyMap[skillId];
                if (internalTalentKey) {
                    const talentType = charTalentInfo[internalTalentKey].scaling_talent;
                    if (talentType && characterBuild.talentLevels[talentType]) {
                        characterBuild.talentLevels[talentType] = Math.max(characterBuild.talentLevels[talentType], level);
                    }
                }
            }
        }

        avatar.equipList.forEach(item => {
            if (item.flat.itemType === 'ITEM_WEAPON') {
                const weaponId = item.itemId;
                console.log(`[Parser] Looking for weapon with ID: ${weaponId}`);
                const weaponKey = findKeyById(weaponId, gameData.weaponData);
                if(weaponKey) {
                    console.log(`[Parser] --- Found weapon: ${gameData.weaponData[weaponKey].name}`);
                } else {
                    console.error(`[Parser] --- WEAPON NOT FOUND! Ensure a weapon with id: ${weaponId} exists in your weapon data file.`);
                }
                characterBuild.weapon = {
                    key: weaponKey || 'no_weapon',
                    refinement: (item.weapon.affixMap ? Object.values(item.weapon.affixMap)[0] : 0) + 1,
                };
            } else if (item.flat.itemType === 'ITEM_RELIQUARY') {
                const slotKey = equipTypeMap[item.flat.equipType];
                if (slotKey) {
                    const mainStatKey = statMap[item.flat.reliquaryMainstat.mainPropId] || 'unknown';
                    const substats = {};
                    item.flat.reliquarySubstats.forEach(sub => {
                        const subStatKey = statMap[sub.appendPropId];
                        if (subStatKey) {
                            substats[subStatKey] = ['hp_percent', 'atk_percent', 'def_percent', 'crit_rate', 'crit_dmg', 'er', 'healing_bonus'].includes(subStatKey)
                                ? sub.statValue / 100
                                : sub.statValue;
                        }
                    });
                    
                    const setNameHash = item.flat.setNameTextMapHash;
                    const setName = gameData.textMap[setNameHash];
                    console.log(`[Parser] Looking for artifact set with Hash: ${setNameHash}, which translates to Name: "${setName || 'Unknown'}"`);
                    const setKey = findKeyByName(setName, gameData.artifactSets);
                    if(setKey) {
                         console.log(`[Parser] --- Found artifact set: ${gameData.artifactSets[setKey].name}`);
                    } else {
                         console.error(`[Parser] --- ARTIFACT SET NOT FOUND! Ensure a set with the name "${setName}" exists in your artifact data file, or that the hash ${setNameHash} exists in your textMap.`);
                    }

                    characterBuild.artifacts[slotKey] = {
                        set: setKey,
                        mainStat: mainStatKey,
                        substats: substats,
                    };
                }
            }
        });

        const setCounts = {};
        Object.values(characterBuild.artifacts).forEach(piece => {
            if (piece && piece.set) {
                setCounts[piece.set] = (setCounts[piece.set] || 0) + 1;
            }
        });
        
        let fourPiece = Object.keys(setCounts).find(key => setCounts[key] >= 4);
        let twoPiece = Object.keys(setCounts).find(key => setCounts[key] >= 2 && key !== fourPiece);

        characterBuild.artifacts.set_4pc = fourPiece || 'no_set';
        characterBuild.artifacts.set_2pc = !fourPiece && twoPiece ? twoPiece : 'no_set';

        newCharacterBuilds[charKey] = characterBuild;
    });

    return newCharacterBuilds;
};