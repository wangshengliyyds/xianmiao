import { create } from 'zustand'
import { isSupabaseConfigured } from '@/lib/supabase/config'

interface Profile {
  id: string
  nickname: string
  avatar_url: string | null
  phone: string | null
  role: string
  city_id: number | null
  credit_score: number
  is_verified: boolean
}

interface AuthState {
  user: { id: string; email?: string } | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean

  // 操作
  initialize: () => Promise<void>
  setMockUser: (phone: string) => void
  refreshProfile: () => Promise<void>
  logout: () => Promise<void>
}

// Mock 用户数据
const MOCK_PROFILE: Profile = {
  id: 'mock-user-1',
  nickname: '闲妙体验用户',
  avatar_url: null,
  phone: null,
  role: 'seller',
  city_id: null,
  credit_score: 100,
  is_verified: false,
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    // 未配置 Supabase 时使用 mock 状态
    if (!isSupabaseConfigured()) {
      // 检查是否有 mock 登录的标记
      if (typeof window !== 'undefined' && localStorage.getItem('xianmiao_mock_user')) {
        const phone = localStorage.getItem('xianmiao_mock_user') || ''
        set({
          user: { id: 'mock-user-1', email: `${phone}@xianmiao.phone` },
          profile: { ...MOCK_PROFILE, phone, nickname: `用户${phone.slice(-4)}` },
          isLoading: false,
          isInitialized: true,
        })
      } else {
        set({ user: null, profile: null, isLoading: false, isInitialized: true })
      }
      return
    }

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        set({
          user: { id: user.id, email: user.email ?? undefined },
          profile,
          isLoading: false,
          isInitialized: true,
        })
      } else {
        set({ user: null, profile: null, isLoading: false, isInitialized: true })
      }

      // 监听登录状态变化
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          set({
            user: { id: session.user.id, email: session.user.email ?? undefined },
            profile,
          })
        } else {
          set({ user: null, profile: null })
        }
      })
    } catch {
      set({ user: null, profile: null, isLoading: false, isInitialized: true })
    }
  },

  // 设置 mock 用户（开发模式登录）
  setMockUser: (phone: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('xianmiao_mock_user', phone)
    }
    set({
      user: { id: 'mock-user-1', email: `${phone}@xianmiao.phone` },
      profile: { ...MOCK_PROFILE, phone, nickname: `用户${phone.slice(-4)}` },
      isLoading: false,
      isInitialized: true,
    })
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return

    if (!isSupabaseConfigured()) return

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      set({ profile })
    } catch {
      // 静默失败
    }
  },

  logout: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('xianmiao_mock_user')
    }

    if (isSupabaseConfigured()) {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      try {
        await supabase.auth.signOut()
      } catch {
        // 静默失败
      }
    }

    set({ user: null, profile: null })
  },
}))
