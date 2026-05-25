import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 获取当前用户的评价
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from('user_ratings')
      .select(`
        *,
        rater:profiles!rater_id(id, nickname, avatar_url)
      `)
      .eq('ratee_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// 创建评价
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const body = await request.json()
    const { order_id, score, content } = body

    if (!order_id || !score) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    // 获取订单信息
    const { data: order } = await supabase
      .from('orders')
      .select('buyer_id, seller_id, status')
      .eq('id', order_id)
      .single()

    if (!order || order.status !== 'completed') {
      return NextResponse.json({ error: '订单未完成' }, { status: 400 })
    }

    // 验证当前用户是买家或卖家
    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      return NextResponse.json({ error: '无权评价此订单' }, { status: 403 })
    }

    // 验证评分范围
    if (typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json({ error: '评分必须在1-5之间' }, { status: 400 })
    }

    // 检查是否已评价
    const { data: existing } = await supabase
      .from('user_ratings')
      .select('id')
      .eq('order_id', order_id)
      .eq('rater_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: '已评价过此订单' }, { status: 400 })
    }

    const rateeId = order.buyer_id === user.id ? order.seller_id : order.buyer_id

    const { data, error } = await supabase
      .from('user_ratings')
      .insert({
        order_id,
        rater_id: user.id,
        ratee_id: rateeId,
        score,
        content,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
