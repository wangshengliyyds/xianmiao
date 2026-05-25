'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackHeaderProps {
  title: string
  right?: React.ReactNode
}

export function BackHeader({ title, right }: BackHeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <button
        onClick={() => router.back()}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
      >
        <ArrowLeft className="h-5 w-5 stroke-[2]" />
      </button>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold">
        {title}
      </h1>

      <div className="w-8">{right}</div>
    </header>
  )
}
