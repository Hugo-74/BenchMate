const CACHE_NAME = 'benchmate-v6';
const urlsToCache = ['/', '/app.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});

// Réception des notifications push (arrière-plan)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'BenchMate';
  const body  = data.body  || 'Alerte stock';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  '/icon-192.png',
      badge: '/icon-192.png',
      data:  { url: data.url || 'https://bench-mate-one.vercel.app/app.html#inventory' }
    })
  );
});

// Clic sur la notification → ouvre l'app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : 'https://bench-mate-one.vercel.app/app.html#inventory';
  event.waitUntil(clients.openWindow(url));
});
