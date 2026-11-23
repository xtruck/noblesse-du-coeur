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
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null }) },
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
const ids = [1, 2, 3, 4];

test("l'examen fermé ne donne ni questions ni correction", () => {
  const { post } = monde({ ouvert: false });
  assert.strictEqual(post({ action: 'examen_questions' }).ok, false);
  assert.strictEqual(post({ action: 'examen_noter', ...eleve, ids, reponses: toutJuste }).ok, false);
});

test('examen non installé (fichier privé absent) : message clair, pas de plantage', () => {
  const { post } = monde({ banque: null });
  assert.match(post({ action: 'examen_questions' }).error, /pas encore install/);
});

test("les questions envoyées au navigateur ne contiennent aucune bonne réponse ; l'examen mêle les deux axes", () => {
  const { post } = monde();
  const brut = JSON.stringify(post({ action: 'examen_questions' }));
  const r = JSON.parse(brut);
  assert.strictEqual(r.ok, true); assert.strictEqual(r.total, 4);
  assert.deepStrictEqual(r.questions.map(q => q.axe), [1, 1, 2, 2], 'les questions de l\'Axe 1 puis celles de l\'Axe 2');
  assert.ok(!/bonne/.test(brut), 'le mot « bonne » ne doit pas sortir');
  r.questions.forEach(q => { assert.strictEqual(q.options.length, 4); assert.deepStrictEqual([...q.options.map(o => o.id)].sort(), [0, 1, 2, 3]); assert.strictEqual(q.bonne, undefined); });
});

test("le tirage donne 7 questions (4 de l'Axe 1, 3 de l'Axe 2) et change à chaque fois", () => {
  const banque = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, axe: i < 15 ? 1 : 2, q: 'Q' + i, options: ['a', 'b', 'c', 'd'], bonne: 0 }));
  const { post } = monde({ banque });
  const tirage = () => post({ action: 'examen_questions' }).questions;
  const a = tirage();
  assert.strictEqual(a.length, 7); assert.strictEqual(a.filter(q => q.axe === 1).length, 4); assert.strictEqual(a.filter(q => q.axe === 2).length, 3);
  assert.strictEqual(new Set(a.map(q => q.id)).size, 7);
  const vus = new Set(a.map(q => q.id)); for (let k = 0; k < 20; k++) tirage().forEach(q => vus.add(q.id));
  assert.ok(vus.size > 7, "les tentatives suivantes posent d'autres questions");
});

test('correction : tout juste, rien, et réponses partielles', () => {
  const { ctx } = monde();
  const c = (rep) => JSON.parse(JSON.stringify(ctx.examenCorriger_(BANQUE, rep)));
  assert.strictEqual(c(toutJuste).note, 4);
  assert.strictEqual(c({}).note, 0);
  assert.strictEqual(c({ 1: 1, 2: 0 }).note, 1);              // 1 → bonne 1 ; 2 → bonne 2 (donc faux)
  assert.strictEqual(c(toutJuste).pct, 100);
  assert.strictEqual(c({ 1: '1', 2: 2 }).note, 1);            // une chaîne n'est pas un choix valide
});

test("une copie est corrigée par le serveur, enregistrée ; l'élève reçoit tout de suite sa note et le corrigé", () => {
  const { post, classeur } = monde();
  const r = post({ action: 'examen_noter', ...eleve, ids, reponses: toutJuste });
  assert.strictEqual(r.ok, true); assert.strictEqual(r.note, 4); assert.strictEqual(r.total, 4); assert.strictEqual(r.pct, 100); assert.strictEqual(r.reussi, true);
  assert.strictEqual(r.tentative, 1); assert.strictEqual(r.certificat, 'ouvert');
  assert.strictEqual(r.corriges.length, 4); assert.ok(r.corriges.every(c => c.juste === true && typeof c.bonne === 'string'));
  const l = classeur.feuilles['Examen final'].rows;
  assert.strictEqual(l.length, 2);                              // en-tête + une copie
  const col = n => l[0].indexOf(n);
  assert.strictEqual(l[1][col('note')], 4); assert.strictEqual(l[1][col('total')], 4);
  assert.strictEqual(l[1][col('axe1')], 2); assert.strictEqual(l[1][col('axe2')], 2); assert.strictEqual(l[1][col('tentatives')], 1);
});

test("une mauvaise copie : le corrigé montre la bonne réponse, et le certificat reste fermé sous 70 %", () => {
  const { post } = monde();
  const r = post({ action: 'examen_noter', ...eleve, ids, reponses: { 1: 99 } });
  assert.strictEqual(r.ok, true); assert.strictEqual(r.reussi, false); assert.strictEqual(r.certificat, 'non');
  assert.ok(r.corriges.every(c => c.juste === false && c.choix === null && c.bonne));
});

test("certificat : ouvert dès la réussite, avec le nom et le matricule donnés par le serveur ; fermé sinon", () => {
  const { post } = monde();
  assert.strictEqual(post({ action: 'certificat', ...eleve }).certificat, 'aucun');              // pas encore d'examen
  post({ action: 'examen_noter', ...eleve, numero: 'NDC-2026-0007', ids, reponses: { 1: 99 } });
  assert.strictEqual(post({ action: 'certificat', ...eleve }).certificat, 'non');                // 0 %
  post({ action: 'examen_noter', ...eleve, numero: 'NDC-2026-0007', ids, reponses: toutJuste });
  const c = post({ action: 'certificat', ...eleve });
  assert.strictEqual(c.ok, true); assert.strictEqual(c.certificat, 'ouvert'); assert.strictEqual(c.nom, 'Koné'); assert.strictEqual(c.prenom, 'Awa'); assert.strictEqual(c.numero, 'NDC-2026-0007');
  assert.strictEqual(post({ action: 'certificat', ...eleve, nom: 'Inconnu' }).certificat, 'aucun');
  assert.strictEqual(post({ action: 'certificat', ...eleve, nom: '' }).ok, false);
});

test("l'élève peut repasser l'examen : une seule ligne, tentatives comptées, la meilleure note est gardée", () => {
  const { post, classeur } = monde();
  const l = classeur.feuilles;
  assert.strictEqual(post({ action: 'examen_noter', ...eleve, ids, reponses: { 1: 1 } }).tentative, 1);       // 1 bonne réponse sur 4
  const bis = post({ action: 'examen_noter', etablissement: 'LYCÉE A', nom: 'kone', prenom: 'AWA', classe: '3e  a', ids, reponses: toutJuste });   // même élève, écrit autrement
  assert.strictEqual(bis.ok, true); assert.strictEqual(bis.tentative, 2);
  const rows = l['Examen final'].rows, col = n => rows[0].indexOf(n);
  assert.strictEqual(rows.length, 2, 'toujours une seule ligne pour cet élève');
  assert.strictEqual(rows[1][col('note')], 4); assert.strictEqual(rows[1][col('tentatives')], 2);
  post({ action: 'examen_noter', ...eleve, ids, reponses: {} });                                               // 3e essai, raté : la note gardée ne baisse pas
  assert.strictEqual(rows[1][col('note')], 4); assert.strictEqual(rows[1][col('tentatives')], 3); assert.strictEqual(rows[1][col('derniere_pct')], 0);
  post({ action: 'examen_noter', ...eleve, nom: 'Traoré', ids, reponses: toutJuste });                          // un autre élève : nouvelle ligne
  assert.strictEqual(rows.length, 3);
});

test("une copie dont les questions ne sont pas celles d'un vrai tirage est refusée", () => {
  const { post, classeur } = monde();
  for (const mauvais of [undefined, [], [1, 2], [1, 1, 3, 4], [1, 2, 3, 999], [1, 2, 3, 4, 4]])
    assert.strictEqual(post({ action: 'examen_noter', ...eleve, ids: mauvais, reponses: toutJuste }).ok, false, JSON.stringify(mauvais));
  assert.strictEqual(post({ action: 'examen_noter', ...eleve, ids: [1, 2], reponses: toutJuste }).ok, false);   // que des questions de l'Axe 1
  assert.strictEqual(classeur.feuilles['Examen final'], undefined);
});

test("identité incomplète ou copie illisible : refusé, rien n'est écrit", () => {
  const { post, classeur } = monde();
  assert.strictEqual(post({ action: 'examen_noter', ...eleve, ids, nom: '', reponses: toutJuste }).ok, false);
  assert.strictEqual(post({ action: 'examen_noter', ...eleve, ids, reponses: 'oups' }).ok, false);
  assert.strictEqual(classeur.feuilles['Examen final'], undefined);
});

test('réponses hors limites ignorées (0 point) : aucune triche par valeurs étranges', () => {
  const { post, classeur } = monde();
  post({ action: 'examen_noter', ...eleve, ids, reponses: { 1: 99, 2: -1, 3: 1.5, 4: 'x' } });
  const l = classeur.feuilles['Examen final'].rows;
  assert.strictEqual(l[1][l[0].indexOf('note')], 0);
});

test("on ne peut pas écrire une fausse note par le formulaire générique", () => {
  const { post } = monde();
  assert.strictEqual(post({ form: 'examen', nom: 'X', note: 20 }).ok, false);
});

test("le tableau de bord calcule moyenne, réussites (80 %) et les meilleurs retenus (classement général), sans distinction", () => {
  const { ctx } = monde();
  const ligne = (nom, note) => ({ etablissement: 'Lycée A', nom, prenom: 'X', classe: '3e', note, total: 10, axe1: note / 2, axe2: note / 2 });
  const D = { examens: [ligne('A', 10), ligne('B', 8), ligne('C', 5)] };   // 100 %, 80 %, 50 %
  const o = JSON.parse(JSON.stringify(ctx.calculer(D, { seuilPct: 80, nbCertificats: 1 })));
  assert.strictEqual(o.examens.copies, 3); assert.strictEqual(o.examens.reussis, 2);   // 100 % et 80 % passent, 50 % non
  assert.strictEqual(o.examens.parEtab[0].retenus, 1);          // 2 réussites mais 1 seul « meilleur » retenu (classement général)
  assert.strictEqual(o.examens.retenus, 1); assert.strictEqual(o.examens.distinctions, undefined);
  assert.strictEqual(o.examens.liste[0].nom, 'A');              // classement par note
  assert.strictEqual(o.personnes.length, 3);
});

test('la liste des personnes fusionne inscription, quiz et examen en une seule ligne par élève', () => {
  const { ctx } = monde();
  const D = { eleve_inscr: [eleve], quiz: [{ ...eleve, profil: 'eleve', module: 'm1', titre: 'M1', pct: 80 }, { ...eleve, profil: 'eleve', module: 'm2', titre: 'M2', pct: 60 }],
              examens: [{ ...eleve, note: 18, total: 20, axe1: 9, axe2: 9 }] };
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

test("une personne = une ligne : sa meilleure note compte, même si la feuille garde plusieurs copies", () => {
  const { ctx } = monde();
  const ligne = (nom, note, tentatives) => ({ etablissement: 'Lycée A', nom, prenom: 'X', classe: '3e', note, total: 10, axe1: 0, axe2: 0, tentatives });
  const D = { examens: [ligne('A', 6, 1), ligne('A', 9, 3), ligne('B', 10, 1)] };
  const o = JSON.parse(JSON.stringify(ctx.calculer(D)));
  assert.strictEqual(o.examens.copies, 2);
  const A = o.examens.liste.find(x => x.nom === 'A');
  assert.strictEqual(A.pct, 90); assert.strictEqual(A.tentatives, 3); assert.strictEqual(A.reussi, true); assert.strictEqual(A.rang, 2); assert.strictEqual(A.retenu, true);
});

test("le certificat porte la date de la première réussite, qui ne bouge plus ensuite", () => {
  const { post } = monde();
  post({ action: 'examen_noter', ...eleve, ids, reponses: { 1: 99 } });                       // raté : pas de date de réussite
  assert.strictEqual(post({ action: 'certificat', ...eleve }).date, undefined);
  post({ action: 'examen_noter', ...eleve, ids, reponses: toutJuste });                       // réussi : la date est fixée
  const premiere = post({ action: 'certificat', ...eleve });
  assert.match(premiere.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.strictEqual(premiere.date, new Date().toISOString().slice(0, 10));
  post({ action: 'examen_noter', ...eleve, ids, reponses: {} });                              // un essai raté plus tard ne change rien
  assert.strictEqual(post({ action: 'certificat', ...eleve }).date, premiere.date);
});
