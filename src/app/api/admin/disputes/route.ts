import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)

  // 查询有争议的订单（退款中、已退款、争议中）
  const { data, error, count } = await supabase
    .from('orders')
    .select(`
      *,
      product:products(id, title),
      buyer:profiles!buyer_id(id, nickname),
      seller:profiles!seller_id(id, nickname)
    `, { count: 'exact' })
    .in('status', ['refunding', 'refunded', 'disputed'])
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data || [], total: count || 0 })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const body = await request.json()
  const { order_id, action, remark } = body

  if (!order_id || !action) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  const statusMap: Record<string, string> = {
    resolve: 'completed',
    reject: 'cancelled',
    refund: 'refunded',
  }

  const newStatus = statusMap[action]
  if (!newStatus) {
    return NextResponse.json({ error: '无效操作' }, { status: 400 })
  }

  // 先获取订单的 product_id
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('product_id')
    .eq('id', order_id)
    .single()

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus, remark: remark || null })
    .eq('id', order_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 取消或退款时恢复商品状态
  if ((action === 'reject' || action === 'refund') && currentOrder?.product_id) {
    await supabase
      .from('products')
      .update({ status: 'active' })
      .eq('id', currentOrder.product_id)
      .eq('status', 'reserved')
  }

  return NextResponse.json({ success: true })
}
