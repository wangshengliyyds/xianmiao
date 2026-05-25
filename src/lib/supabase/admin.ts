import { createClient } from '@supabase/supabase-js'

// 支持通过代理访问 Supabase（国内网络需要）
function getProxyFetch(): typeof fetch | undefined {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.GLOBAL_AGENT_HTTP_PROXY
  if (!proxyUrl) return undefined

  // 动态导入 undici，仅在需要代理时使用
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProxyAgent, fetch: undiciFetch } = require('undici')
  const dispatcher = new ProxyAgent({ uri: proxyUrl, connectTimeout: 15000, headersTimeout: 30000 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((input: any, init?: any) => {
    return undiciFetch(input, { ...init, dispatcher })
  }) as typeof fetch
}

// 管理员客户端，使用 service_role key，绕过 RLS
// 仅在服务端使用（Route Handler / Server Action / Edge Function）
export function createAdminClient() {
  const proxyFetch = getProxyFetch()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    proxyFetch ? { global: { fetch: proxyFetch } } : undefined
  )
}
