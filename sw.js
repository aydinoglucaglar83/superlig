// Skor Tahmin service worker: uygulama kabuğunu önbelleğe alır (çevrimdışı açılış için).
// Veri istekleri (football-data / ESPN / proxy) hiç önbelleğe alınmaz; uygulama kendi önbelleğini kullanır.
const CACHE = 'skor-tahmin-v1.6.1';
const KABUK = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // Kabuk önbelleğe alınamasa bile kurulum başarısız olmasın
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(KABUK)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // Sayfa açılışı (navigate) isteğine RequestInit verilemez; bu yüzden URL ile yeni istek kuruyoruz.
  const ag = fetch(u.href, { cache: 'no-cache', credentials: 'same-origin' })
    .then(r => {
      if (r && r.ok && !u.pathname.includes('/data/')) { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k)).catch(() => {}); }
      return r;
    });
  e.respondWith(ag.catch(async () => {
    const onb = await caches.match(e.request) || (e.request.mode === 'navigate' ? await caches.match('./index.html') : null);
    return onb || new Response('Çevrimdışı ve önbellekte kopya yok. İnternet bağlantını kontrol et.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
