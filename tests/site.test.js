/* Contrôle qualité du site : fichiers référencés, charte, contrastes, pages complètes.
   Lancer : node --test tests/site.test.js   (aucune dépendance à installer). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const existe = f => fs.existsSync(path.join(RACINE, f));
const PAGES = ['index.html', 'form.html', 'dashboard.html', 'liens.html', 'certificat.html', 'quiz.html', '404.html', 'offline.html'];
const css = lire('style.css'), app = lire('app.js'), quiz = lire('quiz.js'), ui = lire('ui.js'), forms = lire('forms.js'), sw = lire('sw.js');

/* ---------- couleurs ---------- */
function rgb(hex) { hex = hex.replace('#', ''); if (hex.length === 3) hex = [...hex].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)); }
function luminance([r, g, b]) { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); }
function contraste(a, b) { const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((p, q) => q - p); return (x + .05) / (y + .05); }
function teinte([r, g, b]) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; if (!d) return { h: 0, s: 0 };
  const l = (max + min) / 2, s = d / (1 - Math.abs(2 * l - 1)); let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return { h, s }; }
const jeton = nom => { const m = css.match(new RegExp('--' + nom + ':\\s*(#[0-9a-fA-F]{3,6})')); assert.ok(m, 'jeton --' + nom + ' introuvable'); return m[1]; };

test('la charte : aucun rouge ni rose dans les feuilles de style et les scripts', () => {
  const sources = { 'style.css': css, 'app.js': app, 'quiz.js': quiz, 'ui.js': ui };
  for (const [nom, src] of Object.entries(sources)) {
    const sansTexte = src.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const h of sansTexte.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []) {
      const { h: ton, s } = teinte(rgb(h));
      assert.ok(!((ton <= 14 || ton >= 325) && s > .35), `${nom} : ${h} est rouge ou rose (teinte ${Math.round(ton)}°)`);
    }
    assert.ok(!/\b(rouge|--red|crimson|pink)\b/i.test(sansTexte), `${nom} : un mot de couleur interdit apparaît`);
  }
});

test('contrastes de texte (WCAG AA, 4,5:1 minimum) sur les fonds de la charte', () => {
  const [creme, sable, blanc, orPale, sombre] = [jeton('creme'), jeton('sable'), '#ffffff', jeton('or-pale'), jeton('foret-dk')];
  const paires = [
    ['encre sur crème', jeton('encre'), creme], ['gris sur crème', jeton('gris'), creme], ['gris sur sable', jeton('gris'), sable], ['gris sur blanc', jeton('gris'), blanc],
    ['vert sur crème', jeton('vert'), creme], ['vert sur blanc', jeton('vert'), blanc], ['vert2 sur blanc', jeton('vert2'), blanc],
    ['or foncé sur crème', jeton('or-texte'), creme], ['or foncé sur sable', jeton('or-texte'), sable], ['or foncé sur blanc', jeton('or-texte'), blanc], ['or foncé sur or pâle', jeton('or-texte'), orPale],
    ['blanc sur vert', blanc, jeton('vert')], ['blanc sur vert2', blanc, jeton('vert2')],
    ['or clair sur vert sombre', jeton('or-clair'), sombre], ['crème sur vert sombre', jeton('sur-sombre'), sombre],
  ];
  for (const [nom, fg, bg] of paires) assert.ok(contraste(fg, bg) >= 4.5, `${nom} : contraste ${contraste(fg, bg).toFixed(2)} < 4,5`);
});

test('les images et logos référencés dans le code existent', () => {
  const noms = new Set();
  for (const src of [app, quiz, forms, css, ...PAGES.map(lire)]) for (const m of src.matchAll(/img\/([A-Za-z0-9_\-]+\.(?:webp|png|jpg))/g)) noms.add('img/' + m[1]);
  assert.ok(noms.size >= 5, 'trop peu d\'images référencées : le test ne vérifie plus rien');
  const manifeste = JSON.parse(lire('manifest.json'));
  for (const i of manifeste.icons) noms.add(i.src);
  for (const f of noms) assert.ok(existe(f), 'image manquante : ' + f);
});

test('les DEUX logos (BMT Green Academy et ONG Lueur d\'Espoir) sont présents partout : en-tête, bandeau, bande dédiée, pied de page, préchargeur, icônes', () => {
  const bloc = nom => { const m = app.match(new RegExp('(?:function ' + nom + '|const ' + nom + ' =)[\\s\\S]*?(?=\\n(?:function|const|/\\*)\\s)')); assert.ok(m, nom + ' introuvable'); return m[0]; };
  for (const [nom, src] of [['header', bloc('header')], ['DUO', bloc('DUO')], ['PARTENAIRES', bloc('PARTENAIRES')], ['FOOT', bloc('FOOT')]]) {
    assert.ok(/logo_bmt-(160|480)\.webp/.test(src), nom + ' : logo BMT absent');
    assert.ok(/logo_lueur-(160|480)\.webp/.test(src), nom + ' : logo Lueur d\'Espoir absent');
  }
  assert.ok(/\$\{DUO\}/.test(app), 'BANDEAU n\'affiche pas le double médaillon');
  assert.ok(/PARTENAIRES/.test(app.match(/function renderHome[\s\S]*?UIok\(\)/)[0]), 'la bande des deux organisations manque sur l\'accueil');
  for (const p of PAGES.filter(p => !['404.html', 'offline.html'].includes(p))) {
    const h = lire(p); assert.ok(h.includes('logo_bmt-160') && h.includes('logo_lueur-160'), p + ' : préchargeur sans les deux logos');
  }
  for (const p of PAGES) assert.ok(lire(p).includes('icon-duo-192.png'), p + ' : icône à deux logos manquante');
  const icones = JSON.parse(lire('manifest.json')).icons.map(i => i.src);
  assert.ok(icones.every(s => s.includes('icon-duo')), 'le manifeste utilise encore une icône à un seul logo');
});

test('chaque bandeau a ses deux versions (1280 px et mobile 768 px) et chaque vignette existe', () => {
  const bandeaux = new Set([...(app + quiz).matchAll(/BANDEAU\(\s*(?:"([a-z]+)"|f\.img)/g)].map(m => m[1]).filter(Boolean));
  for (const m of forms.matchAll(/\bimg:\s*"([a-z]+)"/g)) bandeaux.add(m[1]);
  assert.ok(bandeaux.size >= 5);
  for (const n of bandeaux) for (const s of ['1280', '768', 'thumb']) assert.ok(existe(`img/${n}-${s}.webp`), `img/${n}-${s}.webp manquant`);
  for (const n of ['basilique', 'plateau']) assert.ok(existe(`img/${n}-thumb.webp`));
});

test('le service worker met en cache uniquement des fichiers qui existent (sinon l\'installation échoue)', () => {
  const CORE = vm.runInNewContext(sw + ';CORE', { self: { addEventListener() {} }, location: { origin: 'http://x' }, caches: {} });
  assert.ok(CORE.length > 20);
  for (const f of CORE) assert.ok(existe(f), 'absent du dépôt mais mis en cache : ' + f);
  assert.ok(CORE.includes('offline.html') && CORE.includes('ui.js') && CORE.includes('quiz-data.js'));
});

test('les fiches PDF proposées sur l\'accueil existent', () => {
  const bloc = app.match(/const PDFS = \[([\s\S]*?)\];/)[1];
  const fichiers = [...bloc.matchAll(/\["([^"]+)",\s*"[^"]+"\]/g)].map(m => m[1]);
  assert.strictEqual(fichiers.length, 12);
  for (const f of fichiers) assert.ok(existe(`pdf/${f}.pdf`), 'PDF manquant : pdf/' + f + '.pdf');
});

test('chaque page a son préchargeur, ui.js avant app.js, les bonnes polices et un titre', () => {
  for (const p of PAGES) {
    const h = lire(p);
    assert.ok(/<title>[^<]{5,}<\/title>/.test(h), p + ' : titre manquant');
    assert.ok(/lang="fr"/.test(h), p + ' : lang="fr" manquant');
    assert.ok(/name="viewport"/.test(h), p + ' : viewport manquant');
    assert.ok(h.includes('Fraunces') && h.includes('Manrope') && !h.includes('Poppins') && !h.includes('Playfair'), p + ' : mauvaises polices');
    assert.ok(h.indexOf('ui.js') > -1 && h.indexOf('ui.js') < h.indexOf('app.js'), p + ' : ui.js doit précéder app.js');
    if (!['404.html', 'offline.html'].includes(p)) assert.ok(h.includes('id="pre"') && h.includes('classList.add("prep")'), p + ' : préchargeur manquant');
  }
});

test('toutes les pages du parcours sont atteignables : les liens du menu et du pied de page pointent vers des fichiers existants', () => {
  const cibles = new Set([...app.matchAll(/(?:href|HREF)="([a-z0-9_\-]+\.html)(?:[?#][^"]*)?"/g)].map(m => m[1]));
  for (const m of app.matchAll(/\["([a-z0-9_\-]+\.html)(?:\?[^"]*)?"/g)) cibles.add(m[1]);
  for (const m of app.matchAll(/"@([a-z0-9_\-]+\.html)"/g)) cibles.add(m[1]);
  assert.ok(cibles.size >= 5);
  for (const f of cibles) assert.ok(existe(f), 'page manquante : ' + f);
});

test('les marques *mot* des titres d\'étapes ne fuient jamais dans les libellés courts (frise) ni ailleurs', () => {
  const etapes = vm.runInNewContext(app.match(/const ETAPES = \[[\s\S]*?\n\];/)[0] + ';ETAPES');
  assert.ok(etapes.length >= 8);
  for (const e of etapes) {
    assert.ok(!/\*/.test(e.court), `libellé court de « ${e.id} » contient une astérisque : ${e.court}`);
    assert.ok(!/\*/.test(e.s), `sous-titre de « ${e.id} » contient une astérisque`);
    assert.ok((e.t.match(/\*/g) || []).length % 2 === 0, `titre de « ${e.id} » : astérisques non appariées`);
    for (const it of e.items) assert.ok(!/\*/.test(it[2] + it[3]), `un élément de « ${e.id} » contient une astérisque`);
  }
});

test('tout appel au serveur passe par appelApi, qui a un délai maximal (jamais de roue qui tourne sans fin)', () => {
  const sansHelper = app.replace(/async function appelApi[\s\S]*?\n\}\n/, '');
  assert.ok(!/fetch\(API_URL/.test(sansHelper), 'un appel direct à fetch(API_URL) contourne le délai maximal');
  assert.ok(/AbortController/.test(app) && /signal:\s*ctrl\.signal/.test(app), 'appelApi n\'utilise pas AbortController');
  assert.ok(/DELAI_API\s*=\s*(\d+)/.test(app) && +app.match(/DELAI_API\s*=\s*(\d+)/)[1] <= 60000, 'délai maximal absent ou supérieur à 60 s');
  assert.ok((app.match(/appelApi\(/g) || []).length >= 3, 'envoi des fiches et tableau de bord doivent utiliser appelApi');
});

test('accessibilité : mouvement réduit respecté, focus visible, lien d\'évitement, cibles tactiles d\'au moins 44 px', () => {
  assert.ok(/prefers-reduced-motion:\s*reduce/.test(css), 'prefers-reduced-motion absent du CSS');
  assert.ok(/:focus-visible/.test(css), 'focus visible absent');
  assert.ok(/class="saut"/.test(app), 'lien d\'évitement absent');
  assert.ok(/aria-expanded/.test(app) && /aria-current/.test(app), 'aria-expanded / aria-current absents');
  assert.ok(/aria-invalid/.test(app) && /aria-describedby/.test(app), 'erreurs de champ non reliées aux champs');
  for (const sel of ['.btn{', 'input[type=text]', '.qopt{', '.opts label{']) {
    const i = css.indexOf(sel); assert.ok(i > -1, sel + ' introuvable');
    const regle = css.slice(i, css.indexOf('}', i)), m = regle.match(/min-height:\s*(\d+)px/);
    assert.ok(m && +m[1] >= 44, `${sel} : hauteur minimale ${m ? m[1] : 'absente'} px < 44 px`);
  }
});

test('le mouvement n\'anime que transform et opacity : aucune transition de largeur, hauteur ou marge', () => {
  const regles = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]+\{[^{}]*\}/g) || [];
  const fautes = [];
  for (const r of regles) {
    const t = r.match(/transition:([^;}]*)/); if (!t) continue;
    const mauvais = t[1].match(/\b(width|height|top|left|right|bottom|margin[\w-]*|padding[\w-]*|all)\b/g);
    if (mauvais) fautes.push(`${r.split('{')[0].trim()} → ${[...new Set(mauvais)].join(', ')}`);
  }
  assert.deepStrictEqual(fautes, [], 'transitions sur des propriétés de mise en page :\n  ' + fautes.join('\n  '));
});
