import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 获取收藏列表 / 检查是否已收藏
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')

  // 检查单个商品是否已收藏
  if (productId) {
    const { data } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()
    return NextResponse.json({ favorited: !!data })
  }

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('favorites')
    .select(`
      created_at,
      product:products(
        *,
        images:product_images(url, is_cover, sort_order),
        seller:profiles!seller_id(id, nickname, avatar_url)
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    page_size: pageSize,
    has_more: (count || 0) > to + 1,
  })
}

// 添加收藏
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const body = await request.json()
  const { product_id } = body

  if (!product_id) {
    return NextResponse.json({ error: '请指定商品' }, { status: 400 })
  }

  // 检查是否已收藏
  const { data: existing } = await supabase
    .from('favorites')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('product_id', product_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: '已收藏' }, { status: 400 })
  }

  // 添加收藏
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, product_id })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 增加商品收藏数
  await supabase.rpc('increment_fav_count', { product_id })

  return NextResponse.json({ success: true }, { status: 201 })
}

// 取消收藏
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const product_id = searchParams.get('product_id')

  if (!product_id) {
    return NextResponse.json({ error: '请指定商品' }, { status: 400 })
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', product_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 减少商品收藏数
  await supabase.rpc('decrement_fav_count', { product_id })

  return NextResponse.json({ success: true })
}
