// This file contains all weapon-specific buffs.
// - ADDED: Azurelight buffs.
export const weaponBuffs = {
    serpent_spine_stacks: {
        name: 'Serpent Spine Stacks',
        description: 'For every 4s a character is on the field, they will deal 6/7/8/9/10% more DMG...',
        source_type: 'weapon',
        source_weapon: 'serpent_spine', 
        stackable: { max_stacks: 5, is_weapon_passive: true }
    },
    thrilling_tales_buff: {
        name: 'TTDS Buff',
        description: "When switching characters, the new character taking the field has their ATK increased by 24%/30%/36%/42%/48% for 10s.",
        source_type: 'weapon',
        source_weapon: 'thrilling_tales_of_dragon_slayers',
        dynamic_effects: {
            type: 'refinement_based_stat',
            stat: 'atk_percent',
            values: [0.24, 0.30, 0.36, 0.42, 0.48]
        }
    },
    // --- NEW AZURELIGHT BUFFS ---
    azurelight_post_skill: {
        name: 'Azurelight: Post-Skill ATK',
        description: "Within 12s after an Elemental Skill is used, ATK is increased by 24%/30%/36%/42%/48%.",
        source_type: 'weapon',
        source_weapon: 'azurelight',
        dynamic_effects: {
            type: 'refinement_based_stat',
            stat: 'atk_percent',
            values: [0.24, 0.30, 0.36, 0.42, 0.48]
        }
    },
    azurelight_zero_energy: {
        name: 'Azurelight: Zero Energy Bonus',
        description: "With the Post-Skill buff active, if the character has 0 Energy, gain an additional ATK% and CRIT DMG bonus.",
        source_type: 'weapon',
        source_weapon: 'azurelight',
        dynamic_effects: {
            type: 'refinement_based_stat',
            // This buff provides multiple stats based on refinement
            stats: [
                { stat: 'atk_percent', values: [0.24, 0.30, 0.36, 0.42, 0.48] },
                { stat: 'crit_dmg', values: [0.40, 0.50, 0.60, 0.70, 0.80] }
            ]
        }
    },
};
