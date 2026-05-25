import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)

  let query = supabase
    .from('products')
    .select(`
      *,
      images:product_images(url, is_cover),
      seller:profiles!seller_id(id, nickname)
    `, { count: 'exact' })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    const escaped = search.replace(/[%_\\]/g, '\\$&')
    query = query.ilike('title', `%${escaped}%`)
  }

  query = query.order('created_at', { ascending: false })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    page_size: pageSize,
    has_more: (count || 0) > to + 1,
  })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  const body = await request.json()
  const { id, action } = body

  if (!id || !action) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 })
  }

  if (action === 'remove') {
    const { data: product } = await supabase
      .from('products')
      .select('title')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('products')
      .update({ status: 'removed' })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('audit_logs').insert({
      action: 'remove_product',
      target_type: 'product',
      target_id: id,
      detail: `下架商品「${product?.title || id}」`,
      admin_id: auth.user.id,
    })

    return NextResponse.json({ success: true })
  }

  if (action === 'activate') {
    const { error } = await supabase
      .from('products')
      .update({ status: 'active' })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('audit_logs').insert({
      action: 'activate_product',
      target_type: 'product',
      target_id: id,
      detail: `上架商品「${id}」`,
      admin_id: auth.user.id,
    })

    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    // 永久删除：先删图片再删商品
    await supabase.from('product_images').delete().eq('product_id', id)
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('audit_logs').insert({
      action: 'delete_product',
      target_type: 'product',
      target_id: id,
      detail: `永久删除商品「${id}」`,
      admin_id: auth.user.id,
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '无效操作' }, { status: 400 })
}
