import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'
import { sendEmail, merchantApprovalEmail } from '@/lib/mail'

// 获取商家申请列表
export async function GET(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20') || 20, 100)
  const from = (page - 1) * pageSize

  try {
    let query = supabase
      .from('merchant_profiles')
      .select(`
        *,
        user:profiles!user_id(id, nickname, avatar_url, phone, credit_score)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query.range(from, from + pageSize - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [], total: count || 0, page, page_size: pageSize })
  } catch (err) {
    console.error('[admin/merchants] GET error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 审批商家申请
export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()

  try {
    const body = await request.json()
    const { id, status, remark } = body

    if (!id || !['approved', 'rejected', 'suspended'].includes(status)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('merchant_profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 通知申请人
    const titles: Record<string, string> = {
      approved: '商家入驻申请已通过',
      rejected: '商家入驻申请未通过',
      suspended: '商家账号已被暂停',
    }
    const contents: Record<string, string> = {
      approved: '恭喜！你的商家入驻申请已通过，可以开始经营了。',
      rejected: `很遗憾，你的商家入驻申请未通过。${remark ? `原因：${remark}` : ''}`,
      suspended: `你的商家账号已被暂停。${remark ? `原因：${remark}` : ''}`,
    }

    await supabase.from('notifications').insert({
      user_id: data.user_id,
      type: 'system',
      title: titles[status],
      content: contents[status],
      link: '/merchant',
    })

    // 发送邮件通知
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', data.user_id)
      .single()
    if (userProfile?.phone && (status === 'approved' || status === 'rejected')) {
      const email = `${userProfile.phone}@xianmiao.phone`
      const { subject, html } = merchantApprovalEmail(data.shop_name, status === 'approved', remark)
      sendEmail({ to: email, subject, html }).catch(() => {})
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[admin/merchants] PATCH error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
