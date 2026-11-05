import { NATURAL_OUTFITS } from './prompt-generators/natural-outfits.js';
import { createFashionWardrobe } from './prompt-generators/fashion.js';
import { ANIME_CHARACTERS } from './prompt-generators/anime-characters.js';
import { BACKGROUNDS, POSES } from './prompt-generators/scene-options.js';
import { EXPRESSION_OPTIONS } from './prompt-generators/expression-options.js';

export const ZERO_GRAVITY_RATE = 0.2;
export const APPEARANCE_RATE = 0.1;

export function selectAutomaticClothing(random = Math.random) {
  const roll = random();
  return roll < 0.3 ? 'sexy' : roll < 0.6 ? 'anime' : 'mini';
}

const OUTLOOKS = [
  '堅毅爽朗', '清新自然', '溫柔沉靜', '甜美優雅', '知性溫柔', '親切自然',
  '清新優雅', '恬靜清雅', '高貴優雅', '清新自在', '溫柔自然', '從容優雅',
  '甜美親切', '優雅時尚', '神秘優雅', '文雅自然', '清爽從容', '文藝溫柔',
  '恬靜專注', '知性好奇', '從容自在', '甜美活潑'
];

export function createPromptGenerator({ random = Math.random } = {}) {
  const pick = options => options[Math.floor(random() * options.length)];
  const fashion = createFashionWardrobe({ pick });
  const characters = ANIME_CHARACTERS.filter(character => character.enabled !== false);
  const previous = new Map();
  const next = (key, options) => {
    const candidates = options.filter(option => option !== previous.get(key));
    const value = pick(candidates.length ? candidates : options);
    previous.set(key, value);
    return value;
  };

  function clothing(type) {
    switch (type) {
      case 'natural': return next('natural', NATURAL_OUTFITS);
      case 'sexy': return fashion.sexy();
      case 'mini': return fashion.mini();
      case 'anime': {
        const character = next('anime', characters);
        const outfits = character.fashionOutfits?.length ? character.fashionOutfits : [character.baseOutfit];
        return `${character.features}，身穿${next(`outfit-${character.id}`, outfits)}`;
      }
      default: throw new RangeError('請選擇自動、清新、性感、動漫或迷你裙。');
    }
  }

  function generate({ clothingType = 'auto', sceneType = 'auto' } = {}) {
    if (!['zero-gravity', 'auto'].includes(sceneType)) throw new RangeError('請選擇無重力或自動場景。');
    const outfit = clothing(clothingType === 'auto' ? selectAutomaticClothing(random) : clothingType);
    const outlook = next('outlook', OUTLOOKS);
    const appearance = random() < APPEARANCE_RATE ? '、胸部圓潤' : '';
    const scene = sceneType === 'zero-gravity' || random() < ZERO_GRAVITY_RATE
      ? '無重力空間，天空。' : next('background', BACKGROUNDS);
    const pose = next('pose', POSES);
    const expression = pick(EXPRESSION_OPTIONS);
    return [
      `一位氣質${outlook}${appearance}的成年日本年輕女性，${expression}，半寫實日系動畫風格人像，保留超寫實的真人肌膚質感、細微毛孔與細膩的臉部五官。`,
      outfit,
      scene,
      `姿勢：${pose}`,
      '電影級構圖，細膩華麗，細節豐富，4K，高品質畫面，直式 9:16。'
    ].join('\n\n');
  }

  return { generate };
}
