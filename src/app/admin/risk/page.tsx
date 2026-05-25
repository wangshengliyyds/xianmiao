'use client'

import { useEffect, useState } from 'react'
import { Shield, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface RiskRule {
  id: string
  name: string
  type: string
  threshold: number
  action: string
  enabled: boolean
}

const typeLabels: Record<string, string> = { order: '订单', product: '商品', content: '内容', user: '用户' }
const actionLabels: Record<string, string> = { warning: '警告', block: '拦截', review: '审核', limit: '限制' }

export default function AdminRiskPage() {
  const [rules, setRules] = useState<RiskRule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RiskRule | null>(null)
  const [form, setForm] = useState({ name: '', type: 'order', threshold: 1, action: 'warning', enabled: true })

  useEffect(() => {
    fetch('/api/admin/risk')
      .then((res) => res.ok ? res.json() : { data: [] })
      .then(({ data }) => setRules(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveToServer = async (data: RiskRule[]) => {
    setRules(data)
    await fetch('/api/admin/risk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  const toggleRule = async (id: string) => {
    const updated = rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r)
    await saveToServer(updated)
    const rule = updated.find((r) => r.id === id)
    toast.success(rule?.enabled ? '已启用' : '已禁用')
  }

  const handleSave = async () => {
    if (!form.name) {
      toast.error('请输入规则名称')
      return
    }

    if (editing) {
      await saveToServer(rules.map((r) => r.id === editing.id ? { ...form, id: editing.id } : r))
      toast.success('已更新')
    } else {
      await saveToServer([...rules, { ...form, id: Date.now().toString() }])
      toast.success('已创建')
    }
    setDialogOpen(false)
    setEditing(null)
    setForm({ name: '', type: 'order', threshold: 1, action: 'warning', enabled: true })
  }

  const handleEdit = (r: RiskRule) => {
    setEditing(r)
    setForm({ name: r.name, type: r.type, threshold: r.threshold, action: r.action, enabled: r.enabled })
    setDialogOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', type: 'order', threshold: 1, action: 'warning', enabled: true })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">风控规则</h1>
        <p className="mt-4 text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">风控规则</h1>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" />
          新建规则
        </Button>
      </div>

      <div className="grid gap-3">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${rule.enabled ? 'bg-green-50 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                <Shield className="h-5 w-5 stroke-[1.8]" />
              </div>
              <div>
                <p className="font-medium">{rule.name}</p>
                <p className="text-xs text-muted-foreground">
                  类型: {typeLabels[rule.type] || rule.type}
                  {' · '}阈值: {rule.threshold}
                  {' · '}动作: {actionLabels[rule.action] || rule.action}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleRule(rule.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  rule.enabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  rule.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑规则' : '新建规则'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">规则名称</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="输入规则名称" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">类型</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="order">订单</option>
                  <option value="product">商品</option>
                  <option value="content">内容</option>
                  <option value="user">用户</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">阈值</Label>
                <Input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">触发动作</Label>
              <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="warning">警告</option>
                <option value="block">拦截</option>
                <option value="review">审核</option>
                <option value="limit">限制</option>
              </select>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? '保存修改' : '创建规则'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
