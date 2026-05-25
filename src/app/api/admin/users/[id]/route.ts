import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/api-auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const supabase = await createClient()
  const { id } = await params
  const user = auth.user

  const body = await request.json()

  // 防止管理员封禁自己
  if (id === user.id && body.is_banned === true) {
    return NextResponse.json({ error: '不能封禁自己' }, { status: 400 })
  }

  // 只允许更新安全字段，防止权限提升
  const allowedFields = ['is_banned', 'credit_score']
  const updates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key]
  }

  // 验证信用分范围
  if ('credit_score' in updates) {
    const score = Number(updates.credit_score)
    if (Number.isNaN(score) || score < 0 || score > 1000) {
      return NextResponse.json({ error: '信用分必须在 0-1000 之间' }, { status: 400 })
    }
    updates.credit_score = score
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '无可更新字段' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 记录审计日志
  if ('is_banned' in updates) {
    const { data: targetProfile } = await supabase.from('profiles').select('nickname').eq('id', id).single()
    const nickname = targetProfile?.nickname || id
    await supabase.from('audit_logs').insert({
      action: updates.is_banned ? 'ban_user' : 'unban_user',
      target_type: 'user',
      target_id: id,
      detail: `${updates.is_banned ? '封禁' : '解封'}用户「${nickname}」`,
      admin_id: user.id,
    })
  }

  return NextResponse.json({ success: true })
}
