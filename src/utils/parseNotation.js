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
    
    const talentAliasMap = buildAliasMapForChar(charKey);
    const charName = characterData[charKey].name;

    // This regex splits the string into tokens: 
    // - parenthesized groups like (n1 ca)*2
    // - or words (now allowing underscores) with optional multipliers like q_ruin_slash*3
    const tokens = notation.match(/(\([^)]+\)\s*\*?\s*\d*)|([a-zA-Z0-9_]+(?:\s*\*?\s*\d+)?)/g) || [];

    for (const token of tokens) {
        const groupRepeatMatch = token.match(/\((.*?)\)\s*\*?\s*(\d*)/);

        // Handle repetition groups e.g. (n1 ca)*2
        if (token.startsWith('(') && groupRepeatMatch) { 
            const sequenceStr = groupRepeatMatch[1].trim();
            const count = groupRepeatMatch[2] ? parseInt(groupRepeatMatch[2], 10) : 1;
            const sequenceAliases = sequenceStr.split(/\s+/);

            if (isNaN(count)) {
                 errors.push(`Invalid multiplier for group "${sequenceStr}"`);
                 continue;
            }

            // Unroll the group into individual actions
            for (let i = 0; i < count; i++) {
                for (const alias of sequenceAliases) {
                    const talentKey = talentAliasMap[alias.toLowerCase()];
                    if (talentKey) {
                        actions.push({ id: Date.now() + Math.random(), characterKey: charKey, talentKey, config: { reactionType: 'none', activeBuffs: {}, infusion: null }, repeat: 1 });
                    } else {
                        errors.push(`Unknown action alias "${alias}" in group for ${charName}`);
                    }
                }
            }
        } else { // Handle a single action alias, possibly with a multiplier e.g. n1*3
            const parts = token.match(/([a-zA-Z0-9_]+)(?:(?:\s*\*|\*)\s*(\d+))?/);
            if (!parts) continue;

            const alias = parts[1];
            const repeatCount = parts[2] ? parseInt(parts[2], 10) : 1;

            if (isNaN(repeatCount) || repeatCount < 1) {
                errors.push(`Invalid repeat count for action "${alias}"`);
                continue;
            }

            const talentKey = talentAliasMap[alias.toLowerCase()];
            if (talentKey) {
                actions.push({ id: Date.now() + Math.random(), characterKey: charKey, talentKey, config: { reactionType: 'none', activeBuffs: {}, infusion: null }, repeat: repeatCount });
            } else {
                errors.push(`Unknown action alias "${alias}" for ${charName}`);
            }
        }
    }

    return { actions, errors };
}
