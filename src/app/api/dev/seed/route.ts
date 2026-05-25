import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProductImages } from '@/lib/product-images'

// 开发环境专用：不需要登录即可生成演示数据
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: '仅开发环境可用' }, { status: 403 })
  }

  const admin = createAdminClient()

  // 先检查是否已有数据
  const { count } = await admin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if ((count || 0) >= 20) {
    return NextResponse.json({ success: true, created: 0, message: `已有 ${count} 条商品，无需重复生成` })
  }

  // 使用卖家测试账号
  const SELLER_EMAIL = '16632265014@xianmiao.phone'
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  let sellerUser = existingUsers?.users?.find((u) => u.email === SELLER_EMAIL)

  if (!sellerUser) {
    // 自动创建卖家账号
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: SELLER_EMAIL,
      password: 'dev2026xm',
      email_confirm: true,
      user_metadata: { phone: '16632265014', nickname: '好物优选铺' },
    })
    if (createError || !newUser.user) {
      return NextResponse.json({ error: '卖家账号创建失败' }, { status: 500 })
    }
    sellerUser = newUser.user
    await admin.from('profiles').update({ role: 'seller', nickname: '好物优选铺', credit_score: 920 }).eq('id', sellerUser.id)
  }

  // 确保分类存在
  const { count: catCount } = await admin.from('categories').select('*', { count: 'exact', head: true })
  if (!catCount || catCount === 0) {
    await admin.from('categories').insert([
      { id: 1, name: '手机数码', icon_url: null, parent_id: null, sort_order: 1, is_active: true },
      { id: 2, name: '服饰鞋包', icon_url: null, parent_id: null, sort_order: 2, is_active: true },
      { id: 3, name: '家居生活', icon_url: null, parent_id: null, sort_order: 3, is_active: true },
      { id: 4, name: '图书文具', icon_url: null, parent_id: null, sort_order: 4, is_active: true },
      { id: 5, name: '运动户外', icon_url: null, parent_id: null, sort_order: 5, is_active: true },
      { id: 6, name: '美妆护肤', icon_url: null, parent_id: null, sort_order: 6, is_active: true },
      { id: 7, name: '母婴用品', icon_url: null, parent_id: null, sort_order: 7, is_active: true },
      { id: 8, name: '食品生鲜', icon_url: null, parent_id: null, sort_order: 8, is_active: true },
      { id: 9, name: '游戏动漫', icon_url: null, parent_id: null, sort_order: 9, is_active: true },
      { id: 10, name: '宠物用品', icon_url: null, parent_id: null, sort_order: 10, is_active: true },
      { id: 11, name: '汽车用品', icon_url: null, parent_id: null, sort_order: 11, is_active: true },
      { id: 12, name: '音乐乐器', icon_url: null, parent_id: null, sort_order: 12, is_active: true },
    ])
  }

  const TEMPLATES: { title: string; price: [number, number]; original?: [number, number]; category_id: number }[] = [
    { title: 'iPhone 14 Pro 256G 深空黑', price: [3800, 5200], original: [6000, 8000], category_id: 1 },
    { title: 'iPhone 13 128G 星光色', price: [2200, 3200], original: [4500, 5500], category_id: 1 },
    { title: 'iPad Air 5 64G Wi-Fi版', price: [2500, 3500], original: [4399, 5000], category_id: 1 },
    { title: 'MacBook Pro M1 14寸 16G/512G', price: [6500, 8500], original: [14999, 16000], category_id: 1 },
    { title: 'AirPods Pro 2 全新未拆', price: [1200, 1500], original: [1899, 1899], category_id: 1 },
    { title: 'Apple Watch S8 45mm 午夜色', price: [1800, 2500], original: [3199, 3500], category_id: 1 },
    { title: '索尼 WH-1000XM5 降噪耳机', price: [1500, 2000], original: [2699, 3000], category_id: 1 },
    { title: 'Nintendo Switch OLED 日版', price: [1400, 1800], original: [2200, 2500], category_id: 1 },
    { title: 'PS5 数字版 含手柄', price: [2200, 2800], original: [3499, 3499], category_id: 1 },
    { title: '小米手环8 NFC版', price: [120, 180], original: [249, 249], category_id: 1 },
    { title: 'Nike Air Force 1 白色 42码', price: [300, 500], original: [799, 799], category_id: 2 },
    { title: '优衣库联名款卫衣 XL码 黑色', price: [50, 100], original: [199, 249], category_id: 2 },
    { title: 'Coach 托特包 全新带吊牌', price: [800, 1200], original: [2500, 3000], category_id: 2 },
    { title: 'Levi\'s 501 经典牛仔裤 32码', price: [150, 250], original: [599, 799], category_id: 2 },
    { title: '北面 1996 羽绒服 L码 黑色', price: [800, 1200], original: [2498, 2800], category_id: 2 },
    { title: '戴森 V12 吸尘器 轻量版', price: [2000, 2800], original: [4490, 4990], category_id: 3 },
    { title: '小米空气净化器4 Pro', price: [500, 700], original: [1299, 1499], category_id: 3 },
    { title: '宜家 KALLAX 卡莱克搁架单元', price: [100, 200], original: [449, 449], category_id: 3 },
    { title: '松下 电饭煲 4L 智能IH', price: [300, 500], original: [999, 1299], category_id: 3 },
    { title: '三体全集（1-3册）刘慈欣', price: [30, 60], original: [93, 93], category_id: 4 },
    { title: '人类简史+未来简史 套装', price: [50, 80], original: [168, 168], category_id: 4 },
    { title: 'LAMY 狩猎系列 钢笔 磨砂黑', price: [80, 130], original: [228, 268], category_id: 4 },
    { title: 'Keep 智能动感单车 C1', price: [600, 900], original: [1899, 2199], category_id: 5 },
    { title: '迪卡侬 登山包 40L', price: [100, 200], original: [399, 499], category_id: 5 },
    { title: 'YONEX 弓箭11 羽毛球拍', price: [300, 500], original: [990, 1200], category_id: 5 },
    { title: 'SK-II 神仙水 230ml 全新', price: [600, 800], original: [1540, 1540], category_id: 6 },
    { title: '兰蔻小黑瓶精华 50ml', price: [350, 500], original: [1080, 1080], category_id: 6 },
    { title: '雅诗兰黛 DW粉底液 1W1', price: [150, 220], original: [420, 420], category_id: 6 },
    { title: 'Bugaboo Fox3 婴儿推车', price: [3000, 4500], original: [9990, 10990], category_id: 7 },
    { title: '可么多么 奶瓶 250ml 两只装', price: [80, 120], original: [258, 298], category_id: 7 },
    { title: '三只松鼠 坚果大礼包 1638g', price: [60, 90], original: [168, 198], category_id: 8 },
    { title: '茅台飞天 53度 500ml', price: [2200, 2800], original: [1499, 1499], category_id: 8 },
    { title: '塞尔达传说 王国之泪 卡带', price: [250, 320], original: [429, 429], category_id: 9 },
    { title: 'Steam Deck 256G 掌机', price: [2000, 2600], original: [3288, 3688], category_id: 9 },
    { title: '皇家 猫粮 室内成猫 10kg', price: [200, 300], original: [498, 558], category_id: 10 },
    { title: '猫爬架 大型 多层 灰色', price: [100, 200], original: [399, 599], category_id: 10 },
    { title: '70迈 行车记录仪 A800 4K', price: [300, 450], original: [699, 799], category_id: 11 },
    { title: 'Yamaha 雅马哈 FG800 吉他', price: [600, 900], original: [1599, 1799], category_id: 12 },
    { title: 'Roland 罗兰 FP-30X 电钢琴', price: [2500, 3500], original: [5290, 5990], category_id: 12 },
    { title: '华为 FreeBuds Pro 3', price: [600, 900], original: [1199, 1499], category_id: 1 },
    { title: 'Adidas Yeezy 350 白冰淇淋', price: [1200, 1800], original: [1899, 2200], category_id: 2 },
    { title: '摩飞 多功能料理锅 薄荷绿', price: [200, 350], original: [599, 699], category_id: 3 },
    { title: 'iPad Pro 11寸 M2 256G', price: [4500, 5800], original: [6799, 7500], category_id: 1 },
    { title: '始祖鸟 Beta LT 冲锋衣 M码', price: [2500, 3500], original: [5600, 6000], category_id: 2 },
    { title: 'Balmuda 巴慕达 烤箱 绿色', price: [800, 1200], original: [2299, 2599], category_id: 3 },
    { title: '罗技 K380 蓝牙键盘 粉色', price: [80, 130], original: [229, 249], category_id: 4 },
    { title: 'Brompton 折叠自行车 6速', price: [6000, 9000], original: [13500, 15000], category_id: 5 },
    { title: 'La Mer 海蓝之谜 面霜 30ml', price: [800, 1200], original: [2650, 2800], category_id: 6 },
    { title: '好孩子 婴儿床 实木 可拼接', price: [300, 500], original: [1299, 1599], category_id: 7 },
  ]

  const CITIES = [
    { name: '北京', lat: 39.9042, lng: 116.4074 },
    { name: '上海', lat: 31.2304, lng: 121.4737 },
    { name: '广州', lat: 23.1291, lng: 113.2644 },
    { name: '深圳', lat: 22.5431, lng: 114.0579 },
    { name: '杭州', lat: 30.2741, lng: 120.1551 },
    { name: '成都', lat: 30.5728, lng: 104.0668 },
  ]

  const CONDITIONS = ['new', 'like_new', 'good', 'good', 'fair'] as const
  const TRADE_METHODS = ['offline', 'escrow', 'both'] as const

  const rand = (min: number, max: number) => Math.random() * (max - min) + min
  const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const intros = ['自用闲置转让。', '买来没怎么用，闲置出了。', '搬家清仓，忍痛出。', '换新款了，旧的出掉。']
  const details = ['功能一切正常，成色看图。', '正常使用痕迹，介意勿拍。', '包装齐全，配件都在。', '本地自提优先，可小刀。', '实物拍摄，所见即所得。']

  const allProducts: { id: string; title: string }[] = []
  const BATCH = 20

  for (let batch = 0; batch < 120; batch += BATCH) {
    const inserts = []
    for (let i = batch; i < Math.min(batch + BATCH, 120); i++) {
      const tpl = pick(TEMPLATES)
      const city = pick(CITIES)
      inserts.push({
        seller_id: sellerUser.id,
        category_id: tpl.category_id,
        title: tpl.title,
        description: `${pick(intros)}\n${pick(details)}\n${pick(details)}`,
        price: randInt(tpl.price[0], tpl.price[1]),
        original_price: tpl.original ? randInt(tpl.original[0], tpl.original[1]) : undefined,
        condition: pick(CONDITIONS),
        trade_method: pick(TRADE_METHODS),
        status: 'active',
        lat: city.lat + rand(-0.05, 0.05),
        lng: city.lng + rand(-0.05, 0.05),
        view_count: randInt(0, 500),
        fav_count: randInt(0, 50),
        is_merchant: Math.random() > 0.7,
        ai_generated: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - randInt(0, 14 * 24 * 60 * 60 * 1000)).toISOString(),
      })
    }

    const { data, error } = await admin.from('products').insert(inserts).select('id, title')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (data) {
      allProducts.push(...data)
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

  return NextResponse.json({ success: true, created: allProducts.length })
}
