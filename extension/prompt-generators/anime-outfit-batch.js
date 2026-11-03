// Shared character#outfit range selection and shuffle for bundled anime prompts.
export function createAnimeOutfitBatch(sourcePrompts, transform = prompt => prompt) {
  const size = sourcePrompts.length;
  const outfitsPerCharacter = 4;
  const characterCount = size / outfitsPerCharacter;

  function promptNumber(characterText, outfitText) {
    const character = Number(characterText);
    const outfit = Number(outfitText);
    if (!Number.isInteger(character) || character < 1 || character > characterCount
      || !Number.isInteger(outfit) || outfit < 1 || outfit > outfitsPerCharacter) {
      throw new RangeError(`角色編號須介於 1–${characterCount}，套裝編號須介於 1–${outfitsPerCharacter}。`);
    }
    return (character - 1) * outfitsPerCharacter + outfit;
  }

  function selectNumbers(selection = '') {
    const text = selection.trim();
    if (!text) return Array.from({ length: size }, (_, index) => index + 1);

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
        : token.includes('-') ? size : start;
      if (start > end) throw new RangeError('範圍起點不可大於終點。');
      for (let number = start; number <= end; number++) numbers.add(number);
    }
    return [...numbers].sort((a, b) => a - b);
  }

  function generate(selection = '', random = Math.random) {
    const prompts = selectNumbers(selection).map(number => sourcePrompts[number - 1]);
    for (let i = prompts.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [prompts[i], prompts[j]] = [prompts[j], prompts[i]];
    }
    return prompts.map(prompt => transform(prompt, random));
  }

  return { size, selectNumbers, generate };
}
