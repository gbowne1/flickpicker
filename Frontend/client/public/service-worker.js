const CACHE_NAME = 'flickpicker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/auth.mjs',
  '/app.mjs',
  '/index.mjs',
  '/profile.mjs',
  '/playlist.mjs',
  '/script.mjs',
  '/search.mjs',
  '/utils.mjs',
  '/state.mjs',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.6.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
  'https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/popper.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.js'
];

// Database setup
const dbName = 'flickpicker-db';
const dbVersion = 1;

// Install event handler
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all(ASSETS_TO_CACHE.map(url => {
      return fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status}`);
          }
          return caches.open(CACHE_NAME).then(cache => cache.put(url, response));
        })
        .catch((error) => {
          console.error('Error caching asset:', error);
        });
    }))
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('/api/') && !event.request.url.endsWith('.js')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        if (event.request.url.includes('/api/')) {
          // Network first, falling back to cache for API requests
          try {
            const fetchResponse = await fetch(event.request);
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          } catch (error) {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              return cachedResponse;
            }
            throw error;
          }
        } else {
          // Cache first for static assets
          const cachedResponse = await caches.match(event.request);
          return cachedResponse || fetch(event.request);
        }
      } catch (error) {
        console.error('Fetch handler error:', error);
        throw error;
      }
    })()
  );
});

// Activate event handler
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .catch((error) => console.error('Cache cleanup failed:', error))
  );
});

// Sync event handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-movies') {
    event.waitUntil(syncMovies());
  }
});

// Database operations
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('movies')) {
        const moviesStore = db.createObjectStore('movies', { keyPath: 'id' });
        moviesStore.createIndex('title', 'title', { unique: false });
        moviesStore.createIndex('year', 'year', { unique: false });
        moviesStore.createIndex('synced', 'synced', { unique: false });
      }

      if (!db.objectStoreNames.contains('watchlist')) {
        const watchlistStore = db.createObjectStore('watchlist', { keyPath: 'id' });
        watchlistStore.createIndex('priority', 'priority', { unique: false });
      }
    };
  });
}

// Sync function
async function syncMovies() {
  try {
    const db = await openDatabase();
    const tx = db.transaction('movies', 'readonly');
    const store = tx.objectStore('movies');
    const unsynced = await store.index('synced').getAll(0);

    await Promise.all(unsynced.map(async (movie) => {
      try {
        await fetch('/api/movies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(movie),
        });

        const updateTx = db.transaction('movies', 'readwrite');
        const updateStore = updateTx.objectStore('movies');
        movie.synced = 1;
        await updateStore.put(movie);
      } catch (error) {
        console.error('Sync failed for movie:', movie.id, error);
      }
    }));
  } catch (error) {
    console.error('Movie sync failed:', error);
  }
}