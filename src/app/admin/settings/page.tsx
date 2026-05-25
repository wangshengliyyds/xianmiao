'use client'

import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Settings {
  site_name: string
  site_description: string
  commission_rate: number
  max_images_per_product: number
  order_timeout_hours: number
  enable_registration: boolean
  enable_ai_review: boolean
}

const defaultSettings: Settings = {
  site_name: '闲妙',
  site_description: 'AI驱动的二手闲置交易平台',
  commission_rate: 5,
  max_images_per_product: 9,
  order_timeout_hours: 72,
  enable_registration: true,
  enable_ai_review: true,
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.data) setSettings(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success('设置已保存')
      } else {
        toast.error('保存失败')
      }
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">系统设置</h1>
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">系统设置</h1>

      <div className="space-y-6 max-w-2xl">
        {/* 基础设置 */}
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">基础设置</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">站点名称</label>
              <Input value={settings.site_name} onChange={(e) => setSettings((s) => ({ ...s, site_name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">站点描述</label>
              <Input value={settings.site_description} onChange={(e) => setSettings((s) => ({ ...s, site_description: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* 交易设置 */}
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">交易设置</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">平台佣金比例 (%)</label>
              <Input type="number" min="0" max="100" value={settings.commission_rate} onChange={(e) => setSettings((s) => ({ ...s, commission_rate: Math.max(0, Number(e.target.value)) }))} className="w-32" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">每件商品最大图片数</label>
              <Input type="number" min="1" max="20" value={settings.max_images_per_product} onChange={(e) => setSettings((s) => ({ ...s, max_images_per_product: Math.max(1, Number(e.target.value)) }))} className="w-32" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">订单超时 (小时)</label>
              <Input type="number" min="1" max="720" value={settings.order_timeout_hours} onChange={(e) => setSettings((s) => ({ ...s, order_timeout_hours: Math.max(1, Number(e.target.value)) }))} className="w-32" />
            </div>
          </div>
        </div>

        {/* 功能开关 */}
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">功能开关</h2>
          <div className="space-y-3">
            {[
              { key: 'enable_registration', label: '开放注册' },
              { key: 'enable_ai_review', label: 'AI自动审核' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm">{item.label}</span>
                <button
                  onClick={() => setSettings((s) => ({ ...s, [item.key]: !(s[item.key as keyof Settings] as boolean) }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings[item.key as keyof Settings] ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[item.key as keyof Settings] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 系统信息 */}
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">系统信息</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">版本</span>
              <Badge variant="outline">v1.0.0</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">框架</span>
              <span>Next.js 16</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">数据库</span>
              <span>Supabase</span>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  )
}
