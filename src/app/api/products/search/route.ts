import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const supabase = process.env.NODE_ENV === 'development'
      ? createAdminClient()
      : await createClient()
    const { searchParams } = new URL(request.url)

    const keyword = searchParams.get('q') || ''
    const category_id = searchParams.get('category_id')
    const min_price = searchParams.get('min_price')
    const max_price = searchParams.get('max_price')
    const condition = searchParams.get('condition')
    const city_id = searchParams.get('city_id')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)

    let query = supabase
      .from('products')
      .select(`
        *,
        images:product_images(url, is_cover, sort_order),
        seller:profiles!seller_id(id, nickname, avatar_url)
      `, { count: 'exact' })
      .eq('status', 'active')

    // 关键词搜索（转义特殊字符防止注入）
    if (keyword) {
      const escaped = keyword.replace(/[%_\\]/g, '\\$&')
      query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
    }

    // 分类筛选
    if (category_id) {
      query = query.eq('category_id', parseInt(category_id))
    }

    // 价格区间
    if (min_price) {
      query = query.gte('price', parseFloat(min_price))
    }
    if (max_price) {
      query = query.lte('price', parseFloat(max_price))
    }

    // 成色筛选
    if (condition) {
      query = query.eq('condition', condition)
    }

    // 城市筛选
    if (city_id) {
      query = query.eq('city_id', parseInt(city_id))
    }

    // 排序
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

    const { data, error, count } = await query.range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 记录搜索历史
    if (keyword) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('search_history').insert({
          user_id: user.id,
          query: keyword,
          result_count: count || 0,
        })
      }
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      page_size: pageSize,
      has_more: (count || 0) > to + 1,
    })
  } catch {
    return NextResponse.json({ error: '搜索失败' }, { status: 500 })
  }
}
