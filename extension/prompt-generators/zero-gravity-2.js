// 無重力2: one subject paragraph followed by one short outfit/scene line.
export function createZeroGravity2Generator({ pick }) {
  const outlookOptions = [
    '清新自然', '溫柔婉約', '甜美可愛', '優雅知性', '清冷高雅',
    '自信大方', '活潑俏皮', '沉靜內斂', '浪漫夢幻', '明朗爽快',
    '神秘空靈', '端莊秀麗', '率性灑脫', '柔美細膩', '慵懶從容',
    '靈動輕盈', '文藝恬靜', '高貴典雅', '英氣俐落', '陽光開朗'
  ];
  const topOptions = [
    '修身襯衫', '精緻針織衫', '絲緞上衣', '馬甲上衣', '短版低胸背心',
    '細肩帶上衣', '斜肩帶上衣', '露肩上衣', '短版套裝上衣',
    '掛脖上衣', '削肩上衣', '平口抹胸', '方領上衣', '深V領上衣',
    '裹身式上衣', '交叉綁帶上衣', '繞頸露背上衣', '不對稱剪裁上衣', '抽繩抓皺上衣',
    '泡泡袖上衣', '燈籠袖上衣', '荷葉邊上衣', '蝴蝶結上衣',
    '開襟衫', '罩衫', '短版外套','短版背心','改良式短版和服','改良式短版旗袍','改良式短版洋裝'
  ];
  const palettes = [
    ['曜石黑', '香檳金', '象牙白'],
    ['冰川藍', '月光銀', '雪白'],
    ['櫻花粉', '奶油白', '玫瑰金'],
    ['酒紅', '煙粉', '古銅金'],
    ['翡翠綠', '淡金', '珍珠白'],
    ['薰衣草紫', '霧灰', '銀白'],
    ['香檳色', '奶油色', '淡金'],
    ['午夜藍', '星光銀', '冰藍'],
    ['珍珠白', '月光銀', '淡紫'],
    ['朱紅', '墨黑', '亮金'],
    ['薄荷綠', '奶油白', '檸檬黃'],
    ['孔雀藍', '墨綠', '古金'],
    ['珊瑚橙', '蜜桃粉', '珍珠白'],
    ['玫瑰粉', '可可棕', '玫瑰金'],
    ['丁香紫', '霧藍', '鉑金銀'],
    ['琥珀橙', '焦糖棕', '香草白'],
    ['湖水綠', '海鹽白', '香檳金'],
    ['寶石藍', '象牙白', '亮銀'],
    ['奶茶米', '摩卡棕', '淡金'],
    ['覆盆莓紅', '深紫', '冰銀']
  ];
  const skirtOptions = [
    ['迷你', '短版迷你', '超迷你'],
    ['低腰', '中腰', '高腰', '超高腰', ''],
    ['平口裙襬', '斜口裙襬', '波浪裙襬', '花瓣裙襬', '鋸齒裙襬', ''],
    ['無開衩', '側開衩', '前開衩', '雙側開衩', ''],
    ['純棉', '復古丹寧', '絲緞', '精緻蕾絲', '雪紡', ''],
    ['單層', '雙層', '多層', '異材質拼接', '可拆卸裝飾結構', ''],
    ['蝴蝶結', '金屬扣', '隱形拉鍊', '手工刺繡', '水晶', '珍珠', '立體花朵', '金屬鍊飾', ''],
    ['修身', '直筒', 'A字', '傘狀', '蓬鬆', '']
  ];
  let previousPalette;

  function generate() {
    const palette = pick(palettes.filter(option => option !== previousPalette));
    previousPalette = palette;
    const [topColor, skirtColor] = palette;
    const top = pick(topOptions);
    const design = skirtOptions.map(options => options.length ? pick(options) : '');
    if (design[5] === '異材質拼接' && design[4]) {
      const otherMaterials = skirtOptions[4].filter(material => material && material !== design[4]);
      if (otherMaterials.length) design[4] += `與${pick(otherMaterials)}`;
    }
    const details = design.filter(Boolean).join('、');
    const skirt = `迷你裙${details ? `（${details}）` : ''}`;
    return `獨立生圖： 9:16，**姿勢和視角要和上張圖不同**，一位氣質${pick(outlookOptions)}、胸部圓潤的20歲日本年輕女性，半寫實日系動畫風格人像，保留超寫實的真人肌膚質感、細微毛孔與細膩的臉部五官，其餘畫面採用精緻動畫渲染，呈現自然光影與柔和的日系美感。\n\n${topColor}${top}＋${skirtColor}${skirt}，無重力空間，天空。`;
  }

  return { generate };
}
