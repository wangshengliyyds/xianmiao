import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 获取订单详情
export async function GET(
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

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        product:products(id, title, price, description, images:product_images(url, is_cover)),
        buyer:profiles!buyer_id(id, nickname, avatar_url, phone),
        seller:profiles!seller_id(id, nickname, avatar_url, phone),
        status_logs:order_status_logs(*)
      `)
      .eq('id', id)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .single()

    if (error) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[orders/[id]] GET error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 更新订单状态
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }
  const { action, remark } = body

  // 获取当前订单
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single()

  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  // 状态流转逻辑
  let newStatus: string | null = null

  switch (action) {
    case 'pay':
      if (order.status !== 'pending_pay' || order.buyer_id !== user.id) {
        return NextResponse.json({ error: '无法付款' }, { status: 400 })
      }
      newStatus = 'paid'
      break
    case 'ship':
      if (order.status !== 'paid' || order.seller_id !== user.id) {
        return NextResponse.json({ error: '无法发货' }, { status: 400 })
      }
      newStatus = 'shipped'
      break
    case 'confirm':
      if (order.status !== 'shipped' || order.buyer_id !== user.id) {
        return NextResponse.json({ error: '无法确认收货' }, { status: 400 })
      }
      newStatus = 'delivered'
      break
    case 'complete':
      if (order.status !== 'delivered' || order.buyer_id !== user.id) {
        return NextResponse.json({ error: '无法完成' }, { status: 400 })
      }
      newStatus = 'completed'
      break
    case 'cancel':
      if (!['pending_pay', 'paid'].includes(order.status)) {
        return NextResponse.json({ error: '无法取消' }, { status: 400 })
      }
      // 只有买家或卖家本人可以取消
      if (order.buyer_id !== user.id && order.seller_id !== user.id) {
        return NextResponse.json({ error: '无权取消' }, { status: 403 })
      }
      newStatus = 'cancelled'
      break
    case 'refund':
      if (!['paid', 'shipped', 'delivered'].includes(order.status) || order.buyer_id !== user.id) {
        return NextResponse.json({ error: '无法申请退款' }, { status: 400 })
      }
      newStatus = 'refunding'
      break
    default:
      return NextResponse.json({ error: '无效操作' }, { status: 400 })
  }

  // 更新订单状态
  const updateData: Record<string, unknown> = { status: newStatus }

  // 发货时解析物流信息
  if (action === 'ship' && remark) {
    try {
      const logisticsInfo = JSON.parse(remark)
      if (logisticsInfo.company) updateData.logistics_company = logisticsInfo.company
      if (logisticsInfo.no) updateData.logistics_no = logisticsInfo.no
    } catch {
      // remark 不是 JSON，忽略
    }
  }

  // 乐观锁：更新时检查当前状态未被其他请求改变
  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .eq('status', order.status)
    .select()
    .single()

  if (error) {
    // 如果更新失败（被其他请求抢先更新），返回冲突错误
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: '订单状态已被其他操作改变，请刷新后重试' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 记录状态变更日志
  await supabase.from('order_status_logs').insert({
    order_id: id,
    from_status: order.status,
    to_status: newStatus,
    operator_id: user.id,
    remark,
  })

  // 如果取消订单，恢复商品状态
  if (newStatus === 'cancelled' && order.product_id) {
    // 仅当商品当前是 reserved 时才恢复
    await supabase
      .from('products')
      .update({ status: 'active' })
      .eq('id', order.product_id)
      .eq('status', 'reserved')
  }

  // 如果完成订单，更新商品状态为 sold
  if (newStatus === 'completed') {
    await supabase
      .from('products')
      .update({ status: 'sold' })
      .eq('id', order.product_id)
  }

  // 生成通知
  const statusMessages: Record<string, string> = {
    paid: '买家已付款，请尽快发货',
    shipped: '卖家已发货，请注意查收',
    delivered: '买家已确认收货',
    completed: '订单已完成',
    cancelled: '订单已取消',
    refunding: '买家已申请退款，请及时处理',
  }
  const notifyUserId = newStatus === 'paid' || newStatus === 'shipped'
    ? (newStatus === 'paid' ? order.seller_id : order.buyer_id)
    : (user.id === order.buyer_id ? order.seller_id : order.buyer_id)

  if (statusMessages[newStatus!] && notifyUserId !== user.id) {
    await supabase.from('notifications').insert({
      user_id: notifyUserId,
      type: 'order',
      title: '订单状态更新',
      content: statusMessages[newStatus!],
      link: `/order/${id}`,
    })
  }

  return NextResponse.json({ data })
}
