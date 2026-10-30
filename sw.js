// KNEUBÜHLER 3D – ohne Internet (App-Version 1.91.0): App-Dateien im Speicher, mit Internet im Hintergrund nachgeladen.
// Die Liste und die Modelle (modelle/…) gehen immer übers Netz – die geladenen Gerüste speichert die App selbst (IndexedDB).
const CACHE = "kneubuehler-3d-1.91.0";
const DATEIEN = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("kneubuehler-3d-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== self.location.origin || u.pathname.indexOf("/modelle/") >= 0) return;
  const netz = fetch(r).then(a => {
    if (a && a.ok) { const k = a.clone(); caches.open(CACHE).then(c => c.put(r, k)); }
    return a;
  }).catch(() => null);
  e.waitUntil(netz.then(() => undefined));
  e.respondWith(caches.open(CACHE).then(async c => {
    const treffer = await c.match(r, { ignoreSearch: true }) || (r.mode === "navigate" ? await c.match("./index.html") || await c.match("./") : null);
    if (treffer) return treffer;
    const a = await netz;
    return a || new Response("Ohne Internet nicht verfügbar.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }));
});
