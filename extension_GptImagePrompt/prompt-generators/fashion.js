// Wardrobe data and selection logic copied from MyGPT beautiful.js.
export function createFashionWardrobe({ pick }) {
  const beautifulBottoms = [
    '高腰A字短裙', '牛仔迷你裙', '百褶短裙', '高腰迷你裙', '高腰短裙', '迷你裙'
  ];
  const beautifulOutfits = [
    {
      palettes: [
        ['櫻花粉色', '奶油白色'], ['天空藍色', '霧灰色'], ['奶油白色', '藏青色'],
        ['薰衣草紫色', '米白色'], ['薄荷綠色', '淺卡其色'],
        ['淡粉色', '象牙白色'], ['珊瑚粉色', '霧灰色'], ['鵝黃色', '米白色'],
        ['水藍色', '淺卡其色'], ['鼠尾草綠色', '奶油白色']
      ],
      top: '細肩帶上衣'
    },
    {
      palettes: [
        ['櫻花粉色', '奶油白色'], ['天空藍色', '霧灰色'], ['奶油白色', '藏青色'],
        ['薰衣草紫色', '米白色'], ['薄荷綠色', '淺卡其色'],
        ['白色', '深黑色'], ['象牙白色', '炭灰色'], ['淡粉色', '深藍色'],
        ['淡綠色', '米白色'], ['香檳色', '深咖啡色']
      ],
      top: '深V領襯衫'
    },
    {
      palettes: [
        ['米白色', '淺藍色'], ['淡粉色', '靛藍色'], ['淺灰色', '黑色'],
        ['薄荷綠色', '米白色'], ['奶茶色', '水洗藍色'],
        ['鵝黃色', '靛藍色'], ['天空藍色', '奶油白色'], ['珊瑚粉色', '淺灰色'],
        ['薰衣草紫色', '水洗藍色'], ['米杏色', '深藍色']
      ],
      top: '短袖上衣'
    },
    {
      palettes: [
        ['淺藍色', '米白色'], ['奶油白色', '深灰色'], ['淡紫色', '霧灰色'],
        ['蜜桃粉色', '奶茶色'], ['黑色', '象牙白色'],
        ['淡綠色', '象牙白色'], ['櫻花粉色', '霧灰色'], ['香檳色', '深咖啡色'],
        ['湖水藍色', '米白色'], ['奶油黃色', '淺卡其色']
      ],
      top: '削肩上衣'
    },
    {
      palettes: [
        ['淡紫色', '米白色'], ['奶茶色', '深咖啡色'], ['米白色', '炭灰色'],
        ['煙粉色', '深藍色'], ['淺灰色', '黑色'],
        ['象牙白色', '酒紅色'], ['淡綠色', '奶油白色'], ['珊瑚粉色', '深咖啡色'],
        ['霧藍色', '米白色'], ['香檳色', '藏青色']
      ],
      top: '露肩上衣'
    },
    {
      palettes: [
        ['黑色', '象牙白色'], ['霧灰色', '黑色'], ['淺卡其色', '奶油白色'],
        ['深藍色', '白色'], ['煙粉色', '淺灰色'],
        ['酒紅色', '象牙白色'], ['墨綠色', '香檳色'], ['珍珠白色', '深藍色'],
        ['淡紫色', '炭灰色'], ['珊瑚粉色', '奶油白色']
      ],
      top: '掛脖上衣'
    },
    {
      palettes: [
        ['淡青綠色', '米白色'], ['酒紅色', '淡金色'], ['寶藍色', '銀白色'],
        ['象牙白色', '淺粉色'], ['墨綠色', '香檳金色'],
        ['煙粉色', '玫瑰金色'], ['深藍色', '銀白色'], ['淡紫色', '象牙白色'],
        ['黑色', '淡金色'], ['香檳色', '酒紅色']
      ],
      describe: ([fabric, embroidery]) => `${fabric}短版旗袍，衣襟點綴${embroidery}花卉刺繡`
    },
    {
      palettes: [
        ['奶油白色', '淺棕色'], ['霧藍色', '米白色'], ['淺卡其色', '深咖啡色'],
        ['珊瑚粉色', '奶油白色'], ['黑色', '香檳金色'],
        ['淡綠色', '米白色'], ['淡紫色', '銀灰色'], ['象牙白色', '酒紅色'],
        ['蜜桃粉色', '深棕色'], ['深藍色', '淡金色']
      ],
      describe: ([fabric, belt]) => `${fabric}無袖短版連身裙+${belt}細腰帶`
    },
    {
      palettes: [
        ['酒紅色', '黑色'], ['黑色', '香檳金色'], ['霧藍色', '銀灰色'],
        ['玫瑰粉色', '奶油白色'], ['奶油白色', '淺灰色'],
        ['墨綠色', '香檳金色'], ['淡紫色', '銀白色'], ['淡粉色', '深棕色'],
        ['天空藍色', '象牙白色'], ['香檳色', '黑色']
      ],
      describe: ([fabric, belt]) => `${fabric}細肩帶短洋裝+${belt}細腰帶`
    },
    {
      palettes: [
        ['櫻花粉色', '象牙白色', '銀白色'], ['月白色', '深紅色', '淡粉色'],
        ['淡紫色', '奶油白色', '淡金色'], ['墨藍色', '香檳金色', '淡粉色'],
        ['薄荷綠色', '米白色', '淺粉色'],
        ['象牙白色', '紅棕色', '櫻花粉色'], ['霧藍色', '深藍色', '銀白色'],
        ['煙粉色', '酒紅色', '香檳金色'], ['奶油黃色', '深棕色', '象牙白色'],
        ['黑色', '深紅色', '淡金色']
      ],
      describe: ([fabric, belt, embroidery]) => `${fabric}短版和服+${belt}絲綢腰帶，點綴${embroidery}櫻花刺繡`
    },
    {
      palettes: [
        ['象牙白色', '深藍色'], ['煙粉色', '炭灰色'], ['霧藍色', '奶油白色'],
        ['淡紫色', '黑色'], ['香檳色', '深咖啡色'],
        ['淡綠色', '象牙白色'], ['淡粉色', '深藍色'], ['珍珠白色', '炭灰色'],
        ['湖水藍色', '米白色'], ['蜜桃粉色', '淺卡其色']
      ],
      top: '薄紗襯衫'
    }
  ];
  const contrastPalettes = [
    ['黑色', '香檳金色'], ['酒紅色', '黑色'], ['深藍色', '銀灰色'],
    ['墨綠色', '象牙白色'], ['紫紅色', '炭灰色'],
    ['寶藍色', '香檳金色'], ['深紫色', '銀白色'], ['炭灰色', '酒紅色'],
    ['深棕色', '奶油白色'], ['孔雀綠色', '黑色']
  ];
  const softPalettes = [
    ['奶油白色', '玫瑰粉色'], ['霧藍色', '米白色'], ['淡紫色', '霧灰色'],
    ['蜜桃粉色', '深咖啡色'], ['淺卡其色', '象牙白色'],
    ['淡綠色', '珍珠白色'], ['淡粉色', '象牙白色'], ['鵝黃色', '米白色'],
    ['水藍色', '奶茶色'], ['煙粉色', '淺灰色']
  ];
  const beautiful2Bottoms = [
    ...beautifulBottoms,
    '比基尼泳褲', '側開衩短裙', '不對稱迷你裙',
    '高腰短裙，腰側點綴細緻繫帶與小巧金屬環',
    '百褶迷你裙', '皮質迷你裙', '側綁帶迷你裙',
    '高開衩迷你裙'
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
    },
    {
      palettes: [
        ['米白色', '淡粉色', '紅棕色'],
        ['象牙白色', '櫻花粉色', '酒紅色'],
        ['香檳白色', '淡玫瑰色', '深棕色'],
        ['淡綠色', '象牙白色', '深棕色'],
        ['霧藍色', '珍珠白色', '藏青色'],
        ['淡紫色', '櫻花粉色', '酒紅色']
      ],
      describe: ([fabric, flowers, obi]) => `${fabric}絲綢改良和服，印有細緻${flowers}花卉圖案，${obi}腰帶，高開衩短裙襬`
    },
    {
      palettes: [
        ['象牙白色', '金色'],
        ['淡香檳色', '玫瑰金色'],
        ['霧藍色', '銀色'],
        ['淡粉色', '玫瑰金色'],
        ['淡綠色', '香檳金色'],
        ['珍珠白色', '銀色']
      ],
      describe: ([fabric, ring]) => `${fabric}雪紡海灘短洋裝，超深V領，側邊高開衩以${ring}細緻金屬環固定，裙襬輕盈飄逸`
    }
  ];
  const previousOutfitPalettes = new Map();

  function describeOutfit(outfits, bottoms) {
    const outfit = pick(outfits);
    const palette = pick(outfit.palettes.filter(item => item !== previousOutfitPalettes.get(outfit)));
    previousOutfitPalettes.set(outfit, palette);
    if (outfit.top) return `${palette[0]}${outfit.top}+${palette[1]}${pick(bottoms)}`;
    return outfit.describe(palette);
  }

  const miniOutfits = beautiful2Outfits.filter(outfit => outfit.top);
  const miniBottoms = beautiful2Bottoms.filter(bottom => bottom.includes('裙'));
  return {
    sexy: () => '身穿' + describeOutfit(beautiful2Outfits, beautiful2Bottoms),
    mini: () => '身穿' + describeOutfit(miniOutfits, miniBottoms)
  };
}
