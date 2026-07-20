// Service Worker pour les notifications push
const CACHE_NAME = 'lassoshop-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/firebase.js',
  '/business.js',
  '/ui.js',
  '/core.js',
  '/manifest.json',
  '/icon.png'
];

// Installation du Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation - nettoyer les anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then(res => res || fetch(e.request))
  );
});

// ===================== NOTIFICATIONS PUSH =====================

// Gestion des messages push (quand l'app est fermée)
self.addEventListener('push', (e) => {
  let data = { title: 'Nouvelle notification', body: 'Message reçu', icon: '/icon.png' };
  try {
    data = e.data.json();
  } catch (err) {
    // Si le message n'est pas en JSON
    data.body = e.data.text();
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gestion du clic sur la notification
self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  if (e.action === 'close') return;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre est déjà ouverte, on la focus
        for (const client of clientList) {
          if (client.url === e.notification.data && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, on ouvre une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(e.notification.data || '/');
        }
      })
  );
});