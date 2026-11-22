// Guzmán y Abogados: funcionamiento como app instalable.
// Páginas: primero la red (para que siempre salga lo último) y, sin conexión, la copia guardada.
// Archivos estáticos: primero la copia guardada.
const VERSION = "ga-v2";
const BASICOS = ["/", "/index.html", "/documentos.html", "/pago-recibido.html", "/politica-de-datos.html",
  "/assets/estilo.css", "/assets/emblema-dorado.png", "/assets/icono-192.png", "/assets/icono-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(BASICOS).catch(() => null)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Wompi, Google y WhatsApp nunca pasan por aquí
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    e.respondWith(fetch(req).then((r) => { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); return r; })
      .catch(() => caches.match(req).then((r) => r || caches.match("/index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then((resp) => {
    if (resp.ok) { const copia = resp.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); }
    return resp;
  })));
});
