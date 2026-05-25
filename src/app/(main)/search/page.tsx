'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, X, Clock, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductGrid } from '@/components/product/product-grid'
import { useSearchProducts } from '@/lib/hooks/use-products'
import { useProductStore } from '@/stores/product-store'
import { PRODUCT_CONDITIONS } from '@/lib/constants'
import type { ProductCondition, Category } from '@/types'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialKeyword = searchParams.get('q') || ''
  const initialCategoryId = searchParams.get('category_id')

  const [keyword, setKeyword] = useState(initialKeyword)
  const [categoryId, setCategoryId] = useState(initialCategoryId || '')
  const [condition, setCondition] = useState('')
  const [sort, setSort] = useState('newest')
  const [categories, setCategories] = useState<Category[]>([])
  const [showHistory, setShowHistory] = useState(!initialKeyword)

  const { recentSearches, addRecentSearch, clearRecentSearches } = useProductStore()

  const { data, isLoading } = useSearchProducts(keyword, {
    category_id: categoryId ? parseInt(categoryId) : undefined,
    condition: condition as ProductCondition || undefined,
    sort: sort as 'newest' | 'price_asc' | 'price_desc' | 'popular',
  }, 1, 40)

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []))
      .catch(() => {})
  }, [])

  const handleSearch = (q: string) => {
    if (q.trim()) {
      setKeyword(q.trim())
      addRecentSearch(q.trim())
      setShowHistory(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(keyword)
    }
  }

  const products = data?.data || []

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* 搜索框 */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索商品..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => !keyword && setShowHistory(true)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
          {keyword && (
            <button
              onClick={() => {
                setKeyword('')
                setShowHistory(true)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={() => handleSearch(keyword)}>搜索</Button>
      </div>

      {/* 搜索历史 */}
      {showHistory && recentSearches.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              搜索历史
            </h3>
            <button
              onClick={clearRecentSearches}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" />
              清空
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search) => (
              <button
                key={search}
                onClick={() => handleSearch(search)}
                className="rounded-full bg-muted px-3 py-1.5 text-sm transition-colors hover:bg-muted/80"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 筛选条件 */}
      {!showHistory && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {/* 分类筛选 */}
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v || '')}>
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 成色筛选 */}
            <Select value={condition} onValueChange={(v) => setCondition(v || '')}>
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="全部成色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部成色</SelectItem>
                {PRODUCT_CONDITIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 排序 */}
            <Select value={sort} onValueChange={(v) => setSort(v || 'newest')}>
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">最新发布</SelectItem>
                <SelectItem value="price_asc">价格从低到高</SelectItem>
                <SelectItem value="price_desc">价格从高到低</SelectItem>
                <SelectItem value="popular">最多浏览</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 结果数量 */}
          {data && (
            <p className="mb-3 text-sm text-muted-foreground">
              找到 {data.total} 个商品
            </p>
          )}

          {/* 商品列表 */}
          <ProductGrid products={products} loading={isLoading} />
        </>
      )}
    </div>
  )
}
