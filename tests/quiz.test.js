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

/* ---- tirage des questions de chaque essai (tirerQuestions, dans app.js) ---- */
const tirer = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').match(/function tirerQuestions[\s\S]*?\n\}\n/)[0] + ';tirerQuestions');

test("un essai pose 5 questions différentes, tirées dans la réserve du module", () => {
  const t = tirer(10, 5, [], []);
  assert.strictEqual(t.length, 5); assert.strictEqual(new Set(t).size, 5);
  assert.ok(t.every(i => i >= 0 && i < 10));
  assert.strictEqual(tirer(3, 5, [], []).length, 3, 'une réserve plus petite que 5 est posée en entier');
});

test("l'essai suivant n'est jamais une copie du précédent : on prend d'abord les questions pas encore vues", () => {
  modules.forEach(m => {
    const total = m.questions.length;
    for (let essai = 0; essai < 30; essai++) {
      const premier = tirer(total, 5, [], []);
      const second = tirer(total, 5, premier, premier.slice(0, 2));
      const communes = second.filter(i => premier.includes(i)).length;
      assert.ok(communes <= Math.max(0, 5 - (total - 5)), `${m.id} : ${communes} questions identiques alors qu'il y en avait ${total - 5} nouvelles à poser`);
      assert.ok(second.length === 5 && new Set(second).size === 5);
    }
  });
});

test("si la réserve manque de nouvelles questions, on repose d'abord celles qui avaient été ratées", () => {
  const second = tirer(7, 5, [0, 1, 2, 3, 4], [3, 4]);             // 2 nouvelles (5 et 6) ; il en faut 3 de plus parmi les anciennes
  assert.ok(second.includes(5) && second.includes(6), 'les nouvelles sont posées');
  assert.ok(second.includes(3) && second.includes(4), 'les ratées reviennent en premier');
  assert.strictEqual(second.length, 5);
});

test("chaque module a de quoi varier les essais : au moins 8 questions pour en poser 5", () => {
  modules.forEach(m => assert.ok(m.questions.length >= 8, m.id));
});
