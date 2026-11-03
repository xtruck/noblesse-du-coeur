/* Tests de la fonction de calcul du tableau de bord (backend/Code.gs). Lancer : node --test tests/calculer.test.js */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'backend', 'Code.gs'), 'utf8'), ctx);

const base = { etab: 'Lycée A', classe: '3e A' };
const ev = (nom, phase, q) => Object.assign({ nom, phase }, base, Object.fromEntries(q.map((v, i) => ['q' + (i + 1), v])));
const vide = () => ({ eval: [], ens: [], suivi: [], inc: [], ong: [], inscription: [], engagement: [], rapport: [], pv: [], liste: [] });
const calc = D => JSON.parse(JSON.stringify(ctx.calculer(D)));   // copie simple : évite les différences entre contextes

test('sans aucune donnée, rien ne plante', () => {
  const o = calc(vide());
  assert.strictEqual(o.ok, true);
  assert.strictEqual(o.programme.inscrits, 0);
});

test("l'affirmation 1 (colère) est notée à l'envers", () => {
  const D = vide();
  D.eval = [ev('Awa Koné', 'Avant le programme', [5, 3, 3, 3, 3, 3, 3])];   // 5 devient 1 : (1+18)/7 = 2,71
  assert.strictEqual(calc(D).programme.moyAvant, 2.71);
});

test('un même élève écrit avec accents, casse et espaces différents est compté une seule fois', () => {
  const D = vide();
  D.eval = [ev('Awa Koné', 'Avant le programme', [3, 3, 3, 3, 3, 3, 3]), ev('awa  kone', 'Après le programme', [1, 5, 5, 5, 5, 5, 5])];
  const p = calc(D).programme;
  assert.strictEqual(p.inscrits, 1);
  assert.strictEqual(p.paires, 1);
  assert.strictEqual(p.progres, 1);
  assert.strictEqual(p.moyAvant, 3);
  assert.strictEqual(p.moyApres, 5);
  assert.strictEqual(p.amelioration, 66.7);
});

test('un élève qui remplit les 4 critères est éligible, pas celui qui n\'a qu\'une évaluation', () => {
  const D = vide();
  D.eval = [ev('Awa Koné', 'Avant le programme', [3, 3, 3, 3, 3, 3, 3]), ev('Awa Koné', 'Après le programme', [1, 5, 5, 5, 5, 5, 5]),
            ev('Koffi Yao', 'Avant le programme', [3, 3, 3, 3, 3, 3, 3])];
  D.ens = [Object.assign({ nom: 'Awa Koné', phase: 'Après le programme', c1: 5, c2: 4, c3: 4, c4: 5, c5: 4 }, base)];
  D.suivi = [Object.assign({ nom: 'Awa Koné', d1: 2, d2: 2, d3: 3, d4: 2, f1: 4, f2: 5, f3: 4, f4: 4, incident: 'Non, aucun' }, base)];
  const p = calc(D).programme;
  assert.strictEqual(p.inscrits, 2);
  assert.strictEqual(p.eligibles.length, 1);
  assert.strictEqual(p.eligibles[0].nom, 'Awa Koné');
  assert.strictEqual(p.eligibles[0].crit, 4);
});

test('les incidents avant/après donnent le pourcentage de baisse', () => {
  const D = vide();
  D.inc = [Object.assign({ av1: 4, av2: 2, av3: 5, av4: 1, ap1: 1, ap2: 0, ap3: 2, ap4: 0 }, base)];
  const p = calc(D).programme;
  assert.strictEqual(p.incAvant, 12);
  assert.strictEqual(p.incApres, 3);
  assert.strictEqual(p.reductionInc, 75);
});

test('deux noms presque identiques dans la même classe sont signalés comme doublons probables', () => {
  const D = vide();
  D.eval = [ev('Koffi Yao', 'Avant le programme', [3, 3, 3, 3, 3, 3, 3]), ev('Koffi Yaw', 'Avant le programme', [3, 3, 3, 3, 3, 3, 3]),
            ev('Awa Koné', 'Avant le programme', [3, 3, 3, 3, 3, 3, 3])];
  const p = calc(D).programme;
  assert.strictEqual(p.inscrits, 3);
  assert.strictEqual(p.doublons.length, 1);
});

test('les choix multiples de l\'ONG sont comptés séparément, du plus fréquent au moins fréquent', () => {
  const D = vide();
  D.ong = [{ handicap: 'Moteur, Visuel' }, { handicap: 'Moteur' }];
  assert.deepStrictEqual(calc(D).ong.handicap, [['Moteur', 2, 100], ['Visuel', 1, 50]]);
});
