'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value?: string
  onSearch: (query: string) => void
  onBack?: () => void
  placeholder?: string
  autoFocus?: boolean
  showBack?: boolean
  className?: string
}

export function SearchBar({
  value = '',
  onSearch,
  onBack,
  placeholder = '搜索你想找的宝贝',
  autoFocus = false,
  showBack = false,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex items-center gap-2', className)}>
      {showBack && (
        <button type="button" onClick={onBack} className="shrink-0 p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-8"
        />
        {query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => setQuery('')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="shrink-0 text-sm font-medium text-primary"
      >
        搜索
      </button>
    </form>
  )
}
