'use client'

import { useState } from 'react'
import { BackHeader } from '@/components/common/back-header'
import { toast } from 'sonner'

interface NotifSetting {
  key: string
  label: string
  desc: string
  default: boolean
}

const notifSettings: NotifSetting[] = [
  { key: 'order', label: '订单通知', desc: '付款、发货、收货等订单状态变更', default: true },
  { key: 'message', label: '消息通知', desc: '收到新聊天消息时提醒', default: true },
  { key: 'trade', label: '交易提醒', desc: '商品被购买、收藏等交易相关通知', default: true },
  { key: 'system', label: '系统通知', desc: '平台公告、活动等系统消息', default: true },
  { key: 'promotion', label: '营销推送', desc: '优惠活动、促销信息推送', default: false },
]

function getSettings(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem('notif-settings')
    if (saved) return JSON.parse(saved)
  } catch {}
  const defaults: Record<string, boolean> = {}
  notifSettings.forEach((s) => { defaults[s.key] = s.default })
  return defaults
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState(getSettings)

  const toggle = (key: string) => {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    localStorage.setItem('notif-settings', JSON.stringify(next))
    toast.success(next[key] ? '已开启' : '已关闭')
    // Sync to backend
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_settings: next }),
    }).catch(() => {})
  }

  return (
    <div>
      <BackHeader title="消息通知设置" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="mb-4 px-1 text-xs text-muted-foreground">管理你的通知偏好，关闭后将不再接收对应类型的通知</p>
        <div className="rounded-2xl border bg-card">
          {notifSettings.map((item, i) => (
            <div
              key={item.key}
              className={`flex items-center gap-3 px-4 py-3.5 ${i === 0 ? 'rounded-t-2xl' : ''} ${i === notifSettings.length - 1 ? 'rounded-b-2xl' : ''} ${i > 0 ? 'border-t' : ''}`}
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button
                onClick={() => toggle(item.key)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settings[item.key] ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${settings[item.key] ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
