/* Quiz d'entraînement — La Noblesse du Cœur.
   Choix du module, questions une à une avec correction immédiate, résultat final avec « à revoir ».
   Les questions sont dans quiz-data.js. Le meilleur score de chaque module reste dans le navigateur de l'élève (aucune donnée n'est envoyée). */
const SEUIL_QUIZ = 70;                       // % à partir duquel on félicite l'élève (simple encouragement : l'examen final n'a pas de seuil fixé)
const LETTRES = "ABCD";
const melanger = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const tousModules = () => QUIZ.flatMap(a => a.modules.map(m => ({ ...m, axe: a.titre })));
const sansMouvement = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function renderQuiz() {
  const m = tousModules().find(x => x.id === new URLSearchParams(location.search).get("m"));
  m ? jouerQuiz(m) : menuQuiz();
}

function menuQuiz() {
  document.title = "Quiz d'entraînement — La Noblesse du Cœur";
  const best = store.get("ndc_quiz", {}), mods = tousModules();
  const essayes = mods.filter(m => best[m.id] != null), moyenne = essayes.length ? Math.round(essayes.reduce((s, m) => s + best[m.id], 0) / essayes.length) : null;
  const kpi = (v, l) => `<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div></div>`;
  app().innerHTML = header() + BANDEAU("savane", `<span class="eyebrow" style="--k:0">Entraînement · sans note</span><h1>Quiz d'<em>entraînement</em></h1>
    <p class="lead" style="--k:1">Teste tes connaissances, module par module. La correction s'affiche après chaque question. Ces quiz sont un entraînement : ils ne comptent pas pour l'examen final.</p>`, true) + `
  <main id="contenu" tabindex="-1">
    <section class="bande court"><div class="wrap"><div class="kpis">${kpi(essayes.length + " / " + mods.length, "Modules essayés")}${kpi(moyenne == null ? "—" : moyenne + " %", "Score moyen (meilleurs essais)")}</div></div></section>
    ${QUIZ.map((a, i) => `<section class="etape bande${i % 2 ? " sable" : ""}"><div class="wrap"><div class="etape-tete"><div><h2>${esc(a.titre)}</h2></div></div><div class="liste">${a.modules.map(m => `
    <a class="item" href="quiz.html?m=${esc(m.id)}"><span class="vignette" style="--v:url(img/${a.id === "axe1" ? "basilique" : "plateau"}-thumb.webp)"></span>
      <span class="txt"><b>${esc(m.titre)}</b><span>${m.questions.length} questions${best[m.id] != null ? " · meilleur score : " + best[m.id] + " %" : " · pas encore essayé"}</span></span><span class="chev" aria-hidden="true"></span></a>`).join("")}</div></div></section>`).join("")}
  </main>` + FOOT;
  UIok();
}

function jouerQuiz(m) {
  document.title = m.titre + " — Quiz — La Noblesse du Cœur";
  // chaque partie : questions dans un ordre différent, et réponses mélangées (la bonne réponse change de place)
  const Q = melanger(m.questions).map(q => ({ ...q, o: melanger([{ t: q.ok, ok: true }, ...q.faux.map(t => ({ t, ok: false }))]) }));
  let i = 0, bon = 0; const ratees = [];
  app().innerHTML = header() + BANDEAU("savane", `<span class="eyebrow" style="--k:0">${esc(m.axe)}</span><h1>${esc(m.titre)}</h1>`, true) + `
  <div class="progression"><div class="wrap"><b>Question</b><span class="jauge" role="progressbar" aria-label="Avancement"><i></i></span><small id="pc"></small></div></div>
  <main class="wrap" id="contenu" tabindex="-1"><div id="zone"></div></main>` + FOOT;
  const zone = $("#zone");

  function question() {
    jauge(i / Q.length); $("#pc").textContent = (i + 1) + " / " + Q.length;
    const q = Q[i];
    zone.innerHTML = `<div class="bloc no-rv entre"><h2 tabindex="-1" id="enonce">${esc(q.q)}</h2><div class="qopts">${q.o.map((x, k) =>
      `<button type="button" class="qopt" data-k="${k}"><b>${LETTRES[k]}</b><span>${esc(x.t)}</span></button>`).join("")}</div><div id="fb" aria-live="polite"></div></div>`;
    zone.querySelectorAll(".qopt").forEach(b => b.onclick = () => repondre(+b.dataset.k));
    if (i > 0) { const e = $("#enonce"); e.focus({ preventScroll: true }); zone.scrollIntoView({ behavior: sansMouvement() ? "auto" : "smooth", block: "start" }); }   // la nouvelle question est annoncée et ramenée en vue
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
    $("#suite").focus({ preventScroll: true });
    $("#suite").scrollIntoView({ behavior: sansMouvement() ? "auto" : "smooth", block: "nearest" });
  }

  function resultat() {
    const pct = Math.round(bon / Q.length * 100), s = bon > 1 ? "s" : "", reussi = pct >= SEUIL_QUIZ;
    const best = store.get("ndc_quiz", {}), record = best[m.id] != null && pct > best[m.id];
    if (best[m.id] == null || pct > best[m.id]) { best[m.id] = pct; store.set("ndc_quiz", best); }
    jauge(1); $("#pc").textContent = "Terminé";
    // étincelles dorées autour de l'anneau quand le module est maîtrisé
    const etincelles = reussi ? Array.from({ length: 18 }, (_, n) => { const a = (n / 18) * 2 * Math.PI + Math.random() * .3, r = 78 + Math.random() * 46; return `<i class="etincelle" style="--k:${n};--dx:${Math.round(Math.cos(a) * r)}px;--dy:${Math.round(Math.sin(a) * r)}px"></i>`; }).join("") : "";
    zone.innerHTML = `<div class="bloc no-rv entre"><div class="ok centre">
      <div class="anneau" style="--p:${pct / 100}"><svg viewBox="0 0 132 132" aria-hidden="true"><circle class="piste" cx="66" cy="66" r="52"/><circle class="val" cx="66" cy="66" r="52"/></svg><b aria-hidden="true" id="pctn">${sansMouvement() ? pct + " %" : "0 %"}</b>${etincelles}</div>
      <h3 tabindex="-1" id="enonce">${bon} bonne${s} réponse${s} sur ${Q.length} (${pct} %)</h3>
      <p>${reussi ? "Bravo, tu maîtrises ce module." : "Relis le cours, puis réessaie : tu progresseras vite."}${record ? " C'est ton meilleur score." : ""}</p></div>
      ${ratees.length ? `<h2 style="margin-top:18px">À revoir</h2>${ratees.map(q => `<div class="rev"><b>${esc(q.q)}</b><p>Bonne réponse : ${esc(q.ok)}</p><small>Dans le cours : ${esc(q.ref)}</small></div>`).join("")}` : ""}
      <div class="actions" style="margin-top:16px"><a class="btn" href="quiz.html?m=${esc(m.id)}">Refaire ce quiz</a><a class="btn sec" href="quiz.html">Autres quiz</a></div></div>`;
    scrollTo({ top: 0, behavior: sansMouvement() ? "auto" : "smooth" });
    $("#enonce").focus({ preventScroll: true });
    // l'anneau se remplit, le pourcentage monte jusqu'à sa valeur
    const anneau = $(".anneau"); requestAnimationFrame(() => requestAnimationFrame(() => anneau.classList.add("go")));
    if (!sansMouvement()) {
      const debut = performance.now(), n = $("#pctn");
      const image = t => { const p = Math.min(1, (t - debut - 250) / 1100), e = 1 - Math.pow(1 - Math.max(p, 0), 3); n.textContent = Math.round(pct * e) + " %"; if (p < 1) requestAnimationFrame(image); };
      requestAnimationFrame(image);
    }
  }
  question();
  UIok();
}
