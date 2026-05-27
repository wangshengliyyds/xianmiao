'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-9 w-9 stroke-[1.5] text-destructive/60" />
      </div>
      <h1 className="mb-2 text-xl font-bold">出错了</h1>
      <p className="mb-8 text-sm text-muted-foreground">页面加载时遇到了问题，请稍后再试</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          重新加载
        </Button>
        <Link href="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  )
}
