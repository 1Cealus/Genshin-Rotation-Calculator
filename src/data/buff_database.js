// This file aggregates all buffs from various sources into a single export.
import { weaponBuffs } from './buff_wepn_db.js';
import { artifactBuffs } from './buff_arti_db.js';
import { characterBuffs } from './buff_chars_db.js';
import { constellationBuffs } from './buff_const_db.js';

export const buffData = {
  ...weaponBuffs,
  ...artifactBuffs,
  ...characterBuffs,
  ...constellationBuffs, 
};
