/* Examens finaux notés — La Noblesse du Cœur : CHAQUE AXE a son examen final à la fin (Axe 1 · L'art de la paix, Axe 2 · L'art de l'impact).
   7 questions tirées au hasard dans la réserve de l'axe (l'Axe 1 comprend la sensibilisation) : chaque tentative donne d'autres questions.
   Le certificat s'obtient en réussissant les DEUX examens (70 % minimum à chacun).
   Le navigateur ne connaît JAMAIS les bonnes réponses : il reçoit les questions du serveur, garde les choix de l'élève,
   puis envoie la copie. La correction, la note et l'enregistrement sont faits par le serveur (backend/Code.gs).
   L'élève peut repasser chaque examen autant de fois qu'il veut : le serveur compte les tentatives et garde la meilleure note. */
const LETTRES_EX = "ABCD";
const AXES_EXAMEN = { 1: { nom: "Axe 1", titre: "L'art de la paix", court: "L'art de la *paix*" }, 2: { nom: "Axe 2", titre: "L'art de l'impact", court: "L'art de l'*impact*" } };

function renderExamen() {
  const pr = profil();
  if (!pr) { location.replace("commencer.html"); return; }
  if (!acces(pr).examen) { location.replace("espace.html"); return; }
  const axe = Number(new URLSearchParams(location.search).get("axe")), info = AXES_EXAMEN[axe];
  if (!info) { choixExamen(pr); return; }
  document.title = `Examen final · ${info.nom} — La Noblesse du Cœur`;
  app().innerHTML = header() + `<section class="qtete"><div class="wrap qtete-in"><div class="qtete-txt"><span class="eyebrow">Examen final · ${info.nom}</span><h1>${titreHtml(info.court)}</h1><p>${esc(pr.prenom || pr.nom)} · ${esc(pr.etab)} · ${esc(pr.classe)}</p></div></div></section>
  <div class="progression" id="prog" hidden><div class="wrap"><b>Question</b><span class="jauge" role="progressbar" aria-label="Avancement"><i></i></span><small id="pc"></small></div></div>
  <main class="wrap" id="contenu" tabindex="-1"><div id="zone"></div></main>` + FOOT;
  const zone = $("#zone");
  let Q = [], rep = {}, i = 0, envoi = false;

  const prog = axeProgres("axe" + axe);
  if (!prog.pret) { verrou(); UIok(); return; }
  intro(); UIok();

  /* l'examen d'un axe s'ouvre quand tous les modules de CET axe sont validés (75 % à chaque auto-évaluation) */
  function verrou() {
    zone.innerHTML = `<div class="bloc no-rv entre"><h2>L'examen s'ouvre bientôt</h2>
      <p>L'examen final de l'${info.nom} s'ouvre quand tu as <b>validé tous les modules</b> de l'axe, avec au moins <b>${SEUIL_QUIZ} %</b> à chaque auto-évaluation. Tu peux les refaire autant que tu veux : les questions changent à chaque essai.</p>
      <p class="help">Il te reste ${prog.restants.length} module${prog.restants.length > 1 ? "s" : ""} à valider :</p>
      <ul class="restants">${prog.restants.map(m => `<li><a href="parcours.html?m=${esc(m.id)}">${esc(m.titre.replace(/^Module \d+ · /, ""))}</a></li>`).join("")}</ul>
      <div class="actions"><a class="btn or" href="parcours.html?m=${esc(prog.restants[0].id)}">Continuer mes modules</a><a class="btn sec" href="examen.html">Retour aux examens</a></div></div>`;
  }

  function intro() {
    const f = examenFait(axe);
    zone.innerHTML = `<div class="bloc no-rv entre"><h2>${f ? "Repasser l'examen" : "Avant de commencer"}</h2>
      <ul class="regles"><li><b>${NB_QUESTIONS_EXAMEN} questions</b> sur l'${info.nom} : ${esc(info.titre.toLowerCase())}${axe === 1 ? ", sensibilisation comprise" : ""}.</li>
      <li><b>${SEUIL_EXAMEN} % pour réussir.</b> Tu peux le repasser autant de fois que tu veux : les questions changent à chaque tentative et la meilleure note est gardée.${f ? ` Tu as déjà envoyé ${f.n} copie${f.n > 1 ? "s" : ""}.` : ""}</li>
      <li>Tu peux revenir sur une question avant d'envoyer. Une question sans réponse ne rapporte pas de point.</li>
      <li>Ta note et le corrigé s'affichent tout de suite après l'envoi. Le certificat d'Ambassadeur est le même pour tous : tu l'obtiens en réussissant <b>les deux examens</b>, celui de l'Axe 1 et celui de l'Axe 2.</li></ul>
      <div id="msg" aria-live="polite"></div>
      <div class="actions"><button class="btn or" id="go" type="button">${f ? "Je recommence l'examen" : "Je commence l'examen"}</button><a class="btn sec" href="examen.html">Retour aux examens</a></div></div>`;
    $("#go").onclick = demarrer;
  }

  async function demarrer() {
    const b = $("#go"), lib = b.textContent; window.UI ? UI.charge(b, true, "Chargement des questions…") : (b.disabled = true);
    if (notConfigured()) { $("#msg").innerHTML = '<div class="warn">Mode démonstration : l\'examen n\'est pas encore connecté à la base de données.</div>'; window.UI && UI.charge(b, false, lib); return; }
    const r = await appelApi({ action: "examen_questions", axe });
    if (!r.ok) { $("#msg").innerHTML = `<div class="warn" role="alert">${esc(r.error || "Impossible de charger l'examen.")}</div>`; window.UI && UI.charge(b, false, "Réessayer"); return; }
    Q = r.questions; i = 0; rep = {}; $("#prog").hidden = false; question();
  }

  function question() {
    jauge(i / Q.length); $("#pc").textContent = (i + 1) + " / " + Q.length;
    const q = Q[i];
    zone.innerHTML = `<div class="bloc no-rv entre"><p class="eyebrow">${esc(info.nom)} · ${esc(info.titre)}</p><h2 tabindex="-1" id="enonce"><span class="sr-seul">Question ${i + 1} sur ${Q.length} : </span>${esc(q.q)}</h2>
      <div class="qopts">${q.options.map((o, k) => `<button type="button" class="qopt${rep[q.id] === o.id ? " choisi" : ""}" data-id="${o.id}" aria-pressed="${rep[q.id] === o.id}"><b>${LETTRES_EX[k]}</b><span>${esc(o.t)}</span></button>`).join("")}</div>
      <div class="actions">${i > 0 ? '<button type="button" class="btn sec" id="prec">Précédente</button>' : ""}<button type="button" class="btn" id="suiv">${i === Q.length - 1 ? "Terminer" : "Suivante"}</button></div></div>`;
    zone.querySelectorAll(".qopt").forEach(b => b.onclick = () => {
      rep[q.id] = Number(b.dataset.id);
      zone.querySelectorAll(".qopt").forEach(x => { const on = x === b; x.classList.toggle("choisi", on); x.setAttribute("aria-pressed", on); });
    });
    const p = $("#prec"); if (p) p.onclick = () => { i--; question(); };
    $("#suiv").onclick = () => { i++; i < Q.length ? question() : relecture(); };
    $("#enonce").focus({ preventScroll: true });
    if (i > 0) zone.scrollIntoView({ behavior: UI_REDUIT() ? "auto" : "smooth", block: "start" });
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
    deverrouillerSon();                                              // le clic autorise le son de la célébration finale
    const b = $("#envoyer"); window.UI ? UI.charge(b, true, "Envoi de ta copie…") : (b.disabled = true);
    const avant = examensReussis();                                  // le certificat était-il déjà ouvert avant cet envoi ?
    const r = await appelApi({ action: "examen_noter", axe, etablissement: pr.etab, nom: pr.nom, prenom: pr.prenom, classe: pr.classe, numero: pr.numero || "", ids: Q.map(q => q.id), reponses: rep });
    envoi = false;
    if (r.ok) {
      const e = store.get(CLE_EXAMEN_FAIT, {}) || {}, ancien = examenFait(axe), meilleur = r.meilleurPct ?? r.pct ?? 0;
      e["axe" + axe] = { cle: cleLocale(pr), n: (ancien ? ancien.n : 0) + 1, pct: meilleur, reussi: meilleur >= SEUIL_EXAMEN };
      store.set(CLE_EXAMEN_FAIT, e);
      if (r.certificat === "ouvert" && !avant) { accompli(pr); return; }   // le dernier examen réussi : fanfare, confettis, puis le certificat
      termine(r); return;
    }
    $("#msg").innerHTML = `<div class="warn" role="alert">${esc(r.error || "Envoi impossible.")} Tes réponses sont conservées : tu peux réessayer.</div>`;
    window.UI && UI.charge(b, false, "Envoyer ma copie");
  }

  /* après l'envoi : la note, ce qui reste à faire (l'autre examen, le certificat), puis le corrigé */
  function termine(r) {
    const evalFaite = store.get("ndc_etapes", {}).eval_apres, reussi = r.reussi, tentative = r.tentative || 1, autre = axe === 1 ? 2 : 1;
    const n = 20, feu = UI_REDUIT() || !reussi ? "" : Array.from({ length: n }, (_, k) => { const a = (k / n) * 2 * Math.PI + Math.random() * .3, rr = 90 + Math.random() * 110; return `<i class="etincelle" style="--k:${k};--dx:${Math.round(Math.cos(a) * rr)}px;--dy:${Math.round(Math.sin(a) * rr)}px"></i>`; }).join("");
    const prog = $("#prog"); if (prog) prog.hidden = true;
    const corriges = (r.corriges || []).map(c => `<details class="rev"${c.juste ? "" : " open"}><summary>${c.juste ? "✓" : "✗"} ${esc(c.q)}</summary><p><b>Bonne réponse :</b> ${esc(c.bonne)}</p>${c.juste ? "" : `<p>${c.choix ? "Ta réponse : " + esc(c.choix) : "Tu n'as pas répondu."}</p>`}</details>`).join("");
    let mot, actions;
    if (r.certificat === "ouvert") {
      mot = `<p class="lead-b">Les deux examens sont réussis : ton certificat d'Ambassadeur est prêt. Tu peux le télécharger avec ton nom et ton matricule.</p>`;
      actions = `<a class="btn or" href="certificat.html?moi=1">Télécharger mon certificat</a>${evalFaite ? "" : '<a class="btn" href="form.html?f=eval&phase=apres&moi=1">Faire l\'évaluation finale</a>'}`;
    } else if (reussi) {
      const reste = (r.reste || [autre])[0], prete = axeProgres("axe" + reste).pret;
      mot = `<p class="lead-b">Examen de l'${info.nom} réussi. Pour obtenir le certificat, il te reste à réussir l'examen de l'Axe ${reste}${prete ? "" : " : commence par ses modules"}.</p>`;
      actions = prete ? `<a class="btn or" href="examen.html?axe=${reste}">Passer l'examen de l'Axe ${reste}</a>` : `<a class="btn or" href="parcours.html?a=axe${reste}">Passer à l'Axe ${reste}</a>`;
    } else {
      mot = `<p class="help">Il faut au moins ${SEUIL_EXAMEN} % pour réussir cet examen. Lis le corrigé ci-dessous, puis recommence : les questions changent.</p>`;
      actions = `<button class="btn or" id="refaire" type="button">Repasser l'examen</button>`;
    }
    zone.innerHTML = `<div class="bloc no-rv bienvenue"><div class="feu" aria-hidden="true">${feu}</div>
      <svg class="coche" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25"/><path d="M14 27l8 8 16-17"/></svg>
      <h2 tabindex="-1" id="enonce">${reussi ? "Bravo, tu as <em>réussi</em> !" : "Copie <em>envoyée</em>"}</h2>
      ${r.note != null ? `<p class="lead-b"><b>Ta note : ${r.note} / ${r.total}</b> (${virgule(r.pct)} %)${r.meilleurPct > r.pct ? " · ta meilleure note : " + virgule(r.meilleurPct) + " %" : ""}</p>` : "<p class=\"help\">Les résultats te seront communiqués par l'équipe du programme.</p>"}
      <p class="help">${esc(info.nom)} · tentative n° ${tentative} · la meilleure de tes notes est gardée.</p>
      ${mot}
      <div class="actions" style="justify-content:center">${actions}${reussi ? '<a class="btn sec" href="examen.html?axe=' + axe + '">Repasser pour améliorer ma note</a>' : ""}<a class="btn sec" href="espace.html">Retour à mon espace</a></div>
      ${corriges ? `<h3 class="revoir-t">Le corrigé</h3><div class="revoir" style="text-align:left">${corriges}</div>` : ""}</div>`;
    const re = $("#refaire"); if (re) re.onclick = () => { location.href = "examen.html?axe=" + axe; };
    $("#enonce").focus({ preventScroll: true }); scrollTo({ top: 0, behavior: UI_REDUIT() ? "auto" : "smooth" });
  }
}

/* Choix de l'examen : un examen par axe, avec de grands titres pour les distinguer */
function choixExamen(pr) {
  document.title = "Examens finaux — La Noblesse du Cœur";
  const carte = n => { const info = AXES_EXAMEN[n], f = examenFait(n), ok = examenReussi(n), prog = axeProgres("axe" + n), ferme = !ok && !prog.pret;
    return `<a class="carte-profil carte-examen${ferme ? " ferme" : ""}" href="examen.html?axe=${n}" style="--k:${n - 1}"><span class="cont-eyebrow">Examen final · ${info.nom}</span><h3>${titreHtml(info.court)}</h3>
      <p>${ok ? "Réussi : " + virgule(f.pct) + " %. Tu peux le repasser pour améliorer ta note." : ferme ? "À débloquer : valide d'abord tous les modules de l'axe (" + prog.restants.length + " restant" + (prog.restants.length > 1 ? "s" : "") + ", " + SEUIL_QUIZ + " % minimum)." : f ? "Pas encore réussi : tente à nouveau (" + SEUIL_EXAMEN + " % minimum)." : NB_QUESTIONS_EXAMEN + " questions, " + SEUIL_EXAMEN + " % pour réussir, repassable autant que tu veux."}</p>
      <span class="aller">${ok ? "Repasser" : ferme ? "Voir ce qui reste" : "Passer l'examen"}</span></a>`; };
  app().innerHTML = header() + `<section class="qtete"><div class="wrap qtete-in"><div class="qtete-txt"><span class="eyebrow">Examens finaux</span><h1>Tes <em>examens</em> finaux</h1>
    <p>Un examen à la fin de chaque axe. Quand tu as réussi les deux, ton certificat d'Ambassadeur est prêt.</p></div></div></section>
  <main class="wrap" id="contenu" tabindex="-1"><div class="profils">${carte(1)}${carte(2)}</div>
    <div class="actions" style="margin-top:26px">${examensReussis() ? '<a class="btn or" href="certificat.html?moi=1">Mon certificat</a>' : ""}<a class="btn sec" href="espace.html">Retour à mon espace</a></div></main>` + FOOT;
  UIok();
}

/* Fin du parcours : le dernier examen réussi ouvre le certificat. Fanfare + confettis + médaille, puis le certificat s'affiche tout seul (le son vient d'un clic : il est autorisé). */
function accompli(pr) {
  document.title = "Parcours accompli — La Noblesse du Cœur";
  const ov = document.createElement("div"); ov.className = "accompli"; ov.setAttribute("role", "status");
  ov.innerHTML = `<div class="accompli-in"><svg class="medaille" viewBox="0 0 160 160" aria-hidden="true"><g class="rayons">${Array.from({ length: 16 }, (_, k) => `<rect x="78" y="4" width="4" height="26" rx="2" transform="rotate(${k * 22.5} 80 80)"/>`).join("")}</g>
      <circle cx="80" cy="80" r="46" class="m-or"/><circle cx="80" cy="80" r="37" class="m-vert"/><path class="m-etoile" d="M80 54l7.5 15.2 16.8 2.4-12.2 11.9 2.9 16.7L80 92l-15 8.2 2.9-16.7-12.2-11.9 16.8-2.4z"/></svg>
    <p class="eyebrow">Félicitations, ${esc(pr.prenom || pr.nom)}</p><h2>Parcours <em>accompli</em> !</h2><p class="accompli-txt">Tu as réussi les deux examens finaux. Ton certificat d'Ambassadeur arrive…</p>
    <div class="actions"><button type="button" class="btn or" id="voir-cert">Voir mon certificat</button><button type="button" class="btn sec" id="couper-son">Couper le son</button></div></div>`;
  document.body.appendChild(ov);
  fanfare(); confettis(5200);
  let fini = false;
  const suite = () => { if (fini) return; fini = true; clearTimeout(minuteur); ov.remove(); certificatEleve(); };
  const minuteur = setTimeout(suite, 4800);
  document.getElementById("voir-cert").onclick = suite;
  document.getElementById("couper-son").onclick = () => { store.set("ndc_son", false); coupeSon(); document.getElementById("couper-son").remove(); };
  document.getElementById("voir-cert").focus({ preventScroll: true });
}
