'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Plus, X, Loader2 } from 'lucide-react'
import { useUpload } from '@/lib/hooks/use-upload'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  max?: number
}

export function ImageUpload({ value, onChange, max = 9 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useUpload()
  const [error, setError] = useState('')

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setError('')

    const remaining = max - value.length
    const filesToUpload = Array.from(files).slice(0, remaining)

    if (filesToUpload.length === 0) {
      setError(`最多上传${max}张图片`)
      return
    }

    try {
      const uploaded: string[] = []
      for (const file of filesToUpload) {
        const url = await upload(file)
        uploaded.push(url)
      }
      onChange([...value, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片上传失败，请重试')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {value.map((url, index) => (
          <div
            key={`${index}-${url.slice(-20)}`}
            className="group relative aspect-square overflow-hidden rounded-lg border"
          >
            <Image
              src={url}
              alt={`图片${index + 1}`}
              fill
              className="object-cover"
              sizes="120px"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
            {index === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-center text-xs text-white">
                封面
              </span>
            )}
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary hover:bg-primary/5"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Plus className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        {value.length}/{max} 张图片 {value.length > 0 && '（第一张为封面）'}
      </p>
    </div>
  )
}
