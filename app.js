/* Rendu des pages : accueil, formulaire, tableau de bord */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function header(ong) {
  return `<header class="top"><div class="wrap">${ong ? "" : '<img src="img/logo_bmt.png" alt="BMT Green Academy">'}
  <div class="t"><b>${ong ? "ONG Lueur d'Espoir" : "La Noblesse du Cœur"}</b><small>${ong ? "« Aidez-nous à nous aider »" : "BMT Green Academy · ONG Lueur d'Espoir"}</small></div>
  <img src="img/logo_lueur.png" alt="ONG Lueur d'Espoir"></div></header><div class="flag"></div>`;
}
const FOOT = `<footer><b>RESPECT · DIGNITÉ · LEADERSHIP · PAIX</b>Programme « La Noblesse du Cœur » — BMT Green Academy × ONG Lueur d'Espoir — Côte d'Ivoire</footer>`;
const notConfigured = () => !API_URL;

/* ---------------- accueil ---------------- */
function renderHome() {
  const cards = Object.entries(FORMS).filter(([, f]) => !f.ong).map(([k, f]) => `
    <a class="card" href="form.html?f=${k}"><div class="im" style="background-image:url(img/${f.img}.jpg)"></div>
    <div class="bd"><span class="tag" style="color:${f.couleur}">Formulaire</span><h3>${esc(f.titre)}</h3><p>${esc(f.desc)}</p><span class="go">Remplir →</span></div></a>`).join("");
  document.body.innerHTML = header() + `
  <section class="hero" style="background-image:url(img/basilique.jpg)"><div class="wrap">
    <h1>La Noblesse du Cœur</h1><p>Paix intérieure — Impact extérieur · Saisie en ligne des supports du programme</p></div></section>
  <main class="wrap">
    ${notConfigured() ? '<div class="warn"><b>Mode démonstration :</b> la base de données n\'est pas encore connectée. Les formulaires s\'affichent mais les réponses ne sont pas encore enregistrées.</div>' : ""}
    <div class="note">Ces formulaires sont remplis <b>après la formation</b> par les chefs d'établissement et les responsables de classe, à partir des fiches papier. Chaque formulaire prend 1 à 3 minutes.</div>
    <h2 class="sec">Supports du programme</h2><div class="grid">${cards}</div>
    <h2 class="sec">ONG Lueur d'Espoir</h2>
    <div class="grid"><a class="card" href="form.html?f=ong"><div class="im" style="background-image:url(img/savane.jpg)"></div>
      <div class="bd"><span class="tag" style="color:#2e7d4f">Inscription</span><h3>Inscription des bénéficiaires</h3><p>Fiche individuelle du bénéficiaire : chaque inscription crée un dossier avec un numéro unique.</p><span class="go">S'inscrire →</span></div></a>
    <a class="card" href="dashboard.html"><div class="im" style="background-image:url(img/plateau.jpg)"></div>
      <div class="bd"><span class="tag" style="color:var(--gold)">Accès réservé</span><h3>Tableau de bord</h3><p>Inscrits, moyennes avant / après, pourcentages d'amélioration, élèves sans incident, élèves éligibles, bénéficiaires de l'ONG.</p><span class="go">Consulter →</span></div></a></div>
    <h2 class="sec">Fiches à imprimer (PDF remplissables)</h2>
    <div class="dl">${[["Kit_complet_La_Noblesse_du_Coeur", "Kit complet"], ["01_Kit_responsable_etablissement", "Kit du responsable"], ["02_Evaluation_eleve_AVANT", "Évaluation AVANT"],
      ["03_Evaluation_eleve_APRES", "Évaluation APRÈS"], ["04_Grille_evaluation_enseignant", "Grille enseignant"], ["05_Registre_des_incidents", "Registre des incidents"],
      ["06_Fiche_suivi_individuel", "Suivi individuel"], ["07_Rapport_evaluation_programme", "Rapport"], ["08_PV_selection", "PV de sélection"],
      ["09_Liste_eleves_retenus", "Liste des retenus"], ["10_Certificat_Ambassadeur_Junior", "Certificat"], ["Fiche_beneficiaire_ONG_Lueur_dEspoir", "Fiche bénéficiaire ONG"]]
      .map(([f, l]) => `<a href="pdf/${f}.pdf" download>⬇ ${l}</a>`).join("")}</div>
  </main>` + FOOT;
}

/* ---------------- formulaire ---------------- */
function field(c) {
  const req = c.req ? ' <span class="req">*</span>' : "";
  const help = c.help ? `<div class="help">${esc(c.help)}</div>` : "";
  const cls = "fld" + (c.half ? " half" : "");
  switch (c.t) {
    case "section": return `<div class="fld"><div class="sect">${esc(c.l)}</div></div>`;
    case "text": case "number": case "date": case "tel":
      return `<div class="${cls}"><label for="${c.k}">${esc(c.l)}${req}</label>${help}<input id="${c.k}" name="${c.k}" type="${c.t}" ${c.req ? "required" : ""} ${c.ph ? `placeholder="${esc(c.ph)}"` : ""} ${c.t === "number" ? 'min="0" inputmode="numeric"' : ""} ${c.list ? `list="${c.list}" autocomplete="on"` : ""}></div>`;
    case "textarea": return `<div class="${cls}"><label for="${c.k}">${esc(c.l)}${req}</label>${help}<textarea id="${c.k}" name="${c.k}" ${c.req ? "required" : ""}></textarea></div>`;
    case "select": return `<div class="${cls}"><label for="${c.k}">${esc(c.l)}${req}</label><select id="${c.k}" name="${c.k}">${c.opts.map(o => `<option>${esc(o)}</option>`).join("")}</select></div>`;
    case "radio": case "checks":
      return `<div class="${cls}"><span class="lb">${esc(c.l)}${req}</span>${help}<div class="opts" data-k="${c.k}" data-req="${c.req ? 1 : ""}" data-t="${c.t}">${c.opts.map(o =>
        `<label><input type="${c.t === "radio" ? "radio" : "checkbox"}" name="${c.k}" value="${esc(o)}">${esc(o)}</label>`).join("")}</div></div>`;
    case "likert":
      return `<div class="fld"><span class="lb">${esc(c.l)}${req}</span><div class="help">${c.scale.map((s, i) => `${i + 1} = ${s}`).join(" · ")}</div><div class="lk" data-likert="${c.k}">${c.rows.map((r, i) =>
        `<div class="q" data-q="${c.k}${i + 1}"><div class="qt">${i + 1}. ${esc(r)}</div><div class="sc">${[1, 2, 3, 4, 5].map(v =>
          `<label><input type="radio" name="${c.k}${i + 1}" value="${v}"><b>${v}</b><span>${esc(c.scale[v - 1])}</span></label>`).join("")}</div></div>`).join("")}</div></div>`;
    case "incidents":
      return `<div class="fld"><span class="lb">${esc(c.l)} <span class="req">*</span></span><div class="box" style="padding:0"><table class="inc"><tr><th>Type d'incident</th><th>Avant</th><th>Après</th></tr>${c.rows.map((r, i) =>
        `<tr><td>${esc(r)}</td><td><input type="number" min="0" inputmode="numeric" name="av${i + 1}" required></td><td><input type="number" min="0" inputmode="numeric" name="ap${i + 1}" required></td></tr>`).join("")}</table></div></div>`;
  }
  return "";
}

function renderForm(key) {
  const f = FORMS[key];
  if (!f) { location.href = "index.html"; return; }
  document.title = f.titre + " — La Noblesse du Cœur";
  document.body.innerHTML = header(f.ong) + `
  <section class="hero" style="background-image:url(img/${f.img}.jpg);height:200px"><div class="wrap" style="padding-bottom:42px"><h1>${esc(f.titre)}</h1><p>${esc(f.desc)}</p></div></section>
  <main class="wrap"><form class="f" novalidate>${notConfigured() ? '<div class="warn"><b>Mode démonstration</b> : les réponses ne seront pas enregistrées tant que la base n\'est pas connectée.</div>' : ""}
    <div class="row">${f.champs.map(field).join("")}</div>
    <div id="err"></div>
    <div class="actions"><button class="btn" type="submit">Envoyer</button>${f.ong ? "" : '<a class="btn sec" href="index.html">Retour</a>'}<span class="help" style="margin:0">Les champs marqués <span class="req">*</span> sont obligatoires.</span></div>
  </form><datalist id="etabs"></datalist></main>` + FOOT;
  try { JSON.parse(localStorage.getItem("ndc_etabs") || "[]").forEach(e => $("#etabs").insertAdjacentHTML("beforeend", `<option value="${esc(e)}">`)); } catch (e) {}
  // garder établissement / classe pour la saisie suivante
  try { const last = JSON.parse(localStorage.getItem("ndc_last") || "{}"); ["etab", "classe", "enseignant", "resp"].forEach(k => { const el = $(`[name=${k}]`); if (el && last[k]) el.value = last[k]; }); } catch (e) {}
  $("form").addEventListener("submit", ev => { ev.preventDefault(); submit(key, ev.target); });
}

function collect(key, form) {
  const f = FORMS[key], data = { form: key }, miss = [];
  form.querySelectorAll(".miss").forEach(e => e.classList.remove("miss"));
  for (const c of f.champs) {
    if (c.t === "section") continue;
    if (c.t === "likert") {
      c.rows.forEach((r, i) => {
        const n = c.k + (i + 1), v = form.querySelector(`input[name="${n}"]:checked`);
        data[n] = v ? Number(v.value) : "";
        if (c.req && !v) { miss.push(`${c.l} — ${r}`); form.querySelector(`[data-q="${n}"]`).classList.add("miss"); }
      });
    } else if (c.t === "incidents") {
      c.rows.forEach((r, i) => ["av", "ap"].forEach(p => {
        const el = form.querySelector(`[name=${p}${i + 1}]`); data[p + (i + 1)] = el.value === "" ? "" : Number(el.value);
        if (el.value === "") miss.push(`${r} (${p === "av" ? "avant" : "après"})`);
      }));
    } else if (c.t === "radio") {
      const v = form.querySelector(`input[name="${c.k}"]:checked`); data[c.k] = v ? v.value : "";
      if (c.req && !v) miss.push(c.l);
    } else if (c.t === "checks") {
      data[c.k] = [...form.querySelectorAll(`input[name="${c.k}"]:checked`)].map(i => i.value).join(", ");
      if (c.req && !data[c.k]) miss.push(c.l);
    } else {
      const el = form.querySelector(`[name="${c.k}"]`); data[c.k] = el.value.trim();
      if (c.req && !data[c.k]) miss.push(c.l);
    }
  }
  return { data, miss };
}

async function submit(key, form) {
  const { data, miss } = collect(key, form), err = $("#err");
  if (miss.length) { err.innerHTML = `<div class="warn"><b>Il manque :</b><br>${miss.map(esc).join("<br>")}</div>`; err.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  err.innerHTML = "";
  try {
    const last = {}; ["etab", "classe", "enseignant", "resp"].forEach(k => data[k] && (last[k] = data[k])); localStorage.setItem("ndc_last", JSON.stringify(last));
    if (data.etab) { const l = new Set(JSON.parse(localStorage.getItem("ndc_etabs") || "[]")); l.add(data.etab); localStorage.setItem("ndc_etabs", JSON.stringify([...l].slice(-30))); }
  } catch (e) {}
  const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Envoi…";
  let res = { ok: true, demo: true };
  if (!notConfigured()) {
    try {
      const r = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) });
      res = await r.json();
    } catch (e) { res = { ok: false, error: "Connexion impossible. Vérifiez internet puis réessayez." }; }
  }
  if (!res.ok) { btn.disabled = false; btn.textContent = "Envoyer"; err.innerHTML = `<div class="warn">${esc(res.error || "Erreur")}</div>`; return; }
  const f = FORMS[key];
  form.innerHTML = `<div class="ok"><h3 style="margin:0 0 6px;color:var(--g)">✔ ${res.demo ? "Formulaire valide (mode démonstration)" : "Réponse enregistrée"}</h3>
    ${res.numero ? `<p style="font-size:18px">Numéro du bénéficiaire : <b>${esc(res.numero)}</b></p><p>Notez ce numéro : il identifie le dossier.</p>` : ""}
    <p>Merci ! ${f.ong ? "" : "Vous pouvez saisir l'élève suivant : l'établissement et la classe sont conservés."}</p></div>
    <div class="actions"><a class="btn" href="form.html?f=${key}">${f.ong ? "Nouvelle inscription" : "Saisir une autre fiche"}</a>${f.ong ? "" : '<a class="btn sec" href="index.html">Accueil</a>'}</div>`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------- tableau de bord ---------------- */
function renderDashboard() {
  document.title = "Tableau de bord — La Noblesse du Cœur";
  document.body.innerHTML = header() + `<section class="hero" style="background-image:url(img/plateau.jpg);height:180px"><div class="wrap"><h1>Tableau de bord</h1><p>Résultats du programme et inscriptions de l'ONG</p></div></section>
  <main class="wrap" id="dash"><form class="f" id="login" style="max-width:420px"><div class="fld"><label for="code">Code d'accès</label><input id="code" type="text" autocomplete="off" required></div><button class="btn">Ouvrir</button><div id="err"></div></form></main>` + FOOT;
  let saved = ""; try { saved = sessionStorage.getItem("ndc_code") || ""; } catch (e) {}
  if (saved) load(saved);
  $("#login").addEventListener("submit", e => { e.preventDefault(); load($("#code").value.trim()); });
}
async function load(code) {
  if (notConfigured()) { $("#err").innerHTML = '<div class="warn">La base de données n\'est pas encore connectée.</div>'; return; }
  let d;
  try { d = await (await fetch(`${API_URL}?action=stats&code=${encodeURIComponent(code)}`)).json(); }
  catch (e) { $("#err").innerHTML = '<div class="warn">Connexion impossible.</div>'; return; }
  if (!d.ok) { $("#err").innerHTML = `<div class="warn">${esc(d.error || "Code incorrect")}</div>`; return; }
  try { sessionStorage.setItem("ndc_code", code); } catch (e) {}
  const fr = x => String(x).replace(".", ","), P = d.programme, O = d.ong, pct = x => x == null ? "—" : fr(x) + " %", n2 = x => x == null ? "—" : fr(x);
  const kpi = (v, l, s = "") => `<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;
  const bars = rows => rows.map(r => `<tr><td>${esc(r[0])}</td><td style="width:60px;text-align:right"><b>${r[1]}</b></td><td style="width:45%"><div class="bar"><i style="width:${r[2]}%"></i></div></td><td style="width:60px">${String(r[2]).replace(".", ",")} %</td></tr>`).join("");
  $("#dash").innerHTML = `<div class="actions" style="margin:14px 0"><span class="help" style="margin:0">Mis à jour : ${esc(d.maj)}</span><button class="btn sec" onclick="load('${esc(code)}')">↻ Actualiser</button></div>
  <h2 class="sec">Participation</h2><div class="kpis">${kpi(P.inscrits, "Élèves inscrits")}${kpi(P.etablissements, "Établissements")}${kpi(P.evalAvant, "Évaluations AVANT")}${kpi(P.evalApres, "Évaluations APRÈS")}${kpi(P.suivis, "Fiches de suivi")}</div>
  <h2 class="sec">Résultats</h2><div class="kpis">
    ${kpi(n2(P.moyAvant) + " → " + n2(P.moyApres), "Auto-évaluation /5", "avant → après")}
    ${kpi(pct(P.amelioration), "Amélioration moyenne")}
    ${kpi(pct(P.pctProgres), "Élèves en progrès", P.progres + " / " + P.paires)}
    ${kpi(n2(P.ensAvant) + " → " + n2(P.ensApres), "Note enseignant /5")}
    ${kpi(n2(P.suiviDebut) + " → " + n2(P.suiviFin), "Compétences /5", "début → fin")}
    ${kpi(pct(P.pctSansIncident), "Élèves sans incident", P.sansIncident + " / " + P.suivis)}
    ${kpi(P.incAvant + " → " + P.incApres, "Incidents (registres)", P.incAvant ? pct(P.reductionInc) + " de baisse" : "")}
    ${kpi(P.eligibles.length, "Élèves éligibles", pct(P.pctEligibles) + " des inscrits")}</div>
  <h2 class="sec">Élèves éligibles à la formation continue</h2><div class="box"><table class="tb"><tr><th>Élève</th><th>Établissement</th><th>Classe</th><th>Critères</th></tr>${P.eligibles.map(e => `<tr><td><b>${esc(e.nom)}</b></td><td>${esc(e.etab)}</td><td>${esc(e.classe)}</td><td class="yes">${e.crit}/4</td></tr>`).join("") || '<tr><td colspan="4">Aucun pour le moment.</td></tr>'}</table></div>
  <h2 class="sec">Par établissement</h2><div class="box"><table class="tb"><tr><th>Établissement</th><th>Élèves</th><th>Moy. avant</th><th>Moy. après</th><th>Éligibles</th></tr>${P.parEtab.map(e => `<tr><td>${esc(e.etab)}</td><td>${e.n}</td><td>${n2(e.av)}</td><td>${n2(e.ap)}</td><td>${e.elig}</td></tr>`).join("")}</table></div>
  <h2 class="sec">Tous les élèves</h2><div class="box"><table class="tb"><tr><th>Élève</th><th>Établissement</th><th>Classe</th><th>Avant</th><th>Après</th><th>Ens. après</th><th>Suivi fin</th><th>Incident</th><th>Critères</th></tr>${P.eleves.map(e => `<tr><td>${esc(e.nom)}</td><td>${esc(e.etab)}</td><td>${esc(e.classe)}</td><td>${n2(e.av)}</td><td>${n2(e.ap)}</td><td>${n2(e.ensAp)}</td><td>${n2(e.fin)}</td><td>${e.incident == null ? "—" : e.incident ? "Oui" : "Non"}</td><td class="${e.crit >= 3 ? "yes" : ""}">${e.crit}/4</td></tr>`).join("")}</table></div>
  <h2 class="sec">ONG Lueur d'Espoir — bénéficiaires</h2><div class="kpis">${kpi(O.total, "Bénéficiaires inscrits")}</div>
  ${[["Type de handicap", O.handicap], ["Besoins identifiés", O.besoins], ["Sexe", O.sexe], ["Commune / quartier", O.commune]].map(([t, r]) => `<div class="box"><b style="color:var(--g)">${t}</b><table class="tb" style="margin-top:6px">${bars(r) || "<tr><td>—</td></tr>"}</table></div>`).join("")}`;
}
