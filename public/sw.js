// Service Worker - Web Push 推送通知接收
self.addEventListener('push', function (event) {
  if (!event.data) return

  try {
    const data = event.data.json()
    const options = {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
      tag: data.tag || 'default',
      renotify: true,
    }
    event.waitUntil(self.registration.showNotification(data.title || '闲妙', options))
  } catch {
    // fallback: treat as plain text
    event.waitUntil(
      self.registration.showNotification('闲妙', {
        body: event.data.text(),
        icon: '/icons/icon-192.png',
      })
    )
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
