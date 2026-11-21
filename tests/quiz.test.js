/* Contrôle des quiz d'entraînement (quiz-data.js). Lancer : node --test tests/quiz.test.js
   Ces tests empêchent les erreurs de saisie et les biais qui permettraient de deviner la réponse sans avoir lu le cours. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const QUIZ = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'quiz-data.js'), 'utf8') + ';QUIZ');
const modules = QUIZ.flatMap(a => a.modules.map(m => Object.assign({ axe: a.id }, m)));
const questions = modules.flatMap(m => m.questions.map(q => Object.assign({ module: m.id }, q)));

test('chaque module a un identifiant unique et au moins 8 questions', () => {
  const ids = modules.map(m => m.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  modules.forEach(m => assert.ok(m.questions.length >= 8, `${m.id} : ${m.questions.length} questions`));
});

test('chaque question est complète : énoncé, 1 bonne et 3 fausses réponses toutes différentes, explication, référence au cours', () => {
  questions.forEach(q => {
    const lieu = `${q.module} : « ${String(q.q).slice(0, 50)} »`;
    ['q', 'ok', 'e', 'ref'].forEach(k => assert.ok(typeof q[k] === 'string' && q[k].trim(), `${lieu} — champ « ${k} » vide`));
    assert.strictEqual(q.faux.length, 3, `${lieu} — il faut exactement 3 fausses réponses`);
    const toutes = [q.ok, ...q.faux].map(s => s.trim().toLowerCase());
    assert.strictEqual(new Set(toutes).size, 4, `${lieu} — deux réponses identiques`);
  });
});

test('les énoncés ne se répètent pas', () => {
  const qs = questions.map(q => q.q.trim().toLowerCase());
  assert.strictEqual(new Set(qs).size, qs.length);
});

test('vocabulaire du programme : jamais « Thème » ni « Acte », aucun marqueur technique', () => {
  const texte = JSON.stringify(QUIZ);
  assert.ok(!/Th[èe]me|\bActe\b|@@P:/i.test(texte));
});

test('la bonne réponse n\'est pas systématiquement la plus longue (sinon on la devine sans lire le cours)', () => {
  modules.forEach(m => {
    const plusLongue = m.questions.filter(q => q.ok.length > Math.max(...q.faux.map(f => f.length))).length;
    assert.ok(plusLongue / m.questions.length <= 0.5, `${m.id} : la bonne réponse est la plus longue dans ${plusLongue}/${m.questions.length} questions`);
  });
});
