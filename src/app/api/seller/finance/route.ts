import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    if (type === 'withdrawals') {
      const { data } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('seller_id', auth.user.id)
        .order('created_at', { ascending: false })
      return NextResponse.json({ data: data || [] })
    }

    // 卖家收入概览
    const { data: orders } = await supabase
      .from('orders')
      .select('pay_amount, commission, status, created_at')
      .eq('seller_id', auth.user.id)

    const completed = (orders || []).filter((o) => o.status === 'completed')
    const totalSales = completed.reduce((sum, o) => sum + (o.pay_amount || 0), 0)
    const totalCommission = completed.reduce((sum, o) => sum + (o.commission || 0), 0)
    const totalEarnings = totalSales - totalCommission

    // 今日数据
    const today = new Date().toISOString().split('T')[0]
    const todayCompleted = completed.filter((o) => o.created_at >= today)
    const todaySales = todayCompleted.reduce((sum, o) => sum + (o.pay_amount || 0), 0)
    const todayCommission = todayCompleted.reduce((sum, o) => sum + (o.commission || 0), 0)

    // 待结算（已付款未完成）
    const pending = (orders || []).filter((o) => ['paid', 'shipped', 'delivered'].includes(o.status))
    const pendingAmount = pending.reduce((sum, o) => sum + (o.pay_amount || 0) - (o.commission || 0), 0)

    // 近7天趋势
    const dailyTrend: Array<{ date: string; sales: number; commission: number; earnings: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayStr = nextDay.toISOString().split('T')[0]

      const dayOrders = completed.filter((o) => o.created_at >= dateStr && o.created_at < nextDayStr)
      const daySales = dayOrders.reduce((sum, o) => sum + (o.pay_amount || 0), 0)
      const dayCommission = dayOrders.reduce((sum, o) => sum + (o.commission || 0), 0)
      dailyTrend.push({
        date: dateStr,
        sales: daySales,
        commission: dayCommission,
        earnings: daySales - dayCommission,
      })
    }

    // 已提金额
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount, status')
      .eq('seller_id', auth.user.id)
      .eq('status', 'approved')

    const totalWithdrawn = (withdrawals || []).reduce((sum, w) => sum + (w.amount || 0), 0)
    const availableBalance = totalEarnings - totalWithdrawn

    return NextResponse.json({
      total_sales: totalSales,
      total_commission: totalCommission,
      total_earnings: totalEarnings,
      today_sales: todaySales,
      today_commission: todayCommission,
      pending_amount: pendingAmount,
      total_withdrawn: totalWithdrawn,
      available_balance: availableBalance,
      completed_orders: completed.length,
      pending_orders: pending.length,
      daily_trend: dailyTrend,
    })
  } catch {
    return NextResponse.json({ error: '获取财务数据失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  try {
    const { amount } = await request.json()
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '请输入有效金额' }, { status: 400 })
    }

    // 检查是否有待处理的提现申请
    const { data: pendingWithdrawals } = await supabase
      .from('withdrawals')
      .select('id')
      .eq('seller_id', auth.user.id)
      .eq('status', 'pending')
      .limit(1)

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return NextResponse.json({ error: '已有待处理的提现申请，请等待审核后再申请' }, { status: 400 })
    }

    // 计算可提金额（包含待审批提现一起扣除）
    const { data: orders } = await supabase
      .from('orders')
      .select('pay_amount, commission')
      .eq('seller_id', auth.user.id)
      .eq('status', 'completed')

    const totalSales = (orders || []).reduce((sum, o) => sum + (o.pay_amount || 0), 0)
    const totalCommission = (orders || []).reduce((sum, o) => sum + (o.commission || 0), 0)
    const totalEarnings = totalSales - totalCommission

    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('seller_id', auth.user.id)
      .in('status', ['approved', 'pending'])

    const totalWithdrawn = (withdrawals || []).reduce((sum, w) => sum + (w.amount || 0), 0)
    const available = totalEarnings - totalWithdrawn

    if (amount > available) {
      return NextResponse.json({ error: '提现金额超出可用余额' }, { status: 400 })
    }

    const { error } = await supabase
      .from('withdrawals')
      .insert({
        seller_id: auth.user.id,
        amount,
        status: 'pending',
      })

    if (error) {
      return NextResponse.json({ error: '提现申请失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '提现申请失败' }, { status: 500 })
  }
}
