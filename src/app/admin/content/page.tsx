'use client'

import { useEffect, useState } from 'react'
import { Search, FileText, Trash2, Eye, Plus, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatRelativeTime } from '@/lib/format'
import { toast } from 'sonner'

interface Banner {
  id: string
  title: string | null
  image_url: string
  link_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export default function AdminContentPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState({ title: '', image_url: '', link_url: '', sort_order: 0, is_active: true })
  const [saving, setSaving] = useState(false)

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners')
      if (res.ok) {
        const { data } = await res.json()
        setBanners(data || [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchBanners() }, [])

  const filtered = banners.filter((b) =>
    !search || b.title?.includes(search) || b.link_url?.includes(search)
  )

  const resetForm = () => {
    setForm({ title: '', image_url: '', link_url: '', sort_order: 0, is_active: true })
    setEditing(null)
  }

  const handleEdit = (banner: Banner) => {
    setEditing(banner)
    setForm({
      title: banner.title || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.image_url) {
      toast.error('请输入图片链接')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch('/api/admin/banners', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...form }),
        })
        if (res.ok) {
          toast.success('已更新')
          setDialogOpen(false)
          resetForm()
          fetchBanners()
        } else {
          toast.error('更新失败')
        }
      } else {
        const res = await fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (res.ok) {
          toast.success('已创建')
          setDialogOpen(false)
          resetForm()
          fetchBanners()
        } else {
          toast.error('创建失败')
        }
      }
    } catch {
      toast.error('操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !active }),
      })
      if (res.ok) {
        setBanners((prev) => prev.map((b) => b.id === id ? { ...b, is_active: !active } : b))
        toast.success(active ? '已停用' : '已启用')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除该 Banner 吗？')) return
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id))
        toast.success('已删除')
      }
    } catch {
      toast.error('删除失败')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">内容管理</h1>
        <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true) }}>
          <Plus className="mr-1 h-4 w-4" />
          新增轮播图
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="搜索内容..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <span className="text-sm text-muted-foreground">共 {filtered.length} 条</span>
      </div>

      <div className="rounded-2xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">标题</th>
              <th className="px-4 py-3 text-left font-medium">链接</th>
              <th className="px-4 py-3 text-left font-medium">排序</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">创建时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">加载中...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                暂无内容
              </td></tr>
            ) : (
              filtered.map((banner) => (
                <tr key={banner.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{banner.title || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{banner.link_url || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{banner.sort_order}</td>
                  <td className="px-4 py-3">
                    <Badge variant={banner.is_active ? 'outline' : 'secondary'}>
                      {banner.is_active ? '启用' : '停用'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(banner.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {banner.link_url && (
                        <a href={banner.link_url} target="_blank" className="inline-flex items-center justify-center rounded-lg p-2 text-sm hover:bg-muted">
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(banner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(banner.id, banner.is_active)}>
                        {banner.is_active ? '停用' : '启用'}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(banner.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑轮播图' : '新增轮播图'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">标题</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="轮播图标题（可选）" />
            </div>
            <div>
              <Label className="text-xs">图片链接 *</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://example.com/image.jpg" />
            </div>
            <div>
              <Label className="text-xs">跳转链接</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="点击后跳转的链接（可选）" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">排序</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">状态</Label>
                <select value={form.is_active ? '1' : '0'} onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="1">启用</option>
                  <option value="0">停用</option>
                </select>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? '保存中...' : editing ? '保存修改' : '创建'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
