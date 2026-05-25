'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Phone, Lock, User, Loader2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// 防止 Open Redirect：只允许本站相对路径
function safeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get('redirect'))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [devCode, setDevCode] = useState('') // 开发模式显示验证码

  // 手机号格式化
  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11)
  }

  // 验证码格式化
  const formatCode = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 6)
  }

  // 发送验证码
  const sendCode = useCallback(async () => {
    setError('')
    setDevCode('')
    if (!phone) {
      setError('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的11位手机号')
      return
    }
    if (countdown > 0) return

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '发送验证码失败')
        return
      }

      setCodeSent(true)
      setCountdown(60)

      // 显示验证码（短信服务不可用时自动显示）
      if (data.dev_code) {
        setDevCode(data.dev_code)
      }

      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            timerRef.current = null
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setError('发送验证码失败，请重试')
    }
  }, [phone, countdown])

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phone) {
      setError('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的11位手机号')
      return
    }
    if (!code) {
      setError('请输入验证码')
      return
    }
    if (code.length !== 6) {
      setError('验证码为6位数字')
      return
    }
    if (mode === 'register' && !nickname.trim()) {
      setError('请输入昵称')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '验证失败')
        setLoading(false)
        return
      }

      // 如果需要注册
      if (data.need_register) {
        if (mode !== 'register') {
          setError('该手机号未注册，请切换到注册页面')
          setLoading(false)
          return
        }

        // 创建新用户（使用确定性密码，确保后续可登录）
        const tempPassword = `${phone}${Math.random().toString(36).slice(-8)}`
        const { data: signUpData, error: createError } = await supabase.auth.signUp({
          email: `${phone}@xianmiao.phone`,
          password: tempPassword,
          options: {
            data: {
              phone,
              nickname: nickname.trim()
            }
          }
        })

        if (createError) {
          setError('注册失败: ' + createError.message)
          setLoading(false)
          return
        }

        // 如果 signUp 没有自动建立 session，用密码登录
        if (!signUpData.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: `${phone}@xianmiao.phone`,
            password: tempPassword,
          })
          if (signInError) {
            // 如果密码登录也失败，尝试等待 session
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }

        router.push(redirectTo)
        router.refresh()
        return
      }

      // 已有用户登录，session 已由服务端设置，直接跳转
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError('验证失败，请重试')
      setLoading(false)
    }
  }

  // 切换模式时重置状态
  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode)
    setError('')
    setCode('')
    setNickname('')
    setCodeSent(false)
    setDevCode('')
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      {/* 标题 */}
      <h2 className="mb-6 text-center text-xl font-semibold">
        {mode === 'login' ? '欢迎回来' : '创建账号'}
      </h2>

      {/* 切换登录/注册 */}
      <div className="mb-6 flex rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all ${
            mode === 'login'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          登录
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all ${
            mode === 'register'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          注册
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 错误提示 */}
        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 开发模式验证码提示 */}
        {devCode && (
          <div className="rounded-lg bg-primary/10 px-4 py-2.5 text-sm text-primary">
            开发模式验证码：{devCode}
          </div>
        )}

        {/* 注册时显示昵称 */}
        {mode === 'register' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              昵称
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="请输入昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* 手机号 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            手机号
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              maxLength={11}
              className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* 验证码 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            验证码
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="请输入6位验证码"
                value={code}
                onChange={(e) => setCode(formatCode(e.target.value))}
                maxLength={6}
                className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="button"
              onClick={sendCode}
              disabled={countdown > 0}
              className={`shrink-0 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                countdown > 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>
          {codeSent && countdown > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              验证码已发送至 +86 {phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')}
            </p>
          )}
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === 'login' ? '登录中...' : '注册中...'}
            </>
          ) : (
            <>
              {mode === 'login' ? '登录' : '注册'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* 底部协议 */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        继续即表示同意
        <button onClick={() => toast.info('用户协议暂未开放')} className="text-primary hover:underline">《用户协议》</button>
        和
        <button onClick={() => toast.info('隐私政策暂未开放')} className="text-primary hover:underline">《隐私政策》</button>
      </p>
    </div>
  )
}
