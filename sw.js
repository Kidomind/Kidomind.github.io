/* Kidomind service worker – çevrimdışı çalışma */
const VERSION = 'kidomind-v2';
const CORE = VERSION + '-core';
const AUDIO = VERSION + '-audio';
const BASE = self.registration.scope;
const CORE_FILES = ['index.html','manifest.json','gizlilik.html','icons/icon-192.png','icons/icon-512.png','icons/maskable-192.png','icons/maskable-512.png','icons/apple-touch-icon.png'].map(f => new URL(f, BASE).href);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CORE);
    await Promise.all(CORE_FILES.map(u => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (!k.startsWith(VERSION)) await caches.delete(k);
    }
    await self.clients.claim();
    warmAudio(); // arka planda, kurulumu bekletmeden
  })());
});

/* audio/manifest.json içindeki sesleri arka planda önbelleğe al */
async function warmAudio() {
  try {
    /* ~127 MB: mobil veride otomatik indirme yapma. Sadece Wi-Fi/ethernet ve veri tasarrufu kapalıyken.
       Diğer durumlarda sesler ilk çalındıklarında tek tek önbelleğe alınır. */
    const nc = self.navigator && self.navigator.connection;
    if (!nc || nc.saveData || !(nc.type === 'wifi' || nc.type === 'ethernet')) return;
    const mUrl = new URL('audio/manifest.json', BASE).href;
    const r = await fetch(mUrl, { cache: 'no-cache' });
    if (!r.ok) return;
    const c = await caches.open(AUDIO);
    await c.put(mUrl, r.clone());
    const list = await r.json();
    const files = (Array.isArray(list) ? list : Object.keys(list)).map(n => new URL('audio/' + n + '.mp3', BASE).href);
    let i = 0;
    const worker = async () => {
      while (i < files.length) {
        const u = files[i++];
        if (await c.match(u)) continue;
        try { const res = await fetch(u); if (res.ok && res.status === 200) await c.put(u, res); } catch (e) { return; }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  } catch (e) {}
}

/* Range isteklerine (ses/video) önbellekten 206 yanıtı ver */
async function rangeResponse(req, cached) {
  const buf = await cached.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  const size = buf.byteLength;
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (end >= size) end = size - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    }
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* Sesler: önce önbellek */
  if (url.pathname.includes('/audio/')) {
    e.respondWith((async () => {
      const c = await caches.open(AUDIO);
      const hit = await c.match(url.href);
      if (hit) return req.headers.has('range') ? rangeResponse(req, hit) : hit;
      try {
        const res = await fetch(url.pathname.endsWith('.mp3') ? url.href : req);
        if (res.ok && res.status === 200) c.put(url.href, res.clone());
        if (req.headers.has('range') && res.ok && res.status === 200) {
          const again = await c.match(url.href);
          if (again) return rangeResponse(req, again);
        }
        return res;
      } catch (err) {
        return new Response('', { status: 504 });
      }
    })());
    return;
  }

  /* Sayfa gezinmeleri: ağ öncelikli, çevrimdışıysa önbellekteki index.html */
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(CORE);
      try {
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      } catch (err) {
        return (await c.match(req, { ignoreSearch: true })) || (await c.match(new URL('index.html', BASE).href)) || Response.error();
      }
    })());
    return;
  }

  /* Diğer dosyalar: önce önbellek, arkadan güncelle */
  e.respondWith((async () => {
    const c = await caches.open(CORE);
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
