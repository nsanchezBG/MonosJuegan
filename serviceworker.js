const CACHE_NAME = 'pareja-cache-v3'; // Subimos la versión
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './questions_pareja.json',
  
  // Lista de todos los assets gráficos
  './apple-touch-icon.png',
  './favicon.ico',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png', // <-- CORRECCIÓN AQUÍ
  './favicon-16x16.png',
  './favicon-32x32.png',
  './LogoPareja.png',
  './IconoJuegoPreguntas.png',
  './IconoEspejo.png',
  './IconoEquipo.png',
  './IconoFuego.png',
  './IconoEspejoInner.png',
  './IconoEquipoInner.png',
  './IconoFuegoInner.png',
  './IconoBack.png',
  
  'https://fonts.googleapis.com/css2?family=Shrikhand&display=swap'
];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(res => res || fetch(e.request))));
self.addEventListener('activate', e => {
  const cacheWhitelist = [CACHE_NAME];
  e.waitUntil(caches.keys().then(names => Promise.all(names.map(name => { if (cacheWhitelist.indexOf(name) === -1) { return caches.delete(name); } }))));
});
