/* Fabrique le dossier « _site » : uniquement les fichiers publics du site (sans backend, tests, outils, configuration GitHub).
   Sert à publier le site ailleurs que sur GitHub Pages (Cloudflare Pages, Netlify…).
   Usage : node outils/construire.js     — réglage Cloudflare Pages : « Build command » = node outils/construire.js, « Output directory » = _site */
const fs = require('fs'), path = require('path');
const EXCLUS = new Set(['.git', '.github', 'backend', 'tests', 'outils', '_site', 'node_modules', 'A_refaire_ONG', 'README.md', '.gitignore']);
const SORTIE = '_site';

fs.rmSync(SORTIE, { recursive: true, force: true });
let n = 0;
(function copier(dossier, cible) {
  fs.mkdirSync(cible, { recursive: true });
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (EXCLUS.has(e.name)) continue;
    const src = path.join(dossier, e.name), dst = path.join(cible, e.name);
    if (e.isDirectory()) copier(src, dst); else { fs.copyFileSync(src, dst); n++; }
  }
})('.', SORTIE);
console.log(`${n} fichiers copiés dans ${SORTIE}/`);
