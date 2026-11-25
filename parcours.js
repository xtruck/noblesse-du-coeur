/* Parcours éducatif — La Noblesse du Cœur.
   parcours.html?a=axe1 : un axe, ses modules étape par étape.   parcours.html?m=a1m2 : un module = le cours, puis son auto-évaluation.
   Les questions sont dans quiz-data.js ; les aides communes (bilanQuiz, anneau, IMG_MODULE…) dans app.js.
   Le meilleur score de chaque module reste dans le navigateur, et chaque essai est aussi envoyé à l'équipe (voir envoyerScore). */

/* Tout inscrit peut suivre le parcours ; sans inscription, on est renvoyé vers l'inscription. */
function renderParcours() {
  if (!profil()) { location.replace("commencer.html"); return; }
  const q = new URLSearchParams(location.search), m = tousModules().find(x => x.id === q.get("m")), a = q.get("a");
  if (m) parcoursModule(m);
  else if (typeof QUIZ !== "undefined" && QUIZ.some(x => x.id === a)) pageAxe(a);
  else location.replace("espace.html");
}

/* Page d'un axe : ses modules en étapes numérotées, puis l'examen final de l'axe */
function pageAxe(id) {
  const axe = QUIZ.find(x => x.id === id), B = bilanQuiz(), mods = B.mods.filter(m => m.axeId === id), num = id === "axe2" ? 2 : 1;
  const [nom, titre] = axe.titre.split(" · "), faits = mods.filter(m => moduleValide(B.best, m)), suivant = mods.find(m => !moduleValide(B.best, m)) || null;
  const EPa = axeProgres(id), pret = EPa.pret, reste = EPa.restants.length, ok = examenReussi(num), dejaExamen = !!examenFait(num), peutExamen = !!(profil() && acces(profil()).examen);
  document.title = axe.titre + " — La Noblesse du Cœur";
  const etape = (m, n) => {
    const e = etatModule(B.best, m), s = B.best[m.id], img = (IMG_MODULE[m.id] || {}).c, verrou = n > 0 && !moduleValide(B.best, mods[n - 1]);
    const corps = `<span class="num-axe">${n + 1}</span>${img ? `<img class="mini-affiche" src="img/${img}.webp" width="60" height="90" loading="lazy" alt="">` : ""}
      <span class="txt-axe"><b>${esc(m.titre.replace(/^Module \d+ · /, ""))}</b><span>${verrou ? "Valide d'abord le module précédent (" + SEUIL_QUIZ + " % minimum)" : m.reflexion ? "Le cours, l'auto-évaluation (" + NB_QUESTIONS_QUIZ + " questions) et ta réflexion" : "Module " + (n + 1) + " · le cours, puis l'auto-évaluation (" + NB_QUESTIONS_QUIZ + " questions)"}</span></span>
      <span class="mpuce">${verrou ? "Verrouillé" : s == null ? "À suivre" : (e === "maitrise" ? "Validé · " : "À refaire · ") + s + " %"}</span>`;
    return verrou ? `<li><span class="etape-axe etat-verrou" style="--k:${n}">${corps}</span></li>` : `<li><a class="etape-axe etat-${e}" href="parcours.html?m=${esc(m.id)}" style="--k:${n}">${corps}</a></li>`;
  };
  app().innerHTML = header() + `
  <section class="qtete"><div class="wrap qtete-in"><div class="qtete-txt"><span class="eyebrow">${esc(nom)}</span><h1>${titreHtml(num === 1 ? "L'art de la *paix*" : "L'art de l'*impact*")}</h1>
    <p>${mods.length} modules à suivre dans l'ordre. Pour chacun : le cours, puis une auto-évaluation corrigée (${SEUIL_QUIZ} % pour passer au module suivant). Quand tous les modules sont validés, tu passes l'examen final de l'axe.</p>
    ${suivant ? `<a class="btn or" href="parcours.html?m=${esc(suivant.id)}">${faits.length ? "Continuer" : "Commencer"} : module ${mods.indexOf(suivant) + 1}</a>` : (!peutExamen ? `<a class="btn or" href="${num === 1 ? "parcours.html?a=axe2" : "espace.html"}">${num === 1 ? "Passer à l'Axe 2" : "Retour à mon espace"}</a>` : !ok ? `<a class="btn or" href="examen.html?axe=${num}">Passer à l'examen final de l'Axe ${num}</a>` : num === 1 ? `<a class="btn or" href="parcours.html?a=axe2">Passer à l'Axe 2</a>` : examensReussis() ? `<a class="btn or" href="certificat.html?moi=1">Mon certificat</a>` : `<a class="btn or" href="examen.html?axe=1">Passer l'examen de l'Axe 1</a>`)}</div>
    <div class="qtete-anneau">${anneau(mods.length ? faits.length / mods.length : 0, faits.length + " / " + mods.length, "petit")}<small>modules validés</small></div></div></section>
  <main class="wrap" id="contenu" tabindex="-1">
    <h2 class="sec">Les modules, étape par étape</h2>
    <ol class="axe-etapes">${(() => { let der = ""; return mods.map((m, n) => { const t = m.partie && m.partie !== der ? `<li class="partie-t">${esc(m.partie)}</li>` : ""; der = m.partie || der; return t + etape(m, n); }).join(""); })()}</ol>
    ${peutExamen ? `<div class="axe-examen"><div><span class="cont-eyebrow">Étape finale</span><h3>Examen final · ${esc(nom)}</h3><p>${ok ? "Réussi : " + virgule(examenFait(num).pct) + " %. " + (num === 1 ? "Tu peux passer à l'Axe 2." : examensReussis() ? "Ton certificat t'attend." : "Il te reste l'examen de l'Axe 1 pour obtenir le certificat.") : pret ? "Tous les modules sont validés : " + NB_QUESTIONS_EXAMEN + " questions, " + SEUIL_EXAMEN + " % pour réussir, que tu peux repasser autant de fois que tu veux (la meilleure note est gardée)." : "Il s'ouvre quand tous les modules de l'axe sont validés (" + SEUIL_QUIZ + " % chacun) : il en reste " + reste + "."}</p></div>
      <a class="btn ${pret && !ok ? "or" : "sec"}" href="examen.html?axe=${num}">${dejaExamen ? "Repasser l'examen" : pret ? "Passer l'examen" : "Voir ce qui reste"}</a></div>` : ""}
    <div class="actions" style="margin-top:22px"><a class="btn sec" href="espace.html">Retour à mon espace</a><a class="btn sec" href="bibliotheque.html">Bibliothèque (cours, guides, fiches)</a></div></main>` + FOOT;
  allumerAnneaux();
  UIok();
}

/* Envoie le score à l'équipe (une ligne par essai). Si le réseau manque, le quiz reste utilisable : l'envoi est simplement signalé. */
async function envoyerScore(m, bon, total, pct) {
  const pr = profil(), zone = document.getElementById("envoi-etat");
  if (!pr || notConfigured()) { if (zone) zone.textContent = "Mode démonstration : score gardé sur cet appareil."; return; }
  const id = pr.type === "eleve" ? { etablissement: pr.etab, nom: pr.nom, prenom: pr.prenom, classe: pr.classe, numero: pr.numero || "" } : { nom: pr.nom, prenom: pr.prenom || "", ville: pr.ville || "", numero: pr.numero || "" };
  const res = await appelApi({ form: "quiz", profil: pr.type, ...id, module: m.id, titre: m.titre, score: bon, total, pct });
  const z = document.getElementById("envoi-etat"); if (!z) return;
  z.className = "envoi-etat " + (res.ok ? "envoi-bon" : "envoi-mal");
  z.textContent = res.ok ? "Résultat transmis à l'équipe." : "Résultat non transmis (réseau). Ton score reste noté sur cet appareil.";
}

/* Un module = le cours (affiche, PDF, fiche) PUIS son auto-évaluation, dans la même page : les deux ne se séparent pas.
   Le bouton de l'auto-évaluation s'ouvre quand le cours a été ouvert (ou si le module a déjà été suivi). */
function parcoursModule(m) {
  document.title = m.titre + " — Cours et auto-évaluation — La Noblesse du Cœur";
  const mods = tousModules().filter(x => x.axeId === m.axeId), rang = mods.findIndex(x => x.id === m.id) + 1, vu = store.get("ndc_parcours", {});
  const img = IMG_MODULE[m.id] || {}, cours = coursModule(m), court = m.titre.replace(/^Module \d+ · /, "");
  const best = store.get("ndc_quiz", {})[m.id], prec = mods[rang - 2];
  if (prec && !moduleValide(store.get("ndc_quiz", {}) || {}, prec)) {            // un module ne s'ouvre que lorsque le précédent est validé
    app().innerHTML = header() + `<section class="qtete"><div class="wrap qtete-in"><div class="qtete-txt"><span class="eyebrow">${esc(m.axe)}</span><h1>Module <em>verrouillé</em></h1></div></div></section>
      <main class="wrap" id="contenu" tabindex="-1"><div class="bloc no-rv entre"><p class="lead-b">Pour ouvrir « ${esc(court)} », valide d'abord « ${esc(prec.titre.replace(/^Module \d+ · /, ""))} » avec au moins ${SEUIL_QUIZ} % à son auto-évaluation.</p>
      <div class="actions"><a class="btn or" href="parcours.html?m=${esc(prec.id)}">Aller au module précédent</a><a class="btn sec" href="parcours.html?a=${esc(m.axeId)}">Retour à l'axe</a></div></div></main>` + FOOT;
    UIok(); return;
  }
  app().innerHTML = `<a class="saut" href="#contenu">Aller au parcours</a><div class="qjeu">
    <header class="qbar"><a class="qx" href="parcours.html?a=${esc(m.axeId)}" aria-label="Retour à l'axe"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></a>
      <div class="qtitre"><b>${esc(court)}</b><span>${esc(m.axe)} · ${m.partie ? esc(m.partie.split(" : ")[0]) : "module " + rang + " sur " + mods.length}</span></div></header>
    <main id="contenu" tabindex="-1" class="parcours-page"><div class="parcours entre">
      <figure class="affiche">${img.c ? `<img src="img/${img.c}.webp" width="640" height="960" alt="Affiche du module : ${esc(court)}">` : ""}
        <figcaption><a class="btn sec petit" href="parcours.html?a=${esc(m.axeId)}">Retour à l'${esc(m.axe.split(" · ")[0])}</a></figcaption></figure>
      <div class="parcours-corps"><p class="qnum">Cours et auto-évaluation</p><h1>${esc(court)}</h1>
        <p class="parcours-sous">${esc(m.axe)} · ${m.partie ? esc(m.partie.split(" : ")[0]) : "module " + rang + " sur " + mods.length}${best != null ? " · meilleur score : " + best + " %" : ""}</p>
        <ol class="chemin">
          <li class="${vu[m.id] ? "fait" : ""}" id="e-cours"><span class="pastille">1</span><div><b>Lis le cours</b><span>${img.doc ? "Le document « Préserver sa vie » s'ouvre en PDF. Lis-le en entier avant l'auto-évaluation." : `Le cours de l'${esc(m.axe.split(" · ")[0])} s'ouvre en PDF. Repère le ${esc(m.titre.split(" · ")[0].toLowerCase())}.`}</span>
            <a class="btn sec petit" id="ouvrir-cours" href="pdf/cours/${cours[0]}.pdf" target="_blank" rel="noopener">Ouvrir le cours (PDF, ${cours[3]})<span class="sr-seul"> (nouvel onglet)</span></a></div></li>
          ${img.f ? `<li><span class="pastille">2</span><div><b>Consulte la fiche du module</b><span>L'essentiel en images : objectifs, points clés, actions pratiques.</span></div></li>` : ""}
          <li><span class="pastille">${img.f ? 3 : 2}</span><div><button type="button" class="btn or petit" id="aller" aria-describedby="aide-aller" ${vu[m.id] ? "" : "disabled"}>Commencer l'auto-évaluation</button>
            <span class="info-eval">${NB_QUESTIONS_QUIZ} questions · ta note et la correction s'affichent à la fin ; il faut ${SEUIL_QUIZ} % pour passer au module suivant. <em id="aide-aller">${vu[m.id] ? "" : "Ouvre d'abord le cours (étape 1)."}</em></span></div></li></ol>
        ${img.f ? `<div class="fiches" aria-label="Fiche du module">${img.f.map((f, k) => `<a href="img/${f}.webp" target="_blank" rel="noopener"><img src="img/${f}.webp" width="720" height="1080" loading="lazy" alt="Fiche du module, page ${k + 1}"></a>`).join("")}</div>` : ""}
      </div></div></main></div>`;
  const aller = $("#aller"), debloquer = () => { const v = store.get("ndc_parcours", {}); v[m.id] = Date.now(); store.set("ndc_parcours", v); aller.disabled = false; $("#aide-aller").textContent = ""; $("#e-cours").classList.add("fait"); };
  $("#ouvrir-cours").addEventListener("click", debloquer);
  aller.onclick = () => { scrollTo(0, 0); jouerQuestions(m); };   // même page : le cours et l'auto-évaluation ne se séparent pas
  UIok();
}

/* Auto-évaluation d'un module = un petit examen : on répond d'abord à TOUTES les questions, puis on voit sa note, puis la correction de chaque question.
   Il faut SEUIL_QUIZ % pour valider le module. À chaque essai, les questions changent (voir tirerQuestions). */
function jouerQuestions(m) {
  document.title = m.titre + " — Auto-évaluation — La Noblesse du Cœur";
  const memoire = store.get("ndc_quiz_dernier", {}) || {}, dernier = memoire[m.id] || {};
  const Q = tirerQuestions(m.questions.length, NB_QUESTIONS_QUIZ, dernier.q, dernier.r)
    .map(idx => { const q = m.questions[idx]; return { ...q, idx, o: melanger([{ t: q.ok, ok: true }, ...q.faux.map(t => ({ t, ok: false }))]) }; });   // réponses mélangées : la bonne change de place
  const rep = {}; let i = 0; const debut = performance.now();
  app().innerHTML = `<a class="saut" href="#contenu">Aller à la question</a><div class="qjeu">
    <header class="qbar"><a class="qx" href="parcours.html?m=${esc(m.id)}" aria-label="Quitter l'auto-évaluation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></a>
      <div class="qtitre"><b>${esc(m.titre.replace(/^Module \d+ · /, ""))}</b><span>Auto-évaluation · ${esc(m.axe)}</span></div></header>
    <div class="segs" role="progressbar" aria-label="Avancement" aria-valuemin="1" aria-valuemax="${Q.length}" aria-valuenow="1" aria-valuetext="Question 1 sur ${Q.length}">${Q.map(() => '<i aria-hidden="true"></i>').join("")}</div>
    <main id="contenu" tabindex="-1"><div id="zone"></div></main></div>`;
  const zone = $("#zone"), segs = [...document.querySelectorAll(".segs i")];
  const maj = () => { segs.forEach((s, k) => { s.className = (rep[k] !== undefined ? "rep" : "") + (k === i ? " now" : ""); }); $(".segs").setAttribute("aria-valuenow", Math.min(i + 1, Q.length)); $(".segs").setAttribute("aria-valuetext", i < Q.length ? "Question " + (i + 1) + " sur " + Q.length : "Relecture"); };

  function question() {
    maj();
    const q = Q[i];
    zone.innerHTML = `<div class="qcarte entre"><p class="qnum">Question ${i + 1} sur ${Q.length}</p><h2 tabindex="-1" id="enonce"><span class="sr-seul">Question ${i + 1} sur ${Q.length} : </span>${esc(q.q)}</h2><div class="qopts">${q.o.map((x, k) =>
      `<button type="button" class="qopt${rep[i] === k ? " choisi" : ""}" data-k="${k}" aria-pressed="${rep[i] === k}" aria-keyshortcuts="${LETTRES[k]} ${k + 1}"><b>${LETTRES[k]}</b><span>${esc(x.t)}</span></button>`).join("")}</div>
      <p class="astuce-clavier">Pas de correction maintenant : tu la verras à la fin, avec ta note. Clavier : touches A, B, C, D (ou 1 à 4), puis Entrée.</p>
      <div class="actions">${i > 0 ? '<button type="button" class="btn sec" id="prec">Précédente</button>' : ""}<button type="button" class="btn ${rep[i] === undefined ? "sec" : "or"}" id="suiv">${i === Q.length - 1 ? "Terminer" : "Suivante"}</button></div></div>`;
    zone.querySelectorAll(".qopt").forEach(b => b.onclick = () => {
      rep[i] = +b.dataset.k;
      zone.querySelectorAll(".qopt").forEach(x => { const on = x === b; x.classList.toggle("choisi", on); x.setAttribute("aria-pressed", on); });
      $("#suiv").className = "btn or"; maj();
    });
    const pr = $("#prec"); if (pr) pr.onclick = () => { i--; question(); };
    $("#suiv").onclick = () => { i++; i < Q.length ? question() : relecture(); };
    $("#enonce").focus({ preventScroll: true });
    if (i > 0) scrollTo({ top: 0, behavior: sansMouvement() ? "auto" : "smooth" });
  }

  function relecture() {
    i = Q.length; maj(); segs.forEach(s => { s.className = s.className.replace(" now", ""); });
    const manque = Q.map((q, k) => k).filter(k => rep[k] === undefined);
    zone.innerHTML = `<div class="qcarte entre"><h2 tabindex="-1" id="enonce">Prêt(e) à voir ta note ?</h2>
      <p>${Q.length - manque.length} réponse${Q.length - manque.length > 1 ? "s" : ""} sur ${Q.length}.</p>
      ${manque.length ? `<div class="warn"><b>${manque.length} question${manque.length > 1 ? "s" : ""} sans réponse :</b> ${manque.map(k => `<a href="#" data-q="${k}">n° ${k + 1}</a>`).join(", ")}.</div>` : '<div class="ok">Toutes les questions ont une réponse.</div>'}
      <p class="help">Tu verras ta note, puis la correction de chaque question.</p>
      <div class="actions"><button class="btn or" id="note" type="button">Voir ma note</button><button class="btn sec" id="revoir" type="button">Revoir mes réponses</button></div></div>`;
    zone.querySelectorAll("a[data-q]").forEach(l => l.onclick = ev => { ev.preventDefault(); i = +l.dataset.q; question(); });
    $("#revoir").onclick = () => { i = 0; question(); };
    $("#note").onclick = resultat;
    $("#enonce").focus({ preventScroll: true });
  }

  /* clavier : A-D ou 1-4 choisissent une réponse ; Entrée passe à la suite */
  const touche = e => {
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target && e.target.closest && e.target.closest("input,textarea,select,[contenteditable]"))) return;
    const k = "abcd1234".indexOf(e.key.toLowerCase());
    if (k >= 0 && $(".qopt")) { const b = zone.querySelectorAll(".qopt")[k % 4]; if (b) { e.preventDefault(); b.click(); } }
    else if (e.key === "Enter" && document.activeElement && document.activeElement.tagName !== "BUTTON" && document.activeElement.tagName !== "A") { const b = $("#suiv") || $("#note"); if (b) { e.preventDefault(); b.click(); } }
  };
  document.addEventListener("keydown", touche);

  function resultat() {
    document.removeEventListener("keydown", touche);
    const juste = k => rep[k] !== undefined && Q[k].o[rep[k]].ok, bon = Q.filter((q, k) => juste(k)).length, ratees = Q.filter((q, k) => !juste(k));
    const pct = Math.round(bon / Q.length * 100), s = bon > 1 ? "s" : "", reussi = pct >= SEUIL_QUIZ, sec = Math.round((performance.now() - debut) / 1000);
    const best = store.get("ndc_quiz", {}), record = best[m.id] != null && pct > best[m.id];
    let gardee = true; if (best[m.id] == null || pct > best[m.id]) { best[m.id] = pct; gardee = store.set("ndc_quiz", best); }
    memoire[m.id] = { q: Q.map(q => q.idx), r: ratees.map(q => q.idx) }; store.set("ndc_quiz_dernier", memoire);   // pour que le prochain essai pose d'autres questions
    envoyerScore(m, bon, Q.length, pct);
    const dansAxe = tousModules().filter(x => x.axeId === m.axeId), suivant = dansAxe[dansAxe.findIndex(x => x.id === m.id) + 1];
    const titre = pct >= SEUIL_EXCELLENCE ? "Excellent !" : reussi ? "Module validé" : "Pas encore validé";
    const mot = reussi ? "Tu peux passer au module suivant." : `Il faut au moins ${SEUIL_QUIZ} % (${Math.ceil(SEUIL_QUIZ * Q.length / 100)} bonnes réponses sur ${Q.length}) pour passer au module suivant. Lis la correction ci-dessous, puis recommence : les questions changent.`;
    const etincelles = reussi && !sansMouvement() ? Array.from({ length: 20 }, (_, n) => { const a = (n / 20) * 2 * Math.PI + Math.random() * .3, r = 90 + Math.random() * 60; return `<i class="etincelle" style="--k:${n};--dx:${Math.round(Math.cos(a) * r)}px;--dy:${Math.round(Math.sin(a) * r)}px"></i>`; }).join("") : "";
    segs.forEach((x, k) => { x.className = juste(k) ? "s-ok" : "s-ko"; });
    const correction = Q.map((q, k) => `<details class="rev ${juste(k) ? "juste" : "fausse"}"${juste(k) ? "" : " open"}><summary><span class="ico-rev" aria-hidden="true">${juste(k) ? "✓" : "✗"}</span> ${esc(q.q)}</summary>
      ${juste(k) ? "" : `<p>${rep[k] === undefined ? "<b>Tu n'as pas répondu.</b>" : "<b>Ta réponse :</b> " + esc(q.o[rep[k]].t)}</p>`}<p><b>Bonne réponse :</b> ${esc(q.ok)}</p><p>${esc(q.e)}</p><small>Dans le cours : ${esc(q.ref)}</small></details>`).join("");
    const numAxe = m.axeId === "axe2" ? 2 : 1, peutExamen = !!(profil() && acces(profil()).examen);
    const finAxe = peutExamen ? `<a class="btn or" href="examen.html?axe=${numAxe}">${axeProgres(m.axeId).pret ? "Passer à l'examen final de l'Axe " + numAxe : "Voir l'examen final de l'Axe " + numAxe}</a>` : numAxe === 1 ? `<a class="btn or" href="parcours.html?a=axe2">Passer à l'Axe 2</a>` : `<a class="btn or" href="espace.html">Retour à mon espace</a>`;
    const suite = reussi ? (suivant ? `<a class="btn or" href="parcours.html?m=${esc(suivant.id)}">Module suivant</a>` : finAxe) + (pct < 100 ? '<button type="button" class="btn sec" id="refaire">Refaire pour viser le sans-faute</button>' : "")
      : `<button type="button" class="btn or" id="refaire">Recommencer avec de nouvelles questions</button><a class="btn sec" href="pdf/cours/${coursModule(m)[0]}.pdf" target="_blank" rel="noopener">Relire le cours (PDF)<span class="sr-seul"> (nouvel onglet)</span></a>`;
    zone.innerHTML = `<div class="qres entre"><div class="anneau-grand" aria-hidden="true">${anneau(pct / 100, sansMouvement() ? pct + " %" : "0 %", "grand")}${etincelles}</div>
      <h2 tabindex="-1" id="enonce">${titre}</h2><p class="qres-mot">${bon} bonne${s} réponse${s} sur ${Q.length}. ${mot}${record ? " C'est ton meilleur score." : ""}</p>
      <div class="puces centre">${puce(bon, "bonnes")}${puce(Q.length - bon, "à revoir")}${puce(Math.floor(sec / 60) + " min " + String(sec % 60).padStart(2, "0"), "durée")}</div>
      <p class="envoi-etat" id="envoi-etat" role="status">Envoi du résultat…</p>${gardee ? "" : '<p class="envoi-etat envoi-mal" role="alert">Ton appareil ne peut pas garder ta progression : libère de la place ou quitte la navigation privée, sinon ce module ne sera pas validé ici.</p>'}
      <div class="actions centre">${suite}<a class="btn sec" href="parcours.html?a=${esc(m.axeId)}">Retour à l'axe</a></div>
      ${m.reflexion ? blocReflexion(m) : ""}
      <h3 class="revoir-t">La correction</h3><div class="revoir">${correction}</div></div>`;
    scrollTo({ top: 0, behavior: sansMouvement() ? "auto" : "smooth" });
    $("#enonce").focus({ preventScroll: true });
    allumerAnneaux();
    if (m.reflexion) brancherReflexion(m);
    const r = $("#refaire"); if (r) r.onclick = () => { scrollTo(0, 0); jouerQuestions(m); };
    if (!sansMouvement()) {   // le pourcentage monte jusqu'à sa valeur pendant que l'anneau se remplit
      const t0 = performance.now(), n = $(".anneau b");
      const image = t => { const p = Math.min(1, (t - t0 - 250) / 1100), e = 1 - Math.pow(1 - Math.max(p, 0), 3); n.textContent = Math.round(pct * e) + " %"; if (p < 1) requestAnimationFrame(image); };
      requestAnimationFrame(image);
    }
  }
  question();
  UIok();
}

/* Réflexion personnelle (sensibilisation) : l'élève répond avec ses mots ; ses réponses sont lues par l'équipe pédagogique. */
const reflexionEnvoyee = id => !!(store.get("ndc_reflexion", {}) || {})[id];
function blocReflexion(m) {
  const deja = reflexionEnvoyee(m.id);
  return `<section class="reflexion" aria-labelledby="refl-t"><h3 id="refl-t">Ta <em>réflexion</em></h3>
    <p class="help">Il n'y a pas de bonne ou de mauvaise réponse : écris ce que tu penses, avec tes mots. Ton enseignant pourra te lire.</p>
    ${deja ? '<p class="envoi-etat envoi-bon">Ta réflexion est déjà envoyée. Merci !</p>' : `<form id="form-refl">${m.reflexion.map((t, i) => `<div class="fld"><label for="r${i + 1}">${i + 1}. ${esc(t)}</label><textarea id="r${i + 1}" name="r${i + 1}" rows="3" maxlength="1000"></textarea></div>`).join("")}
      <div class="actions"><button type="submit" class="btn or">Envoyer ma réflexion</button></div><p class="envoi-etat" id="refl-etat" role="status"></p></form>`}</section>`;
}
function brancherReflexion(m) {
  const f = $("#form-refl"); if (!f) return;
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const rep = {}; m.reflexion.forEach((t, i) => { rep["r" + (i + 1)] = f.elements["r" + (i + 1)].value.trim(); });
    const etat = $("#refl-etat"), btn = f.querySelector("button");
    if (!Object.values(rep).some(Boolean)) { etat.className = "envoi-etat envoi-mal"; etat.textContent = "Écris au moins une réponse avant d'envoyer."; return; }
    const pr = profil(), id = pr.type === "eleve" ? { etablissement: pr.etab, nom: pr.nom, prenom: pr.prenom, classe: pr.classe } : { nom: pr.nom, prenom: pr.prenom || "", ville: pr.ville || "" };
    window.UI && UI.charge(btn, true, "Envoi…");
    const res = notConfigured() ? { ok: true } : await appelApi({ form: "reflexion", profil: pr.type, numero: pr.numero || "", ...id, module: m.id, ...rep });
    if (!res.ok) { window.UI && UI.charge(btn, false, "Envoyer ma réflexion"); etat.className = "envoi-etat envoi-mal"; etat.textContent = res.error || "Envoi impossible. Réessaie."; return; }
    const v = store.get("ndc_reflexion", {}) || {}; v[m.id] = Date.now(); store.set("ndc_reflexion", v);
    f.outerHTML = '<p class="envoi-etat envoi-bon">Ta réflexion est envoyée. Merci !</p>';
  });
}
