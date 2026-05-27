import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { productPublishSchema } from '@/lib/validators'
import { PRODUCT_EXPIRE_DAYS } from '@/lib/constants'
import { getProductImages } from '@/lib/product-images'
import { reviewProduct } from '@/lib/ai-review'

// 获取商品列表
export async function GET(request: Request) {
  try {
  // 开发环境用 admin 客户端绕过 RLS，确保数据可见
  const supabase = process.env.NODE_ENV === 'development'
    ? createAdminClient()
    : await createClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)
  const category_id = searchParams.get('category_id')
  const city_id = searchParams.get('city_id')
  const seller_id = searchParams.get('seller_id')
  const status = searchParams.get('status')
  const min_price = searchParams.get('min_price')
  const max_price = searchParams.get('max_price')
  const condition = searchParams.get('condition')
  const trade_method = searchParams.get('trade_method')
  const sort = searchParams.get('sort') || 'newest'

  let query = supabase
    .from('products')
    .select(`
      *,
      images:product_images(url, is_cover, sort_order),
      seller:profiles!seller_id(id, nickname, avatar_url)
    `, { count: 'exact' })

  if (status) {
    query = query.eq('status', status)
  } else {
    query = query.eq('status', 'active')
  }

  if (seller_id) {
    query = query.eq('seller_id', seller_id)
  }

  if (category_id) {
    query = query.eq('category_id', parseInt(category_id))
  }

  if (city_id) {
    query = query.eq('city_id', parseInt(city_id))
  }

  if (min_price) {
    query = query.gte('price', parseFloat(min_price))
  }

  if (max_price) {
    query = query.lte('price', parseFloat(max_price))
  }

  if (condition) {
    query = query.eq('condition', condition)
  }

  if (trade_method) {
    query = query.eq('trade_method', trade_method)
  }

  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'popular':
      query = query.order('view_count', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    total: count || 0,
    page,
    page_size: pageSize,
    has_more: (count || 0) > to + 1,
  })
  } catch (err) {
    return NextResponse.json({ error: '获取商品列表失败' }, { status: 500 })
  }
}

// 创建商品
export async function POST(request: Request) {
  try {
  const supabase = await createClient()

  // 验证用户登录及封禁状态
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .single()

  if (profile?.is_banned) {
    return NextResponse.json({ error: '账号已被封禁' }, { status: 403 })
  }

  const body = await request.json()

  // 验证输入
  const result = productPublishSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.errors[0].message },
      { status: 400 }
    )
  }

  const { images, ...productData } = result.data

  // 风控规则检测
  const { data: riskSettings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'risk_rules')
    .single()

  const riskRules = (riskSettings?.value as Array<{ id: string; name: string; type: string; threshold: number; action: string; enabled: boolean }>) || []

  // 高频发布检测
  const highFreqRule = riskRules.find((r) => r.name.includes('高频发布') && r.enabled)
  if (highFreqRule) {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    if ((count || 0) >= highFreqRule.threshold) {
      if (highFreqRule.action === 'block') {
        return NextResponse.json({ error: '发布过于频繁，请稍后再试' }, { status: 429 })
      }
    }
  }

  // 异常价格检测
  const priceRule = riskRules.find((r) => r.name.includes('异常价格') && r.enabled)
  if (priceRule && productData.original_price && productData.original_price > 0) {
    const discount = productData.price / productData.original_price
    if (discount < priceRule.threshold / 100) {
      if (priceRule.action === 'block') {
        return NextResponse.json({ error: '价格异常，请检查售价和原价' }, { status: 400 })
      }
    }
  }

  // 敏感词过滤
  const wordRule = riskRules.find((r) => r.name.includes('敏感词') && r.enabled)
  if (wordRule) {
    const bannedWords = ['违禁', '枪支', '毒品', '假货', '色情', '赌博', '诈骗']
    const text = `${productData.title} ${productData.description || ''}`.toLowerCase()
    const matched = bannedWords.filter((w) => text.includes(w))
    if (matched.length > 0) {
      if (wordRule.action === 'block') {
        return NextResponse.json({ error: '商品内容包含违规词汇，请修改后重新发布' }, { status: 400 })
      }
    }
  }

  // 重复商品检测
  const dupRule = riskRules.find((r) => r.name.includes('重复商品') && r.enabled)
  if (dupRule) {
    const { data: dupProducts } = await supabase
      .from('products')
      .select('id, title')
      .eq('seller_id', user.id)
      .eq('price', productData.price)
      .neq('status', 'removed')
      .limit(5)
    if (dupProducts && dupProducts.length > 0) {
      const similar = dupProducts.find((p) => p.title === productData.title)
      if (similar) {
        if (dupRule.action === 'block') {
          return NextResponse.json({ error: '检测到重复商品，请勿重复发布' }, { status: 400 })
        }
      }
    }
  }

  // 检查是否启用AI审核
  const { data: appSettings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'app_settings')
    .single()
  const aiReviewEnabled = (appSettings?.value as Record<string, unknown>)?.enable_ai_review === true

  // 创建商品
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      ...productData,
      seller_id: user.id,
      status: aiReviewEnabled ? 'draft' : 'active',
      expires_at: new Date(Date.now() + PRODUCT_EXPIRE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 })
  }

  // 插入图片（用户上传的图片，或自动生成匹配图片）
  const imageUrls = images.length > 0 ? images : getProductImages(productData.title, 3, product.id.slice(0, 8))
  const imageRecords = imageUrls.map((url: string, index: number) => ({
    product_id: product.id,
    url,
    sort_order: index,
    is_cover: index === 0,
  }))

  const { error: imageError } = await supabase
    .from('product_images')
    .insert(imageRecords)

  if (imageError) {
    // 回滚：删除商品
    await supabase.from('products').delete().eq('id', product.id)
    return NextResponse.json({ error: '图片保存失败' }, { status: 500 })
  }

  // AI 自动审核（异步，不阻塞发布响应）
  if (aiReviewEnabled) {
    reviewProduct({
      title: productData.title,
      description: productData.description || '',
      price: productData.price,
      original_price: productData.original_price,
      category_id: productData.category_id,
    }).then(async (result) => {
      if (result.approved) {
        await supabase.from('products').update({ status: 'active' }).eq('id', product.id)
      } else {
        // AI 拒绝，通知卖家
        await supabase.from('products').update({ status: 'removed' }).eq('id', product.id)
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'system',
          title: '商品审核未通过',
          content: `您发布的「${productData.title}」未通过审核。原因：${result.reason}`,
          link: `/product/${product.id}`,
        })
      }
    }).catch((err) => {
      console.error('[ai-review] 审核异常:', err)
    })
  }

  return NextResponse.json({ data: product }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: '创建商品失败' }, { status: 500 })
  }
}
