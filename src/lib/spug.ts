// Spug 短信验证码 API 封装
// 文档: https://spug.dev

const SPUG_API_URL = process.env.SPUG_API_URL || ''
const SPUG_APP_KEY = process.env.SPUG_APP_KEY || ''

interface SpugResponse {
  code: number
  msg: string
  data?: unknown
}

export async function sendSmsCode(phone: string, code: string): Promise<boolean> {
  if (!SPUG_API_URL || !SPUG_APP_KEY) {
    // 开发模式：打印验证码到控制台
    console.log(`[DEV] 验证码发送到 ${phone}: ${code}`)
    return true
  }

  try {
    const res = await fetch(`${SPUG_API_URL}/api/tv/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': SPUG_APP_KEY,
      },
      body: JSON.stringify({
        phone,
        template_code: 'login_code', // Spug模板编码，按实际配置修改
        params: { code },
      }),
    })

    const data: SpugResponse = await res.json()
    return data.code === 200
  } catch (error) {
    console.error('Spug send error:', error)
    return false
  }
}

export function generateCode(): string {
  return Math.random().toString().slice(2, 8)
}
