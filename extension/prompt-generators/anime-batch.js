import { ANIME_CHARACTERS } from '../anime-characters.js';

export const ANIME_BATCH_CHARACTER_IDS = Object.freeze(
  ANIME_CHARACTERS.map(character => character.id)
);

// Start a fresh shuffled round for each batch, then reshuffle only after all IDs are used.
export function generateAnimeBatch(generateCharacterPrompt, count = ANIME_BATCH_CHARACTER_IDS.length) {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('Anime batch count must be a positive integer');
  }

  const prompts = [];
  while (prompts.length < count) {
    const ids = [...ANIME_BATCH_CHARACTER_IDS];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const remaining = count - prompts.length;
    prompts.push(...ids.slice(0, remaining).map(id => generateCharacterPrompt(id)));
  }
  return prompts;
}
