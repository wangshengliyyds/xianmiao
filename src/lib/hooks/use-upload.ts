'use client'

import { useState } from 'react'

export async function doUpload(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    let errorMsg = '上传失败'
    try {
      const err = await res.json()
      errorMsg = err.error || errorMsg
    } catch {}
    throw new Error(errorMsg)
  }

  const { data } = await res.json()
  return data.url
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = async (file: File): Promise<string> => {
    setUploading(true)
    setProgress(0)
    try {
      const url = await doUpload(file)
      setProgress(100)
      return url
    } finally {
      setUploading(false)
    }
  }

  const uploadMultiple = async (files: File[]): Promise<string[]> => {
    setUploading(true)
    setProgress(0)
    try {
      const urls: string[] = []
      for (let i = 0; i < files.length; i++) {
        urls.push(await doUpload(files[i]))
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }
      return urls
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploadMultiple, uploading, progress }
}
