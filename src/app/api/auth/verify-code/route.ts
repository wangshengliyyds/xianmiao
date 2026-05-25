import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: '请提供手机号和验证码' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 暴力破解防护：检查最近10分钟内验证次数
    const { count: recentAttempts } = await supabase
      .from('verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    if ((recentAttempts || 0) > 10) {
      return NextResponse.json(
        { error: '验证次数过多，请10分钟后再试' },
        { status: 429 }
      )
    }

    // 查询验证码
    const { data: verification, error: queryError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .single()

    if (queryError || !verification) {
      return NextResponse.json(
        { error: '验证码错误' },
        { status: 400 }
      )
    }

    // 检查验证码是否过期
    const expiresAt = new Date(verification.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      await supabase
        .from('verification_codes')
        .delete()
        .eq('phone', phone)

      return NextResponse.json(
        { error: '验证码已过期，请重新获取' },
        { status: 400 }
      )
    }

    // 验证成功，删除验证码
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone', phone)

    // 通过 profiles 表按手机号查找用户（避免 listUsers 加载全部用户）
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (profile) {
      // 用户已存在，生成登录链接并在服务端创建 session
      const email = `${phone}@xianmiao.phone`
      const { data: linkData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

      if (sessionError) {
        console.error('生成会话失败:', sessionError)
        return NextResponse.json(
          { error: '登录失败' },
          { status: 500 }
        )
      }

      // 用 token_hash 在服务端验证并设置 cookie，不暴露给客户端
      const serverSupabase = await createClient()
      const { error: verifyError } = await serverSupabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: 'magiclink',
      })

      if (verifyError) {
        console.error('OTP 验证失败:', verifyError)
        return NextResponse.json(
          { error: '登录失败' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '登录成功',
        user_id: profile.id,
      })
    } else {
      // 用户不存在，需要注册
      return NextResponse.json({
        success: true,
        message: '验证码正确，需要注册',
        need_register: true
      })
    }
  } catch (err) {
    console.error('验证码验证错误:', err)
    return NextResponse.json(
      { error: '验证失败' },
      { status: 500 }
    )
  }
}
