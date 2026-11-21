/* Quiz d'entraînement — La Noblesse du Cœur.
   Choix du module, questions une à une avec correction immédiate, résultat final avec « à revoir ».
   Les questions sont dans quiz-data.js. Le meilleur score de chaque module reste dans le navigateur de l'élève (aucune donnée n'est envoyée). */
const SEUIL_QUIZ = 70;                       // % de réussite à partir duquel on félicite (le même seuil que l'examen final)
const LETTRES = "ABCD";
const melanger = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const tousModules = () => QUIZ.flatMap(a => a.modules.map(m => ({ ...m, axe: a.titre })));

function renderQuiz() {
  const m = tousModules().find(x => x.id === new URLSearchParams(location.search).get("m"));
  m ? jouerQuiz(m) : menuQuiz();
}

function menuQuiz() {
  document.title = "Quiz d'entraînement — La Noblesse du Cœur";
  const best = store.get("ndc_quiz", {});
  document.body.innerHTML = header() + `<section class="ouverture court" style="background-image:url(img/savane.jpg)"><div class="wrap"><h1>Quiz d'entraînement</h1>
    <p>Teste tes connaissances, module par module. La correction s'affiche après chaque question. Ces quiz sont un entraînement : ils ne comptent pas pour l'examen final.</p></div></section>
  <main class="wrap">${QUIZ.map(a => `<section class="etape"><div class="etape-tete"><div><h2>${esc(a.titre)}</h2></div></div><div class="liste">${a.modules.map(m => `
    <a class="item" href="quiz.html?m=${esc(m.id)}"><span class="vignette" style="background-image:url(img/basilique.jpg)"></span>
      <span class="txt"><b>${esc(m.titre)}</b><span>${m.questions.length} questions${best[m.id] != null ? " · meilleur score : " + best[m.id] + " %" : ""}</span></span><span class="chev" aria-hidden="true"></span></a>`).join("")}</div></section>`).join("")}
  </main>` + FOOT;
}

function jouerQuiz(m) {
  document.title = m.titre + " — Quiz — La Noblesse du Cœur";
  // chaque partie : questions dans un ordre différent, et réponses mélangées (la bonne réponse change de place)
  const Q = melanger(m.questions).map(q => ({ ...q, o: melanger([{ t: q.ok, ok: true }, ...q.faux.map(t => ({ t, ok: false }))]) }));
  let i = 0, bon = 0; const ratees = [];
  document.body.innerHTML = header() + `<section class="ouverture court" style="background-image:url(img/savane.jpg)"><div class="wrap"><h1>${esc(m.titre)}</h1><p>${esc(m.axe)}</p></div></section>
  <div class="progression"><div class="wrap"><b>Question</b><span class="jauge" role="progressbar" aria-label="Avancement"><i></i></span><small id="pc"></small></div></div>
  <main class="wrap"><div id="zone"></div></main>` + FOOT;
  const zone = $("#zone");

  function question() {
    $(".jauge i").style.width = Math.round(i / Q.length * 100) + "%"; $("#pc").textContent = (i + 1) + " / " + Q.length;
    const q = Q[i];
    zone.innerHTML = `<div class="bloc"><h2>${esc(q.q)}</h2><div class="qopts">${q.o.map((x, k) =>
      `<button type="button" class="qopt" data-k="${k}"><b>${LETTRES[k]}</b><span>${esc(x.t)}</span></button>`).join("")}</div><div id="fb" aria-live="polite"></div></div>`;
    zone.querySelectorAll(".qopt").forEach(b => b.onclick = () => repondre(+b.dataset.k));
  }

  function repondre(k) {
    const q = Q[i], juste = q.o[k].ok;
    zone.querySelectorAll(".qopt").forEach((b, j) => {
      b.disabled = true;
      if (q.o[j].ok) { b.classList.add("bon"); b.insertAdjacentHTML("beforeend", '<i class="tag">Bonne réponse</i>'); }
      else if (j === k) { b.classList.add("faux"); b.insertAdjacentHTML("beforeend", '<i class="tag">Ta réponse</i>'); }
    });
    if (juste) bon++; else ratees.push(q);
    const dernier = i === Q.length - 1;
    $("#fb").innerHTML = `<div class="${juste ? "ok" : "note"} qfb"><h3>${juste ? "Bonne réponse" : "Pas tout à fait"}</h3><p>${esc(q.e)}</p><small>Dans le cours : ${esc(q.ref)}</small></div>
      <div class="actions"><button type="button" class="btn" id="suite">${dernier ? "Voir mon résultat" : "Question suivante"}</button></div>`;
    $("#suite").onclick = () => { i++; i < Q.length ? question() : resultat(); };
    $("#suite").focus();
  }

  function resultat() {
    const pct = Math.round(bon / Q.length * 100), s = bon > 1 ? "s" : "";
    const best = store.get("ndc_quiz", {}); if (best[m.id] == null || pct > best[m.id]) { best[m.id] = pct; store.set("ndc_quiz", best); }
    $(".jauge i").style.width = "100%"; $("#pc").textContent = "Terminé";
    zone.innerHTML = `<div class="bloc"><div class="ok"><h3>${bon} bonne${s} réponse${s} sur ${Q.length} (${pct} %)</h3>
      <p>${pct >= SEUIL_QUIZ ? "Bravo, tu maîtrises ce module." : "Relis le cours, puis réessaie : tu progresseras vite."}</p></div>
      ${ratees.length ? `<h2 style="margin-top:18px">À revoir</h2>${ratees.map(q => `<div class="rev"><b>${esc(q.q)}</b><p>Bonne réponse : ${esc(q.ok)}</p><small>Dans le cours : ${esc(q.ref)}</small></div>`).join("")}` : ""}
      <div class="actions" style="margin-top:16px"><a class="btn" href="quiz.html?m=${esc(m.id)}">Refaire ce quiz</a><a class="btn sec" href="quiz.html">Autres quiz</a></div></div>`;
    scrollTo({ top: 0, behavior: "smooth" });
  }
  question();
}
