// This file contains all buffs granted directly by character constellations.
export const constellationBuffs = {
    escoffier_c1: {
        name: "Escoffier C1: Master's Touch",
        description: "Increases CRIT DMG by 60% when a party member is affected by Cryo.",
        source_type: 'constellation',
        source_character: 'escoffier',
        constellation: 1,
        effects: {
            crit_dmg: 0.60
        }
    },
    skirk_c2_atk_buff: {
        name: "Skirk C2: ATK Buff",
        description: "After using Havoc: Extinction while in Seven-Phase Flash mode, ATK is increased by 70%.",
        source_type: 'constellation',
        source_character: 'skirk',
        constellation: 2,
        effects: {
            atk_percent: 0.70
        }
    },
};
