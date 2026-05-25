import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: '请输入正确的手机号' },
        { status: 400 }
      )
    }

    // 频率限制：同一手机号60秒内只能发送一次
    const supabase = createAdminClient()
    const { data: recentCode } = await supabase
      .from('verification_codes')
      .select('created_at')
      .eq('phone', phone)
      .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString())
      .maybeSingle()
    if (recentCode) {
      return NextResponse.json(
        { error: '验证码发送过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    // 生成6位验证码
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0')

    // 存储验证码到数据库（5分钟有效期）
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // 先删除该手机号的旧验证码
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone', phone)

    // 插入新验证码
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        phone,
        code,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('验证码存储失败:', insertError)
      return NextResponse.json(
        { error: '发送验证码失败' },
        { status: 500 }
      )
    }

    // 调用 Spug 短信服务发送验证码
    let smsSent = false
    const spugUrl = process.env.SPUG_API_URL
    if (spugUrl) {
      try {
        const spugResponse = await fetch(spugUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            code,
            content: `【闲妙】您的验证码是 ${code}，5分钟内有效，请勿泄露。`
          })
        })
        const spugResult = await spugResponse.json().catch(() => ({}))
        if (spugResponse.ok && (spugResult as any).code === 200) {
          smsSent = true
          console.log(`[SMS] 验证码已发送至 ${phone}, request_id: ${(spugResult as any).request_id}`)
        } else {
          console.error('[SMS] Spug 发送失败:', spugResult)
        }
      } catch (spugError) {
        console.error('[SMS] Spug 异常:', spugError)
      }
    }

    // 返回验证码用于测试（短信服务不可用时自动显示）
    const response: Record<string, unknown> = {
      success: true,
      message: '验证码已发送',
    }
    // 未配置短信服务或发送失败时，在页面上显示验证码
    if (!smsSent) {
      response.dev_code = code
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('发送验证码错误:', err)
    return NextResponse.json(
      { error: '发送验证码失败' },
      { status: 500 }
    )
  }
}
