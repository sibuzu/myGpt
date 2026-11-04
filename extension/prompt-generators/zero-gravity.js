// 無重力: template and design choices from dress/無重力.md.
export function createZeroGravityGenerator({ pick }) {
  const subject = '20歲日本年輕女性，半寫實日系動畫風格人像，保留超寫實的真人肌膚質感、細微毛孔與細膩的臉部五官，其餘畫面採用精緻動畫渲染，呈現自然光影與柔和的日系美感。圓潤的胸前、纖細的腰身、修長的雙腿。';
  const topOptions = [
    '修身襯衫', '精緻針織衫', '絲緞上衣', '馬甲上衣',
    '細肩帶上衣', '斜肩帶上衣', '露肩上衣', '短版套裝上衣',
    '掛脖上衣', '削肩上衣', '平口抹胸', '方領上衣', '深V領上衣',
    '裹身式上衣', '交叉綁帶上衣', '繞頸露背上衣', '不對稱剪裁上衣', '抽繩抓皺上衣',
    '泡泡袖上衣', '燈籠袖上衣', '荷葉邊上衣', '蝴蝶結上衣',
    '開襟衫', '罩衫', '短版外套','短版背心','改良式短版和服','改良式短版旗袍','改良式短版洋裝'
  ];
  const skirtOptions = [
    ['一般迷你', '短版迷你', '超迷你'],
    ['低腰', '中腰', '高腰', '超高腰', ''],
    ['平口裙襬', '斜口裙襬', '波浪裙襬', '花瓣裙襬', '鋸齒裙襬', ''],
    ['無開衩', '側開衩', '前開衩', '雙側開衩', ''],
    ['純棉', '復古丹寧', '絲緞', '精緻蕾絲', '雪紡', ''],
    ['單層', '雙層', '多層', '異材質拼接', '可拆卸裝飾結構', ''],
    ['蝴蝶結', '金屬扣', '隱形拉鍊', '手工刺繡', '水晶', '珍珠', '立體花朵', '金屬鍊飾', ''],
    ['修身', '直筒', 'A字', '傘狀', '蓬鬆', '']
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
  const environments = ['晴朗', '薄霧', '微雨', '雨後放晴', '陰天', '飄雪', '微風', '晚霞'];
  const effects = [
    '星塵流光', '櫻花花瓣飄落', '水晶折射光暈', '霓虹光絲', '金色微粒', '月光薄霧',
    '蝴蝶光影', '彩虹稜鏡', '漂浮羽毛', '雨滴折光', '夢幻螢火', '絲綢光帶'
  ];
  const lights = ['柔和晨光', '黃金夕陽', '藍調暮光', '月光', '逆光', '霓虹夜景'];
  const expressions = [
    '開心大笑', '甜美微笑', '害羞臉紅', '傲嬌不屑', '調皮吐舌', '邪魅壞笑', '興奮期待',
    '撒嬌賣萌', '得意自信', '俏皮眨眼', '無辜嘟嘴', '羞澀偷笑', '狡黠壞笑', '幸福陶醉',
    '驚喜雀躍', '溫柔淺笑', '嬌羞低頭', '調皮鬼臉', '魅惑挑眉', '甜蜜心動'
  ];
  const angles = ['動態構圖', '正面', '45度側面', '低機位仰拍', '平視', '略高角度', '三分之二側身', '動態斜角'];
  let previousPalette;

  function generate() {
    const palette = pick(palettes.filter(option => option !== previousPalette));
    previousPalette = palette;
    const design = skirtOptions.map(options => options.length ? pick(options) : '');
    // Mixed-material construction needs a second, distinct fabric.
    if (design[5] === '異材質拼接' && design[4]) {
      const otherMaterials = skirtOptions[4].filter(material => material && material !== design[4]);
      if (otherMaterials.length) design[4] += `與${pick(otherMaterials)}`;
    }
    const top = pick(topOptions);
    const [primary, secondary, accent] = palette;
    return [
      subject,
      `地點： 無重力空間，天空。`,
      `主色： ${primary}｜輔色： ${secondary}｜點綴： ${accent}`,
      `迷你裙： ${design.filter(Boolean).join('、')}`,
      `上衣: ${top}。`,
      `視覺特效： ${pick(effects)}｜光線： ${pick(lights)}。特效需與服裝主題、角色氣質、環境光線自然融合。`,
      `表情：${pick(expressions)}`,
      `視角：${pick(angles)}`,
      '畫面比例： 9:16'
    ].join('\n');
  }

  return { generate };
}
