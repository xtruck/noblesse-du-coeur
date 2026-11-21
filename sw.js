/* Hors-ligne : pages et images en cache ; PDF mis en cache à la première ouverture, puis rafraîchis en arrière-plan. */
const V = "bmt-v7";
const CORE = ["index.html", "form.html", "liens.html", "certificat.html", "dashboard.html", "quiz.html", "style.css", "app.js", "forms.js", "quiz.js", "quiz-data.js", "config.js", "manifest.json",
  "img/logo_bmt.png", "img/logo_lueur.png", "img/basilique.jpg", "img/hkb.jpg", "img/plateau.jpg", "img/savane.jpg", "img/bassam.jpg", "img/man.jpg", "img/certificat.jpg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;            // envois de formulaires : toujours en ligne
  const key = u.origin + u.pathname;                                                  // clé sans « ?nom=… » : aucun nom d'élève n'est gardé dans le cache
  const garder = n => { if (n.status === 200) { const c = n.clone(); caches.open(V).then(x => x.put(key, c)); } return n; };   // jamais de 404/500 ni de réponse partielle en cache
  if (/\.pdf$/.test(u.pathname)) {                                                    // PDF : cache d'abord, mais mis à jour en arrière-plan (un PDF remplacé apparaît à la visite suivante)
    e.respondWith(caches.match(key).then(r => { const f = fetch(e.request).then(garder).catch(() => r); return r || f; }));
    return;
  }
  e.respondWith(fetch(e.request).then(garder).catch(() => caches.match(key)));        // réseau d'abord, cache en secours
});
