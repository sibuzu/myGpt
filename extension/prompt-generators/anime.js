// 動漫角色: character-specific wardrobes, appearance, facing and image captions.
import { ANIME_CHARACTERS } from '../anime-characters.js';

// Disabled records reserve their IDs for existing outfit references.
const availableCharacters = ANIME_CHARACTERS.filter(character => character.enabled !== false);

export function createAnimeGenerator(common) {
  const { pick, chooseGaze, naturalInteractions, clothingSceneDescription, renderNarrative } = common;
  let previousAnimeCharacter = null;
  const previousCharacterOutfits = new Map();
  const animeFacingOptions = [
    { side: '左', caption: '左下角' },
    { side: '右', caption: '右下角' }
  ];
  let animeFacingPool = [];

  function nextAnimeFacing() {
    if (!animeFacingPool.length) {
      animeFacingPool = Math.random() < 0.5 ? [...animeFacingOptions] : [...animeFacingOptions].reverse();
    }
    return animeFacingPool.pop();
  }

  function animeAttentionPlacement(interaction, facing, coversEyes = false) {
    if (/鏡頭/.test(interaction)) return '';
    const target = /圖鑑/.test(interaction) ? '植物圖鑑'
      : /書頁|文字/.test(interaction) ? '書本'
        : /畫作|作品|筆觸|紙上/.test(interaction) ? '作品'
          : /杯|飲品/.test(interaction) ? '杯子'
            : /小狗/.test(interaction) ? '小狗'
              : /橘貓/.test(interaction) ? '橘貓'
                : /花|綠葉|植物/.test(interaction) ? '花草'
                  : /星光|星座|光點/.test(interaction) ? '星光與光點'
                    : '人物留意的景物或互動物件';
    return `${target}安排在觀看者畫面${facing.side}側，${coversEyes ? '頭部朝同側自然微轉' : '視線隨動作自然朝同側延伸'}`;
  }

  function describeCharacterOutfit(character) {
    const outfits = character.fashionOutfits;
    if (!outfits?.length) return character.baseOutfit;
    const candidates = outfits.filter(item => item !== previousCharacterOutfits.get(character));
    const description = pick(candidates.length ? candidates : outfits);
    previousCharacterOutfits.set(character, description);
    return description;
  }

  function generate(context, characterId) {
    const { theme, scene, expression } = context;
    const character = characterId === undefined
      ? pick(availableCharacters.filter(item => item !== previousAnimeCharacter))
      : availableCharacters.find(item => item.id === characterId);
    if (!character) throw new RangeError(`Unknown anime character ID: ${characterId}`);
    previousAnimeCharacter = character;
    const outfitDescription = describeCharacterOutfit(character);
    const interaction = chooseGaze(naturalInteractions(character.features + '，' + outfitDescription, scene.description));
    const lookDescription = `保留原角色的${character.features}，身穿${outfitDescription}`;
    const sceneDescription = clothingSceneDescription(scene.description, outfitDescription)
      .replace(/大學校園/g, '校園').replace(/大學圖書館/g, '圖書館');
    let renderedInteraction = character.coversEyes
      ? /鏡頭/.test(interaction)
        ? '頭部在動作間短暫朝向鏡頭，隨後自然轉開'
        : '隨著手邊動作微微轉頭，以放鬆的肩線呈現留意周圍景物的自然姿態'
      : interaction;
    const gazeDirection = interaction.match(/([右左])(?:前)?方/)?.[1];
    const characterFacing = { ...nextAnimeFacing() };
    if (gazeDirection) characterFacing.side = gazeDirection;
    // Face forward 40% of the time; each side angle has a 15% overall chance.
    const faceCamera = /鏡頭/.test(interaction);
    const facingAngle = faceCamera ? 0 : pick([10, 15, 20, 30]);
    if (facingAngle === 0) {
      renderedInteraction = character.coversEyes
        ? '頭部保持正面朝向鏡頭，以放鬆的姿態與觀看者互動'
        : '眼神自然直視鏡頭，目光朝向前方的觀看者，保持自然放鬆的姿態';
    } else if (/鏡頭/.test(renderedInteraction)) {
      renderedInteraction = character.coversEyes
        ? '頭部保持自然微側，隨著手邊動作放鬆轉動'
        : '保持自然微側臉，僅眼神短暫望向鏡頭，隨後移回周圍景物';
    }
    const prompt = renderNarrative(context, {
      subject: `以《${character.workJa}》的${character.jaName}${character.jaName === character.name ? '' : `（${character.name}）`}為主角`,
      presentation: '半寫實日系動畫風格人像，保留超寫實的真人肌膚質感、細微毛孔與細膩的臉部五官',
      lookDescription,
      sceneDescription,
      expression: character.coversEyes ? '人物神情沉靜從容，姿態自然' : expression,
      facing: facingAngle === 0
        ? '人物頭部正面朝向鏡頭，鼻尖朝向正前方'
        : `以觀看者畫面左右為準，人物頭部自然朝畫面${characterFacing.side}側微轉約${facingAngle}度，鼻尖指向畫面${characterFacing.side}方`,
      interaction: renderedInteraction,
      attention: facingAngle === 0 ? null : animeAttentionPlacement(renderedInteraction, characterFacing, character.coversEyes),
      atmosphere: (scene.atmosphere || theme.atmosphere).replace(/成年大學生的/g, '清爽的')
    });
    const captionName = character.captionName ?? character.jaName;
    return prompt + `${characterFacing.caption}以清晰簡潔的字體標示「${captionName}《${character.workJa}》」，文字較長時分成兩行，保留邊距且不遮擋人物。`;
  }

  return { generate };
}
