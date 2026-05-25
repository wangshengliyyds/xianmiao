'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { User, Camera, Phone, Shield } from 'lucide-react'
import { BackHeader } from '@/components/common/back-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'

export default function AccountSecurityPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setNickname(user.nickname)
      setAvatarUrl(user.avatar_url || '')
    }
  }, [user])

  if (loading) return <LoadingSpinner text="加载中..." />
  if (!user) return null

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error('昵称不能为空')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), avatar_url: avatarUrl }),
      })
      if (res.ok) {
        toast.success('保存成功')
        router.refresh()
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

  const handleAvatarUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片不能超过5MB')
        return
      }
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (res.ok) {
          const { url } = await res.json()
          setAvatarUrl(url)
          toast.success('头像上传成功')
        } else {
          toast.error('上传失败')
        }
      } catch {
        toast.error('上传失败')
      }
    }
    input.click()
  }

  return (
    <div>
      <BackHeader title="账号安全" />
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* 头像 */}
        <div className="flex items-center justify-center">
          <button onClick={handleAvatarUpload} className="relative h-20 w-20 overflow-hidden rounded-2xl bg-muted">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="头像" fill className="object-cover" sizes="80px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground/40 stroke-[1.5]" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 flex h-7 items-center justify-center bg-black/40">
              <Camera className="h-3.5 w-3.5 text-white" />
            </div>
          </button>
        </div>

        {/* 基本信息 */}
        <div className="rounded-2xl border bg-card p-4 space-y-4">
          <div>
            <Label className="text-xs">昵称</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} placeholder="请输入昵称" />
          </div>
          <div>
            <Label className="text-xs">手机号</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.phone?.slice(0, 3)}****{user.phone?.slice(-4)}</span>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">已绑定</span>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? '保存中...' : '保存修改'}
          </Button>
        </div>

        {/* 账号安全信息 */}
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-muted/60">
              <Shield className="h-[18px] w-[18px] stroke-[1.8] text-foreground/65" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">账号安全等级</p>
              <p className="text-xs text-muted-foreground">已绑定手机，账号安全</p>
            </div>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">安全</span>
          </div>
        </div>
      </div>
    </div>
  )
}
