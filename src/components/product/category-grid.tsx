'use client'

import Link from 'next/link'
import type { Category } from '@/types/product'
import {
  Smartphone, Laptop, Home, Shirt, BookOpen,
  Dumbbell, Baby, Car, Gamepad2, MoreHorizontal,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  '手机': Smartphone,
  '数码': Laptop,
  '家电': Home,
  '服饰': Shirt,
  '图书': BookOpen,
  '运动': Dumbbell,
  '母婴': Baby,
  '汽车': Car,
  '游戏': Gamepad2,
}

interface CategoryGridProps {
  categories: Category[]
  maxCount?: number
}

export function CategoryGrid({ categories, maxCount = 10 }: CategoryGridProps) {
  const displayCategories = categories.slice(0, maxCount)

  return (
    <div className="grid grid-cols-5 gap-3">
      {displayCategories.map((cat) => {
        const Icon = ICON_MAP[cat.name] || MoreHorizontal
        return (
          <Link
            key={cat.id}
            href={`/category/${cat.id}`}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/50 p-3 text-center transition-colors hover:bg-muted"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs">{cat.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
