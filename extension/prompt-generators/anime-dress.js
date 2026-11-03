import { ANIME_DRESS_PROMPTS } from './anime-dress-prompts.js';

export const ANIME_DRESS_SIZE = ANIME_DRESS_PROMPTS.length;
const OUTFITS_PER_CHARACTER = 4;
const CHARACTER_COUNT = ANIME_DRESS_SIZE / OUTFITS_PER_CHARACTER;

function promptNumber(characterText, outfitText) {
  const character = Number(characterText);
  const outfit = Number(outfitText);
  if (!Number.isInteger(character) || character < 1 || character > CHARACTER_COUNT
    || !Number.isInteger(outfit) || outfit < 1 || outfit > OUTFITS_PER_CHARACTER) {
    throw new RangeError(`角色編號須介於 1–${CHARACTER_COUNT}，套裝編號須介於 1–${OUTFITS_PER_CHARACTER}。`);
  }
  return (character - 1) * OUTFITS_PER_CHARACTER + outfit;
}

// Return unique positions in source order; previewing a selection consumes no randomness.
export function selectAnimeDressNumbers(selection = '') {
  const text = selection.trim();
  if (!text) return Array.from({ length: ANIME_DRESS_SIZE }, (_, index) => index + 1);

  const numbers = new Set();
  for (const part of text.split(/[,，、\n]/)) {
    const token = part.trim();
    const match = token.match(/^(\d+)#(\d+)(?:\s*-\s*(?:(\d+)#(\d+))?)?$/);
    if (!match) {
      throw new Error(`編號格式錯誤：請輸入 56#1 - 57#4（可用逗號分隔），或留空產生全部 ${ANIME_DRESS_SIZE} 個。`);
    }
    const start = promptNumber(match[1], match[2]);
    const end = match[3] !== undefined ? promptNumber(match[3], match[4])
      : token.includes('-') ? ANIME_DRESS_SIZE : start;
    if (start > end) throw new RangeError('範圍起點不可大於終點。');
    for (let number = start; number <= end; number++) numbers.add(number);
  }
  return [...numbers].sort((a, b) => a - b);
}

export function generateAnimeDressBatch(selection = '', random = Math.random) {
  const prompts = selectAnimeDressNumbers(selection).map(number => ANIME_DRESS_PROMPTS[number - 1]);
  for (let i = prompts.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [prompts[i], prompts[j]] = [prompts[j], prompts[i]];
  }
  // Each prompt gets its own 10% draw after shuffling; source text is never changed.
  return prompts.map(prompt => random() < 0.1 && !prompt.includes('、胸部圓潤')
    ? prompt.replace('的成年日本年輕女性', '、胸部圓潤的成年日本年輕女性')
    : prompt);
}
