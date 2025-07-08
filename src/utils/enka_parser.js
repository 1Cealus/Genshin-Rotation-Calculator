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
    const lowerCaseName = String(name).toLowerCase();
    const entry = Object.entries(dataObject).find(([, value]) => value.name && value.name.toLowerCase() === lowerCaseName);
    return entry ? entry[0] : null;
};

const findKeyById = (id, dataObject) => {
    if (!id || !dataObject) return null;
    // Use loose equality to handle potential type mismatch (string vs number)
    const entry = Object.entries(dataObject).find(([, value]) => value.id == id);
    return entry ? entry[0] : null;
};


export const parseEnkaData = (enkaData, gameData, designatedCharacterKey = null) => {
    const logs = [];
    if (!enkaData || !enkaData.avatarInfoList) {
        logs.push('Parser Error: Invalid or empty Enka.Network data received.');
        return { builds: {}, logs };
    }

    const newCharacterBuilds = {};

    logs.push(`Found ${enkaData.avatarInfoList.length} character(s) in showcase.`);

    enkaData.avatarInfoList.forEach(avatar => {
        try {
            const charId = avatar.avatarId;
            // --- NEW LOGGING ---
            logs.push(`Processing Avatar ID: ${charId}`);

            const charKey = Object.keys(gameData.characterData).find(key => gameData.characterData[key].id == charId);

            if (designatedCharacterKey && charKey !== designatedCharacterKey) {
                return;
            }

            if (!charKey) {
                logs.push(`-> Skipping. ID ${charId} not found in local game data.`);
                return;
            }

            logs.push(`-> Match found: ${gameData.characterData[charKey].name}. Parsing build...`);

            const characterBuild = {
                level: 90,
                talentLevels: { na: 10, skill: 10, burst: 10 },
                constellation: avatar.talentIdList?.length || 0,
                weapon: { key: 'no_weapon', refinement: 1 },
                artifacts: {},
            };

            avatar.equipList.forEach(item => {
                if (item.flat.itemType === 'ITEM_WEAPON') {
                    const weaponId = item.itemId;
                    const weaponKey = findKeyById(weaponId, gameData.weaponData);
                    characterBuild.weapon = {
                        key: weaponKey || 'no_weapon',
                        refinement: (item.weapon.affixMap ? Object.values(item.weapon.affixMap)[0] : 0) + 1,
                    };
                } else if (item.flat.itemType === 'ITEM_RELIQUARY') {
                    const slotKey = equipTypeMap[item.flat.equipType];
                    if (slotKey) {
                        const mainStatKey = statMap[item.flat.reliquaryMainstat.mainPropId] || 'unknown';
                        const substats = {};
                        if (item.flat.reliquarySubstats) {
                            item.flat.reliquarySubstats.forEach(sub => {
                                const subStatKey = statMap[sub.appendPropId];
                                if (subStatKey) {
                                    substats[subStatKey] = ['hp_percent', 'atk_percent', 'def_percent', 'crit_rate', 'crit_dmg', 'er', 'healing_bonus'].includes(subStatKey) ?
                                        sub.statValue / 100 :
                                        sub.statValue;
                                }
                            });
                        }

                        const setNameHash = item.flat.setNameTextMapHash;
                        let setName = gameData.textMap[setNameHash];
                        if (setName && typeof setName === 'object') {
                            setName = setName.en || setName.name || Object.values(setName)[0];
                        }
                        
                        const setKey = findKeyByName(setName, gameData.artifactSets);
                        
                        const pieceData = {
                            set: setKey || 'no_set',
                            mainStat: mainStatKey,
                            substats: substats,
                        };

                        if (slotKey === 'circlet') {
                            characterBuild.circletMainStat = mainStatKey;
                        }

                        characterBuild.artifacts[slotKey] = pieceData;
                    }
                }
            });

            const setCounts = {};
            Object.values(characterBuild.artifacts).forEach(piece => {
                if (piece && piece.set) {
                    setCounts[piece.set] = (setCounts[piece.set] || 0) + 1;
                }
            });

            const fourPiece = Object.keys(setCounts).find(key => setCounts[key] >= 4);
            const twoPiece = Object.keys(setCounts).find(key => setCounts[key] >= 2 && key !== fourPiece);

            characterBuild.artifacts.set_4pc = fourPiece || 'no_set';
            characterBuild.artifacts.set_2pc = twoPiece || 'no_set';

            newCharacterBuilds[charKey] = characterBuild;
            logs.push(`-> Successfully parsed ${gameData.characterData[charKey].name}.`);

        } catch (error) {
            logs.push(`-> ERROR parsing avatar ID ${avatar?.avatarId}: ${error.message}`);
        }
    });

    return { builds: newCharacterBuilds, logs };
};