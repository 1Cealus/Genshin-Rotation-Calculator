import { characterData } from "../data/character_database";

// --- Helper function to build alias maps ---
const buildAliasMapForChar = (charKey) => {
    const talentAliasMap = {};
    const char = characterData[charKey];
    if (char && char.talents) {
        Object.entries(char.talents).forEach(([talentKey, talentValue]) => {
            if (talentValue.alias) {
                talentValue.alias.forEach(a => {
                    talentAliasMap[a.toLowerCase()] = talentKey;
                });
            }
        });
    }
    return talentAliasMap;
};


export function parseNotation(notation, charKey) {
    const actions = [];
    const errors = [];
    
    // Build the alias map only for the specific character
    const talentAliasMap = buildAliasMapForChar(charKey);
    const charName = characterData[charKey].name;

    // This regex splits the string into tokens: words, or groups in parentheses
    const tokens = notation.match(/(\([^)]+\))|([a-zA-Z0-9]+)/g) || [];

    for (const token of tokens) {
        // --- 1. Check for Repetition Group ---
        const repeatMatch = token.match(/\((.*?)\)\s*\*?\s*(\d*)/);
        if (token.startsWith('(') && repeatMatch) {
            const sequenceStr = repeatMatch[1].trim();
            // Default to 1 if no multiplier is found
            const count = repeatMatch[2] ? parseInt(repeatMatch[2], 10) : 1;
            const sequenceAliases = sequenceStr.split(/\s+/);

            if (isNaN(count)) {
                 errors.push(`Invalid multiplier for group "${sequenceStr}"`);
                 continue;
            }

            for (let i = 0; i < count; i++) {
                for (const alias of sequenceAliases) {
                    const talentKey = talentAliasMap[alias.toLowerCase()];
                    if (talentKey) {
                        actions.push({ id: Date.now() + Math.random(), characterKey: charKey, talentKey, config: { reactionType: 'none', activeBuffs: {}, infusion: null } });
                    } else {
                        errors.push(`Unknown action alias "${alias}" in group for ${charName}`);
                    }
                }
            }
        } else { // --- 2. Handle a single action alias ---
            const talentKey = talentAliasMap[token.toLowerCase()];
            if (talentKey) {
                actions.push({ id: Date.now() + Math.random(), characterKey: charKey, talentKey, config: { reactionType: 'none', activeBuffs: {}, infusion: null } });
            } else {
                errors.push(`Unknown action alias "${token}" for ${charName}`);
            }
        }
    }

    return { actions, errors };
}
