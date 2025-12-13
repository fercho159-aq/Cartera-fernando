const CACHE_NAME = 'fintrack-v1';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
];

// Evento de instalación - cachear assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Evento de activación - limpiar caches antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            );
        })
    );
    self.clients.claim();
});

// Evento de fetch - red primero, caer en cache
self.addEventListener('fetch', (event) => {
    // Saltar peticiones que no sean GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Saltar peticiones API - siempre ir a la red
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clonar la respuesta antes de cachear
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Si falla la red, intentar cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Retornar página offline para navegación
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                    return new Response('Sin conexión', { status: 503 });
                });
            })
    );
});

// Evento de notificación push
self.addEventListener('push', (event) => {
    const options = {
        body: event.data?.text() || '¿Ya registraste tus gastos de hoy?',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'fintrack-notification',
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Abrir App' },
            { action: 'dismiss', title: 'Descartar' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification('💰 Recordatorio FinTrack', options)
    );
});

// Evento de click en notificación
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Si la app ya está abierta, enfocarla
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            // Sino abrir nueva ventana
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
