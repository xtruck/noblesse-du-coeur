/* Hors-ligne : pages et images en cache ; PDF mis en cache à la première ouverture, puis rafraîchis en arrière-plan. */
const V = "bmt-v25";
// images en WebP : bandeaux (1280 px) et versions mobiles (768 px) ; le certificat haute définition se met en cache à sa première ouverture
const IMGS = ["basilique", "bassam", "hkb", "man", "plateau", "savane"].flatMap(n => ["img/" + n + "-1280.webp", "img/" + n + "-768.webp", "img/" + n + "-thumb.webp"]);
const CORE = ["index.html", "equipe.html", "commencer.html", "espace.html", "examen.html", "examen.js", "bibliotheque.html", "form.html", "liens.html", "certificat.html", "dashboard.html", "parcours.html", "ong.html", "formations.html", "offline.html", "style.css", "ui.js", "app.js", "forms.js", "parcours.js", "quiz-data.js", "config.js", "manifest.json",
  "img/logo_bmt-160.webp", "img/logo_lueur-160.webp", "img/logo_bmt-480.webp", "img/logo_lueur-480.webp", "img/icon-duo-192.png", "img/bouton-plateforme.webp", ...IMGS];
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
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(garder).catch(() => caches.match(key).then(r => r || (e.request.mode === "navigate" ? caches.match("offline.html") : undefined))));   // réseau d'abord (toujours revalidé : une mise à jour du site apparaît tout de suite), cache en secours, puis page « hors connexion »
});
