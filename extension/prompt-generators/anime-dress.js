import { ANIME_DRESS_PROMPTS } from './anime-dress-prompts.js';
import { createAnimeOutfitBatch } from './anime-outfit-batch.js';

const batch = createAnimeOutfitBatch(ANIME_DRESS_PROMPTS, (prompt, random) =>
  // Each prompt gets its own 10% draw after shuffling; source text is never changed.
  random() < 0.1 && !prompt.includes('、胸部圓潤')
    ? prompt.replace('的成年日本年輕女性', '、胸部圓潤的成年日本年輕女性')
    : prompt);

export const ANIME_DRESS_SIZE = batch.size;
export const selectAnimeDressNumbers = batch.selectNumbers;
export const generateAnimeDressBatch = batch.generate;
