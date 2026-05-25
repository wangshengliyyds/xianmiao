import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'withdrawals') {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*, seller:profiles!seller_id(id, nickname, avatar_url)')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          return NextResponse.json({ data: [] })
        }
        throw error
      }
      return NextResponse.json({ data: data || [] })
    } catch {
      return NextResponse.json({ data: [] })
    }
  }

  if (type === 'commissions') {
    try {
      // 卖家提成统计
      const { data: sellerData } = await supabase
        .from('orders')
        .select('seller_id, pay_amount, commission')
        .eq('status', 'completed')

      const sellerMap = new Map<string, { total_sales: number; total_commission: number; order_count: number }>()
      for (const o of sellerData || []) {
        const s = sellerMap.get(o.seller_id) || { total_sales: 0, total_commission: 0, order_count: 0 }
        s.total_sales += o.pay_amount || 0
        s.total_commission += o.commission || 0
        s.order_count += 1
        sellerMap.set(o.seller_id, s)
      }

      const sellerIds = [...sellerMap.keys()]
      let sellerProfiles: Record<string, { nickname: string; avatar_url: string | null }> = {}
      if (sellerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .in('id', sellerIds)
        for (const p of profiles || []) {
          sellerProfiles[p.id] = { nickname: p.nickname, avatar_url: p.avatar_url }
        }
      }

      const sellers = sellerIds.map((id) => ({
        id,
        nickname: sellerProfiles[id]?.nickname || id.slice(0, 8),
        avatar_url: sellerProfiles[id]?.avatar_url || null,
        ...sellerMap.get(id)!,
      })).sort((a, b) => b.total_commission - a.total_commission)

      // 买家消费统计
      const { data: buyerData } = await supabase
        .from('orders')
        .select('buyer_id, pay_amount')
        .eq('status', 'completed')

      const buyerMap = new Map<string, { total_spent: number; order_count: number }>()
      for (const o of buyerData || []) {
        const b = buyerMap.get(o.buyer_id) || { total_spent: 0, order_count: 0 }
        b.total_spent += o.pay_amount || 0
        b.order_count += 1
        buyerMap.set(o.buyer_id, b)
      }

      const buyerIds = [...buyerMap.keys()]
      let buyerProfiles: Record<string, { nickname: string; avatar_url: string | null }> = {}
      if (buyerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .in('id', buyerIds)
        for (const p of profiles || []) {
          buyerProfiles[p.id] = { nickname: p.nickname, avatar_url: p.avatar_url }
        }
      }

      const buyers = buyerIds.map((id) => ({
        id,
        nickname: buyerProfiles[id]?.nickname || id.slice(0, 8),
        avatar_url: buyerProfiles[id]?.avatar_url || null,
        ...buyerMap.get(id)!,
      })).sort((a, b) => b.total_spent - a.total_spent)

      return NextResponse.json({ sellers, buyers })
    } catch {
      return NextResponse.json({ sellers: [], buyers: [] })
    }
  }

  // 默认：概览数据
  try {
    const today = new Date().toISOString().split('T')[0]

    const [completedRes, todayCompletedRes, totalRes, todayRes] = await Promise.all([
      supabase.from('orders').select('pay_amount, commission, updated_at', { count: 'exact' }).eq('status', 'completed'),
      supabase.from('orders').select('pay_amount, commission').eq('status', 'completed').gte('updated_at', today),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
    ])

    const completedOrders = completedRes.data || []
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.pay_amount || 0), 0)
    const totalCommission = completedOrders.reduce((sum, o) => sum + (o.commission || 0), 0)
    const todayRevenue = (todayCompletedRes.data || []).reduce((sum, o) => sum + (o.pay_amount || 0), 0)
    const todayCommission = (todayCompletedRes.data || []).reduce((sum, o) => sum + (o.commission || 0), 0)
    const completedCount = completedRes.count || 0

    const dailyTrend: Array<{ date: string; revenue: number; commission: number; orders: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayStr = nextDay.toISOString().split('T')[0]

      const dayOrders = completedOrders.filter((o) => o.updated_at >= dateStr && o.updated_at < nextDayStr)
      dailyTrend.push({
        date: dateStr,
        revenue: dayOrders.reduce((sum, o) => sum + (o.pay_amount || 0), 0),
        commission: dayOrders.reduce((sum, o) => sum + (o.commission || 0), 0),
        orders: dayOrders.length,
      })
    }

    return NextResponse.json({
      total_revenue: totalRevenue,
      today_revenue: todayRevenue,
      total_commission: totalCommission,
      today_commission: todayCommission,
      total_orders: totalRes.count || 0,
      today_orders: todayRes.count || 0,
      completed_orders: completedCount,
      avg_order_amount: completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0,
      daily_trend: dailyTrend,
    })
  } catch {
    return NextResponse.json({ error: '获取财务数据失败' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  try {
    const body = await request.json()
    const { withdrawal_id, action } = body

    if (!withdrawal_id || !action) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: '无效操作' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const { data, error } = await supabase
      .from('withdrawals')
      .update({
        status: newStatus,
        processed_by: auth.user.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawal_id)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '更新提现状态失败' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '更新提现状态失败' }, { status: 500 })
  }
}
