import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { smsVerifySchema } from '@/lib/validators'
import { codeStore } from '../send/route'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

function isSupabaseConfigured() {
  return (
    SUPABASE_URL.length > 0 &&
    !SUPABASE_URL.includes('placeholder') &&
    SUPABASE_SERVICE_KEY.length > 0 &&
    !SUPABASE_SERVICE_KEY.includes('placeholder')
  )
}

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = smsVerifySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '请输入正确的手机号和验证码' },
        { status: 400 }
      )
    }

    const { phone, code } = result.data

    // 验证验证码
    const stored = codeStore.get(phone)

    if (!stored) {
      return NextResponse.json(
        { error: '验证码已过期，请重新获取' },
        { status: 400 }
      )
    }

    if (Date.now() > stored.expiresAt) {
      codeStore.delete(phone)
      return NextResponse.json(
        { error: '验证码已过期，请重新获取' },
        { status: 400 }
      )
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { error: '验证码错误' },
        { status: 400 }
      )
    }

    // 验证通过，清除验证码
    codeStore.delete(phone)

    // Supabase 未配置时返回 mock 登录成功
    if (!isSupabaseConfigured()) {
      console.log(`[DEV] 登录成功（Mock模式）: ${phone}`)
      return NextResponse.json({
        success: true,
        token_hash: `dev-mock-token-${phone}`,
        type: 'magiclink',
        is_new: true,
      })
    }

    const admin = getAdminClient()

    // 查找或创建用户
    const email = `${phone}@xianmiao.phone`

    // 尝试用邮箱登录（手机号作为邮箱格式）
    const { data: existingUser } = await admin.auth.admin.listUsers()

    let userId: string
    const foundUser = existingUser?.users?.find(
      (u) => u.phone === phone || u.email === email
    )

    if (foundUser) {
      userId = foundUser.id
    } else {
      // 创建新用户
      const { data: newUser, error: createError } =
        await admin.auth.admin.createUser({
          phone,
          email,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: { phone },
        })

      if (createError || !newUser.user) {
        console.error('Create user error:', createError)
        return NextResponse.json(
          { error: '创建用户失败' },
          { status: 500 }
        )
      }

      userId = newUser.user.id

      // 创建 profile
      await admin.from('profiles').insert({
        id: userId,
        nickname: `用户${phone.slice(-4)}`,
        phone,
      })
    }

    // 生成登录 token（通过 Supabase 的 generateLink）
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

    if (linkError || !linkData) {
      console.error('Generate link error:', linkError)
      return NextResponse.json(
        { error: '登录失败' },
        { status: 500 }
      )
    }

    // 返回 token hash 用于前端设置 session
    return NextResponse.json({
      success: true,
      token_hash: linkData.properties.hashed_token,
      type: linkData.properties.verification_type,
      is_new: !foundUser,
    })
  } catch (error) {
    console.error('SMS verify error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
