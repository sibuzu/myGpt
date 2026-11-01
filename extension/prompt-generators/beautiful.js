// 美麗性感: natural narratives with a dedicated wardrobe and coordinated palettes.
export function createBeautifulGenerator(common) {
  const { pick, chooseGaze, naturalInteractions, clothingSceneDescription, renderNarrative } = common;
  const beautifulPrefix = '20歲日本女性，半寫實日系動畫風格人像，保留超寫實的真人肌膚質感、細微毛孔與細膩的臉部五官，其餘畫面採用精緻動畫渲染，呈現自然光影與柔和的日系美感。豐滿的胸前尺寸、纖細的腰身、高腿身比，以及修長的雙腿。';
  const beautifulScenes = [
    '日式庭園、紅色鳥居和櫻花樹、石板小徑與飄落花瓣、柔和清晨陽光',
    '海邊木棧道、清澈湛藍的大海和白色沙灘、遠方搖曳的椰子樹、溫暖午後陽光',
    '玫瑰庭院、白色木椅和藤蔓花架、石板地面與散落花瓣、柔和午後側光',
    '巴黎街角咖啡館、歐式建築和復古路燈、石板街道與窗邊花卉、溫暖日間光線',
    '現代城市夜景、玻璃建築和霓虹招牌、乾淨的人行步道、柔和藍紫色環境光',
    '玻璃溫室、翠綠植物和盛開的繡球花、陶製花盆與木質步道、明亮柔和自然光',
    '古典宮殿露台、白色大理石欄杆和雕花石柱、遠方花園與山巒、柔和金色晨光',
    '城市屋頂露台、遠方天際線和點亮的窗戶、花盆與精緻欄杆、藍調時刻的柔和燈光',
    '明亮室內空間、落地窗和白色紗簾、木質地板與翠綠盆栽、清晨溫暖窗光',
    '古典中式庭院、雕花木窗和翠綠竹林、石階與平靜池水、柔和晨光與細緻樹影',
    '薰衣草花田、遠方鄉村小屋和緩緩山丘、蜿蜒小路與淡紫花海、夕陽前的金色光線',
    '湖畔觀景步道、垂柳和清澈湖水、木質欄杆與遠方青山、清新柔和的晨間日光',
    '京都鴨川河畔、古老石橋和沿岸櫻花、平整步道與遠方町屋、清透溫暖的春日陽光',
    '奈良公園林蔭步道、遠處悠閒散步的鹿群、翠綠草地與古典木造建築、柔和午後日光',
    '幽靜竹林、青翠竹葉和蜿蜒石板路、小木橋與清澈溪水、穿過竹葉的斑駁晨光',
    '紫藤花廊、垂落的淡紫色花串、白色花架與整齊石板路、明亮柔和的春日散射光',
    '繡球花庭園、藍紫色花叢和古老石階、青苔矮牆與木質欄杆、雨後清新的柔和自然光',
    '法式花園、典雅噴泉和修剪整齊的綠籬、玫瑰花壇與細石步道、溫暖金色午後光線',
    '義式古鎮廣場、粉彩建築和拱形迴廊、石板地面與街角花店、柔和明亮的日間陽光',
    '地中海海岸小鎮、白色房屋和藍色圓頂、鮮豔九重葛與遠方海景、清透明亮的晴日光線',
    '熱帶度假飯店泳池畔、棕櫚樹和白色遮陽傘、乾燥木質平台與清澈池水、柔和溫暖的午後日光',
    '海港觀景碼頭、白色帆船和波光粼粼的海面、木質步道與整齊繫船柱、夕陽映照的金色側光',
    '山城咖啡館露台、遠方青山和輕盈雲海、木質桌椅與盛開花卉、日出後溫暖的柔和晨光',
    '現代美術館、純白幾何牆面和大片玻璃、石質地板與簡潔雕塑、明亮均勻的自然散射光',
    '復古黑膠唱片店、木質唱片架和懷舊海報、開闊走道與精緻音響、溫暖琥珀色室內燈光',
    '獨立書店、高大木質書架和拱形窗戶、整齊走道與翠綠盆栽、柔和午後窗光',
    '藝術畫室、花卉油畫和木質畫架、整齊畫具與明亮落地窗、溫暖細膩的自然側光',
    '復古爵士酒吧、深色木牆和小型鋼琴舞台、天鵝絨座椅與開闊走道、柔和金色與靛藍色燈光',
    '時尚攝影棚、奶油色無縫背景和簡約展示台、乾淨地面與細緻布景、大面積柔光與淡淡輪廓光',
    '夜間燈海步道、樹梢燈串和星形光飾、平整小徑與兩側花叢、溫暖柔亮的節慶燈光'
  ];
  const beautifulOutfits = [
    {
      palettes: [
        ['櫻花粉色', '奶油白色'], ['天空藍色', '霧灰色'], ['奶油白色', '藏青色'],
        ['薰衣草紫色', '米白色'], ['薄荷綠色', '淺卡其色']
      ],
      describe: ([top, skirt]) => `${top}細肩帶上衣搭配${skirt}高腰A字短裙，裙長至大腿中段`
    },
    {
      palettes: [
        ['米白色', '淺藍色'], ['淡粉色', '靛藍色'], ['淺灰色', '黑色'],
        ['薄荷綠色', '米白色'], ['奶茶色', '水洗藍色']
      ],
      describe: ([top, shorts]) => `${top}合身短袖上衣搭配${shorts}高腰牛仔短褲，褲管剪裁俐落`
    },
    {
      palettes: [
        ['淺藍色', '米白色'], ['奶油白色', '深灰色'], ['淡紫色', '霧灰色'],
        ['蜜桃粉色', '奶茶色'], ['黑色', '象牙白色']
      ],
      describe: ([top, skirt]) => `${top}削肩上衣搭配${skirt}高腰百褶短裙，裙襬輕盈自然`
    },
    {
      palettes: [
        ['淡紫色', '米白色'], ['奶茶色', '深咖啡色'], ['米白色', '炭灰色'],
        ['煙粉色', '深藍色'], ['淺灰色', '黑色']
      ],
      describe: ([top, shorts]) => `${top}露肩針織上衣搭配${shorts}高腰西裝短褲，腰線清楚俐落`
    },
    {
      palettes: [
        ['黑色', '象牙白色'], ['霧灰色', '黑色'], ['淺卡其色', '奶油白色'],
        ['深藍色', '白色'], ['煙粉色', '淺灰色']
      ],
      describe: ([suit, vest]) => `${suit}短版西裝外套、${vest}背心搭配${suit}高腰短裙，呈現都會套裝風格`
    },
    {
      palettes: [
        ['淡青綠色', '米白色'], ['酒紅色', '淡金色'], ['寶藍色', '銀白色'],
        ['象牙白色', '淺粉色'], ['墨綠色', '香檳金色']
      ],
      describe: ([fabric, embroidery]) => `${fabric}修身短版旗袍，裙長至大腿中段，衣襟點綴${embroidery}花卉刺繡`
    },
    {
      palettes: [
        ['奶油白色', '淺棕色'], ['霧藍色', '米白色'], ['淺卡其色', '深咖啡色'],
        ['珊瑚粉色', '奶油白色'], ['黑色', '香檳金色']
      ],
      describe: ([fabric, belt]) => `${fabric}無袖短版連身褲，搭配${belt}細腰帶，腰線俐落，褲管自然舒展`
    },
    {
      palettes: [
        ['酒紅色', '黑色'], ['黑色', '香檳金色'], ['霧藍色', '銀灰色'],
        ['玫瑰粉色', '奶油白色'], ['奶油白色', '淺灰色']
      ],
      describe: ([fabric, belt]) => `${fabric}細肩帶合身短洋裝，搭配${belt}細腰帶，裙長至大腿中段，衣料帶有柔和光澤`
    },
    {
      palettes: [
        ['櫻花粉色', '象牙白色', '銀白色'], ['月白色', '深紅色', '淡粉色'],
        ['淡紫色', '奶油白色', '淡金色'], ['墨藍色', '香檳金色', '淡粉色'],
        ['薄荷綠色', '米白色', '淺粉色']
      ],
      describe: ([fabric, belt, embroidery]) => `${fabric}改良式短版和服，搭配${belt}高腰絲綢腰帶與寬袖設計，裙襬至大腿中段，點綴${embroidery}櫻花刺繡`
    },
    {
      palettes: [
        ['象牙白色', '深藍色'], ['煙粉色', '炭灰色'], ['霧藍色', '奶油白色'],
        ['淡紫色', '黑色'], ['香檳色', '深咖啡色']
      ],
      describe: ([blouse, skirt]) => `${blouse}薄紗襯衫，衣身搭配同色內襯，袖部呈現輕盈薄紗質感，下身搭配${skirt}高腰迷你裙，裙長至大腿中段`
    }
  ];
  const contrastPalettes = [
    ['黑色', '香檳金色'], ['酒紅色', '黑色'], ['深藍色', '銀灰色'],
    ['墨綠色', '象牙白色'], ['紫紅色', '炭灰色']
  ];
  const softPalettes = [
    ['奶油白色', '玫瑰粉色'], ['霧藍色', '米白色'], ['淡紫色', '霧灰色'],
    ['蜜桃粉色', '深咖啡色'], ['淺卡其色', '象牙白色']
  ];
  const beautiful2Outfits = [
    ...beautifulOutfits,
    {
      palettes: contrastPalettes,
      describe: ([top, skirt]) => `${top}平口短版上衣搭配${skirt}高腰包臀迷你裙，線條俐落，裙長至大腿中段`
    },
    {
      palettes: softPalettes,
      describe: ([top, skirt]) => `${top}掛脖短上衣搭配${skirt}高腰側開衩短裙，腰間點綴細緻金屬扣環`
    },
    {
      palettes: contrastPalettes,
      describe: ([top, shorts]) => `${top}深V領長袖短上衣搭配${shorts}高腰修身短褲，衣料呈現細膩垂墜感`
    },
    {
      palettes: softPalettes,
      describe: ([top, skirt]) => `${top}露背繫帶上衣搭配${skirt}高腰皮質A字迷你裙，背部飾有交叉細帶`
    },
    {
      palettes: contrastPalettes,
      describe: ([top, skirt]) => `${top}單肩斜領短上衣搭配${skirt}不對稱迷你裙，裙襬帶有俐落斜切線條`
    },
    {
      palettes: softPalettes,
      describe: ([top, skirt]) => `${top}交叉繫帶短上衣搭配${skirt}高腰短裙，腰側點綴細緻繫帶與小巧金屬環`
    },
    {
      palettes: contrastPalettes,
      describe: ([fabric, trim]) => `${fabric}側腰鏤空合身短洋裝，領口與腰側飾有${trim}細邊，裙長至大腿中段`
    },
    {
      palettes: softPalettes,
      describe: ([top, skirt]) => `${top}馬甲式短上衣搭配${skirt}高腰百褶迷你裙，衣身帶有精緻結構線與花邊領口`
    },
    {
      palettes: contrastPalettes,
      describe: ([top, shorts]) => `${top}緞面細肩帶短上衣搭配${shorts}高腰皮質短褲，布料光澤與柔霧皮革形成層次`
    },
    {
      palettes: softPalettes,
      describe: ([top, skirt]) => `${top}露肩短上衣搭配${skirt}側綁帶迷你裙，袖口微微蓬起，裙身剪裁貼合自然曲線`
    },
    {
      palettes: contrastPalettes,
      describe: ([fabric, belt]) => `${fabric}腰側鏤空無袖連身短褲，搭配${belt}細腰帶與俐落V形領口，褲管呈現自然線條`
    }
  ];
  const beautifulAngles = [
    ['正面平視全身拍攝', '臉部自然朝向前方，視線輕落在畫面側方'],
    ['左前方45度全身拍攝', '身體微微側轉，望向側前方景物'],
    ['右前方45度全身拍攝', '臉部自然側轉，視線落在畫面外'],
    ['三分之二側面全身拍攝', '身體自然回頭，望向身後景色'],
    ['側面平視全身拍攝', '側臉順著身體方向，視線落在前方'],
    ['背後斜側全身拍攝', '上半身自然轉回，目光回望身後景物'],
    ['輕微仰角全身拍攝', '臉部自然朝向前方，目光略看向遠處'],
    ['約30度俯視全身拍攝', '微微低頭，視線自然落在側前方']
  ];
  const beautifulHandPoses = [
    '一手輕撥長髮，另一手自然垂放',
    '一手輕扶髮側，另一手自然放在腰側',
    '一手提著小巧手袋，另一手自然垂放',
    '雙手輕鬆交疊於身前',
    '一手輕扶肩邊長髮，另一手放在身側'
  ];
  const beautifulPoses = [
    { name: '跨步站姿', description: '單腿向前跨步呈現動態姿勢' },
    { name: '交腿站姿', description: '雙腿自然交錯站立，重心輕放在後腳' },
    { name: '點地站姿', description: '單腳向前輕點地面，姿態輕盈自然' },
    { name: '錯步站姿', description: '雙腳前後錯開站立，身體線條自然舒展' },
    { name: '輕盈步行', description: '向前緩步行走，雙腿自然交替，步伐輕盈' },
    {
      name: '行走回眸', description: '向前緩步行走，自然回頭留意身後景物',
      anglePattern: /45度|三分之二|背後/,
      gaze: '回頭時視線順著身後景物延伸，保留行走中的自然瞬間'
    },
    { name: '輕盈轉身', description: '自然轉動身體，一腳向外輕點，捕捉動態瞬間' },
    {
      name: '側倚欄杆', description: '身體輕靠欄杆，雙腿前後自然交錯',
      scenePattern: /欄杆|露台|木棧道|碼頭|河畔|石橋|小木橋|湖畔/,
      setting: '人物身旁設有一道精緻欄杆'
    },
    {
      name: '椅上側坐', description: '側坐椅緣，雙腿併攏向斜前方延伸',
      scenePattern: /咖啡館|室內|書店|畫室|酒吧|攝影棚|露台|庭院|花園|溫室/,
      setting: '場景一側擺放一張木質座椅'
    },
    {
      name: '長椅交腿坐', description: '坐在長椅上，雙腿自然交疊，上身微微側轉',
      scenePattern: /公園|庭園|庭院|花園|湖畔|河畔|步道|溫室|花廊/,
      setting: '步道旁設有一張舒適長椅'
    },
    {
      name: '台階錯落坐姿', description: '坐在石階上，一腿彎曲，另一腿向前舒展',
      scenePattern: /石階|庭園|庭院|宮殿|古鎮|石橋|海岸小鎮|美術館/,
      setting: '場景一側設有寬闊的石階'
    },
    {
      name: '花旁低蹲', description: '在花叢旁自然蹲下，雙膝靠攏',
      scenePattern: /庭園|庭院|花園|花田|公園|草地|湖畔|河畔|溫室|花廊|繡球花/,
      setting: '人物身旁有一片低矮花叢',
      hands: '一手輕扶花葉，另一手自然放在膝側',
      anglePattern: /正面|45度|側面平視|俯視/,
      gaze: '目光停留在手邊花葉，像在觀察花瓣細節'
    },
    {
      name: '草地側坐', description: '坐在草地上，雙腿向同側收攏',
      scenePattern: /公園|草地|庭園|花園|花田|湖畔|河畔/,
      setting: '場景一側是平整柔軟的草地',
      hands: '一手輕撐身旁草地，另一手自然放在膝上',
      anglePattern: /正面|45度|側面平視|俯視/,
      gaze: '自然看向身旁草地，神情放鬆'
    },
    {
      name: '野餐墊側躺', description: '側躺於野餐墊，雙腿自然伸展',
      scenePattern: /公園|草地|庭園|花園|花田|湖畔|河畔/,
      setting: '平整草地上鋪著一張野餐墊',
      hands: '一手支頭，另一手輕放在身側',
      anglePattern: /正面|45度|側面平視|俯視/,
      gaze: '目光看向畫面外的景色，神情寧靜'
    },
    {
      name: '躺椅斜靠', description: '放鬆斜靠躺椅，雙腿向前延伸',
      scenePattern: /泳池畔|露台|室內|庭院|花園|海邊|攝影棚/,
      setting: '場景一側擺放一張設有扶手的躺椅',
      hands: '一手搭在扶手上，另一手輕放在身側',
      anglePattern: /正面|45度|側面平視|俯視/,
      gaze: '放鬆斜靠時，目光落在畫面側方'
    }
  ];
  let previousBeautifulScene = null;
  let previousBeautifulPose = null;
  const previousOutfitPalettes = new Map();

  function describeOutfit(outfits) {
    const outfit = pick(outfits);
    const palette = pick(outfit.palettes.filter(item => item !== previousOutfitPalettes.get(outfit)));
    previousOutfitPalettes.set(outfit, palette);
    return outfit.describe(palette);
  }

  function generate(context) {
    const { scene, look } = context;
    const interaction = chooseGaze(naturalInteractions(look.text, scene.description));
    const outfitDescription = describeOutfit(beautiful2Outfits);
    return renderNarrative(context, {
      lookDescription: [`身穿${outfitDescription}`, ...look.details].join('，'),
      sceneDescription: clothingSceneDescription(scene.description, outfitDescription),
      interaction
    });
  }

  function generateLegacy() {
    const pose = pick(beautifulPoses.filter(item => item !== previousBeautifulPose));
    const scene = pick(beautifulScenes.filter(item => item !== previousBeautifulScene
      && (!pose.scenePattern || pose.scenePattern.test(item))));
    previousBeautifulScene = scene;
    previousBeautifulPose = pose;
    const outfitDescription = describeOutfit(beautifulOutfits);
    const angleOptions = beautifulAngles.filter(([angle]) => !pose.anglePattern || pose.anglePattern.test(angle));
    const [angle, gaze] = pick(angleOptions);
    const baseGaze = pose.gaze !== undefined ? pose.gaze : gaze;
    const isLookingBack = /回頭|回眸|背後|轉回/.test(angle + gaze + pose.description);
    const handOptions = pose.hands ? [pose.hands] : beautifulHandPoses;
    // Keep arms away from the hair and shoulders during over-the-shoulder poses.
    const compatibleHands = isLookingBack
      ? ['雙手自然垂放於身側', ...handOptions.filter(hand => !/髮/.test(hand))]
      : handOptions;
    const handPose = pick(compatibleHands);
    const gazeDescription = chooseGaze(pose.gaze || isLookingBack
      ? [baseGaze]
      : /髮/.test(handPose)
        ? ['自然整理髮絲，視線微微垂向側下方', '輕撥髮絲時看向身旁景物，保留不經意的瞬間']
        : /手袋/.test(handPose)
          ? ['自然提著手袋，目光放鬆看向側前方', '輕輕調整手袋位置，視線落在手邊動作上']
          : [baseGaze]);
    const details = [
      scene,
      pose.setting,
      outfitDescription,
      angle,
      gazeDescription,
      handPose,
      pose.description,
      '雙腿與鞋履完整入鏡，呈現自然修長的腿部線條',
      '直式 9:16'
    ].filter(Boolean).join('、') + '。';
    return beautifulPrefix + '\n\n' + details;
  }

  return { generate, generateLegacy };
}
