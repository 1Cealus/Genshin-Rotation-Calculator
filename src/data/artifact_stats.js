// This file defines the possible main stats for each artifact slot.
export const artifactMainStats = {
    flower: {
        hp_flat: { label: "HP", isFlat: true }
    },
    plume: {
        atk_flat: { label: "ATK", isFlat: true }
    },
    sands: {
        hp_percent: { label: "HP%", isPercent: true },
        atk_percent: { label: "ATK%", isPercent: true },
        def_percent: { label: "DEF%", isPercent: true },
        em: { label: "Elemental Mastery", isFlat: true },
        er: { label: "Energy Recharge %", isPercent: true }
    },
    goblet: {
        hp_percent: { label: "HP%", isPercent: true },
        atk_percent: { label: "ATK%", isPercent: true },
        def_percent: { label: "DEF%", isPercent: true },
        em: { label: "Elemental Mastery", isFlat: true },
        pyro_dmg_bonus: { label: "Pyro DMG Bonus %", isPercent: true },
        hydro_dmg_bonus: { label: "Hydro DMG Bonus %", isPercent: true },
        dendro_dmg_bonus: { label: "Dendro DMG Bonus %", isPercent: true },
        electro_dmg_bonus: { label: "Electro DMG Bonus %", isPercent: true },
        anemo_dmg_bonus: { label: "Anemo DMG Bonus %", isPercent: true },
        cryo_dmg_bonus: { label: "Cryo DMG Bonus %", isPercent: true },
        geo_dmg_bonus: { label: "Geo DMG Bonus %", isPercent: true },
        physical_dmg_bonus: { label: "Physical DMG Bonus %", isPercent: true }
    },
    circlet: {
        hp_percent: { label: "HP%", isPercent: true },
        atk_percent: { label: "ATK%", isPercent: true },
        def_percent: { label: "DEF%", isPercent: true },
        em: { label: "Elemental Mastery", isFlat: true },
        crit_rate: { label: "CRIT Rate %", isPercent: true },
        crit_dmg: { label: "CRIT DMG %", isPercent: true },
        healing_bonus: { label: "Healing Bonus %", isPercent: true }
    }
};
