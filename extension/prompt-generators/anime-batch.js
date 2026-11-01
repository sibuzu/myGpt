// Each click generates exactly one prompt per selected character in shuffled order.
// export const ANIME_BATCH_CHARACTER_IDS = Object.freeze([
//   4, 5, 7, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 24, 25, 26,
//   33, 37, 38, 41, 43, 44, 46, 52, 54, 55, 59, 60, 61, 62, 63
// ]);
export const ANIME_BATCH_CHARACTER_IDS = Object.freeze(
  Array.from({ length: 63 }, (_, i) => i + 1)
);

export function generateAnimeBatch(generateCharacterPrompt) {
  const ids = [...ANIME_BATCH_CHARACTER_IDS];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.map(id => generateCharacterPrompt(id));
}
