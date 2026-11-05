// Shared character#outfit range selection and shuffle for bundled anime prompts.
import { ANIME_CHARACTERS } from '../anime-characters.js';

export function createAnimeOutfitBatch(sourcePrompts, transform = prompt => prompt) {
  const outfitsPerCharacter = 4;
  const disabledIds = ANIME_CHARACTERS.filter(character => character.enabled === false).map(character => character.id);
  const promptsByNumber = new Map();
  for (const prompt of sourcePrompts) {
    const [, characterText, outfitText] = prompt.match(/^(\d+)#([1-4])｜/) ?? [];
    if (!characterText) throw new Error('提示詞缺少有效的角色與套裝編號。');
    const character = Number(characterText);
    if (disabledIds.includes(character)) continue;
    const number = (character - 1) * outfitsPerCharacter + Number(outfitText);
    if (promptsByNumber.has(number)) throw new Error(`提示詞編號重複：${characterText}#${outfitText}`);
    promptsByNumber.set(number, prompt);
  }
  const availableNumbers = [...promptsByNumber.keys()].sort((a, b) => a - b);
  const size = availableNumbers.length;
  const maxNumber = availableNumbers.at(-1);
  const characterCount = Math.ceil(maxNumber / outfitsPerCharacter);
  const disabledHelp = disabledIds.length ? `（${disabledIds.join('、')} 已停用，ID 保留）` : '';
  const characterHelp = `角色編號 1–${characterCount}${disabledHelp}，套裝編號 1–${outfitsPerCharacter}。`;

  function promptNumber(characterText, outfitText) {
    const character = Number(characterText);
    const outfit = Number(outfitText);
    if (!Number.isInteger(character) || character < 1 || character > characterCount
      || !Number.isInteger(outfit) || outfit < 1 || outfit > outfitsPerCharacter) {
      throw new RangeError(`角色編號須介於 1–${characterCount}${disabledHelp}，套裝編號須介於 1–${outfitsPerCharacter}。`);
    }
    if (disabledIds.includes(character)) throw new RangeError(`角色編號 ${character} 已停用，ID 保留。${characterHelp}`);
    const number = (character - 1) * outfitsPerCharacter + outfit;
    if (!promptsByNumber.has(number)) throw new RangeError(`角色編號 ${character} 的套裝 ${outfit} 尚無提示詞。`);
    return number;
  }

  function selectNumbers(selection = '') {
    const text = selection.trim();
    if (!text) return [...availableNumbers];

    const numbers = new Set();
    // Treat whitespace around punctuation as part of the separator so that
    // comma-separated lists can wrap across lines without creating empty items.
    for (const part of text.split(/\s*[,，、]\s*|[\r\n]+/)) {
      const token = part.trim();
      const match = token.match(/^(\d+)#(\d+)(?:\s*-\s*(?:(\d+)#(\d+))?)?$/);
      if (!match) {
        throw new Error(`編號格式錯誤：請輸入 56#1 - 57#4（可用逗號分隔），或留空產生全部 ${size} 個。`);
      }
      const start = promptNumber(match[1], match[2]);
      const end = match[3] !== undefined ? promptNumber(match[3], match[4])
        : token.includes('-') ? maxNumber : start;
      if (start > end) throw new RangeError('範圍起點不可大於終點。');
      for (const number of availableNumbers) {
        if (number >= start && number <= end) numbers.add(number);
      }
    }
    return [...numbers].sort((a, b) => a - b);
  }

  function generate(selection = '', random = Math.random) {
    const prompts = selectNumbers(selection).map(number => promptsByNumber.get(number));
    for (let i = prompts.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [prompts[i], prompts[j]] = [prompts[j], prompts[i]];
    }
    return prompts.map(prompt => transform(prompt, random));
  }

  return { size, characterHelp, selectNumbers, generate };
}
