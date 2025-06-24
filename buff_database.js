// This file contains all buff and debuff data.
export const buffData = {
    noblesse_4pc: { name: '4pc Noblesse Oblige', type: 'buff', source: 'artifact', effects: { atk_percent: 0.20 } },
    vv_shred_hydro: { name: '4pc VV Shred (Hydro)', type: 'debuff', source: 'artifact', effects: { res_shred_hydro: 0.40 } },
    deepwood_4pc: { name: '4pc Deepwood Memories', type: 'debuff', source: 'artifact', effects: { res_shred_dendro: 0.30 } },
    zhongli_shield: { name: 'Zhongli Shield', type: 'debuff', source: 'character', effects: { all_res_shred: 0.20 } },
    kazuha_a4_hydro: { name: 'Kazuha A4 (Hydro)', type: 'buff', source: 'character', effects: { hydro_dmg_bonus: 0.40 } }, // Assuming 1000 EM
    yelan_a4: { name: 'Yelan A4', type: 'buff', source: 'character', effects: { all_dmg_bonus: 0.50 } }, // Max value for simplicity
};
