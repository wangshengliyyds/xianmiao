'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function useAuth() {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()

          setUser(profile)
        } else {
          setUser(null)
        }
      } catch (err: unknown) {
        // 仅 token 过期/无效时清理脏 session，网络错误不清理
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('Refresh Token') || msg.includes('AuthApiError')) {
          try { await supabase.auth.signOut() } catch {}
          // 手动清除 Supabase auth cookie（signOut 在 token 无效时可能无法清除 cookie）
          document.cookie.split(';').forEach((c) => {
            const name = c.trim().split('=')[0]
            if (name.startsWith('sb-')) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            }
          })
        }
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          fetchUser()
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, loading, logout, isAuthenticated: !!user }
}
