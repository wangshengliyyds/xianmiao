'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Bell, Trash2, Info, FileText, Phone, LogOut, ChevronDown } from 'lucide-react'
import { BackHeader } from '@/components/common/back-header'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'

const privacyContent = `闲妙重视并保护用户的个人隐私。本隐私政策说明我们如何收集、使用和保护您的信息。

1. 信息收集
我们收集您主动提供的信息，包括注册信息、商品信息、交易信息等。

2. 信息使用
我们使用收集的信息来提供、维护和改进服务，处理交易，发送通知。

3. 信息保护
我们采用业界标准的安全措施保护您的个人信息，包括加密传输和存储。

4. 信息共享
未经您的同意，我们不会向第三方共享您的个人信息，法律法规要求除外。

5. 联系我们
如有隐私相关问题，请联系：privacy@xianmiao.com`

export default function SettingsPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [expandedPrivacy, setExpandedPrivacy] = useState(false)
  const [expandedAbout, setExpandedAbout] = useState(false)

  return (
    <div>
      <BackHeader title="设置" />

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* 通知 */}
        <div>
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">通知</p>
          <div className="rounded-2xl border bg-card">
            <button
              onClick={() => router.push('/profile/settings/notification')}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 rounded-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <Bell className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">消息通知</p>
                <p className="text-xs text-muted-foreground">管理通知偏好</p>
              </div>
              <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
            </button>
          </div>
        </div>

        {/* 隐私与安全 */}
        <div>
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">隐私与安全</p>
          <div className="rounded-2xl border bg-card">
            <button
              onClick={() => router.push('/profile/settings/security')}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 rounded-t-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <Phone className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">账号安全</p>
                <p className="text-xs text-muted-foreground">管理个人信息和账号</p>
              </div>
              <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
            </button>
            <Separator />
            <button
              onClick={() => setExpandedPrivacy(!expandedPrivacy)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 rounded-b-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <FileText className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <span className="flex-1 text-sm font-medium">隐私政策</span>
              <ChevronDown className={`h-4 w-4 stroke-[2] text-muted-foreground/40 transition-transform ${expandedPrivacy ? 'rotate-180' : ''}`} />
            </button>
            {expandedPrivacy && (
              <div className="px-4 pb-4">
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                  {privacyContent}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 关于 */}
        <div>
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">关于</p>
          <div className="rounded-2xl border bg-card">
            <button
              onClick={() => setExpandedAbout(!expandedAbout)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 rounded-2xl"
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
                <Info className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
              </div>
              <span className="flex-1 text-sm font-medium">关于闲妙</span>
              <ChevronDown className={`h-4 w-4 stroke-[2] text-muted-foreground/40 transition-transform ${expandedAbout ? 'rotate-180' : ''}`} />
            </button>
            {expandedAbout && (
              <div className="px-4 pb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">版本</span>
                  <span className="font-medium">v1.0.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">框架</span>
                  <span>Next.js 16</span>
                </div>
                <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
                  闲妙是一个AI驱动的二手闲置交易平台，致力于让闲置物品流转更简单、更安全、更有趣。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 清除缓存 */}
        <div className="rounded-2xl border bg-card">
          <button
            onClick={() => {
              // 只清除应用缓存，保留用户数据
              const keysToKeep = new Set()
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && (key.startsWith('sb-') || key.startsWith('product-store') || key.startsWith('chat-store'))) {
                  keysToKeep.add(key)
                }
              }
              for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i)
                if (key && !keysToKeep.has(key)) {
                  localStorage.removeItem(key)
                }
              }
              toast.success('缓存已清除')
            }}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 rounded-2xl"
          >
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
              <Trash2 className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
            </div>
            <span className="flex-1 text-sm font-medium">清除缓存</span>
            <ChevronRight className="h-4 w-4 stroke-[2] text-muted-foreground/40" />
          </button>
        </div>

        {/* 退出登录 */}
        <Button
          variant="outline"
          className="w-full gap-2"
          disabled={loggingOut}
          onClick={async () => {
            setLoggingOut(true)
            try {
              await logout()
              toast.success('已退出登录')
              router.push('/login')
            } catch {
              toast.error('退出失败')
              setLoggingOut(false)
            }
          }}
        >
          <LogOut className="h-4 w-4 stroke-[2]" />
          {loggingOut ? '退出中...' : '退出登录'}
        </Button>
      </div>
    </div>
  )
}
