/* Hors-ligne : pages et images en cache ; cours et PDF mis en cache dès leur première ouverture. */
const V = "bmt-v3";
const CORE = ["index.html", "form.html", "liens.html", "formations.html", "certificat.html", "dashboard.html", "style.css", "app.js", "forms.js", "config.js", "manifest.json",
  "img/logo_bmt.png", "img/logo_lueur.png", "img/basilique.jpg", "img/hkb.jpg", "img/plateau.jpg", "img/savane.jpg", "img/bassam.jpg", "img/man.jpg", "img/certificat.jpg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;            // envois de formulaires : toujours en ligne
  if (/\.(enc|pdf)$/.test(u.pathname)) {                                               // cours : cache d'abord
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); return n; })));
    return;
  }
  e.respondWith(fetch(e.request).then(n => { const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); return n; })                // réseau d'abord
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
