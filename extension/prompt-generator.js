// Shared prompt helpers and the single entry point used by the side panel.
import { createNaturalGenerator } from './prompt-generators/natural.js';
import { createBeautifulGenerator } from './prompt-generators/beautiful.js';
import { createAnimeGenerator } from './prompt-generators/anime.js';
import { createZeroGravityGenerator } from './prompt-generators/zero-gravity.js';
import { createZeroGravity2Generator } from './prompt-generators/zero-gravity-2.js';
import { ANIME_BATCH_CHARACTER_IDS, generateAnimeBatch } from './prompt-generators/anime-batch.js';
export { LIFE_STORY_SIZE, generateLifeStoryBatch, selectLifeStoryNumbers } from './prompt-generators/life-story.js';
export { ANIME_DRESS_SIZE, generateAnimeDressBatch, selectAnimeDressNumbers } from './prompt-generators/anime-dress.js';
export { ANIME_COMPLETE_SIZE, generateAnimeCompleteBatch, selectAnimeCompleteNumbers } from './prompt-generators/anime-complete.js';

function createLook(text, clothingClauses = [0]) {
  return { text, details: text.split('，').filter((_, index) => !clothingClauses.includes(index)) };
}

const pick = items => items[Math.floor(Math.random() * items.length)];

function chooseGaze(interactions) {
  // Weighted interactions include their own camera choice and bypass the default glance rate.
  if (typeof interactions[0] === 'object') {
    let roll = Math.random() * interactions.reduce((total, option) => total + option.weight, 0);
    for (const option of interactions) {
      if (roll < option.weight) return option.text;
      roll -= option.weight;
    }
    return interactions[interactions.length - 1].text;
  }
  const roll = Math.random();
  if (roll >= 0.6) return '在動作間自然看向鏡頭，保持自然放鬆的姿態';
  return pick(interactions).replaceAll('{side}', roll < 0.3 ? '右' : '左');
}

function naturalInteractions(look, description) {
  if (/翻閱|文學書|書頁/.test(description)) {
    return ['翻閱書頁時微微低頭，目光停留在{side}方的文字上', '停在感興趣的段落，視線沿著{side}方書頁自然移動'];
  }
  if (/植物圖鑑/.test(look)) {
    return ['低頭查看植物圖鑑，再自然看向{side}方身旁綠葉', '目光在圖鑑與{side}方植物之間移動，像在辨認葉片'];
  }
  if (/畫筆|油畫/.test(description)) {
    return ['手邊動作自然停頓，目光專注於{side}方畫作細節', '欣賞作品時微微側頭，視線停留在{side}方的色彩與筆觸上'];
  }
  if (/素描鉛筆|速寫/.test(description)) {
    return ['低頭整理素描線條，視線專注於{side}方紙上作品', '手中鉛筆稍作停頓，目光看向{side}方，像在思考下一筆的位置'];
  }
  if (/伸展|慢跑步道/.test(description)) {
    return ['隨著呼吸自然調整姿態，目光放鬆看向{side}方', '運動間稍作停頓，視線沿著{side}方步道延伸'];
  }
  if (/舞蹈教室|輕盈轉身/.test(description)) {
    return ['視線順著動作朝{side}方延伸，神情專注而流暢', '轉動肩線時自然望向{side}方，捕捉動作尚未停下的瞬間'];
  }
  if (/牽著.*狗/.test(description)) {
    return ['散步時低頭留意{side}方小狗的步伐，神情自然親切', '視線隨著小狗與{side}方小徑移動，保留生活抓拍感'];
  }
  if (/橘貓/.test(description)) {
    return ['自然低頭看向{side}方身旁橘貓，嘴角帶著淡淡笑意', '視線隨著{side}方橘貓的動作輕移，像被捕捉到互動片刻'];
  }
  if (/陶瓷.*杯|拿鐵|熱茶杯|花茶/.test(description)) {
    return ['微微低頭欣賞杯中飲品，目光自然停留在{side}方杯緣', '目光從桌上飲品移向{side}方周圍景色，保留悠閒生活感'];
  }
  if (/星空|星座|水晶球/.test(description)) {
    return ['抬眼觀察遠方星光，視線順著{side}方發光星座延伸', '微微側頭觀察{side}方漂浮光點，像在專注感受周圍景象'];
  }
  if (/花|植物|綠葉|草地/.test(description + look)) {
    return ['稍微停下動作欣賞身旁花草，視線自然移向{side}方', '隨微風輕輕側頭，目光停留在{side}方身旁植物與花朵'];
  }
  if (/漫步|走在|旅行地圖/.test(description)) {
    return [
      { text: '步伐自然延續，視線落在右前方路線，像被捕捉到行走中的瞬間', weight: 3 },
      { text: '步伐自然延續，視線落在左前方路線，像被捕捉到行走中的瞬間', weight: 3 },
      { text: '步伐自然延續，眼神自然看向鏡頭，像被捕捉到行走中的瞬間', weight: 4 }
    ];
  }
  return ['輕輕側頭欣賞周圍景物，目光自然落在畫面{side}方外', '手邊動作自然延續，視線放鬆看向{side}方'];
}

function clothingSceneDescription(description, outfitDescription) {
  return /短褲|長褲|連身褲/.test(outfitDescription)
    ? description.replace(/裙襬/g, '衣料')
    : description;
}

function renderNarrative(context, overrides) {
  const { theme, scene, look, expression, light } = context;
  const parts = {
    subject: `一位${scene.subject || theme.subject}`,
    presentation: null,
    lookDescription: look.text,
    sceneDescription: scene.description,
    expression,
    facing: null,
    interaction: null,
    attention: null,
    light,
    atmosphere: scene.atmosphere || theme.atmosphere,
    visualStyle: scene.style || theme.style,
    ...overrides
  };
  return [
    parts.subject,
    parts.presentation,
    parts.lookDescription,
    parts.sceneDescription,
    parts.expression,
    parts.facing,
    parts.interaction,
    parts.attention,
    parts.light,
    parts.atmosphere,
    parts.visualStyle,
    '細節豐富，4K，高品質畫面，直式 9:16'
  ].filter(Boolean).join('，') + '。';
}

const common = { createLook, pick, chooseGaze, naturalInteractions, clothingSceneDescription, renderNarrative };
const natural = createNaturalGenerator(common);
const beautiful = createBeautifulGenerator(common);
const anime = createAnimeGenerator(common);
const zeroGravity = createZeroGravityGenerator(common);
const zeroGravity2 = createZeroGravity2Generator(common);

export const ANIME_BATCH_SIZE = ANIME_BATCH_CHARACTER_IDS.length;

export function generateAnimeCharacterBatch(count = ANIME_BATCH_SIZE) {
  return generateAnimeBatch(id => anime.generate(natural.nextContext(), id), count);
}

export function generateImagePrompt(style = 'natural') {
  // Keep the older programmatic style key compatible with its original generator.
  if (style === 'beautiful-sexy') return beautiful.generateLegacy();
  if (style === 'zero-gravity') return zeroGravity.generate();
  if (style === 'zero-gravity-2') return zeroGravity2.generate();
  const context = natural.nextContext();
  switch (style) {
    case 'beautiful-sexy-2': return beautiful.generate(context);
    case 'anime-characters': return anime.generate(context);
    default: return natural.generate(context);
  }
}
