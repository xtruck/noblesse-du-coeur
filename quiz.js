/* Quiz d'entraînement — La Noblesse du Cœur (mode application).
   Menu : progression, « Continuer », modules en cartes. Jeu : une question à la fois, plein écran, correction expliquée.
   Résultat : anneau, bilan, « à revoir ». Les questions sont dans quiz-data.js ; les aides communes (bilanQuiz, anneau…) dans app.js.
   Le meilleur score de chaque module reste dans le navigateur, et chaque essai est aussi envoyé à l'équipe (voir envoyerScore). */

/* Les quiz sont réservés aux personnes inscrites dont le profil y donne accès (voir acces() dans app.js). */
function renderQuiz() {
  const pr = profil();
  if (!pr) { location.replace("commencer.html"); return; }
  if (!acces(pr).quiz) { location.replace("espace.html"); return; }
  const m = tousModules().find(x => x.id === new URLSearchParams(location.search).get("m"));
  m ? jouerQuiz(m) : menuQuiz();
}

function menuQuiz() {
  document.title = "Quiz d'entraînement — La Noblesse du Cœur";
  const B = bilanQuiz(), axes = QUIZ;
  const carte = (m, i) => {
    const e = etatModule(B.best, m), s = B.best[m.id];
    return `<a class="mcarte etat-${e}" data-axe="${esc(m.axeId)}" href="quiz.html?m=${esc(m.id)}" style="--k:${i}"><span class="mnum">${i + 1}</span>
      <div class="mcorps"><h3>${esc(m.titre.replace(/^Module \d+ · /, ""))}</h3><p class="mmeta">${m.questions.length} questions · environ ${minutes(m)} min</p>
      <div class="mbar" aria-hidden="true"><i style="--w:${(s || 0) / 100}"></i></div></div>
      <span class="mpuce">${LIBELLE_ETAT[e]}${s != null ? " · " + s + " %" : ""}</span></a>`;
  };
  const sec = a => { const mods = B.mods.filter(m => m.axeId === a.id); return `<section class="axe" data-axe="${esc(a.id)}"><h2 class="axe-t">${esc(a.titre)}<small>${mods.filter(m => etatModule(B.best, m) === "maitrise").length} / ${mods.length} maîtrisés</small></h2><div class="mgrille">${mods.map((m, n) => carte(m, n)).join("")}</div></section>`; };
  app().innerHTML = header() + `
  <section class="qtete"><div class="wrap qtete-in"><div class="qtete-txt"><span class="eyebrow">Quiz d'entraînement</span><h1>Teste tes <em>connaissances</em></h1>
    <p>La correction s'affiche après chaque question. Ces quiz ne comptent pas pour l'examen final, mais ton score est transmis à l'équipe pour suivre ta progression.</p>
    ${B.suivant ? `<a class="btn or" href="quiz.html?m=${esc(B.suivant.id)}">${B.essayes.length ? "Continuer" : "Commencer"} : ${esc(B.suivant.titre.replace(/^Module \d+ · /, ""))}</a>` : '<p class="felic">Tous les modules sont maîtrisés. Bravo !</p>'}</div>
    <div class="qtete-anneau">${anneau(B.pct, Math.round(B.pct * 100) + " %", "petit")}<small>progression</small></div></div>
    <div class="wrap puces">${puce(B.essayes.length + " / " + B.total, "modules essayés")}${puce(B.maitrises.length, "maîtrisés (" + SEUIL_QUIZ + " % et plus)")}${puce(B.moyenne == null ? "—" : B.moyenne + " %", "score moyen")}</div></section>
  <main class="wrap" id="contenu" tabindex="-1">
    <div class="segment" role="group" aria-label="Filtrer par axe"><button type="button" aria-pressed="true" data-f="">Tous</button>${axes.map(a => `<button type="button" aria-pressed="false" data-f="${esc(a.id)}">${esc(a.titre.split(" · ")[0])}</button>`).join("")}</div>
    ${axes.map(sec).join("")}</main>` + FOOT;
  document.querySelectorAll(".segment button").forEach(b => b.onclick = () => {
    document.querySelectorAll(".segment button").forEach(x => x.setAttribute("aria-pressed", x === b));
    document.querySelectorAll(".axe").forEach(s => { s.hidden = !!b.dataset.f && s.dataset.axe !== b.dataset.f; });
  });
  allumerAnneaux();
  UIok();
}

/* Envoie le score à l'équipe (une ligne par essai). Si le réseau manque, le quiz reste utilisable : l'envoi est simplement signalé. */
async function envoyerScore(m, bon, total, pct) {
  const pr = profil(), zone = document.getElementById("envoi-etat");
  if (!pr || notConfigured()) { if (zone) zone.textContent = "Mode démonstration : score gardé sur cet appareil."; return; }
  const id = pr.type === "eleve" ? { etablissement: pr.etab, nom: pr.nom, prenom: pr.prenom, classe: pr.classe } : { nom: pr.nom, tel: pr.tel };
  const res = await appelApi({ form: "quiz", profil: pr.type, ...id, module: m.id, titre: m.titre, score: bon, total, pct });
  const z = document.getElementById("envoi-etat"); if (!z) return;
  z.className = "envoi-etat " + (res.ok ? "envoi-bon" : "envoi-mal");
  z.textContent = res.ok ? "Résultat transmis à l'équipe." : "Résultat non transmis (réseau). Ton score reste noté sur cet appareil.";
}

function jouerQuiz(m) {
  document.title = m.titre + " — Quiz — La Noblesse du Cœur";
  // chaque partie : questions dans un ordre différent, et réponses mélangées (la bonne réponse change de place)
  const Q = melanger(m.questions).map(q => ({ ...q, o: melanger([{ t: q.ok, ok: true }, ...q.faux.map(t => ({ t, ok: false }))]) }));
  let i = 0, bon = 0, serie = 0, repondu = false; const ratees = [], debut = performance.now(), etats = Q.map(() => "");
  app().innerHTML = `<a class="saut" href="#contenu">Aller à la question</a><div class="qjeu">
    <header class="qbar"><a class="qx" href="quiz.html" aria-label="Quitter le quiz"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></a>
      <div class="qtitre"><b>${esc(m.titre.replace(/^Module \d+ · /, ""))}</b><span>${esc(m.axe)}</span></div><div class="qscore" title="Bonnes réponses"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg><b id="qb">0</b></div></header>
    <div class="segs" role="progressbar" aria-label="Avancement" aria-valuemin="1" aria-valuemax="${Q.length}" aria-valuenow="1">${Q.map(() => "<i></i>").join("")}</div>
    <main id="contenu" tabindex="-1"><div id="zone"></div></main></div>`;
  const zone = $("#zone"), segs = [...document.querySelectorAll(".segs i")];
  const maj = () => { segs.forEach((s, k) => { s.className = etats[k] + (k === i && !etats[k] ? " now" : ""); }); $(".segs").setAttribute("aria-valuenow", i + 1); };

  function question() {
    repondu = false; maj();
    const q = Q[i];
    zone.innerHTML = `<div class="qcarte entre"><p class="qnum">Question ${i + 1} sur ${Q.length}</p><h2 tabindex="-1" id="enonce">${esc(q.q)}</h2><div class="qopts">${q.o.map((x, k) =>
      `<button type="button" class="qopt" data-k="${k}" aria-keyshortcuts="${LETTRES[k]} ${k + 1}"><b>${LETTRES[k]}</b><span>${esc(x.t)}</span></button>`).join("")}</div>
      <p class="astuce-clavier">Clavier : touches A, B, C, D (ou 1 à 4), puis Entrée.</p><div id="fb" aria-live="polite"></div></div>`;
    zone.querySelectorAll(".qopt").forEach(b => b.onclick = () => repondre(+b.dataset.k));
    if (i > 0) { $("#enonce").focus({ preventScroll: true }); scrollTo({ top: 0, behavior: sansMouvement() ? "auto" : "smooth" }); }
  }

  function repondre(k) {
    if (repondu) return; repondu = true;
    const q = Q[i], juste = q.o[k].ok;
    zone.querySelectorAll(".qopt").forEach((b, j) => {
      b.disabled = true;
      if (q.o[j].ok) { b.classList.add("bon"); b.insertAdjacentHTML("beforeend", '<i class="tag">Bonne réponse</i>'); }
      else if (j === k) { b.classList.add("faux"); b.insertAdjacentHTML("beforeend", '<i class="tag">Ta réponse</i>'); }
    });
    if (juste) { bon++; serie++; $("#qb").textContent = bon; } else { ratees.push(q); serie = 0; }
    etats[i] = juste ? "s-ok" : "s-ko"; maj();
    const dernier = i === Q.length - 1;
    $("#fb").innerHTML = `<div class="qfeed ${juste ? "bon" : "mal"}"><div class="qfeed-t"><span class="ico" aria-hidden="true">${juste ? "✓" : "i"}</span><h3>${juste ? (serie >= 3 ? "Bonne réponse · série de " + serie : "Bonne réponse") : "Pas tout à fait"}</h3></div>
      <p>${esc(q.e)}</p><small>Dans le cours : ${esc(q.ref)}</small>
      <button type="button" class="btn ${juste ? "" : "or"}" id="suite">${dernier ? "Voir mon résultat" : "Question suivante"}</button></div>`;
    $("#suite").onclick = suite;
    $("#suite").focus({ preventScroll: true });
    $("#suite").scrollIntoView({ behavior: sansMouvement() ? "auto" : "smooth", block: "nearest" });
  }
  const suite = () => { i++; i < Q.length ? question() : resultat(); };

  /* clavier : A-D ou 1-4 choisissent une réponse ; Entrée passe à la suite */
  const touche = e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = "abcd1234".indexOf(e.key.toLowerCase());
    if (k >= 0 && !repondu && $(".qopt")) { const b = zone.querySelectorAll(".qopt")[k % 4]; if (b) { e.preventDefault(); b.click(); } }
    else if (e.key === "Enter" && repondu && $("#suite") && document.activeElement !== $("#suite")) { e.preventDefault(); $("#suite").click(); }
  };
  document.addEventListener("keydown", touche);

  function resultat() {
    document.removeEventListener("keydown", touche);
    const pct = Math.round(bon / Q.length * 100), s = bon > 1 ? "s" : "", reussi = pct >= SEUIL_QUIZ, sec = Math.round((performance.now() - debut) / 1000);
    const best = store.get("ndc_quiz", {}), record = best[m.id] != null && pct > best[m.id];
    if (best[m.id] == null || pct > best[m.id]) { best[m.id] = pct; store.set("ndc_quiz", best); }
    envoyerScore(m, bon, Q.length, pct);
    const mods = tousModules(), B = bilanQuiz(), suivant = B.suivant && B.suivant.id !== m.id ? B.suivant : mods[mods.findIndex(x => x.id === m.id) + 1];
    const titre = pct >= 90 ? "Excellent !" : reussi ? "Module maîtrisé" : pct >= 50 ? "Bien parti" : "On s'accroche";
    const mot = reussi ? "Tu maîtrises ce module." : "Relis le cours, puis réessaie : tu progresseras vite.";
    const etincelles = reussi && !sansMouvement() ? Array.from({ length: 20 }, (_, n) => { const a = (n / 20) * 2 * Math.PI + Math.random() * .3, r = 90 + Math.random() * 60; return `<i class="etincelle" style="--k:${n};--dx:${Math.round(Math.cos(a) * r)}px;--dy:${Math.round(Math.sin(a) * r)}px"></i>`; }).join("") : "";
    etats.fill(""); segs.forEach((x, k) => { x.className = Q[k] && ratees.includes(Q[k]) ? "s-ko" : "s-ok"; });
    $(".qscore").hidden = true;
    zone.innerHTML = `<div class="qres entre"><div class="anneau-grand">${anneau(pct / 100, sansMouvement() ? pct + " %" : "0 %", "grand")}${etincelles}</div>
      <h2 tabindex="-1" id="enonce">${titre}</h2><p class="qres-mot">${bon} bonne${s} réponse${s} sur ${Q.length}. ${mot}${record ? " C'est ton meilleur score." : ""}</p>
      <div class="puces centre">${puce(bon, "bonnes")}${puce(Q.length - bon, "à revoir")}${puce(Math.floor(sec / 60) + " min " + String(sec % 60).padStart(2, "0"), "durée")}</div>
      <p class="envoi-etat" id="envoi-etat" role="status">Envoi du résultat…</p>
      <div class="actions centre">${suivant ? `<a class="btn or" href="quiz.html?m=${esc(suivant.id)}">Module suivant</a>` : ""}<a class="btn ${suivant ? "sec" : ""}" href="quiz.html?m=${esc(m.id)}">Refaire ce quiz</a><a class="btn sec" href="quiz.html">Tous les quiz</a></div>
      ${ratees.length ? `<h3 class="revoir-t">À revoir (${ratees.length})</h3><div class="revoir">${ratees.map(q => `<details class="rev"><summary>${esc(q.q)}</summary><p><b>Bonne réponse :</b> ${esc(q.ok)}</p><p>${esc(q.e)}</p><small>Dans le cours : ${esc(q.ref)}</small></details>`).join("")}</div>` : '<p class="felic">Aucune erreur : sans faute.</p>'}</div>`;
    scrollTo({ top: 0, behavior: sansMouvement() ? "auto" : "smooth" });
    $("#enonce").focus({ preventScroll: true });
    allumerAnneaux();
    if (!sansMouvement()) {   // le pourcentage monte jusqu'à sa valeur pendant que l'anneau se remplit
      const t0 = performance.now(), n = $(".anneau b");
      const image = t => { const p = Math.min(1, (t - t0 - 250) / 1100), e = 1 - Math.pow(1 - Math.max(p, 0), 3); n.textContent = Math.round(pct * e) + " %"; if (p < 1) requestAnimationFrame(image); };
      requestAnimationFrame(image);
    }
  }
  question();
  UIok();
}
