const CACHE_VERSION = 'chuncheon60-v22';
const PRECACHE = [
  './', 'index.html', 'manifest.json',
  'styles.css?v=20260822p', 'app.js?v=20260822p',
  'images/dakgalbi.jpg', 'images/cafe220.jpg', 'images/gugok.jpg',
  'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const cacheFirst = (request) =>
  caches.open(CACHE_VERSION).then((cache) =>
    cache.match(request).then((cached) => cached || fetch(request).then((res) => {
      if (res.ok && res.type !== 'opaque') cache.put(request, res.clone());
      return res;
    }))
  );

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // 페이지 이동: network-first, 오프라인이면 캐시된 셸
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./')));
    return;
  }
  // 날씨 API는 항상 네트워크 (가로채지 않음)
  if (url.hostname === 'api.open-meteo.com') return;
  // 폰트 CDN: cache-first
  if (url.hostname === 'cdn.jsdelivr.net') { event.respondWith(cacheFirst(request)); return; }
  // 동일 출처 정적 에셋: cache-first
  if (url.origin === self.location.origin) { event.respondWith(cacheFirst(request)); return; }
});
