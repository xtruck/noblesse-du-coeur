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
  rapport: 'Rapport établissement', pv: 'PV de sélection', liste: 'Élèves retenus', ong: 'ONG — Bénéficiaires', inscription: 'Inscriptions formations', eleve_inscr: 'Inscriptions élèves', quiz: 'Résultats quiz', reflexion: 'Réflexions sensibilisation' };

/* Examen noté en ligne. Les questions ET les bonnes réponses sont dans le fichier PRIVÉ ExamenPrive.gs
   (jamais sur GitHub : le site public n'a donc aucun moyen de connaître les réponses).
   L'examen ne s'ouvre que si la propriété du script EXAMEN_OUVERT vaut « oui ». */
var ONGLET_EXAMEN = 'Examen final';   // une ligne par élève : sa meilleure note et son nombre de tentatives
var EXAMEN_SEUIL_PCT = 70;          // réussite d'un examen : à partir de 70/100 ; le certificat d'Ambassadeur (le même pour tous) s'obtient en réussissant LES DEUX examens
var EXAMEN_NB_CERTIFICATS = 200;    // les 200 meilleurs, classement général des DEUX lycées réunis
var EXAMEN_NB_QUESTIONS = 7;        // chaque axe a son examen final : 7 questions tirées au hasard dans la réserve de l'axe
var EXAMEN_AFFICHER_NOTE = true;    // l'élève voit tout de suite sa note et le corrigé ; le certificat s'ouvre tout seul quand les deux examens sont réussis

/* Limites contre les envois abusifs (le site est public) */
var MAX_OCTETS = 200000, MAX_TEXTE = 2000, MAX_LIGNES = 200, MAX_COLONNES = 60;
/* Tableau de bord : après ESSAIS_MAX codes faux, plus aucun essai pendant BLOCAGE_SEC secondes (pour tout le monde) */
var ESSAIS_MAX = 10, BLOCAGE_SEC = 900;

/* Texte comparable : minuscules, sans accents, espaces simples. Sert à repérer qu'un élève est déjà inscrit. */
function normCle_(s) { return String(s === undefined || s === null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
/* Matricule unique NDC-AAAA-0001, partagé par les élèves et les participants. C'est le numéro du certificat et l'identifiant pour les autres formations BMT.
   Compteur gardé dans les propriétés du script : jamais deux fois le même numéro, même si une ligne est supprimée. */
function matriculeSuivant_() {
  var props = PropertiesService.getScriptProperties();
  var compte = Number(props.getProperty('COMPTEUR_MATRICULES') || props.getProperty('COMPTEUR_ELEVES') || 0) + 1;
  props.setProperty('COMPTEUR_MATRICULES', String(compte));
  return 'NDC-' + new Date().getFullYear() + '-' + ('0000' + compte).slice(-4);
}
/* Cherche la clé dans la colonne « cle » (TextFinder, sans relire toute la feuille). Renvoie le matricule déjà donné, ou null si la personne est nouvelle. */
function numeroExistant_(sh, cle) {
  if (sh.getLastRow() < 2) return null;
  var entete = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], colCle = entete.indexOf('cle') + 1;
  if (colCle < 1) return null;
  var trouve = sh.getRange(2, colCle, sh.getLastRow() - 1, 1).createTextFinder(cle).matchEntireCell(true).matchCase(true).findNext();
  if (!trouve) return null;
  var colNum = entete.indexOf('numero') + 1;
  return colNum > 0 ? String(sh.getRange(trouve.getRow(), colNum).getValue() || '') : '';
}
function cleEleve_(d) { return [d.etablissement, d.nom, d.prenom, d.classe].map(normCle_).join('|'); }

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
  if (d.action === 'examen_questions') return examenQuestions_(d);   // examen noté : questions SANS les bonnes réponses
  if (d.action === 'examen_noter') return examenNoter_(d);          // examen noté : correction faite ici, jamais dans le navigateur
  if (d.action === 'certificat') return certificatDonnees_(d);      // certificat : nom et matricule donnés par le serveur

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return json_({ ok: false, error: 'Le serveur est très sollicité. Réessayez dans un instant.' });
  try {
    var nom = Object.prototype.hasOwnProperty.call(ONGLET, d.form) ? ONGLET[d.form] : null;
    if (!nom) return json_({ ok: false, error: 'Formulaire inconnu' });
    delete d.form;
    d = propre_(d);
    delete d.cle; delete d.horodatage; delete d.rang;                                          // champs réservés au serveur : jamais repris du navigateur
    if (d.numero !== undefined && !/^[A-Z]{2,3}-\d{4}-\d{4}$/.test(String(d.numero))) delete d.numero;   // un matricule mal formé est ignoré (il pourrait cacher une formule)
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(nom) || ss.insertSheet(nom);
    var res = { ok: true };
    if (nom === ONGLET.ong) {
      var annee = new Date().getFullYear();
      var n = Math.max(0, sh.getLastRow() - 1) + 1;
      d = Object.assign({}, d, { numero: 'LE-' + annee + '-' + ('0000' + n).slice(-4) });
      res.numero = d.numero;
    }
    if (nom === ONGLET.inscription) {
      /* Participant : minimum demandé = nom, prénoms, où il habite. Même anti-doublon et même matricule que les élèves. */
      d.cle = ['participant', d.nom, d.prenom, d.ville].map(normCle_).join('|');
      var exist = numeroExistant_(sh, d.cle);
      if (exist !== null) { res.numero = exist; return json_(res); }
      d = Object.assign({}, d, { numero: matriculeSuivant_() });
      res.numero = d.numero;
    }
    if (nom === ONGLET.eleve_inscr) {
      /* Anti-doublon : même établissement + nom + prénoms + classe (sans accents ni majuscules).
         La clé est stockée dans une colonne « cle » et cherchée avec TextFinder : pas de relecture de toute la feuille sous le verrou. */
      d.cle = cleEleve_(d);
      var existE = numeroExistant_(sh, d.cle);
      if (existE !== null) { res.numero = existE; return json_(res); }   // déjà inscrit : on redonne son matricule, sans doublon
      d = Object.assign({}, d, { numero: matriculeSuivant_() });
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
    var nbCol = head.length;
    lignes.forEach(function (l) { Object.keys(l).forEach(function (k) { if (head.indexOf(k) < 0) head.push(k); }); });
    if (head.length !== nbCol || nbCol === 0) {          // l'en-tête n'est réécrit que s'il change (envois plus rapides sous le verrou)
      sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#14472f').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
    var vals = lignes.map(function (l) { return head.map(function (k) { return l[k] === undefined ? '' : l[k]; }); });
    var plage = sh.getRange(sh.getLastRow() + 1, 1, vals.length, head.length);
    vals.forEach(function (ligne, i) {
      ligne.forEach(function (v, j) {
        // une saisie qui commence par = + - @ reste du texte brut : elle n'est jamais exécutée comme une formule
        if (typeof v === 'string' && /^[=+\-@\t\r]/.test(v)) plage.getCell(i + 1, j + 1).setNumberFormat('@');
      });
    });
    plage.setValues(vals);
    return json_(res);
  } catch (err) {
    console.error(err);                                   // le détail reste dans les journaux Apps Script, pas chez le visiteur
    return json_({ ok: false, error: 'Enregistrement impossible. Réessayez dans un instant.' });
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
  var attendu = codeAcces_(), cache = CacheService.getScriptCache(), essais = Number(cache.get('essais_code') || 0);
  if (essais >= ESSAIS_MAX) return json_({ ok: false, error: 'Trop d\'essais. Réessayez dans 15 minutes.' });   // bloque aussi les essais lancés en parallèle
  if (!attendu || String(code || '') !== attendu) {
    cache.put('essais_code', String(essais + 1), BLOCAGE_SEC);
    Utilities.sleep(1000);
    return json_({ ok: false, error: attendu ? 'Code d\'accès incorrect' : 'Code d\'accès non configuré (Propriétés du script)' });
  }
  cache.remove('essais_code');
  var ss = SpreadsheetApp.getActiveSpreadsheet(), data = {};
  Object.keys(ONGLET).forEach(function (k) { data[k] = lignes_(ss.getSheetByName(ONGLET[k])); });
  data.examens = lignes_(ss.getSheetByName(ONGLET_EXAMEN));   // hors de ONGLET : aucun formulaire public ne peut y écrire
  var s = calculer(data, { seuilPct: EXAMEN_SEUIL_PCT, nbCertificats: EXAMEN_NB_CERTIFICATS });
  s.maj = Utilities.formatDate(new Date(), 'Africa/Abidjan', 'dd/MM/yyyy HH:mm');
  return json_(s);
}

/* ---------- examen noté ---------- */
function examenBanque_() {
  return (typeof EXAMEN_PRIVE !== 'undefined' && EXAMEN_PRIVE && Array.isArray(EXAMEN_PRIVE.questions)) ? EXAMEN_PRIVE.questions : [];
}
function examenOuvert_() { return PropertiesService.getScriptProperties().getProperty('EXAMEN_OUVERT') === 'oui'; }
function melanger_(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* Questions envoyées au navigateur : jamais la bonne réponse. Chaque choix garde son numéro d'origine (id) ; l'ordre affiché est mélangé. */
/* Chaque axe a son examen final : 7 questions tirées au hasard dans la réserve de l'axe (l'Axe 1 comprend la sensibilisation). Chaque tentative donne d'autres questions. */
function banqueAxe_(axe) { return examenBanque_().filter(function (q) { return (q.axe === 2 ? 2 : 1) === axe; }); }
function nbQuestions_(axe) { return Math.min(EXAMEN_NB_QUESTIONS, banqueAxe_(axe).length); }
function axeDemande_(d) { var a = Number(d && d.axe); return a === 1 || a === 2 ? a : 0; }

function examenQuestions_(d) {
  var axe = axeDemande_(d);
  if (!examenBanque_().length) return json_({ ok: false, error: 'L\'examen n\'est pas encore installé.' });
  if (!axe) return json_({ ok: false, error: 'Choisissez l\'examen de l\'Axe 1 ou de l\'Axe 2.' });
  if (!examenOuvert_()) return json_({ ok: false, error: 'L\'examen n\'est pas encore ouvert.' });
  var tirees = melanger_(banqueAxe_(axe)).slice(0, nbQuestions_(axe));
  return json_({ ok: true, axe: axe, total: tirees.length, questions: tirees.map(function (q) {
    return { id: q.id, axe: axe, q: q.q, options: melanger_(q.options.map(function (t, i) { return { id: i, t: t }; })) };
  }) });
}

/* Fonction pure (testée) : note une copie. reponses = { idQuestion: numéroDuChoix }. Une question sans réponse vaut 0. */
function examenCorriger_(banque, reponses) {
  var note = 0, axe = { 1: 0, 2: 0 }, tot = { 1: 0, 2: 0 };
  banque.forEach(function (q) {
    var a = q.axe === 2 ? 2 : 1;
    tot[a]++;
    var r = reponses ? reponses[q.id] : undefined;
    if (typeof r === 'number' && r === q.bonne) { note++; axe[a]++; }
  });
  return { note: note, total: banque.length, axe1: axe[1], axe2: axe[2], total1: tot[1], total2: tot[2],
           pct: banque.length ? Math.round(note / banque.length * 1000) / 10 : 0 };
}

/* Meilleure note, date de réussite et tentatives de l'élève à chacun des deux examens (une ligne par élève ET par axe, clé « …|axe1 » / « …|axe2 »). */
function examensDe_(sh, cleBase) {
  var res = { p: { 1: null, 2: null }, d: { 1: '', 2: '' }, n: { 1: 0, 2: 0 } };
  if (!sh || sh.getLastRow() < 2) return res;
  var entete = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], col = function (k) { return entete.indexOf(k); };
  [1, 2].forEach(function (a) {
    var f = sh.getRange(2, 2, sh.getLastRow() - 1, 1).createTextFinder(cleBase + '|axe' + a).matchEntireCell(true).matchCase(true).findNext();
    if (!f) return;
    var l = sh.getRange(f.getRow(), 1, 1, entete.length).getValues()[0];
    res.p[a] = Number(l[col('pct')]) || 0; res.d[a] = l[col('date_reussite')] || ''; res.n[a] = Number(l[col('tentatives')]) || 1;
  });
  return res;
}
/* Le certificat s'ouvre quand LES DEUX examens sont réussis. 'reste' = les axes dont l'examen n'est pas encore réussi. */
function certificatStatut_(m) {
  var reste = [1, 2].filter(function (a) { return !(m.p[a] !== null && m.p[a] >= EXAMEN_SEUIL_PCT); });
  return { statut: reste.length ? 'non' : 'ouvert', reste: reste };
}

/* L'élève peut repasser chaque examen autant de fois qu'il veut : chaque tentative est comptée, la MEILLEURE note est gardée. */
function examenNoter_(d) {
  var axe = axeDemande_(d), B = axe ? banqueAxe_(axe) : [];
  if (!B.length || !examenOuvert_()) return json_({ ok: false, error: 'L\'examen n\'est pas ouvert.' });
  var id = propre_({ etablissement: d.etablissement, nom: d.nom, prenom: d.prenom, classe: d.classe });   // le matricule du navigateur est ignoré : on le relit dans les inscriptions
  var manque = ['etablissement', 'nom', 'prenom', 'classe'].filter(function (k) { return !id[k] || !String(id[k]).trim(); });
  if (manque.length) return json_({ ok: false, error: 'Renseignez votre établissement, nom, prénoms et classe.' });
  if (!d.reponses || typeof d.reponses !== 'object' || Array.isArray(d.reponses)) return json_({ ok: false, error: 'Copie illisible' });
  /* les questions de la copie : exactement celles d'un tirage de CET axe (nombre contrôlé), sans doublon, toutes dans la réserve de l'axe */
  var ids = Array.isArray(d.ids) ? d.ids.map(Number) : [], vus = {}, tirees = [];
  ids.forEach(function (n) { var q = B.filter(function (x) { return x.id === n; })[0]; if (q && !vus[n]) { vus[n] = 1; tirees.push(q); } });
  if (tirees.length !== ids.length || tirees.length !== nbQuestions_(axe)) return json_({ ok: false, error: 'Copie illisible' });
  var rep = {};
  tirees.forEach(function (q) {
    var v = d.reponses[q.id];
    if (typeof v === 'number' && v >= 0 && v < q.options.length && Math.floor(v) === v) rep[q.id] = v;
  });
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return json_({ ok: false, error: 'Le serveur est très sollicité. Réessayez dans un instant.' });
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(ONGLET_EXAMEN) || ss.insertSheet(ONGLET_EXAMEN);
    var base = cleEleve_(id), cle = base + '|axe' + axe, insc = ss.getSheetByName(ONGLET.eleve_inscr);
    id.numero = insc ? numeroExistant_(insc, base) || '' : '';
    var entete = ['horodatage', 'cle', 'numero', 'etablissement', 'nom', 'prenom', 'classe', 'note', 'total', 'axe1', 'axe2', 'pct', 'tentatives', 'derniere_pct', 'reponses', 'date_reussite', 'axe'];
    if (sh.getLastRow() < 1) {
      sh.getRange(1, 1, 1, entete.length).setValues([entete]).setFontWeight('bold').setBackground('#14472f').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
    else if (sh.getLastColumn() < entete.length) sh.getRange(1, 1, 1, entete.length).setValues([entete]);   // ancienne feuille : on ajoute les colonnes qui manquent
    var r = examenCorriger_(tirees, rep);
    var compact = tirees.map(function (q) { return q.id + ':' + (rep[q.id] === undefined ? '-' : rep[q.id]); }).join(' ');
    var ligne = [new Date(), cle, id.numero || '', id.etablissement, id.nom, id.prenom, id.classe, r.note, r.total, r.axe1, r.axe2, r.pct, 1, r.pct, compact, r.pct >= EXAMEN_SEUIL_PCT ? new Date() : '', axe];
    var deja = sh.getLastRow() > 1 ? sh.getRange(2, 2, sh.getLastRow() - 1, 1).createTextFinder(cle).matchEntireCell(true).matchCase(true).findNext() : null;
    var tentative = 1, meilleurPct = r.pct;
    if (deja) {                                           // nouvelle tentative : on compte, et on ne remplace que si la note est meilleure
      var rang = deja.getRow(), cur = sh.getRange(rang, 1, 1, entete.length).getValues()[0], i = function (k) { return entete.indexOf(k); };
      tentative = (Number(cur[i('tentatives')]) || 1) + 1;
      var meilleure = r.pct > (Number(cur[i('pct')]) || 0);
      meilleurPct = meilleure ? r.pct : (Number(cur[i('pct')]) || 0);
      var nouvelle = meilleure ? ligne.slice() : cur.slice();
      nouvelle[0] = new Date(); nouvelle[i('tentatives')] = tentative; nouvelle[i('derniere_pct')] = r.pct; nouvelle[i('axe')] = axe;
      if (!nouvelle[i('numero')] && id.numero) nouvelle[i('numero')] = id.numero;
      nouvelle[i('date_reussite')] = cur[i('date_reussite')] || (r.pct >= EXAMEN_SEUIL_PCT ? new Date() : '');   // date de la PREMIÈRE réussite, qui ne bouge plus
      sh.getRange(rang, 1, 1, entete.length).setValues([nouvelle]);
    } else {
      var plage = sh.getRange(sh.getLastRow() + 1, 1, 1, entete.length);
      ligne.forEach(function (v, j) { if (typeof v === 'string' && /^[=+\-@\t\r]/.test(v)) plage.getCell(1, j + 1).setNumberFormat('@'); });
      plage.setValues([ligne]);
    }
    var rep2 = { ok: true, enregistre: true, axe: axe, tentative: tentative };
    if (EXAMEN_AFFICHER_NOTE) {
      rep2.note = r.note; rep2.total = r.total; rep2.pct = r.pct; rep2.reussi = r.pct >= EXAMEN_SEUIL_PCT; rep2.meilleurPct = meilleurPct;
      var cert = certificatStatut_(examensDe_(sh, base));
      rep2.certificat = cert.statut; rep2.reste = cert.reste;
      rep2.corriges = tirees.map(function (q) {                     // le corrigé n'est donné qu'APRÈS l'envoi de la copie
        var ch = rep[q.id];
        return { q: q.q, axe: q.axe === 2 ? 2 : 1, choix: ch === undefined ? null : q.options[ch], bonne: q.options[q.bonne], juste: ch === q.bonne };
      });
    }
    return json_(rep2);
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Enregistrement impossible. Réessayez dans un instant.' });
  } finally { lock.releaseLock(); }
}

function jourIso_(v) {
  var d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return '';
  return typeof Utilities !== 'undefined' ? Utilities.formatDate(d, 'Africa/Abidjan', 'yyyy-MM-dd') : d.toISOString().slice(0, 10);
}

/* Ce que l'élève peut demander : son statut, et (si le certificat est ouvert) son nom, son matricule et la date, tels que le serveur les connaît.
   Certificat d'Ambassadeur, le même pour tous : il s'ouvre automatiquement quand les DEUX examens (Axe 1 et Axe 2) sont réussis.
   Sa date est celle de la réussite du second examen. Les 200 meilleurs restent classés dans le tableau de bord (cérémonie), sans différence de certificat. */
function certificatDonnees_(d) {
  var id = propre_({ etablissement: d.etablissement, nom: d.nom, prenom: d.prenom, classe: d.classe });
  var manque = ['etablissement', 'nom', 'prenom', 'classe'].filter(function (k) { return !id[k] || !String(id[k]).trim(); });
  if (manque.length) return json_({ ok: false, error: 'Renseignez votre établissement, nom, prénoms et classe.' });
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(ONGLET_EXAMEN), base = cleEleve_(id);
  var m = examensDe_(sh, base);
  if (m.p[1] === null && m.p[2] === null) return json_({ ok: true, certificat: 'aucun' });
  var cert = certificatStatut_(m), rep = { ok: true, certificat: cert.statut, reste: cert.reste, pct1: m.p[1], pct2: m.p[2] };
  if (cert.statut === 'ouvert') {
    var d1 = m.d[1] ? new Date(m.d[1]).getTime() : 0, d2 = m.d[2] ? new Date(m.d[2]).getTime() : 0;
    rep.date = jourIso_(new Date(Math.max(d1, d2)));
    var insc = ss.getSheetByName(ONGLET.eleve_inscr), numero = insc ? numeroExistant_(insc, base) || '' : '';   // le matricule des inscriptions fait foi
    var f = sh.getRange(2, 2, sh.getLastRow() - 1, 1).createTextFinder(base + '|axe1').matchEntireCell(true).matchCase(true).findNext() || sh.getRange(2, 2, sh.getLastRow() - 1, 1).createTextFinder(base + '|axe2').matchEntireCell(true).matchCase(true).findNext();
    var entete = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], ligne = f ? sh.getRange(f.getRow(), 1, 1, entete.length).getValues()[0] : [];
    rep.nom = String(ligne[entete.indexOf('nom')] || id.nom); rep.prenom = String(ligne[entete.indexOf('prenom')] || id.prenom); rep.numero = numero || String(ligne[entete.indexOf('numero')] || '');
  }
  return json_(rep);
}

function doGet() { return json_({ ok: true, service: 'La Noblesse du Cœur' }); }

function lignes_(sh) {
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), h = v.shift();
  return v.map(function (r) { var o = {}; h.forEach(function (k, i) { o[k] = r[i]; }); return o; });
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- calculs (fonction pure, testée dans tests/calculer.test.js) ---------- */
function calculer(D, opts) {
  opts = opts || {};
  var seuil = typeof opts.seuilPct === 'number' ? opts.seuilPct : 70, nbCert = typeof opts.nbCertificats === 'number' ? opts.nbCertificats : 200;
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
                 retenus: (D.liste || []).length, reflexions: (D.reflexion || []).length, inscriptions: I.length, formations: compte(I, 'formation') };
  /* Examens finaux notés (un par axe) : une ligne par élève ET par axe = sa meilleure note à cet axe. Une personne = une ligne ici :
     elle réussit (et reçoit le certificat) quand les DEUX examens sont à 70 % ou plus ; les 200 meilleurs (moyenne des deux) sont retenus pour la cérémonie. */
  var XP = {};
  (D.examens || []).forEach(function (r) {
    var a = num(r.axe); if (a !== 1 && a !== 2) return;                                   // anciennes lignes de l'examen unique : ignorées
    var k = [r.etablissement, r.nom, r.prenom, r.classe].map(norm).join('|'), note = num(r.note) || 0, total = num(r.total) || 0, p = num(r.pct);
    if (p === null) p = total ? Math.round(note / total * 1000) / 10 : 0;
    var x = XP[k] = XP[k] || { nom: String(r.nom || '').trim(), prenom: String(r.prenom || '').trim(), etab: String(r.etablissement || '').trim(), classe: String(r.classe || '').trim(),
      numero: '', pct1: null, pct2: null, note1: 0, tot1: 0, note2: 0, tot2: 0, t1: 0, t2: 0 };
    if (r.numero && !x.numero) x.numero = String(r.numero);
    if (x['pct' + a] === null || p > x['pct' + a]) { x['pct' + a] = p; x['note' + a] = note; x['tot' + a] = total; x['t' + a] = num(r.tentatives) || 1; }
  });
  var X = Object.keys(XP).map(function (k) {
    var x = XP[k]; x.a1 = x.pct1 !== null; x.a2 = x.pct2 !== null; x.complet = x.a1 && x.a2;
    x.note = x.note1 + x.note2; x.total = x.tot1 + x.tot2; x.axe1 = x.note1; x.axe2 = x.note2; x.tentatives = x.t1 + x.t2;
    x.pct = x.total ? Math.round(x.note / x.total * 1000) / 10 : 0;
    x.reussi = x.complet && x.pct1 >= seuil && x.pct2 >= seuil;
    return x;
  }).sort(function (a, b) { return b.pct - a.pct || (a.etab + a.nom).localeCompare(b.etab + b.nom); });
  X.forEach(function (x, i) { x.rang = i + 1; x.retenu = x.reussi && x.rang <= nbCert; });   // classement général (deux lycées réunis) ; égalités à trancher par la coordination
  var xe = {};
  X.forEach(function (x) { var k = x.etab.toLowerCase(); (xe[k] = xe[k] || { etab: x.etab, L: [] }).L.push(x); });
  var nbOk = X.filter(function (x) { return x.reussi; }).length;
  out.examens = { copies: X.length, seuilPct: seuil, nbCertificats: nbCert,
    retenus: X.filter(function (x) { return x.retenu; }).length,
    moyennePct: X.length ? r2(moy(X.map(function (x) { return x.pct; }))) : null,
    reussis: nbOk, pctReussite: pc(nbOk, X.length),
    parEtab: Object.keys(xe).sort().map(function (k) { var L = xe[k].L, ok = L.filter(function (x) { return x.reussi; }).length;
      return { etab: xe[k].etab, n: L.length, moyennePct: r2(moy(L.map(function (x) { return x.pct; }))), reussis: ok, retenus: L.filter(function (x) { return x.retenu; }).length }; }),
    liste: X };
  var EI = D.eleve_inscr || [], g = {};                 // campagne de sensibilisation : élèves inscrits par lycée et par groupe
  EI.forEach(function (r) { var k = String(r.etablissement || '') + '||' + String(r.groupe || ''); g[k] = (g[k] || 0) + 1; });
  out.inscritsEleves = { total: EI.length, parGroupe: Object.keys(g).sort().map(function (k) { var p = k.split('||'); return { etab: p[0], groupe: p[1], n: g[k] }; }) };
  /* Quiz d'entraînement : chaque essai envoyé par un élève ou un participant (score déclaré par le navigateur, donc indicatif) */
  var QZ = D.quiz || [], qm = {}, qw = {};
  QZ.forEach(function (r) {
    var k = String(r.module || ''), p = num(r.pct); if (!k) return;
    var o = qm[k] = qm[k] || { module: k, titre: String(r.titre || k), n: 0, L: [] };
    o.n++; if (p !== null) o.L.push(p);
    qw[[r.etablissement, r.nom, r.prenom, r.classe].map(norm).join('|')] = 1;
  });
  out.quiz = { tentatives: QZ.length, personnes: Object.keys(qw).length,
    parModule: Object.keys(qm).sort().map(function (k) { return { module: k, titre: qm[k].titre, n: qm[k].n, moyennePct: r2(moy(qm[k].L)) }; }) };

  /* Liste unique de toutes les personnes (une ligne par personne) : inscription, quiz, examen. Sert à l'export Excel de la direction. */
  var PP = {};
  function pers(r, type) {
    var k = type + '|' + [r.etablissement, r.nom, r.prenom, r.classe || r.ville || r.tel].map(norm).join('|');
    return PP[k] || (PP[k] = { type: type, nom: String(r.nom || '').trim(), prenom: String(r.prenom || '').trim(), etab: String(r.etablissement || '').trim(),
      classe: String(r.classe || '').trim(), ville: String(r.ville || '').trim(), formation: '', quizEssais: 0, quizTot: 0, modules: {}, examPct: null, examReussi: null, tel: String(r.tel || '').trim(), numero: String(r.numero || '') });
  }
  EI.forEach(function (r) { var o = pers(r, 'Élève'); if (r.numero) o.numero = String(r.numero); });
  I.forEach(function (r) { var o = pers({ nom: r.nom, prenom: r.prenom, ville: r.ville, tel: r.tel }, 'Participant'); o.formation = String(r.formation || ''); o.prenom = String(r.prenom || '').trim(); o.ville = String(r.ville || '').trim(); if (r.numero) o.numero = String(r.numero); o.tel = String(r.tel || '').trim(); });
  QZ.forEach(function (r) { var o = pers(r, r.profil === 'participant' ? 'Participant' : 'Élève'); o.quizEssais++; o.quizTot += num(r.pct) || 0;
    var mk = String(r.module || ''), mm = o.modules[mk] = o.modules[mk] || { titre: String(r.titre || mk), n: 0, best: 0, dernier: 0 };
    mm.n++; mm.dernier = num(r.pct) || 0; mm.best = Math.max(mm.best, mm.dernier); });
  X.forEach(function (x) { var o = pers({ etablissement: x.etab, nom: x.nom, prenom: x.prenom, classe: x.classe }, 'Élève'); o.examPct = x.pct; o.examReussi = x.complet ? x.reussi : null; });
  out.personnes = Object.keys(PP).map(function (k) { var o = PP[k];
    return { type: o.type, nom: o.nom, prenom: o.prenom, etab: o.etab, classe: o.classe, formation: o.formation, quizEssais: o.quizEssais,
             quizMoy: o.quizEssais ? Math.round(o.quizTot / o.quizEssais) : null, examPct: o.examPct, examReussi: o.examReussi, tel: o.tel, numero: o.numero,
             modules: Object.keys(o.modules).sort().map(function (k) { return { module: k, titre: o.modules[k].titre, n: o.modules[k].n, best: o.modules[k].best, dernier: o.modules[k].dernier }; }) };
  }).sort(function (a, b) { return (a.type + a.etab + a.classe + a.nom).localeCompare(b.type + b.etab + b.classe + b.nom); }).slice(0, 3000);
  return out;
}
