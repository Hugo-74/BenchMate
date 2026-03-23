// firebase-messaging-sw.js
// Ce fichier DOIT être à la racine du site
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAmd8PyBfoWoyt0F4HAanrOGLmukkxWLHc",
  authDomain: "benchmate-d1c51.firebaseapp.com",
  projectId: "benchmate-d1c51",
  storageBucket: "benchmate-d1c51.firebasestorage.app",
  messagingSenderId: "16150419455",
  appId: "1:16150419455:web:793d5826563e4370f679ca"
});

const messaging = firebase.messaging();

// Notifications en arrière-plan
messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    data:  { url: 'https://bench-mate-one.vercel.app/#inventory' }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : 'https://bench-mate-one.vercel.app/#inventory';
  event.waitUntil(clients.openWindow(url));
});
