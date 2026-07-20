/**
 * Meowniverse - Service Worker
 * Provides offline support and caching for PWA functionality
 */
const CACHE_NAME = 'meowniverse-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/styles/main.css',
    '/styles/components/header.css',
    '/styles/components/shop.css',
    '/styles/components/minigame.css',
    '/styles/themes/light.css',
    '/styles/themes/dark.css',
    '/src/main.js',
    '/src/core/EventBus.js',
    '/src/core/StateManager.js',
    '/src/core/GameLoop.js',
    '/src/core/TimeSystem.js',
    '/src/core/SaveManager.js',
    '/src/core/Registry.js',
    '/src/core/GameEngine.js',
    '/src/core/ContentLoader.js',
    '/src/pets/Pet.js',
    '/src/ui/UIManager.js',
    '/src/config/pets/cat.js',
    '/src/config/pets/dog.js',
    '/src/config/pets/bunny.js',
    '/src/config/pets/penguin.js',
    '/src/config/pets/duck.js',
    '/src/config/pets/dragon.js',
    '/src/config/pets/fox.js',
    '/src/config/items/foods.js',
    '/src/config/items/toys.js',
    '/src/config/themes/themes.js',
    '/src/config/environments/environments.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network first for JS modules, cache first for static assets
self.addEventListener('fetch', (event) => {
    // For JavaScript modules, try network first to get latest code
    if (event.request.url.endsWith('.js') || event.request.url.endsWith('.css')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => cache.put(event.request, responseToCache));
                    return response;
                })
                .catch(() => caches.match(event.request)
                    .then((cached) => cached || new Response('Offline', { status: 503 }))
                )
        );
    } else {
        // Cache-first for other assets (images, manifest, etc.)
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request)
                        .then((response) => {
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseToCache));
                            return response;
                        })
                        .catch(() => new Response('Offline', { status: 503 }));
                })
        );
    }
});
