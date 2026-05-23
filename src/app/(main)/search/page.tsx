'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/search/search-bar'
import { FilterPanel, type SearchFilters } from '@/components/search/filter-panel'
import { ProductCard } from '@/components/product/product-card'
import { useSearch } from '@/lib/hooks/use-search'
import { useSearchStore } from '@/stores/search-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, Trash2, TrendingUp } from 'lucide-react'

const HOT_SEARCHES = ['iPhone', 'MacBook', 'Switch', '相机', 'AJ球鞋', 'iPad', '耳机', '手办']

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [hasSearched, setHasSearched] = useState(false)

  const { history, addHistory, clearHistory } = useSearchStore()
  const { data: results, isLoading } = useSearch(query, filters)

  const handleSearch = (q: string) => {
    setQuery(q)
    setHasSearched(true)
    addHistory(q)
  }

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    if (query) setHasSearched(true)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 搜索栏 */}
      <div className="sticky top-14 z-40 border-b bg-background px-4 py-3">
        <SearchBar
          value={query}
          onSearch={handleSearch}
          onBack={() => router.back()}
          showBack
          autoFocus
        />
      </div>

      {/* 筛选面板 - 搜索后显示 */}
      {hasSearched && (
        <div className="border-b px-4 py-2">
          <FilterPanel filters={filters} onChange={handleFilterChange} />
        </div>
      )}

      <div className="px-4 py-4">
        {/* 搜索结果 */}
        {hasSearched ? (
          <>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border">
                    <Skeleton className="aspect-square" />
                    <div className="p-2.5">
                      <Skeleton className="mb-1 h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results && results.length > 0 ? (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  找到 {results.length} 件商品
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {results.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                没有找到相关商品，换个关键词试试
              </div>
            )}
          </>
        ) : (
          /* 未搜索时：显示历史 + 热门 */
          <>
            {/* 搜索历史 */}
            {history.length > 0 && (
              <section className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-1 text-sm font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    搜索历史
                  </h3>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleSearch(item)}
                      className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/80"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 热门搜索 */}
            <section>
              <h3 className="mb-2 flex items-center gap-1 text-sm font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                热门搜索
              </h3>
              <div className="flex flex-wrap gap-2">
                {HOT_SEARCHES.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSearch(item)}
                    className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/80"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
