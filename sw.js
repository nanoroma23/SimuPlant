// Service worker de SimuPlant.
// Estrategia: "red primero, caché de respaldo" para los archivos propios de la app.
// Así, cada vez que subas una versión nueva del index.html, el celular la toma
// sola (no queda pegado a una versión vieja), y si no hay internet abre la última
// copia guardada. Todo lo que no sea de este mismo sitio (Supabase, CDN) NO se toca.
const CACHE = 'simuplant-v1';
const APP_FILES = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method!=='GET') return;
  const url = new URL(req.url);
  if(url.origin!==self.location.origin) return; // Supabase, CDN, etc.: sin intervenir
  e.respondWith(
    fetch(req).then(res=>{
      if(res && res.ok){
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy));
      }
      return res;
    }).catch(()=>caches.match(req).then(r=>r || caches.match('./index.html')))
  );
});
