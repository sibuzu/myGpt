import { LIFE_STORY_PROMPTS } from './life-story-prompts.js';

export const LIFE_STORY_SIZE = LIFE_STORY_PROMPTS.length;

// Selections refer to the original numbers in 160_unsorted_prompts.txt.
export function selectLifeStoryNumbers(selection = '') {
  const text = selection.trim();
  if (!text) return Array.from({ length: LIFE_STORY_SIZE }, (_, index) => index + 1);

  const numbers = new Set();
  for (const part of text.split(/[,，、\n]/)) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d*))?$/);
    if (!match) {
      throw new Error(`編號格式錯誤：請輸入 1, 10-15, 45-，或留空產生全部 ${LIFE_STORY_SIZE} 個。`);
    }
    const start = Number(match[1]);
    const end = match[2] === undefined ? start : match[2] === '' ? LIFE_STORY_SIZE : Number(match[2]);
    if (start < 1 || end > LIFE_STORY_SIZE || start > end) {
      throw new RangeError(`編號須介於 1–${LIFE_STORY_SIZE}，且範圍起點不可大於終點。`);
    }
    for (let number = start; number <= end; number++) numbers.add(number);
  }
  return [...numbers].sort((a, b) => a - b);
}

export function generateLifeStoryBatch(selection = '') {
  return selectLifeStoryNumbers(selection).map(number => LIFE_STORY_PROMPTS[number - 1]);
}
