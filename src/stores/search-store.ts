import { create } from 'zustand'

interface SearchState {
  history: string[]
  recentFilters: {
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    condition?: string
    tradeMethod?: string
    sort?: string
  }

  addHistory: (query: string) => void
  clearHistory: () => void
  setFilters: (filters: SearchState['recentFilters']) => void
  clearFilters: () => void
}

const HISTORY_KEY = 'xianmiao_search_history'
const MAX_HISTORY = 20

function loadHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export const useSearchStore = create<SearchState>((set) => ({
  history: loadHistory(),
  recentFilters: {},

  addHistory: (query: string) => {
    set((state) => {
      const trimmed = query.trim()
      if (!trimmed) return state

      const newHistory = [trimmed, ...state.history.filter((h) => h !== trimmed)].slice(
        0,
        MAX_HISTORY
      )
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
      return { history: newHistory }
    })
  },

  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY)
    set({ history: [] })
  },

  setFilters: (filters) => set({ recentFilters: filters }),

  clearFilters: () => set({ recentFilters: {} }),
}))
