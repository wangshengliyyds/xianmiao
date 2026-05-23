'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCategories } from '@/lib/hooks/use-products'
import { CONDITION_LABELS } from '@/types/product'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'

export interface SearchFilters {
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  condition?: string
  tradeMethod?: string
  sort?: string
}

interface FilterPanelProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
}

const SORT_OPTIONS = [
  { value: '', label: '综合排序' },
  { value: 'newest', label: '最新发布' },
  { value: 'price_asc', label: '价格低到高' },
  { value: 'price_desc', label: '价格高到低' },
  { value: 'popular', label: '最多浏览' },
]

const PRICE_RANGES = [
  { min: 0, max: 50, label: '50以下' },
  { min: 50, max: 100, label: '50-100' },
  { min: 100, max: 500, label: '100-500' },
  { min: 500, max: 1000, label: '500-1000' },
  { min: 1000, max: 0, label: '1000以上' },
]

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const { data: categories } = useCategories()
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)

  const activeCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length

  const handleApply = () => {
    onChange(localFilters)
    setOpen(false)
  }

  const handleReset = () => {
    setLocalFilters({})
    onChange({})
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      {/* 快捷排序 */}
      <div className="flex flex-1 gap-1 overflow-x-auto scrollbar-hide">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, sort: opt.value || undefined })}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs transition-colors',
              (filters.sort || '') === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 筛选按钮 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="relative flex shrink-0 items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-muted/80">
          <SlidersHorizontal className="h-3 w-3" />
          筛选
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeCount}
            </span>
          )}
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>筛选条件</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-4">
            {/* 分类 */}
            <div>
              <h4 className="mb-2 text-sm font-medium">分类</h4>
              <div className="flex flex-wrap gap-2">
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        categoryId: localFilters.categoryId === cat.id ? undefined : cat.id,
                      })
                    }
                    className={cn(
                      'rounded-full px-3 py-1 text-xs transition-colors',
                      localFilters.categoryId === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 价格区间 */}
            <div>
              <h4 className="mb-2 text-sm font-medium">价格区间</h4>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.label}
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        minPrice: range.min || undefined,
                        maxPrice: range.max || undefined,
                      })
                    }
                    className={cn(
                      'rounded-full px-3 py-1 text-xs transition-colors',
                      localFilters.minPrice === range.min && localFilters.maxPrice === range.max
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="最低"
                  value={localFilters.minPrice || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, minPrice: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="h-8 text-xs"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="最高"
                  value={localFilters.maxPrice || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, maxPrice: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* 成色 */}
            <div>
              <h4 className="mb-2 text-sm font-medium">成色</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        condition: localFilters.condition === value ? undefined : value,
                      })
                    }
                    className={cn(
                      'rounded-full px-3 py-1 text-xs transition-colors',
                      localFilters.condition === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 交易方式 */}
            <div>
              <h4 className="mb-2 text-sm font-medium">交易方式</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'both', label: '均可' },
                  { value: 'offline', label: '仅自提' },
                  { value: 'escrow', label: '仅担保' },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        tradeMethod: localFilters.tradeMethod === m.value ? undefined : m.value,
                      })
                    }
                    className={cn(
                      'rounded-full px-3 py-1 text-xs transition-colors',
                      localFilters.tradeMethod === m.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              重置
            </Button>
            <Button className="flex-1" onClick={handleApply}>
              确定
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
