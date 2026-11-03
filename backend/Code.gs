/**
 * La Noblesse du Cœur — base de données (Google Sheets) du site de saisie en ligne.
 *
 * INSTALLATION (5 minutes, une seule fois, avec le compte Google de BMT) :
 *  1. Créer une Google Sheet vide (sheets.new), la nommer « La Noblesse du Cœur — Données ».
 *  2. Menu Extensions → Apps Script. Effacer le contenu, coller TOUT ce fichier, enregistrer.
 *  3. Paramètres du projet (roue dentée) → Propriétés du script → Ajouter une propriété :
 *       nom : CODE_ACCES      valeur : le code du tableau de bord (à choisir, long et unique).
 *     Ne JAMAIS écrire ce code dans ce fichier : le fichier est public sur GitHub.
 *  4. Bouton « Déployer » → « Nouveau déploiement » → type « Application web » :
 *       - Exécuter en tant que : Moi
 *       - Qui a accès : Tout le monde
 *     → Déployer → autoriser → copier l'URL qui se termine par /exec.
 *  5. Coller cette URL dans config.js du site.
 * Après toute modification de ce fichier : Déployer → Gérer les déploiements → crayon → Nouvelle version.
 * Chaque formulaire a son onglet ; l'onglet « ONG — Bénéficiaires » reçoit un numéro automatique.
 */
var ONGLET = { engagement: 'Responsables', eval: 'Évaluation élève', ens: 'Grille enseignant', inc: 'Registre incidents', suivi: 'Suivi individuel',
  rapport: 'Rapport établissement', pv: 'PV de sélection', liste: 'Élèves retenus', ong: 'ONG — Bénéficiaires', inscription: 'Inscriptions formations' };

/* Limites contre les envois abusifs (le site est public) */
var MAX_OCTETS = 200000, MAX_TEXTE = 2000, MAX_LIGNES = 200, MAX_COLONNES = 60;

function codeAcces_() { return PropertiesService.getScriptProperties().getProperty('CODE_ACCES') || ''; }

function doPost(e) {
  var d;
  try {
    var brut = (e && e.postData && e.postData.contents) || '';
    if (brut.length > MAX_OCTETS) return json_({ ok: false, error: 'Envoi trop volumineux' });
    d = JSON.parse(brut);
  } catch (err) { return json_({ ok: false, error: 'Requête illisible' }); }
  if (!d || typeof d !== 'object') return json_({ ok: false, error: 'Requête illisible' });
  if (d.action === 'stats') return stats_(d.code);       // tableau de bord : le code ne passe jamais dans l'adresse (URL)
  if (d.site_web) return json_({ ok: true });             // champ piège caché : seuls les robots le remplissent

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var nom = Object.prototype.hasOwnProperty.call(ONGLET, d.form) ? ONGLET[d.form] : null;
    if (!nom) return json_({ ok: false, error: 'Formulaire inconnu' });
    delete d.form;
    d = propre_(d);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(nom) || ss.insertSheet(nom);
    var res = { ok: true };
    if (nom === ONGLET.ong) {
      var annee = new Date().getFullYear();
      var n = Math.max(0, sh.getLastRow() - 1) + 1;
      d = Object.assign({ numero: 'LE-' + annee + '-' + ('0000' + n).slice(-4) }, d);
      res.numero = d.numero;
    }
    if (nom === ONGLET.inscription) {
      var n2 = Math.max(0, sh.getLastRow() - 1) + 1;
      d = Object.assign({ numero: 'BMT-' + new Date().getFullYear() + '-' + ('0000' + n2).slice(-4) }, d);
      res.numero = d.numero;
    }
    var lignes = [d];
    if (Array.isArray(d.eleves)) {                       // liste des retenus : une ligne par élève
      var commun = {}; Object.keys(d).forEach(function (k) { if (k !== 'eleves') commun[k] = d[k]; });
      lignes = d.eleves.map(function (el, i) { return Object.assign({}, commun, { rang: i + 1 }, el); });
    }
    var maintenant = new Date();
    lignes = lignes.map(function (l) { return Object.assign({ horodatage: maintenant }, l); });
    var head = sh.getLastRow() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
    lignes.forEach(function (l) { Object.keys(l).forEach(function (k) { if (head.indexOf(k) < 0) head.push(k); }); });
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#14472f').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    var vals = lignes.map(function (l) { return head.map(function (k) { return l[k] === undefined ? '' : l[k]; }); });
    var plage = sh.getRange(sh.getLastRow() + 1, 1, vals.length, head.length);
    vals.forEach(function (ligne, i) {
      ligne.forEach(function (v, j) {
        // une saisie qui commence par = + - @ reste du texte brut : elle n'est jamais exécutée comme une formule
        if (typeof v === 'string' && /^[=+\-@]/.test(v)) plage.getCell(i + 1, j + 1).setNumberFormat('@');
      });
    });
    plage.setValues(vals);
    return json_(res);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally { lock.releaseLock(); }
}

/* Garde uniquement des champs simples et de taille raisonnable (noms de colonnes sûrs, textes tronqués). */
function propre_(o) {
  var out = {}, n = 0;
  Object.keys(o).forEach(function (k) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(k) || n >= MAX_COLONNES) return;
    var v = o[k];
    if (k === 'eleves' && Array.isArray(v)) {
      out[k] = v.slice(0, MAX_LIGNES).map(function (x) { return (x && typeof x === 'object') ? propre_(x) : {}; }); n++;
    } else if (typeof v === 'string') { out[k] = v.slice(0, MAX_TEXTE); n++; }
    else if (typeof v === 'number' || typeof v === 'boolean') { out[k] = v; n++; }
  });
  return out;
}

function stats_(code) {
  var attendu = codeAcces_();
  if (!attendu || String(code || '') !== attendu) {
    Utilities.sleep(1000);                                // ralentit les essais au hasard
    return json_({ ok: false, error: attendu ? 'Code d\'accès incorrect' : 'Code d\'accès non configuré (Propriétés du script)' });
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet(), data = {};
  Object.keys(ONGLET).forEach(function (k) { data[k] = lignes_(ss.getSheetByName(ONGLET[k])); });
  var s = calculer(data);
  s.maj = Utilities.formatDate(new Date(), 'Africa/Abidjan', 'dd/MM/yyyy HH:mm');
  return json_(s);
}

function doGet() { return json_({ ok: true, service: 'La Noblesse du Cœur' }); }

function lignes_(sh) {
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), h = v.shift();
  return v.map(function (r) { var o = {}; h.forEach(function (k, i) { o[k] = r[i]; }); return o; });
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- calculs (fonction pure, testée dans tests/calculer.test.js) ---------- */
function calculer(D) {
  function num(x) { return x === '' || x === null || x === undefined || isNaN(Number(x)) ? null : Number(x); }
  function moy(a) { a = a.filter(function (x) { return x !== null; }); return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }
  function r2(x) { return x === null ? null : Math.round(x * 100) / 100; }
  function pc(a, b) { return b ? Math.round(a / b * 1000) / 10 : null; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function dist(a, b) {                                 // distance de Levenshtein : nombre de lettres à changer pour passer de a à b
    var t = [], i, j;
    for (i = 0; i <= a.length; i++) t[i] = [i];
    for (j = 1; j <= b.length; j++) t[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++)
      t[i][j] = Math.min(t[i - 1][j] + 1, t[i][j - 1] + 1, t[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return t[a.length][b.length];
  }
  function cle(r) { return [r.etab, r.classe, r.nom].map(norm).join('|'); }
  var E = {};
  function el(r) { var k = cle(r); return E[k] || (E[k] = { etab: String(r.etab).trim(), classe: String(r.classe).trim(), nom: String(r.nom).trim(), av: null, ap: null, ensAv: null, ensAp: null, deb: null, fin: null, incident: null }); }
  function avant(r) { return /avant/i.test(r.phase); }
  (D.eval || []).forEach(function (r) {
    var s = moy([1, 2, 3, 4, 5, 6, 7].map(function (i) { var v = num(r['q' + i]); return v === null ? null : (i === 1 ? 6 - v : v); }));   // affirmation 1 notée à l'envers
    var e = el(r); if (avant(r)) e.av = s; else e.ap = s;
  });
  (D.ens || []).forEach(function (r) { var s = moy([1, 2, 3, 4, 5].map(function (i) { return num(r['c' + i]); })); var e = el(r); if (avant(r)) e.ensAv = s; else e.ensAp = s; });
  (D.suivi || []).forEach(function (r) {
    var e = el(r);
    e.deb = moy([1, 2, 3, 4].map(function (i) { return num(r['d' + i]); }));
    e.fin = moy([1, 2, 3, 4].map(function (i) { return num(r['f' + i]); }));
    e.incident = /oui/i.test(r.incident || '');
  });
  var eleves = Object.keys(E).map(function (k) {
    var e = E[k];
    var c = [e.fin !== null && e.fin >= 4, e.ensAp !== null && e.ensAp >= 4, e.incident === false,
             (e.av !== null && e.ap !== null && e.ap > e.av) || (e.deb !== null && e.fin !== null && e.fin > e.deb)];
    e.crit = c.filter(Boolean).length; e.eligible = e.crit >= 3;
    return e;
  }).sort(function (a, b) { return (a.etab + a.classe + a.nom).localeCompare(b.etab + b.classe + b.nom); });

  /* Doublons probables : deux noms presque identiques dans le même établissement et la même classe */
  var doublons = [], groupes = {};
  eleves.forEach(function (e) { var g = norm(e.etab) + '|' + norm(e.classe); (groupes[g] = groupes[g] || []).push(e); });
  Object.keys(groupes).forEach(function (g) {
    var L = groupes[g];
    for (var i = 0; i < L.length; i++) for (var j = i + 1; j < L.length; j++) {
      var a = norm(L[i].nom), b = norm(L[j].nom);
      if (a.length >= 5 && b.length >= 5 && dist(a, b) <= (Math.min(a.length, b.length) >= 8 ? 2 : 1))
        doublons.push({ etab: L[i].etab, classe: L[i].classe, a: L[i].nom, b: L[j].nom });
    }
  });
  doublons = doublons.slice(0, 30);

  function m(f) { return r2(moy(eleves.map(function (e) { return e[f]; }))); }
  var paires = eleves.filter(function (e) { return e.av !== null && e.ap !== null; });
  var progres = paires.filter(function (e) { return e.ap > e.av; }).length;
  var suivis = eleves.filter(function (e) { return e.incident !== null; });
  var sans = suivis.filter(function (e) { return e.incident === false; }).length;
  var incAv = 0, incAp = 0;
  (D.inc || []).forEach(function (r) { for (var i = 1; i <= 4; i++) { incAv += num(r['av' + i]) || 0; incAp += num(r['ap' + i]) || 0; } });
  var mAv = moy(eleves.map(function (e) { return e.av; })), mAp = moy(eleves.map(function (e) { return e.ap; }));
  var et = {};
  eleves.forEach(function (e) { var k = e.etab.toLowerCase(); (et[k] = et[k] || { etab: e.etab, L: [] }).L.push(e); });
  var elig = eleves.filter(function (e) { return e.eligible; });
  var out = { ok: true, programme: {
    inscrits: eleves.length, etablissements: Object.keys(et).length, doublons: doublons,
    evalAvant: eleves.filter(function (e) { return e.av !== null; }).length, evalApres: eleves.filter(function (e) { return e.ap !== null; }).length,
    suivis: suivis.length, moyAvant: r2(mAv), moyApres: r2(mAp),
    amelioration: (mAv && mAp) ? Math.round((mAp - mAv) / mAv * 1000) / 10 : null,
    progres: progres, paires: paires.length, pctProgres: pc(progres, paires.length),
    ensAvant: m('ensAv'), ensApres: m('ensAp'), suiviDebut: m('deb'), suiviFin: m('fin'),
    sansIncident: sans, pctSansIncident: pc(sans, suivis.length),
    incAvant: incAv, incApres: incAp, reductionInc: incAv ? Math.round((incAv - incAp) / incAv * 1000) / 10 : null,
    pctEligibles: pc(elig.length, eleves.length),
    eligibles: elig.map(function (e) { return { nom: e.nom, etab: e.etab, classe: e.classe, crit: e.crit }; }),
    parEtab: Object.keys(et).map(function (k) { var L = et[k].L; return { etab: et[k].etab, n: L.length,
      av: r2(moy(L.map(function (e) { return e.av; }))), ap: r2(moy(L.map(function (e) { return e.ap; }))),
      elig: L.filter(function (e) { return e.eligible; }).length }; }),
    eleves: eleves.map(function (e) { return { nom: e.nom, etab: e.etab, classe: e.classe, av: r2(e.av), ap: r2(e.ap), ensAp: r2(e.ensAp), fin: r2(e.fin), incident: e.incident, crit: e.crit }; })
  } };
  function compte(liste, champ) {
    var c = {};
    liste.forEach(function (r) { String(r[champ] || '').split(',').forEach(function (x) { x = x.trim(); if (x) { var k = x.toLowerCase(); c[k] = c[k] || [x, 0]; c[k][1]++; } }); });
    return Object.keys(c).map(function (k) { return [c[k][0], c[k][1], pc(c[k][1], liste.length)]; }).sort(function (a, b) { return b[1] - a[1]; });
  }
  var O = D.ong || [], I = D.inscription || [];
  out.ong = { total: O.length, handicap: compte(O, 'handicap'), besoins: compte(O, 'besoins'), sexe: compte(O, 'sexe'), commune: compte(O, 'commune') };
  out.autres = { responsables: (D.engagement || []).length, rapports: (D.rapport || []).length, pv: (D.pv || []).length,
                 retenus: (D.liste || []).length, inscriptions: I.length, formations: compte(I, 'formation') };
  return out;
}
