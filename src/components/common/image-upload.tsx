'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxCount?: number
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  maxCount = 9,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remaining = maxCount - value.length
    if (remaining <= 0) {
      toast.error(`最多上传${maxCount}张图片`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remaining)
    setUploading(true)

    try {
      const urls: string[] = []

      for (const file of filesToUpload) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} 不是图片文件`)
          continue
        }

        // 验证大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} 超过5MB限制`)
          continue
        }

        // 压缩图片
        const compressed = await compressImage(file)

        // 上传
        const formData = new FormData()
        formData.append('file', compressed)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (res.ok && data.url) {
          urls.push(data.url)
        } else {
          toast.error(`${file.name} 上传失败`)
        }
      }

      if (urls.length > 0) {
        onChange([...value, ...urls])
      }
    } catch {
      toast.error('上传失败')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {value.map((url, index) => (
        <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border">
          <Image src={url} alt="" fill className="object-cover" sizes="33vw" />
          <button
            className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => handleRemove(index)}
          >
            <X className="h-3 w-3 text-white" />
          </button>
          {index === 0 && (
            <span className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center text-[10px] text-white">
              封面
            </span>
          )}
        </div>
      ))}

      {value.length < maxCount && (
        <button
          className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Plus className="h-6 w-6" />
              <span className="mt-1 text-xs">{value.length}/{maxCount}</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />
    </div>
  )
}

// 简单的前端图片压缩
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 1280
        let { width, height } = img

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/webp' }))
            } else {
              resolve(file)
            }
          },
          'image/webp',
          0.85
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
