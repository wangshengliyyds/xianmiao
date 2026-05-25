import Link from 'next/link'
import { SearchX, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60">
        <SearchX className="h-9 w-9 stroke-[1.5] text-muted-foreground/40" />
      </div>
      <h1 className="mb-2 text-xl font-bold">页面不存在</h1>
      <p className="mb-8 text-sm text-muted-foreground">你访问的页面可能已被移除或链接有误</p>
      <Link href="/">
        <Button className="gap-2">
          <Home className="h-4 w-4" />
          返回首页
        </Button>
      </Link>
    </div>
  )
}
