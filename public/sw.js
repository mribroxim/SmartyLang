self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  event.waitUntil(self.registration.showNotification('SmartyLang', {
    body: 'Time for a little language practice.',
    tag: 'smarty-daily-review',
    icon: '/smarty-face.svg',
    data: { url: '/#/practice' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of all) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client && target !== '/') { try { await client.navigate(target); } catch (e) { /* cross-origin or blocked */ } }
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
