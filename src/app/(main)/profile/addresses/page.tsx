'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Plus, MapPin, Pencil, Trash2 } from 'lucide-react'

interface Address {
  id: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  is_default: boolean
}

export default function AddressesPage() {
  const { user } = useAuthStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // 表单状态
  const [form, setForm] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    is_default: false,
  })
  const [saving, setSaving] = useState(false)

  const fetchAddresses = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_default', { ascending: false })

    setAddresses(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchAddresses()
  }, [user])

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.detail) {
      toast.error('请填写完整信息')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from('addresses').insert({
      ...form,
      user_id: user!.id,
    })

    if (error) {
      toast.error('保存失败')
    } else {
      toast.success('地址添加成功')
      setShowForm(false)
      setForm({ name: '', phone: '', province: '', city: '', district: '', detail: '', is_default: false })
      fetchAddresses()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('addresses').delete().eq('id', id)
    toast.success('已删除')
    fetchAddresses()
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">地址管理</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" />
          新增地址
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">新增地址</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="收件人" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="手机号" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="省" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
              <Input placeholder="市" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input placeholder="区" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </div>
            <Input placeholder="详细地址" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              设为默认地址
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>取消</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <MapPin className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
          <p>暂无收货地址</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border bg-card p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-medium">{addr.name}</span>
                <span className="text-sm text-muted-foreground">{addr.phone}</span>
                {addr.is_default && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">默认</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {addr.province}{addr.city}{addr.district}{addr.detail}
              </p>
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Pencil className="mr-1 h-3 w-3" /> 编辑
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(addr.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> 删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
