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
      } catch {
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
