'use client'

import { useEffect, useState, useCallback } from 'react'

export function usePush() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasSupport = 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(hasSupport)
    if (!hasSupport) { setLoading(false); return }

    // 检查是否已订阅
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const subscribe = useCallback(async () => {
    if (!supported) return false

    try {
      // 获取 VAPID 公钥
      const res = await fetch('/api/push/vapid-key')
      if (!res.ok) return false
      const { publicKey } = await res.json()
      if (!publicKey) return false

      // 请求通知权限
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false

      // 注册 Service Worker
      const reg = await navigator.serviceWorker.ready

      // 订阅推送
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // 保存订阅到服务器
      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })

      if (saveRes.ok) {
        setSubscribed(true)
        return true
      }
      return false
    } catch (err) {
      console.error('[use-push] 订阅失败:', err)
      return false
    }
  }, [supported])

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await fetch('/api/push/subscribe', { method: 'DELETE' })
      setSubscribed(false)
    } catch {}
  }, [])

  return { supported, subscribed, loading, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
