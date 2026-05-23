'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Bot, Loader2, Shield, AlertTriangle, Check } from 'lucide-react'

export default function AiReviewPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleCheck = async () => {
    if (!text.trim()) {
      toast.error('请输入待审核内容')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type: 'product' }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      toast.error('审核失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">AI 内容审核</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 输入区 */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium">待审核内容</h2>
          <Textarea
            placeholder="输入待审核的文本内容..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] resize-none"
          />
          <Button onClick={handleCheck} disabled={loading} className="mt-4 w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bot className="mr-2 h-4 w-4" />
            )}
            开始审核
          </Button>
        </div>

        {/* 结果区 */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium">审核结果</h2>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {result.safe ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Check className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{result.safe ? '内容安全' : '内容违规'}</p>
                  {!result.safe && result.reason && (
                    <p className="text-sm text-muted-foreground">{result.reason}</p>
                  )}
                </div>
              </div>

              {result.flags && result.flags.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">风险标签</p>
                  <div className="flex flex-wrap gap-2">
                    {result.flags.map((flag: string) => (
                      <Badge key={flag} variant="destructive" className="text-xs">{flag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.action && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    建议操作: <span className="font-medium text-foreground">
                      {result.action === 'block' ? '拦截' : result.action === 'warn' ? '警告' : '放行'}
                    </span>
                  </p>
                </div>
              )}

              <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              输入内容后点击审核
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
