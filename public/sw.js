self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'حجز جديد'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    tag: 'booking',
    renotify: true,
    data: { url: data.url || '/dashboard/bookings' },
  }
  event.waitUntil(
    self.registration.showNotification(title, options).then(() =>
      clients.matchAll({ type: 'window' }).then(list =>
        list.forEach(c => c.postMessage({ type: 'NEW_BOOKING' }))
      )
    )
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const url = event.notification.data?.url || '/dashboard/bookings'
      for (const client of list) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          client.focus()
          return
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
