import { NextResponse } from 'next/server'
import { sendSmsCode, generateCode } from '@/lib/spug'
import { phoneSchema } from '@/lib/validators'

// 内存存储验证码（开发用，生产建议用 Redis）
const codeStore = new Map<string, { code: string; expiresAt: number }>()

// 限流记录
const rateLimit = new Map<string, number>()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = phoneSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '请输入正确的手机号' },
        { status: 400 }
      )
    }

    const { phone } = result.data

    // 限流：60秒内不可重发
    const lastSent = rateLimit.get(phone)
    if (lastSent && Date.now() - lastSent < 60000) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - lastSent)) / 1000)
      return NextResponse.json(
        { error: `请${waitSeconds}秒后再试` },
        { status: 429 }
      )
    }

    // 生成并发送验证码
    const code = generateCode()
    const success = await sendSmsCode(phone, code)

    if (!success) {
      return NextResponse.json(
        { error: '验证码发送失败，请稍后重试' },
        { status: 500 }
      )
    }

    // 存储验证码，5分钟过期
    codeStore.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    })

    // 记录发送时间
    rateLimit.set(phone, Date.now())

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SMS send error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// 导出 codeStore 供 verify 路由使用
export { codeStore }
