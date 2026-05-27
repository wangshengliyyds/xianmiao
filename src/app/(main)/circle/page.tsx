'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { toast } from 'sonner'
import type { Circle } from '@/types'

export default function CirclePage() {
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    const fetchCircles = async () => {
      try {
        const res = await fetch('/api/circles')
        if (res.ok) {
          const { data } = await res.json()
          setCircles(data || [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    fetchCircles()
  }, [])

  const handleJoinCircle = async (circleId: string) => {
    try {
      const res = await fetch(`/api/circles/${circleId}/join`, { method: 'POST' })
      if (res.ok) {
        toast.success('加入成功')
        setCircles((prev) => prev.map((c) => c.id === circleId ? { ...c, member_count: c.member_count + 1 } : c))
      } else {
        const err = await res.json()
        toast.error(err.error || '加入失败')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('请输入圈子名称')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const { data } = await res.json()
        setCircles((prev) => [data, ...prev])
        setDialogOpen(false)
        setForm({ name: '', description: '' })
        toast.success('创建成功')
      } else {
        const err = await res.json()
        toast.error(err.error || '创建失败')
      }
    } catch {
      toast.error('创建失败')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="加载中..." />
  }

  const topCircles = circles.slice(0, 5)
  const restCircles = circles.length > 5 ? circles.slice(5) : []

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">兴趣圈子</h1>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          创建圈子
        </Button>
      </div>

      {circles.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 stroke-[1.5] text-muted-foreground/40" />}
          title="暂无圈子"
          description="还没有兴趣圈子，快来创建第一个吧"
          action={<Button size="sm" onClick={() => setDialogOpen(true)}>创建圈子</Button>}
        />
      ) : (
        <>
          {topCircles.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">推荐圈子</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {topCircles.map((circle) => (
                  <div key={circle.id} className="flex shrink-0 flex-col items-center gap-2 rounded-xl border bg-card p-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
                      {circle.cover_url ? (
                        <Image src={circle.cover_url} alt={circle.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-medium">{circle.name?.[0] || '?'}</div>
                      )}
                    </div>
                    <span className="text-sm font-medium">{circle.name}</span>
                    <span className="text-xs text-muted-foreground">{circle.member_count} 成员</span>
                    <Button size="sm" variant="outline" className="mt-1" onClick={() => handleJoinCircle(circle.id)}>加入</Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">全部圈子</h2>
            <div className="space-y-3">
              {restCircles.map((circle) => (
                <Link key={circle.id} href={`/circle/${circle.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                    {circle.cover_url ? (
                      <Image src={circle.cover_url} alt={circle.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-medium">{circle.name?.[0] || '?'}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{circle.name}</h3>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{circle.description || '暂无简介'}</p>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {circle.member_count} 成员
                    </span>
                  </div>
                  <Button size="sm" onClick={(e) => { e.preventDefault(); handleJoinCircle(circle.id) }}>加入</Button>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建圈子</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">圈子名称</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="输入圈子名称" />
            </div>
            <div>
              <Label className="text-xs">圈子简介</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="简单介绍一下这个圈子" />
            </div>
            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating ? '创建中...' : '创建圈子'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
