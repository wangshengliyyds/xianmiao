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
    const { imageUrl, type } = body as { imageUrl: string; type: 'product' | 'chat' }

    if (!imageUrl) {
      return NextResponse.json({ error: '缺少图片URL' }, { status: 400 })
    }

    // 如果没有配置 MiMo，返回模拟数据
    if (!MIMO_API_URL || !MIMO_API_KEY) {
      return NextResponse.json({
        success: true,
        data: {
          category_guess: '电子产品',
          brand_guess: null,
          condition_guess: 'good',
          defect_tags: [],
          suggested_price: 299,
          price_range_low: 200,
          price_range_high: 400,
          title_suggestion: '九成新二手好物转让',
          description_suggestion: '物品成色良好，功能正常，同城交易优先。',
          risk_flags: [],
        },
      })
    }

    // 调用 MiMo API
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
            content: `你是一个二手商品分析助手。请分析商品图片并返回JSON格式的结果：
{
  "category_guess": "商品类别",
  "brand_guess": "品牌（如果能识别）",
  "condition_guess": "new|like_new|good|fair|poor",
  "defect_tags": ["瑕疵标签"],
  "suggested_price": 建议售价（元）,
  "price_range_low": 最低价,
  "price_range_high": 最高价,
  "title_suggestion": "建议标题（30字内）",
  "description_suggestion": "建议描述（100字内）",
  "risk_flags": ["风险标记"]
}`
          },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUrl } },
              { type: 'text', text: '请分析这张商品图片' },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`MiMo API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || ''

    // 解析 JSON 响应
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0])
        return NextResponse.json({ success: true, data })
      }
    } catch {
      // JSON 解析失败
    }

    return NextResponse.json({
      success: true,
      data: {
        category_guess: null,
        brand_guess: null,
        condition_guess: 'good',
        defect_tags: [],
        suggested_price: null,
        price_range_low: null,
        price_range_high: null,
        title_suggestion: null,
        description_suggestion: null,
        risk_flags: [],
      },
    })
  } catch (error) {
    console.error('AI analyze error:', error)
    return NextResponse.json({ error: '分析失败' }, { status: 500 })
  }
}
