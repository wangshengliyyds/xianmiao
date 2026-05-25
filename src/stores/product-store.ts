import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductFilters } from '@/types'

interface ProductState {
  filters: ProductFilters
  recentSearches: string[]
  setFilters: (filters: ProductFilters) => void
  resetFilters: () => void
  addRecentSearch: (keyword: string) => void
  clearRecentSearches: () => void
}

const defaultFilters: ProductFilters = {
  sort: 'newest',
}

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      recentSearches: [],

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () => set({ filters: defaultFilters }),

      addRecentSearch: (keyword) =>
        set((state) => {
          const searches = state.recentSearches.filter((s) => s !== keyword)
          return {
            recentSearches: [keyword, ...searches].slice(0, 10),
          }
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    { name: 'product-store' }
  )
)
