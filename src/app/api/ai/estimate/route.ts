import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

const MIMO_API_URL = process.env.MIMO_API_URL || ''
const MIMO_API_KEY = process.env.MIMO_API_KEY || ''

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
    const { title, category, condition, brand, originalPrice } = body as {
      title: string
      category?: string
      condition: string
      brand?: string
      originalPrice?: number
    }

    if (!title) {
      return NextResponse.json({ error: '缺少商品标题' }, { status: 400 })
    }

    // 如果没有配置 MiMo，返回基于原价的简单估算
    if (!MIMO_API_URL || !MIMO_API_KEY) {
      const conditionMultiplier: Record<string, number> = {
        new: 0.85, like_new: 0.7, good: 0.5, fair: 0.3, poor: 0.15,
      }
      const base = originalPrice || 100
      const mult = conditionMultiplier[condition] || 0.5
      const suggested = Math.round(base * mult)
      return NextResponse.json({
        success: true,
        data: {
          suggested_price: suggested,
          price_range_low: Math.round(suggested * 0.8),
          price_range_high: Math.round(suggested * 1.2),
          confidence: 0.6,
          reason: `基于${condition}成色和原价估算`,
        },
      })
    }

    // MiMo 估价
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
            content: `你是一个二手商品估价助手。根据商品信息给出合理估价。
返回JSON格式：
{
  "suggested_price": 建议售价,
  "price_range_low": 最低价,
  "price_range_high": 最高价,
  "confidence": 0-1的置信度,
  "reason": "估价理由"
}`
          },
          {
            role: 'user',
            content: `商品: ${title}
类别: ${category || '未知'}
成色: ${condition}
品牌: ${brand || '未知'}
原价: ${originalPrice || '未知'}
请给出二手估价（人民币）。`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`MiMo API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || ''

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0])
        return NextResponse.json({ success: true, data })
      }
    } catch {
      // 解析失败
    }

    return NextResponse.json({
      success: false,
      error: '估价失败',
    })
  } catch (error) {
    console.error('AI estimate error:', error)
    return NextResponse.json({ error: '估价失败' }, { status: 500 })
  }
}
