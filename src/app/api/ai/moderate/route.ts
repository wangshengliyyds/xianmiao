import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

const MIMO_API_URL = process.env.MIMO_API_URL || ''
const MIMO_API_KEY = process.env.MIMO_API_KEY || ''

// 敏感词快速检查（兜底方案）
const SENSITIVE_WORDS = [
  '微信号', '微信', 'QQ号', '加我', '私聊',
  '转账', '红包', '先款', '先钱',
  '假货', '高仿', 'A货',
]

export async function POST(request: NextRequest) {
  try {
    // 登录检查（Supabase 未配置时跳过）
    if (isSupabaseConfigured()) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: '请先登录' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { text, type } = body as { text: string; type: 'message' | 'product' | 'comment' }

    if (!text) {
      return NextResponse.json({ safe: true })
    }

    // 快速敏感词检查
    const foundSensitive = SENSITIVE_WORDS.filter((word) => text.includes(word))
    if (foundSensitive.length > 0) {
      return NextResponse.json({
        safe: false,
        reason: '包含敏感词',
        flags: foundSensitive,
        action: type === 'message' ? 'warn' : 'block',
      })
    }

    // 如果没有配置 MiMo，直接返回安全
    if (!MIMO_API_URL || !MIMO_API_KEY) {
      return NextResponse.json({ safe: true })
    }

    // MiMo 内容审核
    const response = await fetch(`${MIMO_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiMo-v2-Pro',
        messages: [
          {
            role: 'system',
            content: `你是一个内容安全审核助手。判断以下内容是否安全。
返回JSON格式：
{
  "safe": true/false,
  "reason": "不安全的原因",
  "flags": ["风险标签"],
  "action": "block/warn/pass"
}
检查项：欺诈、色情、暴力、违法商品、联系方式泄露、虚假宣传。`
          },
          {
            role: 'user',
            content: `[${type}] ${text}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      // API 失败时放行
      return NextResponse.json({ safe: true })
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || ''

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0])
        return NextResponse.json(data)
      }
    } catch {
      // 解析失败则放行
    }

    return NextResponse.json({ safe: true })
  } catch (error) {
    console.error('AI moderate error:', error)
    return NextResponse.json({ safe: true })
  }
}
