/* Tests de l'examen noté (backend/Code.gs) : les bonnes réponses ne sortent jamais, la correction est faite par le serveur,
   une seule copie par élève, l'examen ne s'ouvre que sur ordre. Lancer : node --test tests/examen.test.js */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const BANQUE = [1, 2, 3, 4].map(i => ({ id: i, axe: i <= 2 ? 1 : 2, q: 'Question ' + i + ' ?', options: ['A' + i, 'B' + i, 'C' + i, 'D' + i], bonne: i % 4 }));

/* Faux Google Sheets : juste ce qu'il faut à examenNoter_ */
function fauxClasseur() {
  const feuilles = {};
  const feuille = () => {
    const rows = [];
    const f = {
      rows,
      getLastRow: () => rows.length, getLastColumn: () => (rows[0] || []).length,
      setFrozenRows() {},
      getRange(r, c, nr = 1, nc = 1) {
        const p = {
          setValues(v) { v.forEach((l, i) => { rows[r - 1 + i] = l.slice(); }); return p; },
          setFontWeight: () => p, setBackground: () => p, setFontColor: () => p,
          getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (rows[r - 1 + i] || [])[c - 1 + j] ?? '')),
          getValue: () => (rows[r - 1] || [])[c - 1] ?? '', setValue(v) { (rows[r - 1] = rows[r - 1] || [])[c - 1] = v; return p; },
          getCell: () => ({ setNumberFormat() {} }),
          createTextFinder(txt) { const t = { matchEntireCell: () => t, matchCase: () => t, findNext: () => { for (let i = 0; i < nr; i++) if (rows[r - 1 + i] && rows[r - 1 + i][c - 1] === txt) return { getRow: () => r + i }; return null; } }; return t; },
        };
        return p;
      },
    };
    return f;
  };
  return { feuilles, getSheetByName: n => feuilles[n] || null, insertSheet: n => (feuilles[n] = feuille()) };
}

function monde({ ouvert = true, banque = BANQUE } = {}) {
  const props = ouvert ? { EXAMEN_OUVERT: 'oui' } : {};
  const classeur = fauxClasseur();
  const ctx = vm.createContext({
    console,
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => classeur },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'backend', 'Code.gs'), 'utf8'), ctx);
  if (banque) vm.runInContext('var EXAMEN_PRIVE = ' + JSON.stringify({ questions: banque }) + ';', ctx);
  const post = corps => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(corps) } }).s);
  return { ctx, post, classeur };
}
const eleve = { etablissement: 'Lycée A', nom: 'Koné', prenom: 'Awa', classe: '3e A' };
const toutJuste = Object.fromEntries(BANQUE.map(q => [q.id, q.bonne]));
const ids1 = [1, 2], ids2 = [3, 4];                                  // dans BANQUE : questions 1-2 = Axe 1, questions 3-4 = Axe 2
const juste = qs => Object.fromEntries(BANQUE.filter(q => qs.includes(q.id)).map(q => [q.id, q.bonne]));
const copie = (axe, ok = true, plus = {}) => ({ action: 'examen_noter', axe, ...eleve, ids: axe === 1 ? ids1 : ids2, reponses: ok ? juste(axe === 1 ? ids1 : ids2) : {}, ...plus });

test("l'examen fermé ne donne ni questions ni correction", () => {
  const { post } = monde({ ouvert: false });
  assert.strictEqual(post({ action: 'examen_questions', axe: 1 }).ok, false);
  assert.strictEqual(post(copie(1)).ok, false);
});

test('examen non installé (fichier privé absent) : message clair, pas de plantage', () => {
  const { post } = monde({ banque: null });
  assert.match(post({ action: 'examen_questions', axe: 1 }).error, /pas encore install/);
});

test("sans axe, ou avec un axe inconnu : ni questions ni correction", () => {
  const { post, classeur } = monde();
  assert.strictEqual(post({ action: 'examen_questions' }).ok, false);
  assert.strictEqual(post({ action: 'examen_questions', axe: 3 }).ok, false);
  assert.strictEqual(post({ action: 'examen_noter', ...eleve, ids: ids1, reponses: juste(ids1) }).ok, false);
  assert.strictEqual(classeur.feuilles['Examen final'], undefined);
});

test("chaque axe a son examen : seules les questions de l'axe demandé sont envoyées, sans aucune bonne réponse", () => {
  const { post } = monde();
  [1, 2].forEach(axe => {
    const brut = JSON.stringify(post({ action: 'examen_questions', axe })), r = JSON.parse(brut);
    assert.strictEqual(r.ok, true); assert.strictEqual(r.axe, axe); assert.strictEqual(r.total, 2);
    assert.deepStrictEqual(r.questions.map(q => q.id).sort(), axe === 1 ? ids1 : ids2);
    assert.ok(!/bonne/.test(brut), 'le mot « bonne » ne doit pas sortir');
    r.questions.forEach(q => { assert.strictEqual(q.options.length, 4); assert.deepStrictEqual([...q.options.map(o => o.id)].sort(), [0, 1, 2, 3]); assert.strictEqual(q.bonne, undefined); });
  });
});

test("le tirage donne 7 questions de l'axe, et change à chaque fois", () => {
  const banque = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, axe: i < 15 ? 1 : 2, q: 'Q' + i, options: ['a', 'b', 'c', 'd'], bonne: 0 }));
  const { post } = monde({ banque });
  [1, 2].forEach(axe => {
    const tirage = () => post({ action: 'examen_questions', axe }).questions;
    const a = tirage();
    assert.strictEqual(a.length, 7); assert.strictEqual(new Set(a.map(q => q.id)).size, 7);
    assert.ok(a.every(q => (axe === 1 ? q.id <= 15 : q.id > 15)));
    const vus = new Set(a.map(q => q.id)); for (let k = 0; k < 25; k++) tirage().forEach(q => vus.add(q.id));
    assert.ok(vus.size > 7, "les tentatives suivantes posent d'autres questions");
  });
});

test('correction : tout juste, rien, et réponses partielles', () => {
  const { ctx } = monde();
  const c = rep => JSON.parse(JSON.stringify(ctx.examenCorriger_(BANQUE, rep)));
  assert.strictEqual(c(juste([1, 2, 3, 4])).note, 4);
  assert.strictEqual(c({}).note, 0);
  assert.strictEqual(c({ 1: 1, 2: 0 }).note, 1);              // 1 → bonne 1 ; 2 → bonne 2 (donc faux)
  assert.strictEqual(c(juste([1, 2, 3, 4])).pct, 100);
  assert.strictEqual(c({ 1: '1', 2: 2 }).note, 1);            // une chaîne n'est pas un choix valide
});

test("une copie est corrigée par le serveur et enregistrée ; l'élève reçoit tout de suite sa note et le corrigé", () => {
  const { post, classeur } = monde();
  const r = post(copie(1));
  assert.strictEqual(r.ok, true); assert.strictEqual(r.axe, 1); assert.strictEqual(r.note, 2); assert.strictEqual(r.total, 2); assert.strictEqual(r.pct, 100); assert.strictEqual(r.reussi, true);
  assert.strictEqual(r.tentative, 1); assert.strictEqual(r.certificat, 'non', 'un seul examen réussi : pas encore de certificat'); assert.deepStrictEqual(r.reste, [2]);
  assert.strictEqual(r.corriges.length, 2); assert.ok(r.corriges.every(c => c.juste === true && typeof c.bonne === 'string'));
  const l = classeur.feuilles['Examen final'].rows, col = n => l[0].indexOf(n);
  assert.strictEqual(l.length, 2);                              // en-tête + une copie
  assert.strictEqual(l[1][col('axe')], 1); assert.match(l[1][col('cle')], /\|axe1$/); assert.strictEqual(l[1][col('note')], 2); assert.strictEqual(l[1][col('tentatives')], 1);
});

test("une mauvaise copie : le corrigé montre la bonne réponse, et la réussite est refusée sous 70 %", () => {
  const { post } = monde();
  const r = post(copie(2, false));
  assert.strictEqual(r.ok, true); assert.strictEqual(r.reussi, false); assert.strictEqual(r.certificat, 'non'); assert.deepStrictEqual(r.reste, [1, 2]);
  assert.ok(r.corriges.every(c => c.juste === false && c.choix === null && c.bonne));
});

test("le certificat s'ouvre quand LES DEUX examens sont réussis, avec le matricule des INSCRIPTIONS (jamais celui du navigateur)", () => {
  const { post } = monde();
  const insc = post({ form: 'eleve_inscr', ...eleve });
  assert.match(insc.numero, /^NDC-\d{4}-0001$/);
  assert.strictEqual(post({ action: 'certificat', ...eleve }).certificat, 'aucun');                       // pas encore d'examen
  const a1 = post(copie(1, true, { numero: 'NDC-2099-9999' }));                                              // le numéro envoyé par le navigateur est ignoré
  assert.strictEqual(a1.certificat, 'non');
  const apresAxe1 = post({ action: 'certificat', ...eleve });
  assert.strictEqual(apresAxe1.certificat, 'non'); assert.deepStrictEqual(apresAxe1.reste, [2]); assert.strictEqual(apresAxe1.pct1, 100); assert.strictEqual(apresAxe1.pct2, null);
  assert.strictEqual(apresAxe1.nom, undefined, 'rien à imprimer tant que le certificat est fermé');
  const a2 = post(copie(2));
  assert.strictEqual(a2.certificat, 'ouvert'); assert.deepStrictEqual(a2.reste, []);
  const c = post({ action: 'certificat', ...eleve });
  assert.strictEqual(c.ok, true); assert.strictEqual(c.certificat, 'ouvert'); assert.strictEqual(c.nom, 'Koné'); assert.strictEqual(c.prenom, 'Awa'); assert.strictEqual(c.numero, insc.numero);
  assert.match(c.date, /^\d{4}-\d{2}-\d{2}$/); assert.strictEqual(c.date, new Date().toISOString().slice(0, 10));
  assert.strictEqual(post({ action: 'certificat', ...eleve, nom: 'Inconnu' }).certificat, 'aucun');
  assert.strictEqual(post({ action: 'certificat', ...eleve, nom: '' }).ok, false);
});

test("un examen raté ne suffit pas : il faut 70 % aux DEUX examens", () => {
  const { post } = monde();
  post(copie(1)); post(copie(2, false));
  const c = post({ action: 'certificat', ...eleve });
  assert.strictEqual(c.certificat, 'non'); assert.deepStrictEqual(c.reste, [2]); assert.strictEqual(c.pct2, 0);
  post(copie(2));                                                                                           // il repasse l'Axe 2 et réussit
  assert.strictEqual(post({ action: 'certificat', ...eleve }).certificat, 'ouvert');
});

test("le serveur choisit le matricule : un numéro envoyé à l'inscription est ignoré, et un matricule mal formé n'est jamais écrit", () => {
  const { post, classeur } = monde();
  const a = post({ form: 'eleve_inscr', ...eleve, numero: 'NDC-2099-9999' });
  assert.match(a.numero, /^NDC-\d{4}-0001$/);
  const b = post({ form: 'eleve_inscr', ...eleve, nom: 'Traoré', numero: '=HYPERLINK("http://x")' });
  assert.match(b.numero, /^NDC-\d{4}-0002$/);
  const l = classeur.feuilles['Inscriptions élèves'].rows, col = l[0].indexOf('numero');
  assert.deepStrictEqual(l.slice(1).map(r => r[col]), [a.numero, b.numero]);
  const q = post({ form: 'quiz', ...eleve, profil: 'eleve', numero: '=1+1', module: 'a1m1', titre: 'M1', pct: 80 });
  assert.strictEqual(q.ok, true);
  const lq = classeur.feuilles['Résultats quiz'].rows;
  assert.ok(!lq[0].includes('numero') || lq[1][lq[0].indexOf('numero')] === '', 'une formule dans le numéro est rejetée');
});

test("l'élève peut repasser chaque examen : une ligne par axe, tentatives comptées, la meilleure note est gardée", () => {
  const { post, classeur } = monde();
  const l = classeur.feuilles;
  assert.strictEqual(post({ ...copie(1, false), reponses: { 1: 1 } }).tentative, 1);                          // 1 bonne réponse sur 2
  const bis = post({ ...copie(1), etablissement: 'LYCÉE A', nom: 'kone', prenom: 'AWA', classe: '3e  a' });   // même élève, écrit autrement
  assert.strictEqual(bis.ok, true); assert.strictEqual(bis.tentative, 2);
  const rows = l['Examen final'].rows, col = n => rows[0].indexOf(n);
  assert.strictEqual(rows.length, 2, "toujours une seule ligne pour l'Axe 1");
  assert.strictEqual(rows[1][col('note')], 2); assert.strictEqual(rows[1][col('tentatives')], 2);
  post(copie(1, false));                                                                                      // 3e essai raté : la note gardée ne baisse pas
  assert.strictEqual(rows[1][col('note')], 2); assert.strictEqual(rows[1][col('tentatives')], 3); assert.strictEqual(rows[1][col('derniere_pct')], 0);
  post(copie(2));                                                                                             // l'Axe 2 a sa propre ligne
  assert.strictEqual(rows.length, 3);
  post({ ...copie(1), nom: 'Traoré' });                                                                       // un autre élève : nouvelle ligne
  assert.strictEqual(rows.length, 4);
});

test("une copie dont les questions ne sont pas celles d'un vrai tirage de l'axe est refusée", () => {
  const { post, classeur } = monde();
  for (const mauvais of [undefined, [], [1], [1, 1], [1, 999], [1, 2, 3], [3, 4]])
    assert.strictEqual(post({ ...copie(1), ids: mauvais }).ok, false, JSON.stringify(mauvais));              // [3,4] = questions de l'Axe 2 envoyées pour l'Axe 1
  assert.strictEqual(post({ ...copie(2), ids: ids1 }).ok, false);
  assert.strictEqual(classeur.feuilles['Examen final'], undefined);
});

test("identité incomplète ou copie illisible : refusé, rien n'est écrit", () => {
  const { post, classeur } = monde();
  assert.strictEqual(post({ ...copie(1), nom: '' }).ok, false);
  assert.strictEqual(post({ ...copie(1), reponses: 'oups' }).ok, false);
  assert.strictEqual(classeur.feuilles['Examen final'], undefined);
});

test('réponses hors limites ignorées (0 point) : aucune triche par valeurs étranges', () => {
  const { post, classeur } = monde();
  post({ ...copie(1), reponses: { 1: 99, 2: -1 } });
  const l = classeur.feuilles['Examen final'].rows;
  assert.strictEqual(l[1][l[0].indexOf('note')], 0);
});

test("on ne peut pas écrire une fausse note par le formulaire générique", () => {
  const { post } = monde();
  assert.strictEqual(post({ form: 'examen', nom: 'X', note: 20 }).ok, false);
});

test("le tableau de bord : une personne = deux examens ; réussite si les DEUX atteignent 70 % ; les meilleurs retenus (classement général)", () => {
  const { ctx } = monde();
  const l = (nom, axe, note) => ({ etablissement: 'Lycée A', nom, prenom: 'X', classe: '3e', axe, note, total: 10 });
  const D = { examens: [l('A', 1, 10), l('A', 2, 10), l('B', 1, 9), l('B', 2, 8), l('C', 1, 10), l('C', 2, 5), l('D', 1, 10)] };   // D n'a passé que l'Axe 1 ; C rate l'Axe 2
  const o = JSON.parse(JSON.stringify(ctx.calculer(D, { seuilPct: 70, nbCertificats: 1 })));
  assert.strictEqual(o.examens.copies, 4);
  const par = n => o.examens.liste.find(x => x.nom === n);
  assert.strictEqual(par('A').reussi, true); assert.strictEqual(par('A').pct, 100); assert.strictEqual(par('A').pct1, 100);
  assert.strictEqual(par('B').reussi, true); assert.strictEqual(par('B').pct, 85);
  assert.strictEqual(par('C').reussi, false, "un examen sous 70 % : pas de certificat"); assert.strictEqual(par('C').pct2, 50);
  assert.strictEqual(par('D').reussi, false); assert.strictEqual(par('D').complet, false);
  assert.strictEqual(o.examens.reussis, 2);
  assert.strictEqual(o.examens.retenus, 1, "2 réussites mais 1 seul « meilleur » retenu"); assert.strictEqual(par('A').retenu, true); assert.strictEqual(par('B').retenu, false);
  assert.strictEqual(o.examens.liste[0].nom, 'A');
  assert.strictEqual(o.examens.distinctions, undefined);
  assert.strictEqual(o.personnes.length, 4);
});

test('la liste des personnes fusionne inscription, quiz et examens en une seule ligne par élève', () => {
  const { ctx } = monde();
  const D = { eleve_inscr: [eleve], quiz: [{ ...eleve, profil: 'eleve', module: 'm1', titre: 'M1', pct: 80 }, { ...eleve, profil: 'eleve', module: 'm2', titre: 'M2', pct: 60 }],
              examens: [{ ...eleve, axe: 1, note: 9, total: 10 }, { ...eleve, axe: 2, note: 9, total: 10 }] };
  const o = JSON.parse(JSON.stringify(ctx.calculer(D)));
  assert.strictEqual(o.personnes.length, 1);
  assert.strictEqual(o.personnes[0].quizEssais, 2); assert.strictEqual(o.personnes[0].quizMoy, 70); assert.strictEqual(o.personnes[0].examPct, 90);
  assert.strictEqual(o.quiz.parModule.length, 2);
});

test("le fichier des bonnes réponses ne se trouve pas dans le dépôt public", () => {
  const racine = path.join(__dirname, '..');
  const trouves = [];
  (function parcourir(d) { fs.readdirSync(d, { withFileTypes: true }).forEach(e => { if (e.name === '.git' || e.name === 'node_modules') return; const p = path.join(d, e.name); e.isDirectory() ? parcourir(p) : /ExamenPrive|EXAMEN_PRIVE/.test(e.name + (/\.(js|gs|html|json)$/.test(e.name) && e.name !== 'examen.test.js' && fs.readFileSync(p, 'utf8').includes('EXAMEN_PRIVE = ') ? 'EXAMEN_PRIVE' : '')) && trouves.push(p); }); })(racine);
  assert.deepStrictEqual(trouves, []);
});

function mondeInscriptions() {
  /* faux classeur minimal pour la feuille d'inscription : on réutilise fauxClasseur */
  const classeur = fauxClasseur(); const props = {};
  const c = vm.createContext({ console,
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => classeur } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'backend', 'Code.gs'), 'utf8'), c);
  const post = corps => JSON.parse(c.doPost({ postData: { contents: JSON.stringify(corps) } }).s);
  return { post, classeur };
}

test("chaque élève reçoit un identifiant unique, et le retrouve s'il s'inscrit deux fois", () => {
  const { post, classeur } = mondeInscriptions();
  const a = post({ form: 'eleve_inscr', ...eleve }), b = post({ form: 'eleve_inscr', ...eleve, nom: 'Traoré', prenom: 'Ibrahim' });
  assert.match(a.numero, /^NDC-\d{4}-0001$/); assert.match(b.numero, /^NDC-\d{4}-0002$/);
  const encore = post({ form: 'eleve_inscr', ...eleve });
  assert.strictEqual(encore.numero, a.numero);                  // même élève : même identifiant, pas de nouvelle ligne
  assert.strictEqual(classeur.feuilles['Inscriptions élèves'].rows.length, 3);
});

test("un participant n'a besoin que de son nom, ses prénoms et sa ville ; il partage le compteur des élèves, sans doublon", () => {
  const { post, classeur } = mondeInscriptions();
  const e = post({ form: 'eleve_inscr', ...eleve });
  const part = { form: 'inscription', nom: 'Koffi', prenom: 'Awa', ville: 'Bingerville', formation: 'La Noblesse du Cœur' };
  const p1 = post(part), p2 = post({ ...part, nom: 'Diallo' }), p1bis = post({ ...part, nom: ' KOFFI ', ville: 'bingerville' });
  assert.match(e.numero, /^NDC-\d{4}-0001$/); assert.match(p1.numero, /^NDC-\d{4}-0002$/); assert.match(p2.numero, /^NDC-\d{4}-0003$/);
  assert.strictEqual(p1bis.numero, p1.numero);                  // même personne (accents et majuscules ignorés) : même matricule
  assert.strictEqual(classeur.feuilles['Inscriptions formations'].rows.length, 3);
});

test("une personne = une ligne par axe : sa meilleure note compte, même si la feuille garde plusieurs copies ; les anciennes lignes sans axe sont ignorées", () => {
  const { ctx } = monde();
  const l = (nom, axe, note, tentatives) => ({ etablissement: 'Lycée A', nom, prenom: 'X', classe: '3e', axe, note, total: 10, tentatives });
  const D = { examens: [l('A', 1, 6, 1), l('A', 1, 9, 3), l('A', 2, 10, 1), l('B', undefined, 10, 1)] };
  const o = JSON.parse(JSON.stringify(ctx.calculer(D)));
  assert.strictEqual(o.examens.copies, 1, "B n'a qu'une ancienne ligne sans axe : ignorée");
  const A = o.examens.liste.find(x => x.nom === 'A');
  assert.strictEqual(A.pct1, 90); assert.strictEqual(A.pct2, 100); assert.strictEqual(A.pct, 95); assert.strictEqual(A.tentatives, 4); assert.strictEqual(A.reussi, true); assert.strictEqual(A.retenu, true);
});

test("la date du certificat est celle de la réussite du SECOND examen, et un essai raté plus tard ne la change pas", () => {
  const { post } = monde();
  post(copie(1)); post(copie(2, false));
  assert.strictEqual(post({ action: 'certificat', ...eleve }).date, undefined, 'pas de date tant que le certificat est fermé');
  post(copie(2));
  const premiere = post({ action: 'certificat', ...eleve });
  assert.match(premiere.date, /^\d{4}-\d{2}-\d{2}$/); assert.strictEqual(premiere.date, new Date().toISOString().slice(0, 10));
  post(copie(2, false));
  assert.strictEqual(post({ action: 'certificat', ...eleve }).date, premiere.date);
});
