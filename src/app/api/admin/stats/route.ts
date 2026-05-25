import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    const today = new Date().toISOString().split('T')[0]

    switch (type) {
      case 'users': {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        return NextResponse.json({ total: count || 0 })
      }
      case 'products': {
        const [totalRes, activeRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        ])
        return NextResponse.json({ total: totalRes.count || 0, active: activeRes.count || 0 })
      }
      case 'orders': {
        const [totalRes, pendingRes, todayRes] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_pay'),
          supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
        ])
        return NextResponse.json({
          total: totalRes.count || 0,
          pending: pendingRes.count || 0,
          today: todayRes.count || 0,
        })
      }
      case 'review': {
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('updated_at', today),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'removed').gte('updated_at', today),
        ])
        return NextResponse.json({
          pending: pendingRes.count || 0,
          today_approved: approvedRes.count || 0,
          today_rejected: rejectedRes.count || 0,
        })
      }
      default:
        return NextResponse.json({ error: '未知类型' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
}
