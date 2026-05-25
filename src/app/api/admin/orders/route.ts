import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

// 管理员获取全平台订单
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
    .from('orders')
    .select(`
      *,
      product:products(id, title, price, images:product_images(url, is_cover)),
      buyer:profiles!buyer_id(id, nickname, avatar_url),
      seller:profiles!seller_id(id, nickname, avatar_url)
    `, { count: 'exact' })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    const escaped = search.replace(/[%_\\]/g, '\\$&')
    query = query.ilike('order_no', `%${escaped}%`)
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

// 管理员操作订单
export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  const body = await request.json()
  const { id, action } = body

  if (!id || !action) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 })
  }

  const statusMap: Record<string, string> = {
    cancel: 'cancelled',
    refund: 'refunded',
  }

  const newStatus = statusMap[action]
  if (!newStatus) {
    return NextResponse.json({ error: '无效操作' }, { status: 400 })
  }

  // 先获取当前订单状态
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('status, product_id')
    .eq('id', id)
    .single()

  if (!currentOrder) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  // 状态校验
  const cancelableStatuses = ['pending_pay', 'paid', 'shipped']
  const refundableStatuses = ['paid', 'shipped', 'delivered']
  if (action === 'cancel' && !cancelableStatuses.includes(currentOrder.status)) {
    return NextResponse.json({ error: `当前状态（${currentOrder.status}）无法取消` }, { status: 400 })
  }
  if (action === 'refund' && !refundableStatuses.includes(currentOrder.status)) {
    return NextResponse.json({ error: `当前状态（${currentOrder.status}）无法退款` }, { status: 400 })
  }

  // 更新订单状态
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 记录状态变更日志
  await supabase.from('order_status_logs').insert({
    order_id: id,
    from_status: currentOrder?.status,
    to_status: newStatus,
    operator_id: auth.user.id,
    remark: `管理员操作: ${action}`,
  })

  // 记录审计日志
  await supabase.from('audit_logs').insert({
    action: action === 'cancel' ? 'cancel_order' : 'refund_order',
    target_type: 'order',
    target_id: id,
    detail: `管理员${action === 'cancel' ? '取消' : '退款'}订单`,
    admin_id: auth.user.id,
  })

  // 取消订单时恢复商品状态（仅当商品仍为 reserved 时）
  if (action === 'cancel' && currentOrder?.product_id) {
    await supabase
      .from('products')
      .update({ status: 'active' })
      .eq('id', currentOrder.product_id)
      .eq('status', 'reserved')
  }

  return NextResponse.json({ success: true })
}
