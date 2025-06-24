// This file contains all buff and debuff data.
// - Added 'stackable' property for buffs that have variable stacks.
export const buffData = {
    serpent_spine_stacks: {
        name: 'Serpent Spine Stacks',
        type: 'buff',
        source: 'weapon',
        stackable: {
            max_stacks: 5,
            // The actual stat bonus is pulled from the weapon's refinement data
            is_weapon_passive: true 
        }
    },
    noblesse_4pc: { 
        name: '4pc Noblesse Oblige', 
        type: 'buff', 
        source: 'artifact', 
        effects: { atk_percent: 0.20 } 
    },
    vv_shred_hydro: { 
        name: '4pc VV Shred (Hydro)', 
        type: 'debuff', 
        source: 'artifact', 
        effects: { res_shred_hydro: 0.40 } 
    },
    zhongli_shield: { 
        name: 'Zhongli Shield', 
        type: 'debuff', 
        source: 'character', 
        effects: { all_res_shred: 0.20 } 
    },
    // Add other buffs/debuffs here...
};
