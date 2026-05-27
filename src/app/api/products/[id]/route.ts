import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 获取商品详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const supabase = process.env.NODE_ENV === 'development'
    ? createAdminClient()
    : await createClient()
  const { id } = await params

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, title, description, price, original_price, condition, trade_method, status,
      category_id, city, lat, lng, view_count, fav_count, created_at, expires_at,
      images:product_images(id, url, is_cover, sort_order),
      videos:product_videos(id, url, thumbnail_url),
      skus:product_skus(id, name, price, stock),
      seller:profiles!seller_id(id, nickname, avatar_url, credit_score, created_at),
      ai_analysis:product_ai_analysis(id, result, risk_level, created_at)
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: '商品不存在' }, { status: 404 })
  }

  // 增加浏览次数（使用 RPC 原子操作）
  await supabase.rpc('increment_view_count', { product_id_param: id })

  // 记录浏览记录
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('product_views').insert({
      product_id: id,
      viewer_id: user.id,
      source: 'direct',
    })
  }

  return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '获取商品详情失败' }, { status: 500 })
  }
}

// 更新商品
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  // 验证所有权
  const { data: product } = await supabase
    .from('products')
    .select('seller_id')
    .eq('id', id)
    .single()

  // 验证所有权或管理员权限
  const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = userProfile?.role === 'admin'

  if (!product || (product.seller_id !== user.id && !isAdmin)) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 })
  }

  const body = await request.json()
  const { images, ...rest } = body

  // 只允许更新安全字段，并验证值
  const allowedFields = isAdmin
    ? ['title', 'description', 'price', 'original_price', 'condition', 'trade_method', 'category_id', 'city', 'lat', 'lng', 'status']
    : ['title', 'description', 'price', 'original_price', 'condition', 'trade_method', 'category_id', 'city', 'lat', 'lng']
  const validConditions = ['new', 'like_new', 'good', 'fair', 'poor']
  const validTradeMethods = ['offline', 'escrow', 'both']
  const validStatuses = ['active', 'draft', 'reserved', 'sold', 'expired', 'removed']
  const updateData: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (!(key in rest)) continue
    const val = rest[key]
    if (key === 'title' && (typeof val !== 'string' || !val.trim())) continue
    if ((key === 'price' || key === 'original_price') && (typeof val !== 'number' || val < 0)) continue
    if (key === 'condition' && !validConditions.includes(val)) continue
    if (key === 'trade_method' && !validTradeMethods.includes(val)) continue
    if (key === 'status' && !validStatuses.includes(val)) continue
    updateData[key] = val
  }

  if (Object.keys(updateData).length === 0 && !images) {
    return NextResponse.json({ error: '无可更新字段' }, { status: 400 })
  }

  const { data, error } = Object.keys(updateData).length > 0
    ? await supabase.from('products').update(updateData).eq('id', id).select().single()
    : await supabase.from('products').select().eq('id', id).single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 更新图片（先插入新的，成功后再删除旧的，避免中间失败导致无图片）
  if (images) {
    if (images.length > 0) {
      // 先查出旧图片 URL
      const { data: oldImages } = await supabase
        .from('product_images')
        .select('url')
        .eq('product_id', id)
      const oldUrls = new Set((oldImages || []).map((i) => i.url))

      // 插入新图片中不存在的
      const newRecords = images
        .map((url: string, index: number) => ({ product_id: id, url, sort_order: index, is_cover: index === 0 }))
        .filter((r: { url: string }) => !oldUrls.has(r.url))

      if (newRecords.length > 0) {
        const { error: insertError } = await supabase.from('product_images').insert(newRecords)
        if (insertError) {
          return NextResponse.json({ error: '图片更新失败' }, { status: 500 })
        }
      }

      // 删除不在新列表中的旧图片
      const newUrlSet = new Set(images)
      const urlsToDelete = [...oldUrls].filter((url) => !newUrlSet.has(url))
      if (urlsToDelete.length > 0) {
        await supabase.from('product_images').delete().eq('product_id', id).in('url', urlsToDelete)
      }

      // 更新排序和封面 — 先设新封面，再清旧封面，避免短暂无封面窗口
      await supabase.from('product_images').update({ is_cover: true }).eq('product_id', id).eq('url', images[0])
      await supabase.from('product_images').update({ is_cover: false }).eq('product_id', id).neq('url', images[0])
    } else {
      await supabase.from('product_images').delete().eq('product_id', id)
    }
  }

  return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '更新商品失败' }, { status: 500 })
  }
}

// 删除商品
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  // 验证所有权
  const { data: product } = await supabase
    .from('products')
    .select('seller_id')
    .eq('id', id)
    .single()

  if (!product || product.seller_id !== user.id) {
    return NextResponse.json({ error: '无权删除该商品' }, { status: 403 })
  }

  // 检查是否有进行中的订单
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('product_id', id)
    .in('status', ['pending_pay', 'paid', 'shipped', 'delivered'])
    .limit(1)

  if (activeOrders && activeOrders.length > 0) {
    return NextResponse.json({ error: '该商品有进行中的订单，无法删除' }, { status: 400 })
  }

  // 软删除：改为 removed 状态
  const { error } = await supabase
    .from('products')
    .update({ status: 'removed' })
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '删除商品失败' }, { status: 500 })
  }
}
