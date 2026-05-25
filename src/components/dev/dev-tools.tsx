'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Bug, ChevronUp, UserCog } from 'lucide-react'
import { toast } from 'sonner'

const accounts = [
  { role: 'buyer',  label: '买家', emoji: '🛒' },
  { role: 'seller', label: '卖家', emoji: '🏪' },
  { role: 'admin',  label: '管理员', emoji: '🛡️' },
] as const

// 连续点击 5 次激活开发者工具
let tapCount = 0
let tapTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<(v: boolean) => void>()

export function triggerDevTools() {
  tapCount++
  if (tapTimer) clearTimeout(tapTimer)
  tapTimer = setTimeout(() => { tapCount = 0 }, 800)
  if (tapCount >= 5) {
    tapCount = 0
    listeners.forEach(fn => fn(true))
    toast.success('开发者模式已激活')
  }
}

// 供外部直接激活（如 Profile 页面按钮）
export function activateDevTools() {
  listeners.forEach(fn => fn(true))
  toast.success('开发者模式已激活')
}

export function DevTools() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [activated, setActivated] = useState(process.env.NODE_ENV === 'development')

  // 注册激活监听器
  const onActivate = useCallback(() => setActivated(true), [])
  useState(() => {
    listeners.add(onActivate)
    return () => { listeners.delete(onActivate) }
  })

  const handleSwitch = async (role: string) => {
    if (!user || role === user.role) return
    setSwitching(true)
    try {
      const res = await fetch('/api/dev/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`已切换为 ${data.nickname}`)
        window.location.reload()
      } else {
        toast.error(data.error || '切换失败')
      }
    } catch {
      toast.error('切换失败')
    } finally {
      setSwitching(false)
    }
  }

  if (!user || !activated) return null

  return (
    <div className="fixed bottom-20 right-3 z-[999] md:bottom-4">
      {open && (
        <div className="mb-2 w-52 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <UserCog className="h-3 w-3" />
            切换测试账号
          </div>
          <div className="space-y-1">
            {accounts.map((acc) => {
              const isActive = user.role === acc.role
              return (
                <button
                  key={acc.role}
                  onClick={() => handleSwitch(acc.role)}
                  disabled={switching || isActive}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-sm">{acc.emoji}</span>
                  <span className="flex-1 text-left">{acc.label}</span>
                  {isActive && <span className="text-[10px] opacity-70">当前</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105"
      >
        {open ? <ChevronUp className="h-4 w-4" /> : <Bug className="h-4 w-4" />}
      </button>
    </div>
  )
}
