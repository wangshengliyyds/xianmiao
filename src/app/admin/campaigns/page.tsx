'use client'

import { useEffect, useState } from 'react'
import { Plus, Calendar, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Campaign {
  id: string
  name: string
  type: string
  status: 'active' | 'scheduled' | 'ended'
  start_date: string
  end_date: string
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [form, setForm] = useState({ name: '', type: '折扣', status: 'scheduled' as Campaign['status'], start_date: '', end_date: '' })

  useEffect(() => {
    fetch('/api/admin/campaigns')
      .then((res) => res.ok ? res.json() : { data: [] })
      .then(({ data }) => setCampaigns(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveToServer = async (data: Campaign[]) => {
    setCampaigns(data)
    await fetch('/api/admin/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  const handleSave = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      toast.error('请填写完整信息')
      return
    }

    if (editing) {
      await saveToServer(campaigns.map((c) => c.id === editing.id ? { ...form, id: editing.id } : c))
      toast.success('已更新')
    } else {
      await saveToServer([...campaigns, { ...form, id: Date.now().toString() }])
      toast.success('已创建')
    }
    setDialogOpen(false)
    setEditing(null)
    setForm({ name: '', type: '折扣', status: 'scheduled', start_date: '', end_date: '' })
  }

  const handleEdit = (c: Campaign) => {
    setEditing(c)
    setForm({ name: c.name, type: c.type, status: c.status, start_date: c.start_date, end_date: c.end_date })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await saveToServer(campaigns.filter((c) => c.id !== id))
    toast.success('已删除')
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', type: '折扣', status: 'scheduled', start_date: '', end_date: '' })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">营销活动</h1>
        <p className="mt-4 text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">营销活动</h1>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" />
          新建活动
        </Button>
      </div>

      <div className="rounded-2xl border bg-card admin-table-wrap overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">活动名称</th>
              <th className="px-4 py-3 text-left font-medium">类型</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                暂无活动
              </td></tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.type}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === 'active' ? 'default' : c.status === 'scheduled' ? 'secondary' : 'outline'}>
                      {c.status === 'active' ? '进行中' : c.status === 'scheduled' ? '未开始' : '已结束'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.start_date} ~ {c.end_date}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑活动' : '新建活动'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">活动名称</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="输入活动名称" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">类型</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="折扣">折扣</option>
                  <option value="满减">满减</option>
                  <option value="促销">促销</option>
                  <option value="优惠券">优惠券</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">状态</Label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Campaign['status'] })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="scheduled">未开始</option>
                  <option value="active">进行中</option>
                  <option value="ended">已结束</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">开始日期</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">结束日期</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? '保存修改' : '创建活动'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
