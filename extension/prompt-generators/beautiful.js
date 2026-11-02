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
    '夜間燈海步道、樹梢燈串和星形光飾、平整小徑與兩側花叢、溫暖柔亮的節慶燈光',
    '銀杏林蔭大道、金黃色樹冠和落葉地毯、復古長椅與整齊矮籬、穿過枝葉的柔和秋日陽光',
    '楓紅溪谷步道、緋紅楓葉和清澈溪流、青苔岩石與木質小橋、雨後通透的柔和晨光',
    '白樺林間步道、銀白樹幹和嫩綠枝葉、細碎野花與平整木棧道、清晨薄霧中的柔和散射光',
    '山間梯田茶園、層層翠綠茶樹和蜿蜒石階、竹編茶亭與遠方山嵐、日出後清透的金色晨光',
    '高山草甸觀景台、低矮野花和綿延山稜、木質欄杆與遠方白雲、明亮清新的夏日自然光',
    '向日葵花田、金黃色花盤和鄉村風車、田間小徑與白色木籬笆、溫暖飽滿的午後陽光',
    '鬱金香花園、粉紅與奶油色花帶、石質噴泉與拱形花門、柔和明亮的春日晨光',
    '波斯菊花田、輕盈粉白花海和遠方小山、平整土徑與木質休息亭、夕陽前清透的暖色側光',
    '桃花果園、粉色花枝和古樸農舍、青石小徑與矮木柵欄、薄雲透出的柔和春日陽光',
    '荷塘庭園、碧綠荷葉和淡粉荷花、曲折木橋與臨水涼亭、夏日清晨的柔和水面反光',
    '海岸燈塔步道、白色燈塔和開闊海灣、低矮野草與石質欄杆、落日前溫暖的金色海風光影',
    '運河小鎮河畔、彩色窗框和拱形石橋、繫泊小船與沿岸花箱、清透柔和的午後日光',
    '復古電車街道、奶油色車站和沿街小店、整齊人行道與懷舊站牌、明亮溫暖的上午陽光',
    '紅磚倉庫藝術區、工業風窗框和戶外雕塑、寬闊石板廣場與創意招牌、傍晚柔和的橙金側光',
    '歐式車站大廳、高聳拱窗和復古大鐘、石質地板與木質候車長椅、屋頂玻璃灑下的均勻自然光',
    '拱廊商店街、連續石柱和精緻櫥窗、馬賽克地磚與街角花盆、拱廊內柔和明亮的漫射日光',
    '雨後城市廣場、映著天空的石板地面、現代噴泉與整齊街樹、雲層散開後的清透柔光',
    '山間湖景飯店露台、寧靜湖灣和層疊山色、玻璃欄杆與柔軟戶外座椅、藍調清晨的淡金日光',
    '海景餐廳室內、弧形落地窗和遼闊海面、亞麻桌布與玻璃花瓶、映入窗邊的柔和海面反光',
    '手作麵包店、木質展示櫃和新鮮出爐的麵包、奶油色磁磚與窗邊座椅、清晨溫暖的自然窗光',
    '花藝工作室、層疊花束和透明玻璃花器、木質工作桌與整齊緞帶架、柔和細膩的午後窗光',
    '陶藝工坊室內、素色陶瓶和木質展示架、乾淨工作台與米色亞麻簾、帶有暖意的自然側光',
    '音樂練習室、黑色三角鋼琴和木質譜架、淺色地板與高挑窗戶、午後安靜柔和的窗邊日光',
    '古典劇院門廳、水晶吊燈和酒紅色絨布、弧形樓梯與黃銅扶手、細膩柔和的香檳金色燈光',
    '精品旅館中庭、圓形天井和水磨石地面、低矮綠植與弧形沙發、天窗灑下的均勻柔和日光',
    '歷史博物館長廊、古典雕像和高聳石柱、寬闊走道與拱形窗戶、溫暖細膩的午後斜光',
    '海洋水族館觀景廊、湛藍水景和悠游魚群、寬闊玻璃窗與深色石質地面、柔和水波光影與暖色補光',
    '天文館星空展廳、深藍穹頂和細緻星座光點、圓弧步道與簡約展示台、柔和靛藍環境光與淡金輪廓光',
    '復古旋轉木馬樂園、彩繪木馬和奶油色棚頂、整齊石板廣場與小巧花壇、傍晚暖色燈串與柔和夕光',
    '河岸花燈步道、映在水面的紙燈與石橋、平整小徑和沿岸柳樹、柔和月光交織溫暖燈籠光'
  ];
  const beautifulBottoms = [
    '高腰A字短裙', '牛仔迷你裙', '百褶短裙', '高腰迷你裙', '高腰短裙', '迷你裙'
  ];
  const beautifulOutfits = [
    {
      palettes: [
        ['櫻花粉色', '奶油白色'], ['天空藍色', '霧灰色'], ['奶油白色', '藏青色'],
        ['薰衣草紫色', '米白色'], ['薄荷綠色', '淺卡其色']
      ],
      top: '細肩帶上衣'
    },
    {
      palettes: [
        ['米白色', '淺藍色'], ['淡粉色', '靛藍色'], ['淺灰色', '黑色'],
        ['薄荷綠色', '米白色'], ['奶茶色', '水洗藍色']
      ],
      top: '短袖上衣'
    },
    {
      palettes: [
        ['淺藍色', '米白色'], ['奶油白色', '深灰色'], ['淡紫色', '霧灰色'],
        ['蜜桃粉色', '奶茶色'], ['黑色', '象牙白色']
      ],
      top: '削肩上衣'
    },
    {
      palettes: [
        ['淡紫色', '米白色'], ['奶茶色', '深咖啡色'], ['米白色', '炭灰色'],
        ['煙粉色', '深藍色'], ['淺灰色', '黑色']
      ],
      top: '露肩上衣'
    },
    {
      palettes: [
        ['黑色', '象牙白色'], ['霧灰色', '黑色'], ['淺卡其色', '奶油白色'],
        ['深藍色', '白色'], ['煙粉色', '淺灰色']
      ],
      top: '掛脖上衣'
    },
    {
      palettes: [
        ['淡青綠色', '米白色'], ['酒紅色', '淡金色'], ['寶藍色', '銀白色'],
        ['象牙白色', '淺粉色'], ['墨綠色', '香檳金色']
      ],
      describe: ([fabric, embroidery]) => `${fabric}短版旗袍，衣襟點綴${embroidery}花卉刺繡`
    },
    {
      palettes: [
        ['奶油白色', '淺棕色'], ['霧藍色', '米白色'], ['淺卡其色', '深咖啡色'],
        ['珊瑚粉色', '奶油白色'], ['黑色', '香檳金色']
      ],
      describe: ([fabric, belt]) => `${fabric}無袖短版連身裙+${belt}細腰帶`
    },
    {
      palettes: [
        ['酒紅色', '黑色'], ['黑色', '香檳金色'], ['霧藍色', '銀灰色'],
        ['玫瑰粉色', '奶油白色'], ['奶油白色', '淺灰色']
      ],
      describe: ([fabric, belt]) => `${fabric}細肩帶短洋裝+${belt}細腰帶`
    },
    {
      palettes: [
        ['櫻花粉色', '象牙白色', '銀白色'], ['月白色', '深紅色', '淡粉色'],
        ['淡紫色', '奶油白色', '淡金色'], ['墨藍色', '香檳金色', '淡粉色'],
        ['薄荷綠色', '米白色', '淺粉色']
      ],
      describe: ([fabric, belt, embroidery]) => `${fabric}短版和服+${belt}絲綢腰帶，點綴${embroidery}櫻花刺繡`
    },
    {
      palettes: [
        ['象牙白色', '深藍色'], ['煙粉色', '炭灰色'], ['霧藍色', '奶油白色'],
        ['淡紫色', '黑色'], ['香檳色', '深咖啡色']
      ],
      top: '薄紗襯衫'
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
  const beautiful2Bottoms = [
    ...beautifulBottoms,
    '比基尼泳褲', '側開衩短裙', '不對稱迷你裙',
    '高腰短裙，腰側點綴細緻繫帶與小巧金屬環',
    '百褶迷你裙', '皮質迷你裙', '側綁帶迷你裙'
  ];
  const beautiful2Outfits = [
    ...beautifulOutfits,
    {
      palettes: contrastPalettes,
      top: '短版上衣'
    },
    {
      palettes: softPalettes,
      top: '掛脖上衣'
    },
    {
      palettes: contrastPalettes,
      top: '深V短上衣'
    },
    {
      palettes: softPalettes,
      top: '胸罩式上衣'
    },
    {
      palettes: contrastPalettes,
      top: '單肩上衣'
    },
    {
      palettes: softPalettes,
      top: '交叉繫帶短上衣'
    },
    {
      palettes: contrastPalettes,
      describe: ([fabric, trim]) => `${fabric}側腰鏤空短洋裝，領口與腰側飾有${trim}細邊`
    },
    {
      palettes: softPalettes,
      top: '馬甲式短上衣'
    },
    {
      palettes: contrastPalettes,
      top: '肩帶短上衣'
    },
    {
      palettes: softPalettes,
      top: '露肩短上衣'
    },
    {
      palettes: softPalettes,
      top: '細肩帶背心'
    },
    {
      palettes: contrastPalettes,
      describe: ([fabric, belt]) => `${fabric}V形領口腰側鏤空無袖連身裙+${belt}細腰帶`
    }
  ];
  const beautifulAngles = [
    ['正面平視全身拍攝', '臉部自然朝向前方，視線輕落在畫面{side}方'],
    ['左前方45度全身拍攝', '身體微微側轉，望向{side}前方景物'],
    ['右前方45度全身拍攝', '臉部自然側轉，視線落在畫面{side}方外'],
    ['三分之二側面全身拍攝', '身體自然回頭，望向{side}方身後景色'],
    ['側面平視全身拍攝', '側臉順著身體方向，視線落在{side}方'],
    ['背後斜側全身拍攝', '上半身自然轉回，目光回望{side}方身後景物'],
    ['輕微仰角全身拍攝', '臉部自然朝向前方，目光略看向{side}方遠處'],
    ['約30度俯視全身拍攝', '微微低頭，視線自然落在{side}前方']
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
      gaze: '回頭時視線順著{side}方身後景物延伸，保留行走中的自然瞬間'
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
      anglePattern: /正面|45度|側面平視|俯視/,
      gaze: '目光停留在{side}方手邊花葉，像在觀察花瓣細節'
    },
    {
      name: '草地側坐', description: '坐在草地上，雙腿向同側收攏',
      scenePattern: /公園|草地|庭園|花園|花田|湖畔|河畔/,
      setting: '場景一側是平整柔軟的草地',
      anglePattern: /正面|45度|側面平視|俯視/,
      gaze: '自然看向{side}方身旁草地，神情放鬆'
    },
    {
      name: '野餐墊側躺', description: '側躺於野餐墊，雙腿自然伸展',
      scenePattern: /公園|草地|庭園|花園|花田|湖畔|河畔/,
      setting: '平整草地上鋪著一張野餐墊',
      anglePattern: /正面|45度|側面平視|俯視/,
      gaze: '目光看向畫面{side}方外的景色，神情寧靜'
    },
    {
      name: '躺椅斜靠', description: '放鬆斜靠躺椅，雙腿向前延伸',
      scenePattern: /泳池畔|露台|室內|庭院|花園|海邊|攝影棚/,
      setting: '場景一側擺放一張設有扶手的躺椅',
      anglePattern: /正面|45度|側面平視|俯視/,
      gaze: '放鬆斜靠時，目光落在畫面{side}方'
    }
  ];
  let previousBeautifulScene = null;
  let previousBeautifulPose = null;
  const previousOutfitPalettes = new Map();

  function describeOutfit(outfits, bottoms) {
    const outfit = pick(outfits);
    const palette = pick(outfit.palettes.filter(item => item !== previousOutfitPalettes.get(outfit)));
    previousOutfitPalettes.set(outfit, palette);
    if (outfit.top) return `${palette[0]}${outfit.top}+${palette[1]}${pick(bottoms)}`;
    return outfit.describe(palette);
  }

  function generate(context) {
    const { scene, look } = context;
    const interaction = chooseGaze(naturalInteractions(look.text, scene.description));
    const outfitDescription = describeOutfit(beautiful2Outfits, beautiful2Bottoms);
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
    const outfitDescription = describeOutfit(beautifulOutfits, beautifulBottoms);
    const angleOptions = beautifulAngles.filter(([angle]) => !pose.anglePattern || pose.anglePattern.test(angle));
    const [angle, gaze] = pick(angleOptions);
    const baseGaze = pose.gaze !== undefined ? pose.gaze : gaze;
    const gazeDescription = chooseGaze([baseGaze]);
    const details = [
      scene,
      pose.setting,
      outfitDescription,
      angle,
      gazeDescription,
      pose.description,
      '直式 9:16'
    ].filter(Boolean).join('、') + '。';
    return beautifulPrefix + '\n\n' + details;
  }

  return { generate, generateLegacy };
}
