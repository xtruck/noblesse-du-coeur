/* Examen final noté — La Noblesse du Cœur : UN SEUL examen sur les deux axes (L'art de la paix et L'art de l'impact).
   10 questions tirées au hasard (5 de l'Axe 1, sensibilisation comprise, et 5 de l'Axe 2) : chaque tentative donne d'autres questions.
   Le navigateur ne connaît JAMAIS les bonnes réponses : il reçoit les questions du serveur, garde les choix de l'élève,
   puis envoie la copie. La correction, la note et l'enregistrement sont faits par le serveur (backend/Code.gs).
   L'élève peut repasser l'examen autant de fois qu'il veut : le serveur compte les tentatives et garde la meilleure note. */
const LETTRES_EX = "ABCD";
const ETIQ_AXE = { 1: "Axe 1 · L'art de la paix", 2: "Axe 2 · L'art de l'impact" };

function renderExamen() {
  const pr = profil();
  if (!pr) { location.replace("commencer.html"); return; }
  if (!acces(pr).examen) { location.replace("espace.html"); return; }
  document.title = "Examen final — La Noblesse du Cœur";
  app().innerHTML = header() + `<section class="qtete"><div class="wrap qtete-in"><div class="qtete-txt"><span class="eyebrow">Examen final</span><h1>Ton <em>examen</em> final</h1><p>${esc(pr.prenom || pr.nom)} · ${esc(pr.etab)} · ${esc(pr.classe)}</p></div></div></section>
  <div class="progression" id="prog" hidden><div class="wrap"><b>Question</b><span class="jauge" role="progressbar" aria-label="Avancement"><i></i></span><small id="pc"></small></div></div>
  <main class="wrap" id="contenu" tabindex="-1"><div id="zone"></div></main>` + FOOT;
  const zone = $("#zone");
  let Q = [], rep = {}, i = 0, envoi = false;

  const prog = examenProgres();
  if (!prog.pret) { verrou(); UIok(); return; }
  intro(); UIok();

  /* l'examen s'ouvre quand toutes les auto-évaluations des deux axes ont été faites au moins une fois (peu importe la note) */
  function verrou() {
    zone.innerHTML = `<div class="bloc no-rv entre"><h2>L'examen s'ouvre bientôt</h2>
      <p>L'examen final porte sur les <b>deux axes</b>. Il s'ouvre quand tu as fait <b>toutes les auto-évaluations</b> de l'Axe 1 et de l'Axe 2, quelle que soit ta note : tu peux les refaire autant que tu veux.</p>
      <p class="help">Il te reste ${prog.restants.length} auto-évaluation${prog.restants.length > 1 ? "s" : ""} à faire :</p>
      <ul class="restants">${prog.restants.map(m => `<li><a href="parcours.html?m=${esc(m.id)}">${esc(m.titre.replace(/^Module \d+ · /, ""))}</a></li>`).join("")}</ul>
      <div class="actions"><a class="btn or" href="parcours.html?m=${esc(prog.restants[0].id)}">Continuer mes auto-évaluations</a><a class="btn sec" href="espace.html">Retour à mon espace</a></div></div>`;
  }

  function intro() {
    const f = examenFait();
    zone.innerHTML = `<div class="bloc no-rv entre"><h2>${f ? "Repasser l'examen" : "Avant de commencer"}</h2>
      <ul class="regles"><li><b>${NB_QUESTIONS_EXAMEN} questions</b> sur les deux axes : 5 sur l'Axe 1 (la paix et la sensibilisation) et 5 sur l'Axe 2 (l'impact).</li>
      <li><b>Tu peux le repasser autant de fois que tu veux.</b> Les questions changent à chaque tentative et la meilleure note est gardée.${f ? ` Tu as déjà envoyé ${f.n} copie${f.n > 1 ? "s" : ""}.` : ""}</li>
      <li>Tu peux revenir sur une question avant d'envoyer. Une question sans réponse ne rapporte pas de point.</li>
      <li>La note est calculée par le serveur et transmise à la direction du programme. Le certificat d'Ambassadeur est le même pour tous : il revient aux 200 meilleurs résultats.</li></ul>
      <div id="msg" aria-live="polite"></div>
      <div class="actions"><button class="btn or" id="go" type="button">${f ? "Je recommence l'examen" : "Je commence l'examen"}</button><a class="btn sec" href="espace.html">Retour à mon espace</a></div></div>`;
    $("#go").onclick = demarrer;
  }

  async function demarrer() {
    const b = $("#go"), lib = b.textContent; window.UI ? UI.charge(b, true, "Chargement des questions…") : (b.disabled = true);
    if (notConfigured()) { $("#msg").innerHTML = '<div class="warn">Mode démonstration : l\'examen n\'est pas encore connecté à la base de données.</div>'; window.UI && UI.charge(b, false, lib); return; }
    const r = await appelApi({ action: "examen_questions" });
    if (!r.ok) { $("#msg").innerHTML = `<div class="warn" role="alert">${esc(r.error || "Impossible de charger l'examen.")}</div>`; window.UI && UI.charge(b, false, "Réessayer"); return; }
    Q = r.questions; i = 0; rep = {}; $("#prog").hidden = false; question();
  }

  function question() {
    jauge(i / Q.length); $("#pc").textContent = (i + 1) + " / " + Q.length;
    const q = Q[i];
    zone.innerHTML = `<div class="bloc no-rv entre"><p class="eyebrow">${esc(ETIQ_AXE[q.axe] || "")}</p><h2 tabindex="-1" id="enonce">${esc(q.q)}</h2>
      <div class="qopts">${q.options.map((o, k) => `<button type="button" class="qopt${rep[q.id] === o.id ? " choisi" : ""}" data-id="${o.id}" aria-pressed="${rep[q.id] === o.id}"><b>${LETTRES_EX[k]}</b><span>${esc(o.t)}</span></button>`).join("")}</div>
      <div class="actions">${i > 0 ? '<button type="button" class="btn sec" id="prec">Précédente</button>' : ""}<button type="button" class="btn" id="suiv">${i === Q.length - 1 ? "Terminer" : "Suivante"}</button></div></div>`;
    zone.querySelectorAll(".qopt").forEach(b => b.onclick = () => {
      rep[q.id] = Number(b.dataset.id);
      zone.querySelectorAll(".qopt").forEach(x => { const on = x === b; x.classList.toggle("choisi", on); x.setAttribute("aria-pressed", on); });
    });
    const p = $("#prec"); if (p) p.onclick = () => { i--; question(); };
    $("#suiv").onclick = () => { i++; i < Q.length ? question() : relecture(); };
    if (i > 0) { $("#enonce").focus({ preventScroll: true }); zone.scrollIntoView({ behavior: UI_REDUIT() ? "auto" : "smooth", block: "start" }); }
  }

  function relecture() {
    const manque = Q.filter(q => rep[q.id] === undefined);
    jauge(1); $("#pc").textContent = "Relecture";
    zone.innerHTML = `<div class="bloc no-rv entre"><h2 tabindex="-1" id="enonce">Prêt(e) à envoyer ?</h2>
      <p>${Q.length - manque.length} réponse${Q.length - manque.length > 1 ? "s" : ""} sur ${Q.length}.</p>
      ${manque.length ? `<div class="warn"><b>${manque.length} question${manque.length > 1 ? "s" : ""} sans réponse :</b> ${manque.map(q => `<a href="#" data-q="${Q.indexOf(q)}">n° ${Q.indexOf(q) + 1}</a>`).join(", ")}.</div>` : '<div class="ok">Toutes les questions ont une réponse.</div>'}
      <div id="msg" aria-live="polite"></div>
      <div class="actions"><button class="btn or" id="envoyer" type="button">Envoyer ma copie</button><button class="btn sec" id="retour" type="button">Revoir mes réponses</button></div></div>`;
    zone.querySelectorAll("a[data-q]").forEach(a => a.onclick = e => { e.preventDefault(); i = Number(a.dataset.q); question(); });
    $("#retour").onclick = () => { i = 0; question(); };
    $("#envoyer").onclick = envoyer;
    $("#enonce").focus({ preventScroll: true });
  }

  async function envoyer() {
    if (envoi) return; envoi = true;
    const b = $("#envoyer"); window.UI ? UI.charge(b, true, "Envoi de ta copie…") : (b.disabled = true);
    const r = await appelApi({ action: "examen_noter", etablissement: pr.etab, nom: pr.nom, prenom: pr.prenom, classe: pr.classe, numero: pr.numero || "", ids: Q.map(q => q.id), reponses: rep });
    envoi = false;
    if (r.ok) { const e = examenFait(); store.set(CLE_EXAMEN_FAIT, { cle: cleLocale(pr), n: (e ? e.n : 0) + 1, note: r.note ?? null, total: r.total ?? null, reussi: r.reussi ?? null }); termine(r); return; }
    $("#msg").innerHTML = `<div class="warn" role="alert">${esc(r.error || "Envoi impossible.")} Tes réponses sont conservées : tu peux réessayer.</div>`;
    window.UI && UI.charge(b, false, "Envoyer ma copie");
  }

  function termine(r) {
    const evalFaite = store.get("ndc_etapes", {}).eval_apres, note = r.note, total = r.total, reussi = r.reussi, tentative = r.tentative || 1;
    const n = 20, feu = UI_REDUIT() ? "" : Array.from({ length: n }, (_, k) => { const a = (k / n) * 2 * Math.PI + Math.random() * .3, rr = 90 + Math.random() * 110; return `<i class="etincelle" style="--k:${k};--dx:${Math.round(Math.cos(a) * rr)}px;--dy:${Math.round(Math.sin(a) * rr)}px"></i>`; }).join("");
    const prog = $("#prog"); if (prog) prog.hidden = true;
    zone.innerHTML = `<div class="bloc no-rv bienvenue"><div class="feu" aria-hidden="true">${feu}</div>
      <svg class="coche" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25"/><path d="M14 27l8 8 16-17"/></svg>
      <h2 tabindex="-1" id="enonce">Copie <em>envoyée</em></h2>
      <p class="lead-b">Merci, ${esc(pr.prenom || pr.nom)}. Ta copie (tentative n° ${tentative}) a été corrigée par le serveur et transmise à la direction du programme. La meilleure de tes notes est gardée.</p>
      ${note != null ? `<p class="lead-b"><b>Ta note : ${note} / ${total}</b>${reussi ? " — bravo !" : ""}</p>` : "<p class=\"help\">Les résultats te seront communiqués par l'équipe du programme.</p>"}
      ${evalFaite ? "" : `<p class="lead-b">Dernière étape : l'évaluation finale (2 minutes).</p>`}
      <div class="actions" style="justify-content:center">${evalFaite ? "" : '<a class="btn or" href="form.html?f=eval&phase=apres&moi=1">Faire l\'évaluation finale</a>'}<a class="btn sec" href="examen.html">Repasser l'examen</a><a class="btn sec" href="espace.html">Retour à mon espace</a></div></div>`;
    $("#enonce").focus({ preventScroll: true }); scrollTo({ top: 0, behavior: UI_REDUIT() ? "auto" : "smooth" });
  }
}
