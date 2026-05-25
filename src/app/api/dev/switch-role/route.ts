import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TEST_ACCOUNTS: Record<string, {
  phone: string
  email: string
  password: string
  nickname: string
  credit_score: number
  is_verified: boolean
  avatarInitial: string
  avatarColor: string
}> = {
  buyer: {
    phone: '13800000001',
    email: '13800000001@xianmiao.phone',
    password: 'dev2026xm',
    nickname: '小明同学',
    credit_score: 750,
    is_verified: true,
    avatarInitial: '明',
    avatarColor: '#3b82f6',
  },
  seller: {
    phone: '16632265014',
    email: '16632265014@xianmiao.phone',
    password: 'dev2026xm',
    nickname: '好物优选铺',
    credit_score: 920,
    is_verified: true,
    avatarInitial: '优',
    avatarColor: '#f59e0b',
  },
  admin: {
    phone: '13800000003',
    email: '13800000003@xianmiao.phone',
    password: 'dev2026xm',
    nickname: '系统管理员',
    credit_score: 999,
    is_verified: true,
    avatarInitial: '管',
    avatarColor: '#6366f1',
  },
}

function makeAvatarSvg(initial: string, color: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="${color}"/><text x="60" y="78" text-anchor="middle" font-family="system-ui,-apple-system,'Noto Sans SC',sans-serif" font-size="52" font-weight="700" fill="white">${initial}</text></svg>`
  )}`
}

export async function POST(request: Request) {
  const { role } = await request.json()
  const account = TEST_ACCOUNTS[role]
  if (!account) {
    return NextResponse.json({ error: '无效角色' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 查找已有账号（按邮箱）
  const { data: listData } = await admin.auth.admin.listUsers()
  const existing = listData?.users?.find((u) => u.email === account.email)

  let userId: string
  let isNew = false

  if (existing) {
    userId = existing.id
    // 确保密码正确（防止旧密码残留）
    await admin.auth.admin.updateUserById(userId, {
      password: account.password,
      email_confirm: true,
    })
  } else {
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { phone: account.phone, nickname: account.nickname },
    })
    if (createError || !newUser.user) {
      return NextResponse.json({ error: '创建测试账号失败: ' + (createError?.message || '未知错误') }, { status: 500 })
    }
    userId = newUser.user.id
    isNew = true
  }

  // 首次创建：写入完整信息；后续切换：只改角色，不覆盖昵称/头像
  if (isNew) {
    const avatarUrl = makeAvatarSvg(account.avatarInitial, account.avatarColor)
    await admin
      .from('profiles')
      .update({
        role,
        nickname: account.nickname,
        avatar_url: avatarUrl,
        phone: account.phone,
        credit_score: account.credit_score,
        is_verified: account.is_verified,
      })
      .eq('id', userId)
  } else {
    await admin.from('profiles').update({ role }).eq('id', userId)
  }

  // 卖家：创建商家资料
  if (role === 'seller') {
    const { count } = await admin
      .from('merchant_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (!count) {
      await admin.from('merchant_profiles').insert({
        user_id: userId,
        shop_name: '好物优选铺',
        deposit_amount: 1000,
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
    }
  }

  // 切换登录
  const supabase = await createClient()
  await supabase.auth.signOut()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  })

  if (signInError) {
    return NextResponse.json({ error: '登录失败: ' + signInError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, role, nickname: account.nickname })
}
