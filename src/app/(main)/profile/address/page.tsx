'use client'

import { useEffect, useState } from 'react'
import { MapPin, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { BackHeader } from '@/components/common/back-header'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Address } from '@/types'

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Address | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', province: '', city: '', district: '', detail: '', is_default: false })
  const [saving, setSaving] = useState(false)

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses')
      if (res.ok) {
        const { data } = await res.json()
        setAddresses(data || [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchAddresses() }, [])

  const resetForm = () => {
    setForm({ name: '', phone: '', province: '', city: '', district: '', detail: '', is_default: false })
    setEditing(null)
  }

  const handleEdit = (addr: Address) => {
    setEditing(addr)
    setForm({
      name: addr.name,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail: addr.detail,
      is_default: addr.is_default,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.detail) {
      toast.error('请填写完整信息')
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/addresses/${editing.id}` : '/api/addresses'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editing ? '修改成功' : '添加成功')
        setDialogOpen(false)
        resetForm()
        fetchAddresses()
      } else {
        const err = await res.json()
        toast.error(err.error || '保存失败')
      }
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除该地址吗？')) return
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('已删除')
        fetchAddresses()
      } else {
        const err = await res.json()
        toast.error(err.error || '删除失败')
      }
    } catch {
      toast.error('删除失败')
    }
  }

  return (
    <div>
      <BackHeader
        title="收货地址"
        right={
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5 stroke-[2]" /> 新增
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? '编辑地址' : '新增地址'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">收件人</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="姓名" />
                  </div>
                  <div>
                    <Label className="text-xs">手机号</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="手机号" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">省份</Label>
                    <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="省" />
                  </div>
                  <div>
                    <Label className="text-xs">城市</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="市" />
                  </div>
                  <div>
                    <Label className="text-xs">区县</Label>
                    <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="区" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">详细地址</Label>
                  <Input value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="街道、楼牌号等" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="rounded" />
                  设为默认地址
                </label>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? '保存中...' : '保存'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <LoadingSpinner text="加载中..." />
        ) : addresses.length === 0 ? (
          <EmptyState icon={<MapPin className="h-8 w-8 stroke-[2] text-muted-foreground/40" />} title="暂无地址" description="添加收货地址，下单更方便" />
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="rounded-2xl border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium">{addr.name}</span>
                  <span className="text-sm text-muted-foreground">{addr.phone}</span>
                  {addr.is_default && (
                    <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      <Check className="h-3 w-3 stroke-[2]" /> 默认
                    </span>
                  )}
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  {addr.province}{addr.city}{addr.district}{addr.detail}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleEdit(addr)}>
                    <Pencil className="h-3 w-3 stroke-[2]" /> 编辑
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(addr.id)}>
                    <Trash2 className="h-3 w-3 stroke-[2]" /> 删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
