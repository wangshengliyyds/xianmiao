'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { User, Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BackHeader } from '@/components/common/back-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useUpload } from '@/lib/hooks/use-upload'
import { toast } from 'sonner'
import type { Profile } from '@/types'

export default function ProfileEditPage() {
  const router = useRouter()
  const { upload, uploading } = useUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then(({ data }) => {
        if (data) {
          setProfile(data)
          setNickname(data.nickname || '')
          setAvatarUrl(data.avatar_url || '')
        }
      })
      .catch(() => toast.error('加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const url = await upload(file)
      setAvatarUrl(url)
      toast.success('头像上传成功')
    } catch {
      toast.error('上传失败')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error('请输入昵称')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), avatar_url: avatarUrl || undefined }),
      })

      if (res.ok) {
        toast.success('保存成功')
        router.back()
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

  if (loading) return <LoadingSpinner text="加载中..." />

  return (
    <div>
      <BackHeader
        title="编辑资料"
        right={
          <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full text-xs">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '保存'}
          </Button>
        }
      />

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* 头像 */}
        <div className="flex flex-col items-center gap-3">
          <label className="relative cursor-pointer group">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-muted">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="头像" fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-9 w-9 text-muted-foreground/40 stroke-[1.5]" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6 stroke-[2] text-white" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
          {uploading && <p className="text-xs text-muted-foreground">上传中...</p>}
        </div>

        {/* 昵称 */}
        <div>
          <Label htmlFor="nickname" className="mb-2 block text-sm font-medium">昵称</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="请输入昵称"
            maxLength={20}
          />
          <p className="mt-1 text-xs text-muted-foreground">{nickname.length}/20</p>
        </div>

        {/* 手机号（只读） */}
        {profile?.phone && (
          <div>
            <Label className="mb-2 block text-sm font-medium">手机号</Label>
            <Input value={profile.phone} disabled className="bg-muted/50" />
          </div>
        )}
      </div>
    </div>
  )
}
