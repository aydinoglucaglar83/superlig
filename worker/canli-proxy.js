// Skor Tahmin — Cloudflare Worker (ücretsiz plan yeterli)
// Telefondan ESPN / football-data'ya ulaşılamadığında aracı olur.
// Sadece izinli adreslere istek iletir; tarayıcıya CORS izni ekler.
// Kullanım: https://<worker-adın>.workers.dev/?url=<hedef-adres>
const IZINLI = ['site.api.espn.com', 'www.football-data.co.uk', 'football-data.co.uk'];

export default {
  async fetch(istek) {
    if (istek.method === 'OPTIONS') return new Response(null, { headers: cors() });
    const hedefStr = new URL(istek.url).searchParams.get('url');
    if (!hedefStr) return new Response('?url= parametresi gerekli', { status: 400, headers: cors() });
    let hedef;
    try { hedef = new URL(hedefStr); } catch { return new Response('geçersiz url', { status: 400, headers: cors() }); }
    if (hedef.protocol !== 'https:' || !IZINLI.includes(hedef.hostname))
      return new Response('bu adrese izin yok', { status: 403, headers: cors() });
    const espn = hedef.hostname.includes('espn');
    const cevap = await fetch(hedef.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cf: { cacheTtl: espn ? 15 : 1800, cacheEverything: true },   // canlı skor 15 sn, CSV 30 dk önbellek
    });
    const h = new Headers(cevap.headers);
    Object.entries(cors()).forEach(([k, v]) => h.set(k, v));
    return new Response(cevap.body, { status: cevap.status, headers: h });
  },
};
function cors() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };
}
