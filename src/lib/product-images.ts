/**
 * 商品图片生成器
 * 根据分类和标题生成精美的 SVG 商品展示图（data URI 格式）
 * 零网络请求 · 秒加载 · 中国网络无延迟 · 永不丢失
 */

// 分类视觉方案
const CATEGORY_THEMES: Record<string, {
  bg: [string, string]
  accent: string
  icon: string
  label: string
}> = {
  electronics: {
    bg: ['#0f172a', '#1e40af'],
    accent: '#60a5fa',
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    label: '数码',
  },
  fashion: {
    bg: ['#4a1942', '#be185d'],
    accent: '#f9a8d4',
    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    label: '服饰',
  },
  home: {
    bg: ['#064e3b', '#065f46'],
    accent: '#6ee7b7',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4',
    label: '家居',
  },
  books: {
    bg: ['#422006', '#92400e'],
    accent: '#fcd34d',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    label: '图书',
  },
  sports: {
    bg: ['#7f1d1d', '#b91c1c'],
    accent: '#fca5a5',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    label: '运动',
  },
  beauty: {
    bg: ['#701a75', '#a21caf'],
    accent: '#f0abfc',
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    label: '美妆',
  },
  baby: {
    bg: ['#1e3a5f', '#0369a1'],
    accent: '#7dd3fc',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    label: '母婴',
  },
  food: {
    bg: ['#78350f', '#b45309'],
    accent: '#fde68a',
    icon: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
    label: '食品',
  },
  gaming: {
    bg: ['#312e81', '#4c1d95'],
    accent: '#c4b5fd',
    icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    label: '游戏',
  },
  pets: {
    bg: ['#422006', '#78350f'],
    accent: '#fde68a',
    icon: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5',
    label: '宠物',
  },
  auto: {
    bg: ['#0f172a', '#334155'],
    accent: '#94a3b8',
    icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
    label: '汽车',
  },
  music: {
    bg: ['#451a03', '#9a3412'],
    accent: '#fdba74',
    icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    label: '乐器',
  },
}

// 关键词 → 分类映射
const KEYWORD_MAP: [string, string][] = [
  // 数码
  ['iPhone', 'electronics'], ['iPad', 'electronics'], ['MacBook', 'electronics'],
  ['AirPods', 'electronics'], ['Apple Watch', 'electronics'], ['小米手环', 'electronics'],
  ['华为 FreeBuds', 'electronics'], ['Kindle', 'electronics'], ['大疆', 'electronics'],
  ['GoPro', 'electronics'], ['罗技', 'electronics'], ['三星 Galaxy', 'electronics'],
  ['JBL', 'electronics'], ['小米平板', 'electronics'], ['Nintendo', 'electronics'],
  ['PS5', 'electronics'], ['DualSense', 'electronics'], ['索尼 WH', 'electronics'],
  ['Steam Deck', 'electronics'], ['小米手环', 'electronics'],
  // 服饰
  ['Nike', 'fashion'], ['Adidas', 'fashion'], ['Yeezy', 'fashion'],
  ['优衣库', 'fashion'], ['卫衣', 'fashion'], ['Coach', 'fashion'],
  ['Levi', 'fashion'], ['牛仔裤', 'fashion'], ['北面', 'fashion'],
  ['羽绒服', 'fashion'], ['COS', 'fashion'], ['羊毛大衣', 'fashion'],
  ['Lululemon', 'fashion'], ['瑜伽裤', 'fashion'], ['MLB', 'fashion'],
  ['棒球帽', 'fashion'], ['Champion', 'fashion'], ['Gucci', 'fashion'],
  ['腰带', 'fashion'], ['Dr. Martens', 'fashion'], ['马丁靴', 'fashion'],
  ['始祖鸟', 'fashion'], ['冲锋衣', 'fashion'], ['Acne Studios', 'fashion'],
  ['围巾', 'fashion'], ['三宅一生', 'fashion'], ['BAO BAO', 'fashion'],
  // 家居
  ['戴森', 'home'], ['吸尘器', 'home'], ['空气净化器', 'home'],
  ['宜家', 'home'], ['搁架', 'home'], ['电饭煲', 'home'],
  ['摩飞', 'home'], ['料理锅', 'home'], ['无印良品', 'home'],
  ['颈椎按摩', 'home'], ['飞利浦', 'home'], ['电动牙刷', 'home'],
  ['巴慕达', 'home'], ['烤箱', 'home'], ['双立人', 'home'],
  ['刀具', 'home'], ['智能门锁', 'home'], ['门锁', 'home'],
  ['SMEG', 'home'], ['烤面包机', 'home'], ['马桶盖', 'home'],
  ['松下', 'home'],
  // 图书
  ['三体', 'books'], ['人类简史', 'books'], ['简史', 'books'],
  ['经济学', 'books'], ['富爸爸', 'books'], ['LAMY', 'books'],
  ['钢笔', 'books'], ['国誉', 'books'], ['笔记本', 'books'],
  ['绘画套装', 'books'],
  // 运动
  ['动感单车', 'sports'], ['Keep', 'sports'], ['迪卡侬', 'sports'],
  ['登山包', 'sports'], ['瑜伽垫', 'sports'], ['YONEX', 'sports'],
  ['羽毛球拍', 'sports'], ['Salomon', 'sports'], ['跑鞋', 'sports'],
  ['帐篷', 'sports'], ['Brompton', 'sports'], ['自行车', 'sports'],
  ['泳镜', 'sports'], ['篮球', 'sports'], ['水壶', 'sports'],
  // 美妆
  ['SK-II', 'beauty'], ['神仙水', 'beauty'], ['兰蔻', 'beauty'],
  ['小黑瓶', 'beauty'], ['雅诗兰黛', 'beauty'], ['粉底液', 'beauty'],
  ['MAC', 'beauty'], ['口红', 'beauty'], ['资生堂', 'beauty'],
  ['精华', 'beauty'], ['CPB', 'beauty'], ['隔离', 'beauty'],
  ['La Mer', 'beauty'], ['海蓝之谜', 'beauty'], ['科颜氏', 'beauty'],
  ['面霜', 'beauty'],
  // 母婴
  ['婴儿推车', 'baby'], ['推车', 'baby'], ['安全座椅', 'baby'],
  ['奶瓶', 'baby'], ['棉柔巾', 'baby'], ['婴儿床', 'baby'],
  ['积木', 'baby'], ['爱他美', 'baby'], ['可么多么', 'baby'],
  ['全棉时代', 'baby'], ['好孩子', 'baby'], ['Hape', 'baby'],
  // 食品
  ['坚果', 'food'], ['零食', 'food'], ['茅台', 'food'],
  ['白酒', 'food'], ['红茶', 'food'], ['茶', 'food'],
  ['白色恋人', 'food'], ['巧克力', 'food'], ['松鼠', 'food'],
  ['良品铺子', 'food'], ['三只松鼠', 'food'],
  // 游戏
  ['塞尔达', 'gaming'], ['艾尔登法环', 'gaming'], ['原神', 'gaming'],
  ['手办', 'gaming'], ['宝可梦', 'gaming'], ['掌机', 'gaming'],
  ['动物森友会', 'gaming'], ['健身环', 'gaming'], ['最终幻想', 'gaming'],
  // 宠物
  ['猫粮', 'pets'], ['猫爬架', 'pets'], ['宠物饮水机', 'pets'],
  ['狗粮', 'pets'], ['喂食器', 'pets'], ['皇家', 'pets'],
  ['ZIWI', 'pets'], ['巅峰', 'pets'], ['小佩', 'pets'],
  // 汽车
  ['行车记录仪', 'auto'], ['车载净化器', 'auto'], ['汽车脚垫', 'auto'],
  ['车载手机支架', 'auto'], ['70迈', 'auto'], ['米家', 'auto'],
  ['固特异', 'auto'], ['倍思', 'auto'],
  // 乐器
  ['吉他', 'music'], ['电钢琴', 'music'], ['话筒', 'music'],
  ['尤克里里', 'music'], ['效果器', 'music'], ['雅马哈', 'music'],
  ['Yamaha', 'music'], ['Roland', 'music'], ['Shure', 'music'],
  ['BOSS', 'music'], ['Kala', 'music'],
]

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function findCategory(title: string): string {
  for (const [kw, cat] of KEYWORD_MAP) {
    if (title.includes(kw)) return cat
  }
  return 'electronics'
}

/**
 * 断行文本
 */
function breakLines(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text]
  const mid = Math.ceil(text.length / 2)
  // 尝试在中间位置找空格或标点
  for (let i = mid; i < text.length && i < mid + 3; i++) {
    if (text[i] === ' ') return [text.substring(0, i), text.substring(i + 1)]
  }
  for (let i = mid - 1; i >= 0 && i > mid - 4; i--) {
    if (text[i] === ' ') return [text.substring(0, i), text.substring(i + 1)]
  }
  return [text.substring(0, maxChars), text.substring(maxChars)]
}

/**
 * 生成装饰元素
 */
function getDecorations(variant: number, accent: string): string {
  const a = accent
  switch (variant % 6) {
    case 0: // 圆形光晕
      return `
        <circle cx="450" cy="150" r="120" fill="${a}" opacity="0.06"/>
        <circle cx="150" cy="450" r="80" fill="${a}" opacity="0.05"/>
        <circle cx="500" cy="400" r="40" fill="${a}" opacity="0.04"/>`
    case 1: // 几何线条
      return `
        <line x1="0" y1="450" x2="600" y2="300" stroke="${a}" stroke-width="1.5" opacity="0.06"/>
        <line x1="0" y1="500" x2="600" y2="350" stroke="${a}" stroke-width="1" opacity="0.04"/>
        <line x1="100" y1="600" x2="600" y2="400" stroke="${a}" stroke-width="0.8" opacity="0.03"/>`
    case 2: // 三角
      return `
        <polygon points="500,100 580,250 420,250" fill="${a}" opacity="0.05"/>
        <polygon points="100,400 160,500 40,500" fill="${a}" opacity="0.04"/>`
    case 3: // 点阵
      return Array.from({ length: 8 }, (_, i) => {
        const x = 80 + ((hash(a) * (i + 1) * 73) % 440)
        const y = 80 + ((hash(a) * (i + 2) * 47) % 440)
        return `<circle cx="${x}" cy="${y}" r="${1.5 + i % 3}" fill="${a}" opacity="0.08"/>`
      }).join('')
    case 4: // 波纹
      return `
        <circle cx="300" cy="300" r="200" fill="none" stroke="${a}" stroke-width="1" opacity="0.04"/>
        <circle cx="300" cy="300" r="160" fill="none" stroke="${a}" stroke-width="0.8" opacity="0.03"/>
        <circle cx="300" cy="300" r="120" fill="none" stroke="${a}" stroke-width="0.6" opacity="0.02"/>`
    default: // 弧线
      return `
        <path d="M0 500 Q300 400 600 500" fill="none" stroke="${a}" stroke-width="1.5" opacity="0.06"/>
        <path d="M0 540 Q300 440 600 540" fill="none" stroke="${a}" stroke-width="1" opacity="0.04"/>`
  }
}

/**
 * 生成单张 SVG 商品展示图
 */
function generateSvg(title: string, index: number): string {
  const cat = findCategory(title)
  const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.electronics
  const h = hash(title + String(index))

  const [bg1, bg2] = theme.bg
  const accent = theme.accent
  const decor = getDecorations((h >> 3) % 6, accent)

  // 根据 index 变化色调深浅
  const overlayOpacity = 0.12 + (index % 3) * 0.05

  // 标题换行
  const lines = breakLines(title, 10)
  const mainFontSize = title.length > 14 ? 26 : 30
  const lineGap = mainFontSize + 8
  const totalTextH = lines.length * lineGap
  const textStartY = 300 - totalTextH / 2 + mainFontSize

  const textSvg = lines.map((line, i) =>
    `<text x="300" y="${textStartY + i * lineGap}" text-anchor="middle" font-family="system-ui,-apple-system,'Noto Sans SC',sans-serif" font-size="${mainFontSize}" font-weight="700" fill="white" opacity="0.95">${escapeXml(line)}</text>`
  ).join('')

  // 分类标签
  const labelSvg = `<text x="300" y="${textStartY + totalTextH + 24}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="500" fill="${accent}" opacity="0.7" letter-spacing="2">${theme.label}</text>`

  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="${overlayOpacity}"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <rect width="600" height="600" fill="url(#glow)"/>
  ${decor}
  <g transform="translate(260, 190)" opacity="0.2">
    <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="${theme.icon}"/>
    </svg>
  </g>
  ${textSvg}
  ${labelSvg}
</svg>`)}`
}

/**
 * 根据商品标题生成匹配的图片 URL 数组
 *
 * @param title - 商品标题
 * @param count - 图片数量，默认 3
 * @param seed - 可选种子（当前未使用，保留接口兼容）
 */
export function getProductImages(title: string, count = 3, seed?: string): string[] {
  const images: string[] = []
  for (let i = 0; i < count; i++) {
    images.push(generateSvg(title, i))
  }
  return images
}
