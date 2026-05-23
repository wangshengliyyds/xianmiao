'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Step = 'phone' | 'code'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { setMockUser } = useAuthStore()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const codeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号')
      return
    }

    setIsSending(true)
    try {
      const res = await fetch('/api/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '发送失败')
        return
      }

      toast.success('验证码已发送')
      if (!isSupabaseConfigured()) {
        toast.info('开发模式：验证码已输出到浏览器控制台 (F12)')
      }
      setStep('code')
      setCountdown(60)
      setTimeout(() => codeInputRef.current?.focus(), 100)
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('请输入6位验证码')
      return
    }

    setIsVerifying(true)
    try {
      const res = await fetch('/api/auth/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '验证失败')
        return
      }

      // Mock 模式：跳过 Supabase verifyOtp，直接设置本地状态
      if (data.token_hash?.startsWith('dev-mock-token-')) {
        setMockUser(phone)
        toast.success('登录成功（开发模式）')
        router.push(redirect)
        return
      }

      // 真实模式：通过 Supabase 设置 session
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
        email: `${phone}@xianmiao.phone`,
      })

      if (sessionError) {
        console.error('Session error:', sessionError)
        toast.error('登录失败，请重试')
        return
      }

      toast.success(data.is_new ? '注册成功，欢迎来到闲妙！' : '登录成功')
      router.push(redirect)
      router.refresh()
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      {step === 'phone' ? (
        <>
          <h2 className="mb-6 text-center text-xl font-semibold">登录 / 注册</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">手机号</label>
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                maxLength={11}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSendCode}
              disabled={isSending || phone.length !== 11}
            >
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              获取验证码
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            未注册的手机号将自动创建账号
          </p>
        </>
      ) : (
        <>
          <h2 className="mb-2 text-center text-xl font-semibold">输入验证码</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            已发送到 +86 {phone.replace(/(\d{3})\d{4}(\d{4})/, '$1 **** $2')}
          </p>
          <div className="space-y-4">
            <Input
              ref={codeInputRef}
              type="text"
              placeholder="请输入6位验证码"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-[0.5em]"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={isVerifying || code.length !== 6}
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              登录
            </Button>
            <div className="flex items-center justify-between">
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => { setStep('phone'); setCode('') }}
              >
                更换手机号
              </button>
              {countdown > 0 ? (
                <span className="text-sm text-muted-foreground">{countdown}s 后可重发</span>
              ) : (
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={handleSendCode}
                  disabled={isSending}
                >
                  重新发送
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <div className="mt-6 text-center text-xs text-muted-foreground">
        登录即表示同意{' '}
        <a href="#" className="text-primary hover:underline">用户协议</a>
        {' '}和{' '}
        <a href="#" className="text-primary hover:underline">隐私政策</a>
      </div>
    </div>
  )
}
