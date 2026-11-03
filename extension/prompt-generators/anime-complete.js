import { ANIME_COMPLETE_PROMPTS } from './anime-complete-prompts.js';
import { createAnimeOutfitBatch } from './anime-outfit-batch.js';

const batch = createAnimeOutfitBatch(ANIME_COMPLETE_PROMPTS);

export const ANIME_COMPLETE_SIZE = batch.size;
export const selectAnimeCompleteNumbers = batch.selectNumbers;
export const generateAnimeCompleteBatch = batch.generate;
