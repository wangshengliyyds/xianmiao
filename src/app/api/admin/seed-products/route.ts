import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProductImages } from '@/lib/product-images'
import { requireAdmin } from '@/lib/api-auth'

// 商品模板库：{ 分类ID: [{ title, priceRange, condition?, description }] }
const TEMPLATES: Record<number, { title: string; price: [number, number]; original?: [number, number]; condition?: string; desc?: string }[]> = {
  // 1 - 数码电子
  1: [
    { title: 'iPhone 14 Pro 256G 深空黑', price: [3800, 5200], original: [6000, 8000] },
    { title: 'iPhone 13 128G 星光色', price: [2200, 3200], original: [4500, 5500] },
    { title: 'iPad Air 5 64G Wi-Fi版', price: [2500, 3500], original: [4399, 5000] },
    { title: 'MacBook Pro M1 14寸 16G/512G', price: [6500, 8500], original: [14999, 16000] },
    { title: 'AirPods Pro 2 全新未拆', price: [1200, 1500], original: [1899, 1899], condition: 'new' },
    { title: 'Apple Watch S8 45mm 午夜色', price: [1800, 2500], original: [3199, 3500] },
    { title: '索尼 WH-1000XM5 降噪耳机', price: [1500, 2000], original: [2699, 3000] },
    { title: 'Nintendo Switch OLED 日版', price: [1400, 1800], original: [2200, 2500] },
    { title: 'PS5 数字版 含手柄', price: [2200, 2800], original: [3499, 3499] },
    { title: '小米手环8 NFC版', price: [120, 180], original: [249, 249] },
    { title: '华为 FreeBuds Pro 3', price: [600, 900], original: [1199, 1499] },
    { title: 'Kindle Paperwhite 5 电子书', price: [500, 700], original: [998, 1000] },
    { title: '大疆 Mini 3 无人机 畅飞套装', price: [2800, 3500], original: [4788, 5000] },
    { title: 'GoPro Hero 12 运动相机', price: [1800, 2200], original: [3298, 3500] },
    { title: '罗技 MX Master 3S 鼠标', price: [400, 550], original: [799, 799] },
    { title: 'iPad Pro 11寸 M2 256G', price: [4500, 5800], original: [6799, 7500] },
    { title: '三星 Galaxy Buds2 Pro', price: [400, 600], original: [1099, 1299] },
    { title: '索尼 PS5 DualSense 手柄 星光蓝', price: [300, 400], original: [559, 559] },
    { title: '小米平板6 Pro 128G', price: [1300, 1700], original: [2399, 2500] },
    { title: 'JBL Flip 6 蓝牙音箱', price: [400, 550], original: [899, 899] },
  ],
  // 2 - 服饰鞋包
  2: [
    { title: 'Nike Air Force 1 白色 42码', price: [300, 500], original: [799, 799] },
    { title: '优衣库联名款卫衣 XL码 黑色', price: [50, 100], original: [199, 249] },
    { title: 'Coach 托特包 全新带吊牌', price: [800, 1200], original: [2500, 3000], condition: 'new' },
    { title: 'Levi\'s 501 经典牛仔裤 32码', price: [150, 250], original: [599, 799] },
    { title: '北面 1996 羽绒服 L码 黑色', price: [800, 1200], original: [2498, 2800] },
    { title: 'Adidas Yeezy 350 白冰淇淋 41码', price: [1200, 1800], original: [1899, 2200] },
    { title: 'COS 羊毛大衣 驼色 S码', price: [400, 600], original: [1950, 1950] },
    { title: 'Lululemon Align 瑜伽裤 4码', price: [300, 450], original: [850, 950] },
    { title: 'MLB 棒球帽 NY 黑色', price: [80, 130], original: [269, 299] },
    { title: 'Champion 反面卫衣 M码 灰色', price: [100, 180], original: [399, 499] },
    { title: 'Gucci 腰带 80cm 双G扣', price: [1500, 2200], original: [3500, 4000] },
    { title: 'Dr. Martens 1460 马丁靴 39码', price: [400, 600], original: [1499, 1699] },
    { title: '始祖鸟 Beta LT 冲锋衣 M码', price: [2500, 3500], original: [5600, 6000] },
    { title: 'Acne Studios 围巾 灰色', price: [400, 600], original: [1500, 1800] },
    { title: '三宅一生 BAO BAO 手提包', price: [1000, 1500], original: [2800, 3500] },
  ],
  // 3 - 家居生活
  3: [
    { title: '戴森 V12 吸尘器 轻量版', price: [2000, 2800], original: [4490, 4990] },
    { title: '小米空气净化器4 Pro', price: [500, 700], original: [1299, 1499] },
    { title: '宜家 KALLAX 卡莱克搁架单元 白色', price: [100, 200], original: [449, 449] },
    { title: '松下 电饭煲 4L 智能IH', price: [300, 500], original: [999, 1299] },
    { title: '摩飞 多功能料理锅 薄荷绿', price: [200, 350], original: [599, 699] },
    { title: 'Muji 无印良品 颈椎按摩仪', price: [150, 250], original: [490, 490] },
    { title: '飞利浦 电动牙刷 HX6803', price: [150, 250], original: [399, 499] },
    { title: 'Balmuda 巴慕达 烤箱 绿色', price: [800, 1200], original: [2299, 2599] },
    { title: '双立人 刀具7件套 全新', price: [300, 500], original: [998, 1299], condition: 'new' },
    { title: '小米智能门锁 E', price: [300, 500], original: [999, 999] },
    { title: 'SMEG 复古烤面包机 白色', price: [500, 700], original: [1399, 1599] },
    { title: '智能马桶盖 松下 DL-5225', price: [600, 900], original: [1999, 2499] },
  ],
  // 4 - 图书文具
  4: [
    { title: '三体全集（1-3册）刘慈欣', price: [30, 60], original: [93, 93] },
    { title: '人类简史+未来简史+今日简史 套装', price: [50, 80], original: [168, 168] },
    { title: 'iPad Pro + Apple Pencil 绘画套装', price: [3500, 5000], original: [7000, 8500] },
    { title: 'LAMY 狩猎系列 钢笔 磨砂黑', price: [80, 130], original: [228, 268] },
    { title: '罗技 K380 蓝牙键盘 粉色', price: [80, 130], original: [229, 249] },
    { title: '经济学原理 曼昆 第8版', price: [30, 50], original: [128, 128] },
    { title: '富爸爸穷爸爸 全套10册', price: [40, 70], original: [198, 198] },
    { title: '日本国誉 笔记本套装 A5', price: [20, 40], original: [68, 88] },
  ],
  // 5 - 运动户外
  5: [
    { title: 'Keep 智能动感单车 C1', price: [600, 900], original: [1899, 2199] },
    { title: '迪卡侬 登山包 40L', price: [100, 200], original: [399, 499] },
    { title: 'YONEX 弓箭11 羽毛球拍', price: [300, 500], original: [990, 1200] },
    { title: 'Salomon XT-6 越野跑鞋 42码', price: [500, 700], original: [1280, 1480] },
    { title: '帐篷 牧高笛 冷山2 三季', price: [200, 350], original: [599, 799] },
    { title: 'Brompton 折叠自行车 6速', price: [6000, 9000], original: [13500, 15000] },
    { title: '迪卡侬 瑜伽垫 8mm 加厚', price: [40, 70], original: [129, 149] },
    { title: 'Speedo 专业泳镜 防雾', price: [50, 80], original: [168, 198] },
    { title: 'Wilson 威尔逊 篮球 7号', price: [50, 80], original: [169, 199] },
    { title: 'Nalgene 户外水壶 1L 蓝色', price: [40, 60], original: [98, 128] },
  ],
  // 6 - 美妆护肤
  6: [
    { title: 'SK-II 神仙水 230ml 全新', price: [600, 800], original: [1540, 1540], condition: 'new' },
    { title: '兰蔻小黑瓶精华 50ml', price: [350, 500], original: [1080, 1080] },
    { title: '雅诗兰黛 DW粉底液 1W1', price: [150, 220], original: [420, 420] },
    { title: 'MAC 口红 Ruby Woo', price: [80, 120], original: [190, 190] },
    { title: '资生堂 红腰子精华 75ml', price: [300, 450], original: [860, 920] },
    { title: 'CPB 肌肤之钥 长管隔离', price: [250, 350], original: [650, 680] },
    { title: 'La Mer 海蓝之谜 面霜 30ml', price: [800, 1200], original: [2650, 2800] },
    { title: '科颜氏 高保湿面霜 125ml', price: [150, 220], original: [480, 520] },
  ],
  // 7 - 母婴用品
  7: [
    { title: 'Bugaboo Fox3 婴儿推车 黑色车架', price: [3000, 4500], original: [9990, 10990] },
    { title: 'Combi 康贝 婴儿安全座椅 0-7岁', price: [500, 800], original: [1980, 2580] },
    { title: '可么多么 奶瓶 250ml 两只装', price: [80, 120], original: [258, 298] },
    { title: '全棉时代 婴儿棉柔巾 6包', price: [40, 60], original: [108, 128] },
    { title: '好孩子 婴儿床 实木 可拼接', price: [300, 500], original: [1299, 1599] },
    { title: 'Aptamil 爱他美 卓萃 3段 900g', price: [150, 200], original: [308, 328] },
    { title: 'Hape 木质积木 100粒 彩色', price: [60, 100], original: [198, 248] },
  ],
  // 8 - 食品生鲜
  8: [
    { title: '三只松鼠 坚果大礼包 1638g', price: [60, 90], original: [168, 198] },
    { title: '良品铺子 零食组合 2斤装', price: [40, 60], original: [99, 129] },
    { title: '茅台飞天 53度 500ml', price: [2200, 2800], original: [1499, 1499] },
    { title: '正山小种 红茶礼盒 250g', price: [80, 150], original: [298, 398] },
    { title: '日本白色恋人 巧克力夹心饼干', price: [50, 80], original: [128, 158] },
  ],
  // 9 - 游戏动漫
  9: [
    { title: '塞尔达传说 王国之泪 卡带', price: [250, 320], original: [429, 429] },
    { title: 'PS5 艾尔登法环 黄金树幽影版', price: [200, 280], original: [398, 478] },
    { title: '原神 甘雨手办 1/7比例', price: [300, 500], original: [898, 1200] },
    { title: '宝可梦 朱紫 双版本', price: [250, 350], original: [429, 429] },
    { title: 'Steam Deck 256G 掌机', price: [2000, 2600], original: [3288, 3688] },
    { title: '动物森友会 amiibo卡 一盒', price: [50, 80], original: [150, 199] },
    { title: '健身环大冒险 国行', price: [200, 300], original: [499, 499] },
    { title: '最终幻想7 重制版 PS5', price: [150, 220], original: [449, 449] },
  ],
  // 10 - 宠物用品
  10: [
    { title: '皇家 猫粮 室内成猫 10kg', price: [200, 300], original: [498, 558] },
    { title: '猫爬架 大型 多层 灰色', price: [100, 200], original: [399, 599] },
    { title: '小佩 智能宠物饮水机', price: [80, 130], original: [269, 299] },
    { title: 'ZIWI 巅峰 风干牛肉狗粮 1kg', price: [200, 300], original: [498, 558] },
    { title: '宠物自动喂食器 小米', price: [150, 250], original: [399, 499] },
  ],
  // 11 - 汽车用品
  11: [
    { title: '70迈 行车记录仪 A800 4K', price: [300, 450], original: [699, 799] },
    { title: '米家 车载空气净化器', price: [150, 250], original: [449, 499] },
    { title: '固特异 汽车脚垫 全包围', price: [100, 200], original: [398, 598] },
    { title: '倍思 车载手机支架 无线充电', price: [60, 100], original: [169, 199] },
  ],
  // 12 - 音乐乐器
  12: [
    { title: 'Yamaha 雅马哈 FG800 吉他', price: [600, 900], original: [1599, 1799] },
    { title: 'Roland 罗兰 FP-30X 电钢琴', price: [2500, 3500], original: [5290, 5990] },
    { title: 'Shure 舒尔 SM58 话筒', price: [300, 450], original: [899, 999] },
    { title: 'Kala 尤克里里 23寸 桃花心木', price: [150, 250], original: [499, 599] },
    { title: 'BOSS GT-1 吉他综合效果器', price: [600, 900], original: [1680, 1980] },
  ],
}

// 城市坐标（随机分布）
const CITIES = [
  { name: '北京', lat: 39.9042, lng: 116.4074 },
  { name: '上海', lat: 31.2304, lng: 121.4737 },
  { name: '广州', lat: 23.1291, lng: 113.2644 },
  { name: '深圳', lat: 22.5431, lng: 114.0579 },
  { name: '杭州', lat: 30.2741, lng: 120.1551 },
  { name: '成都', lat: 30.5728, lng: 104.0668 },
  { name: '武汉', lat: 30.5928, lng: 114.3055 },
  { name: '南京', lat: 32.0603, lng: 118.7969 },
  { name: '重庆', lat: 29.4316, lng: 106.9123 },
  { name: '西安', lat: 34.3416, lng: 108.9398 },
]

const CONDITIONS = ['new', 'like_new', 'good', 'good', 'fair'] as const
const TRADE_METHODS = ['offline', 'escrow', 'both'] as const

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1))
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function genDescription(title: string): string {
  const intros = [
    `${title}，自用闲置转让。`,
    `${title}，买来没怎么用，闲置出了。`,
    `${title}，搬家清仓，忍痛出。`,
    `${title}，换新款了，旧的出掉。`,
    `${title}，朋友送的，自己用不上。`,
  ]
  const details = [
    '功能一切正常，成色看图。',
    '正常使用痕迹，介意勿拍。',
    '几乎没用过，和新的差不多。',
    '包装齐全，配件都在。',
    '本地自提优先，可小刀。',
    '非诚勿扰，不接受到手刀。',
    '实物拍摄，所见即所得。',
  ]
  return `${pick(intros)}\n${pick(details)}\n${pick(details)}`
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  // 开发环境下跳过管理员权限检查
  if (process.env.NODE_ENV !== 'development') {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: '无权访问' }, { status: 403 })
  }

  let body: { count?: number } = {}
  try { body = await request.json() } catch {}
  const count = Math.min(body.count || 100, 200)

  const admin = createAdminClient()
  const categoryIds = Object.keys(TEMPLATES).map(Number)
  const products: { title: string }[] = []
  const errors: string[] = []

  // 批量生成，每批 20 条
  const BATCH = 20
  for (let batch = 0; batch < count; batch += BATCH) {
    const batchEnd = Math.min(batch + BATCH, count)
    const inserts = []

    for (let i = batch; i < batchEnd; i++) {
      const catId = pick(categoryIds)
      const templates = TEMPLATES[catId]
      const tpl = pick(templates)
      const condition = tpl.condition || pick(CONDITIONS)
      const price = randInt(tpl.price[0], tpl.price[1])
      const originalPrice = tpl.original ? randInt(tpl.original[0], tpl.original[1]) : Math.round(price * rand(1.3, 2.5))
      const city = pick(CITIES)
      const tradeMethod = pick(TRADE_METHODS)

      // 为每个商品生成随机位置偏移
      const lat = city.lat + rand(-0.05, 0.05)
      const lng = city.lng + rand(-0.05, 0.05)

      inserts.push({
        seller_id: user.id,
        category_id: catId,
        title: tpl.title,
        description: genDescription(tpl.title),
        price,
        original_price: originalPrice,
        condition,
        trade_method: tradeMethod,
        status: 'active',
        lat,
        lng,
        view_count: randInt(0, 500),
        fav_count: randInt(0, 50),
        is_merchant: Math.random() > 0.7,
        ai_generated: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - randInt(0, 14 * 24 * 60 * 60 * 1000)).toISOString(),
      })
    }

    const { data, error } = await admin
      .from('products')
      .insert(inserts)
      .select('id, title')

    if (error) {
      errors.push(`批次 ${batch}-${batchEnd}: ${error.message}`)
    } else if (data) {
      products.push(...data)

      // 为每个商品添加匹配图片
      const imageInserts = data.flatMap((p) => {
        const imgCount = randInt(3, 5)
        const urls = getProductImages(p.title, imgCount, p.id.slice(0, 8))
        return urls.map((url, j) => ({
          product_id: p.id,
          url,
          sort_order: j,
          is_cover: j === 0,
        }))
      })

      await admin.from('product_images').insert(imageInserts)
    }
  }

  return NextResponse.json({
    success: true,
    created: products.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
