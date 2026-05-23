'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'

export default function ProfileEditPage() {
  const router = useRouter()
  const { profile, refreshProfile } = useAuthStore()
  const [nickname, setNickname] = useState(profile?.nickname || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (nickname.length < 2) {
      toast.error('昵称至少2个字符')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ nickname, updated_at: new Date().toISOString() })
        .eq('id', profile!.id)

      if (error) {
        toast.error('保存失败')
        return
      }

      await refreshProfile()
      toast.success('保存成功')
      router.back()
    } catch {
      toast.error('网络错误')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-lg font-semibold">编辑资料</h1>

      {/* 头像 */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {profile?.nickname?.[0] || '用'}
            </AvatarFallback>
          </Avatar>
          <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">点击更换头像</p>
      </div>

      {/* 表单 */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">昵称</label>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="请输入昵称"
            maxLength={20}
          />
          <p className="mt-1 text-xs text-muted-foreground">{nickname.length}/20</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">手机号</label>
          <Input value={profile?.phone || ''} disabled className="bg-muted" />
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存
        </Button>
      </div>
    </div>
  )
}
