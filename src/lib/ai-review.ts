/**
 * MiMo AI 商品审核服务
 * 调用小米 MiMo API 对商品进行自动内容审核
 */

interface ReviewResult {
  approved: boolean
  reason: string
  confidence: number
}

const MIMO_API_URL = process.env.MIMO_API_URL || 'https://api.lkbeyond.com/v1/chat/completions'
const MIMO_API_KEY = process.env.MIMO_API_KEY || ''

const REVIEW_PROMPT = `你是一个二手交易平台的商品内容审核员。请审核以下商品信息是否合规。

审核规则：
1. 标题和描述中不能包含违禁品（枪支、毒品、假货等）
2. 不能包含色情、赌博、诈骗等违规内容
3. 价格不能明显异常（如标价0.01元的高价商品）
4. 不能包含广告、引流信息（微信号、QQ号、外链等）
5. 标题和描述需与正常二手商品相关

请以 JSON 格式回复，包含以下字段：
- approved: boolean（true=通过，false=不通过）
- reason: string（不通过的原因，通过则为空字符串）
- confidence: number（0-1之间的置信度）

商品信息：
标题：{title}
描述：{description}
价格：¥{price}
原价：¥{originalPrice}
分类：{category}`

/**
 * 调用 MiMo API 审核商品内容
 */
export async function reviewProduct(product: {
  title: string
  description: string
  price: number
  original_price?: number
  category_id?: number
}): Promise<ReviewResult> {
  if (!MIMO_API_KEY) {
    // 未配置 API Key，返回默认通过
    return { approved: true, reason: '', confidence: 1 }
  }

  // 防止 prompt injection：转义用户输入中的特殊字符
  const sanitize = (s: string) => s.replace(/[{}"<>\[\]]/g, '').replace(/\n{2,}/g, '\n').slice(0, 2000)

  const prompt = REVIEW_PROMPT
    .replace('{title}', sanitize(product.title))
    .replace('{description}', sanitize(product.description || '无描述'))
    .replace('{price}', String(product.price))
    .replace('{originalPrice}', String(product.original_price || product.price))
    .replace('{category}', String(product.category_id || '未分类'))

  try {
    const response = await fetch(MIMO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiMo',
        messages: [
          { role: 'system', content: '你是一个严格的商品内容审核AI，只返回JSON格式的结果，不要输出其他内容。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      console.error('[ai-review] MiMo API 调用失败:', response.status)
      return { approved: true, reason: '', confidence: 0 }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // 解析 JSON 响应
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        return {
          approved: result.approved !== false,
          reason: result.reason || '',
          confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
        }
      }
    } catch {
      console.error('[ai-review] 解析响应失败:', content)
    }

    // 解析失败默认通过
    return { approved: true, reason: '', confidence: 0 }
  } catch (err) {
    console.error('[ai-review] 调用异常:', err)
    return { approved: true, reason: '', confidence: 0 }
  }
}
