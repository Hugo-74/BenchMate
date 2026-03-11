const CACHE_NAME = 'benchmate-cache-v1';

// Liste des fichiers à sauvegarder pour le mode hors-ligne
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installation : on met en cache les fichiers de base
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Fichiers mis en cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interception des requêtes : on sert le cache si disponible, sinon on va sur le réseau
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourne la version en cache si elle existe, sinon télécharge la nouvelle
        return response || fetch(event.request);
      })
  );
});

// Nettoyage des anciens caches lors des mises à jour
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});