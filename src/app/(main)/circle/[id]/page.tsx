'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Users, LogOut } from 'lucide-react'
import { BackHeader } from '@/components/common/back-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Circle } from '@/types'

interface CircleMember {
  user_id: string
  role: string
  user?: { nickname: string; avatar_url: string | null }
}

export default function CircleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [circle, setCircle] = useState<Circle | null>(null)
  const [members, setMembers] = useState<CircleMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [circleRes, membersRes] = await Promise.all([
          fetch(`/api/circles`),
          fetch(`/api/circles/${params.id}/join`),
        ])

        if (circleRes.ok) {
          const { data } = await circleRes.json()
          const found = (data || []).find((c: Circle) => c.id === params.id)
          if (found) setCircle(found)
        }

        if (membersRes.ok) {
          const { data, is_member } = await membersRes.json()
          setMembers(data || [])
          setIsMember(is_member || false)
        }
      } catch {
        toast.error('加载失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  const handleJoin = async () => {
    try {
      const res = await fetch(`/api/circles/${params.id}/join`, { method: 'POST' })
      if (res.ok) {
        setIsMember(true)
        toast.success('加入成功')
      } else {
        const err = await res.json()
        toast.error(err.error || '加入失败')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  const handleLeave = async () => {
    try {
      const res = await fetch(`/api/circles/${params.id}/join`, { method: 'DELETE' })
      if (res.ok) {
        setIsMember(false)
        toast.success('已退出圈子')
      }
    } catch {
      toast.error('操作失败')
    }
  }

  if (loading) {
    return <LoadingSpinner text="加载中..." />
  }

  if (!circle) {
    return (
      <div>
        <BackHeader title="圈子" />
        <p className="p-8 text-center text-sm text-muted-foreground">圈子不存在</p>
      </div>
    )
  }

  return (
    <div>
      <BackHeader title={circle.name} />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* 圈子信息 */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
            {circle.cover_url ? (
              <Image src={circle.cover_url} alt={circle.name} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-medium">
                {circle.name?.[0] || '?'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{circle.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{circle.description || '暂无简介'}</p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {circle.member_count} 成员
            </span>
          </div>
          {isMember ? (
            <Button variant="outline" size="sm" onClick={handleLeave}>
              <LogOut className="h-4 w-4 mr-1" />
              退出
            </Button>
          ) : (
            <Button size="sm" onClick={handleJoin}>加入</Button>
          )}
        </div>

        {/* 成员列表 */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">成员列表</h2>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无成员</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                  <div className="relative h-9 w-9 overflow-hidden rounded-full bg-muted">
                    {member.user?.avatar_url ? (
                      <Image src={member.user.avatar_url} alt={member.user.nickname || ''} fill className="object-cover" sizes="36px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-medium">
                        {member.user?.nickname?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.user?.nickname || '匿名用户'}</p>
                  </div>
                  {member.role === 'owner' && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">圈主</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
