/* Aperçu du lien (WhatsApp, Facebook…), référencement (Google) : écrit les balises dans <head> de chaque page,
   puis fabrique sitemap.xml et robots.txt.
   Usage : node outils/seo.js           (depuis la racine du site ; sans danger : on peut le relancer autant de fois qu'on veut)
   Pour changer d'adresse (nom de domaine) : modifier SITE ci-dessous, relancer, puis publier. */
const fs = require('fs');

const SITE = 'https://xtruck.github.io/noblesse-du-coeur/';   // adresse de base, avec « / » final
const NOM = 'La Noblesse du Cœur';
const DATE = new Date().toISOString().slice(0, 10);
const VERSION_APERCU = '5';   // à augmenter quand on change l'image d'aperçu : WhatsApp et Facebook gardent les anciennes images en mémoire

const ACCUEIL = { img: 'img/apercu-accueil.jpg', alt: 'La Noblesse du Cœur : logos de BMT Green Academy et de l\'ONG Lueur d\'Espoir' };
const ONG = { img: 'img/apercu-ong.jpg', alt: 'ONG Lueur d\'Espoir : logo et devise' };
const D_ACCUEIL = 'L\'art de la politesse : cours, auto-évaluations corrigées et examen final, en ligne. Par BMT Green Academy et l\'ONG Lueur d\'Espoir.';

/* indexe = la page peut apparaître dans Google ; sinon « noindex » (parcours de l'élève, espace équipe, formulaires) */
const PAGES = {
  'index.html': { titre: NOM + ' — Programme éducatif de sensibilisation citoyenne', desc: D_ACCUEIL, ...ACCUEIL, indexe: true, accueil: true },
  'ong.html': { titre: 'ONG Lueur d\'Espoir — Redonner espoir, révéler les potentiels', desc: 'ONG Lueur d\'Espoir : dignité humaine, inclusion sociale, paix et vivre-ensemble, leadership positif et engagement citoyen. Contact : +225 01 01 73 68 12.', ...ONG, indexe: true },
  'formations.html': { titre: 'Nos formations — BMT Green Academy', desc: 'Les 9 pôles de formation de BMT Green Academy : thérapies naturelles, psychologie, coaching, art-thérapie, environnement, langues et patrimoines ivoiriens, éthique et citoyenneté, sport et handicap, leadership.', ...ACCUEIL, indexe: true },
  'commencer.html': { titre: 'S\'inscrire — ' + NOM, desc: 'Choisis ton profil (élève ou participant) et inscris-toi en une minute au programme La Noblesse du Cœur.', ...ACCUEIL },
  'espace.html': { titre: 'Mon espace — ' + NOM, desc: D_ACCUEIL, ...ACCUEIL },
  'parcours.html': { titre: 'Parcours éducatif — ' + NOM, desc: D_ACCUEIL, ...ACCUEIL },
  'examen.html': { titre: 'Examen final — ' + NOM, desc: D_ACCUEIL, ...ACCUEIL },
  'bibliotheque.html': { titre: 'Bibliothèque — ' + NOM, desc: 'Les cours, le guide, le manuel, les fiches pratiques et les carnets de suivi du programme La Noblesse du Cœur.', ...ACCUEIL },
  'equipe.html': { titre: 'Espace équipe — ' + NOM, desc: 'Espace réservé à l\'équipe du programme.', ...ACCUEIL },
  'liens.html': { titre: 'Liens du programme — ' + NOM, desc: 'Espace réservé à l\'équipe du programme.', ...ACCUEIL },
  'dashboard.html': { titre: 'Tableau de bord — ' + NOM, desc: 'Espace réservé à l\'équipe du programme.', ...ACCUEIL },
  'certificat.html': { titre: 'Certificat — ' + NOM, desc: 'Espace réservé à l\'équipe du programme.', ...ACCUEIL },
  'form.html': { titre: 'Fiche du programme — ' + NOM, desc: 'Saisie des fiches du programme La Noblesse du Cœur.', ...ACCUEIL },
  '404.html': { titre: 'Page introuvable — ' + NOM, desc: D_ACCUEIL, ...ACCUEIL },
  'offline.html': { titre: 'Hors connexion — ' + NOM, desc: D_ACCUEIL, ...ACCUEIL },
};

const e = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const donneesStructurees = () => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: NOM, url: SITE, inLanguage: 'fr', description: D_ACCUEIL },
    { '@type': 'EducationalOrganization', name: 'BMT Green Academy', logo: SITE + 'img/logo_bmt-480.webp', url: SITE },
    { '@type': 'NGO', name: 'ONG Lueur d\'Espoir', slogan: 'Aidez-nous à nous aider', logo: SITE + 'img/logo_lueur-480.webp', url: SITE + 'ong.html', telephone: '+225 01 01 73 68 12' },
  ],
});

function bloc(page, p) {
  const url = SITE + (page === 'index.html' ? '' : page), image = SITE + p.img + '?v=' + VERSION_APERCU;
  const l = [
    '<!-- seo:debut -->',
    `<title>${e(p.titre)}</title>`,
    `<meta name="description" content="${e(p.desc)}">`,
    `<meta name="robots" content="${p.indexe ? 'index,follow,max-image-preview:large' : 'noindex,nofollow'}">`,
    p.indexe ? `<link rel="canonical" href="${url}">` : '',
    `<meta property="og:type" content="website"><meta property="og:site_name" content="${e(NOM)}"><meta property="og:locale" content="fr_FR">`,
    `<meta property="og:title" content="${e(p.titre)}"><meta property="og:description" content="${e(p.desc)}"><meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${image}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${e(p.alt)}">`,
    `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(p.titre)}"><meta name="twitter:description" content="${e(p.desc)}"><meta name="twitter:image" content="${image}">`,
    p.accueil ? `<script type="application/ld+json">${donneesStructurees()}</script>` : '',
    '<!-- seo:fin -->',
  ];
  return l.filter(Boolean).join('\n');
}

let n = 0;
for (const [page, p] of Object.entries(PAGES)) {
  if (!fs.existsSync(page)) { console.log('absente :', page); continue; }
  let h = fs.readFileSync(page, 'utf8');
  h = h.replace(/<!-- seo:debut -->[\s\S]*?<!-- seo:fin -->\n?/, '');          // ancien bloc
  h = h.replace(/<title>[^<]*<\/title>\n?/, '').replace(/<meta name="description" content="[^"]*">\n?/, '');
  const m = h.match(/<meta name="viewport"[^>]*>/);
  if (!m) { console.log('pas de balise viewport :', page); continue; }
  h = h.replace(m[0], m[0] + '\n' + bloc(page, p));
  fs.writeFileSync(page, h); n++;
}

const indexables = Object.entries(PAGES).filter(([, p]) => p.indexe).map(([page]) => page);
fs.writeFileSync('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  indexables.map(page => `  <url><loc>${SITE + (page === 'index.html' ? '' : page)}</loc><lastmod>${DATE}</lastmod></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
console.log(`${n} pages mises à jour ; sitemap.xml (${indexables.length} pages) et robots.txt écrits ; adresse de base : ${SITE}`);
