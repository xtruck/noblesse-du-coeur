/* Plateforme BMT Green Academy × ONG Lueur d'Espoir — accueil, formulaires, liens, certificat, formations, tableau de bord */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BASE = location.href.replace(/[^/]*([?#].*)?$/, "");
const notConfigured = () => !API_URL;
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

/* La page est construite dans #app : le préchargeur, les barres fines et les scripts restent en dehors et ne sont jamais effacés. */
const app = () => document.getElementById("app") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "app" }));
const jauge = p => { const j = $(".jauge i"); if (j) j.style.setProperty("--p", p); };   // barre de progression : transform, pas de largeur animée
const UIok = () => window.UI && UI.pret();

/* Navigation principale : la même liste sert à l'en-tête (écran large) et au tiroir (mobile) */
const NAV = [["index.html", "Parcours"], ["quiz.html", "Quiz"], ["liens.html", "Liens"], ["dashboard.html", "Résultats"]];
const CTA_NAV = ["form.html?f=eleve_inscr", "Inscription élèves"];
const courant = h => { const [p, q] = h.split("?"), ici = location.pathname.split("/").pop() || "index.html"; return p === ici && (!q || location.search.includes(q)); };
const lienNav = ([h, t]) => `<a href="${h}"${courant(h) ? ' aria-current="page"' : ""}>${t}</a>`;

function header(mode) {
  const saut = `<a class="saut" href="#contenu">Aller au contenu</a>`;
  if (mode === "ong")   // page publique de l'ONG : en-tête minimal, sans navigation vers le reste du site
    return `${saut}<header class="ident"><div class="wrap"><div class="logo"><span class="nom"><b>ONG <em>Lueur</em> d'Espoir</b><span>Aidez-nous à nous aider</span></span></div>
    <img src="img/logo_lueur-160.webp" width="46" height="46" alt="ONG Lueur d'Espoir"></div></header><div class="tricolore"></div>`;
  return `${saut}<header class="ident"><div class="wrap">
    <a class="logo" href="index.html" aria-label="La Noblesse du Cœur, accueil"><img src="img/logo_bmt-160.webp" width="49" height="48" alt=""><span class="nom"><b>La Noblesse du <em>Cœur</em></b><span>BMT Green Academy et ONG Lueur d'Espoir</span></span></a>
    <nav class="nav" aria-label="Navigation principale">${NAV.map(lienNav).join("")}<a class="btn" href="${CTA_NAV[0]}">${CTA_NAV[1]}</a></nav>
    <button class="burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="tiroir"><span></span><span></span></button></div></header>
  <div class="voile"></div>
  <nav class="tiroir" id="tiroir" aria-label="Menu" aria-hidden="true"><div class="t-tete"><img src="img/logo_bmt-160.webp" width="45" height="44" alt=""><img src="img/logo_lueur-160.webp" width="44" height="44" alt=""></div>
    ${NAV.map(lienNav).join("")}<a class="btn" href="${CTA_NAV[0]}">${CTA_NAV[1]}</a><p class="t-bas">BMT Green Academy · ONG Lueur d'Espoir</p></nav><div class="tricolore"></div>`;
}
/* bandeau d'ouverture : image en WebP (≈70 Ko, 30 Ko sur mobile au lieu de 250 Ko), animée par ui.js ; médaillon du logo sur grand écran */
const BANDEAU = (img, contenu, court) => `<section class="ouverture${court ? " court" : ""}" style="--img:url(img/${img}-1280.webp);--img-m:url(img/${img}-768.webp)"><div class="fond"></div>${court ? "" : '<img class="badge" src="img/logo_bmt-160.webp" width="160" height="156" alt="">'}<div class="wrap"><div class="corps">${contenu}</div></div></section>`;
const FOOT = `<footer><div class="wrap">
  <div class="a-propos-pied"><img src="img/logo_bmt-160.webp" width="44" height="43" alt="BMT Green Academy"><img src="img/logo_lueur-160.webp" width="44" height="44" alt="ONG Lueur d'Espoir"><b>La Noblesse du <em>Cœur</em></b>Respect, dignité, leadership, paix.<br>Programme d'éducation citoyenne, Côte d'Ivoire.</div>
  <div><h4>Les élèves</h4><a href="form.html?f=eleve_inscr">Inscription des élèves</a><a href="quiz.html">Quiz d'entraînement</a><a href="index.html#pdf">Fiches à imprimer</a></div>
  <div><h4>L'équipe</h4><a href="index.html">Parcours du programme</a><a href="liens.html">Tous les liens</a><a href="dashboard.html">Tableau de bord</a></div>
  <p class="partenaire">En partenariat avec l'Association des Arts-Thérapeutes, Coachs et Praticiens Holistiques de Côte d'Ivoire.</p></div></footer>`;
const FOOT_ONG = `<footer><div class="wrap"><div><b>ONG Lueur d'Espoir</b>Aidez-nous à nous aider</div></div></footer>`;
const DEMO = () => notConfigured() ? '<div class="warn"><b>Mode démonstration.</b> La base de données n\'est pas encore connectée : les formulaires fonctionnent, mais les réponses ne sont pas enregistrées.</div>' : "";

/* Le parcours du programme : chaque étape et ses supports */
/* Dans les titres, *mot* devient un mot en italique doré (comme sur le site BMT Green Academy) ; brut() retire les marques pour WhatsApp et les listes */
const titreHtml = t => esc(t).replace(/\*(.+?)\*/g, "<em>$1</em>"), brut = t => t.replace(/\*/g, "");
const ETAPES = [
  { id: "avant", court: "Avant", t: "Avant la *formation*", s: "Enregistrer l'établissement et mesurer le point de départ.", items: [
    ["engagement", "", "Kit du responsable", "Enregistrement de l'établissement et engagement du responsable."],
    ["eval", "avant", "Évaluation de l'élève, avant", "7 affirmations notées de 1 à 5, une fiche par élève."],
    ["ens", "avant", "Grille enseignant, avant", "5 comportements notés par l'enseignant, une grille par élève."]] },
  { id: "pendant", court: "Pendant", t: "Pendant la *formation*", s: "Noter les incidents de chaque classe.", items: [
    ["inc", "", "Registre des incidents", "Conflits, bagarres, insultes et sanctions, avant et après."]] },
  { id: "apres", court: "Après", t: "Après la *formation*", s: "Mesurer les progrès et faire le bilan.", items: [
    ["eval", "apres", "Évaluation de l'élève, après", "Les mêmes 7 affirmations, pour comparer avec le départ."],
    ["ens", "apres", "Grille enseignant, après", "Les mêmes 5 comportements, notés à la fin."],
    ["suivi", "", "Fiche de suivi individuel", "4 compétences au début et à la fin, et les incidents éventuels."],
    ["rapport", "", "Rapport d'évaluation", "Le bilan de l'établissement et le retour des enseignants."]] },
  { id: "selection", court: "Sélection", t: "Sélection et *reconnaissance*", s: "Retenir les élèves à fort potentiel et les honorer.", items: [
    ["pv", "", "Procès-verbal de sélection", "La validation officielle de la sélection, un PV par établissement."],
    ["liste", "", "Liste des élèves retenus", "La liste nominative jointe au PV."],
    ["@certificat.html", "", "Certificat Ambassadeur Junior", "Saisir le nom de l'élève et imprimer son certificat."]] },
  { id: "ong", court: "ONG", t: "ONG Lueur d'*Espoir*", s: "Inscrire les personnes accompagnées par l'ONG.", items: [
    ["ong", "", "Inscription des bénéficiaires", "Chaque inscription ouvre un dossier avec un numéro unique."]] },
  { id: "eleves", court: "Élèves", t: "Inscription des *élèves*", s: "Campagne de sensibilisation en milieu scolaire : un lien pour tous les élèves.", items: [
    ["eleve_inscr", "", "Inscription de l'élève (lien général)", "Nom, prénoms, classe, établissement et groupe à choisir."],
    ["eleve_inscr", "lycee=mamie&groupe=1", "Lycée Mamie Faitai · Groupe 1", "Lien à donner à ce groupe : l'établissement et le groupe sont déjà choisis."],
    ["eleve_inscr", "lycee=mamie&groupe=2", "Lycée Mamie Faitai · Groupe 2", "Lien à donner à ce groupe : l'établissement et le groupe sont déjà choisis."],
    ["eleve_inscr", "lycee=gnalega&groupe=1", "Lycée de Garçons Gnaléga Mémé Jérémie · Groupe 1", "Lien à donner à ce groupe : l'établissement et le groupe sont déjà choisis."],
    ["eleve_inscr", "lycee=gnalega&groupe=2", "Lycée de Garçons Gnaléga Mémé Jérémie · Groupe 2", "Lien à donner à ce groupe : l'établissement et le groupe sont déjà choisis."]] },
  { id: "quiz", court: "Quiz", t: "Quiz d'*entraînement*", s: "Pour les élèves : réviser les modules de l'Axe 1 et de l'Axe 2.", items: [
    ["@quiz.html", "", "Quiz d'entraînement", "Questions à choix avec correction immédiate, sur téléphone."]] },
  { id: "formations", court: "Formations", t: "Formations BMT Green *Academy*", s: "S'inscrire aux formations de BMT Green Academy.", items: [
    ["inscription", "", "Inscription aux formations", "Demande d'inscription : l'équipe BMT vous recontacte."]] },
  { id: "pilotage", court: "*Résultats*", t: "*Résultats*", s: "Suivre le programme en direct.", items: [
    ["@dashboard.html", "", "Tableau de bord", "Inscrits, progrès, élèves éligibles et bénéficiaires.", true]] },
];
const href = (k, ph) => k.startsWith("@") ? k.slice(1) : `form.html?f=${k}${ph ? "&" + (ph.includes("=") ? ph : "phase=" + ph) : ""}`;   // ph = "avant" / "apres", ou un paramètre complet (ex. « lycee=mamie&groupe=1 »)
const vignette = k => (FORMS[k] || {}).img || (k.includes("certificat") ? "basilique" : "plateau");

/* ---------------- accueil ---------------- */
function renderHome() {
  document.title = "La Noblesse du Cœur — saisie et suivi du programme";
  app().innerHTML = header() + BANDEAU("basilique", `
    <span class="eyebrow" style="--k:0">Programme 2026-2027 · Bingerville</span>
    <h1>La Noblesse du <em>Cœur</em></h1>
    <p class="lead" style="--k:1">Saisissez ici les fiches du programme, étape par étape. Chaque formulaire se remplit en une à trois minutes, à partir de la fiche papier.</p>
    <div class="cta" style="--k:2"><a class="btn or" href="#avant">Commencer le parcours</a><a class="btn clair" href="quiz.html">Quiz des élèves</a></div>`) + `
  <nav class="frise" aria-label="Étapes du programme"><ol>${ETAPES.map((e, i) => `<li><a href="#${e.id}"><i>${i + 1}</i>${e.court}</a></li>`).join("")}<span class="trait" aria-hidden="true"></span></ol></nav>
  <main id="contenu" tabindex="-1">${DEMO() ? `<div class="wrap">${DEMO()}</div>` : ""}
    ${ETAPES.map((e, i) => `<section class="etape bande${i % 2 ? " sable" : ""}${e.id === "quiz" ? " sombre" : ""}" id="${e.id}"><div class="wrap"><div class="etape-tete"><span class="num">${i + 1}</span><div><h2>${titreHtml(e.t)}</h2><p>${esc(e.s)}</p></div></div>
      <div class="liste">${e.items.map(([k, ph, label, d, prive]) => `<a class="item${prive ? " prive" : ""}" href="${href(k, ph)}"><span class="vignette" style="--v:url(img/${vignette(k)}-thumb.webp)"></span>
        <span class="txt"><b>${esc(label)}</b><span>${esc(d)}</span></span><span class="chev" aria-hidden="true"></span></a>`).join("")}</div></div></section>`).join("")}
    <section class="etape bande sable" id="pdf"><div class="wrap"><div class="etape-tete"><div><h2>Fiches à <em>imprimer</em></h2><p>Les mêmes supports en PDF, à imprimer ou à remplir sur l'écran.</p></div></div>
      <div class="dl">${PDFS.map(([f, l]) => `<a href="pdf/${f}.pdf" download>${l}</a>`).join("")}</div>
      <p class="lien-bas"><a href="liens.html">Copier les liens pour WhatsApp</a></p></div></section>
  </main>` + FOOT;
  const liens = [...document.querySelectorAll(".frise a")], secs = ETAPES.map(e => document.getElementById(e.id)), ol = $(".frise ol");
  const io = new IntersectionObserver(en => en.forEach(x => {
    if (!x.isIntersecting) return;
    liens.forEach(a => a.classList.toggle("actif", a.hash === "#" + x.target.id));
    const actif = liens.find(a => a.classList.contains("actif")); if (actif && window.UI) UI.trait(ol, actif);   // le trait doré glisse sous l'étape active
  }), { rootMargin: "-40% 0px -55% 0px" });
  secs.forEach(s => io.observe(s));
  UIok();
}
const PDFS = [["Kit_complet_La_Noblesse_du_Coeur", "Kit complet"], ["01_Kit_responsable_etablissement", "Kit du responsable"], ["02_Evaluation_eleve_AVANT", "Évaluation avant"],
  ["03_Evaluation_eleve_APRES", "Évaluation après"], ["04_Grille_evaluation_enseignant", "Grille enseignant"], ["05_Registre_des_incidents", "Registre des incidents"],
  ["06_Fiche_suivi_individuel", "Suivi individuel"], ["07_Rapport_evaluation_programme", "Rapport d'évaluation"], ["08_PV_selection", "PV de sélection"],
  ["09_Liste_eleves_retenus", "Liste des retenus"], ["10_Certificat_Ambassadeur_Junior", "Certificat"], ["Fiche_beneficiaire_ONG_Lueur_dEspoir", "Fiche bénéficiaire ONG"]];

/* ---------------- page des liens ---------------- */
function renderLinks() {
  document.title = "Tous les liens — La Noblesse du Cœur";
  const text = ETAPES.map((e, i) => `*${i + 1}. ${brut(e.t)}*\n` + e.items.map(it => `${it[2]} :\n${BASE + href(it[0], it[1])}`).join("\n\n")).join("\n\n");
  const titre = "La Noblesse du Cœur — liens des formulaires\n\n";
  app().innerHTML = header() + BANDEAU("hkb", `<span class="eyebrow" style="--k:0">Pour l'équipe</span><h1>Tous les <em>liens</em></h1><p class="lead" style="--k:1">Chaque lien avec son intitulé, à copier ou à envoyer par WhatsApp.</p>`, true) + `
  <main class="wrap" id="contenu" tabindex="-1"><div class="actions" style="margin:28px 0 4px"><button class="btn" id="cpall">Copier toute la liste</button>
    <a class="btn sec" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(titre + text)}">Envoyer par WhatsApp</a></div>
  ${ETAPES.map((e, i) => `<section class="etape"><div class="etape-tete"><span class="num">${i + 1}</span><div><h2>${titreHtml(e.t)}</h2></div></div><div class="liste">${e.items.map(it => { const u = BASE + href(it[0], it[1]); return `
    <div class="lnk"><div><b>${esc(it[2])}</b><a href="${u}">${esc(u)}</a></div><button class="btn sec cp" data-u="${esc(u)}">Copier</button></div>`; }).join("")}</div></section>`).join("")}
  </main>` + FOOT;
  const copy = (t, b) => navigator.clipboard.writeText(t).then(() => { const o = b.textContent; b.textContent = "Copié"; b.disabled = true; setTimeout(() => { b.textContent = o; b.disabled = false; }, 1500); });
  document.querySelectorAll(".cp").forEach(b => b.onclick = () => copy(b.dataset.u, b));
  $("#cpall").onclick = e => copy(titre + text, e.target);
  UIok();
}

/* ---------------- formulaire ---------------- */
function field(c) {
  const req = c.req ? ' <span class="req">*</span>' : "";
  const help = c.help ? `<div class="help">${esc(c.help)}</div>` : "";
  const cls = "fld" + (c.half ? " half" : "");
  switch (c.t) {
    case "section": return `<div class="fld"><div class="sect">${esc(c.l)}</div></div>`;
    case "text": case "number": case "date": case "tel": case "email":
      return `<div class="${cls}"><label for="${c.k}">${esc(c.l)}${req}</label>${help}<input id="${c.k}" name="${c.k}" type="${c.t}" ${c.req ? "required" : ""} ${c.ph ? `placeholder="${esc(c.ph)}"` : ""} ${c.t === "number" ? 'min="0" step="any" inputmode="decimal"' : ""} ${c.list ? `list="${c.list}" autocomplete="on"` : ""}></div>`;
    case "textarea": return `<div class="${cls}"><label for="${c.k}">${esc(c.l)}${req}</label>${help}<textarea id="${c.k}" name="${c.k}" ${c.req ? "required" : ""}></textarea></div>`;
    case "select": return `<div class="${cls}"><label for="${c.k}">${esc(c.l)}${req}</label><select id="${c.k}" name="${c.k}">${c.opts.map(o => `<option>${esc(o)}</option>`).join("")}</select></div>`;
    case "radio": case "checks":
      return `<div class="${cls}"><span class="lb">${esc(c.l)}${req}</span>${help}<div class="opts">${c.opts.map(o =>
        `<label><input type="${c.t === "radio" ? "radio" : "checkbox"}" name="${c.k}" value="${esc(o)}">${esc(o)}</label>`).join("")}</div></div>`;
    case "likert":
      return `<div class="fld"><span class="lb">${esc(c.l)}${req}</span><div class="echelle">${c.scale.map((s, i) => `<span><b>${i + 1}</b> ${s}</span>`).join("")}</div><div class="lk">${c.rows.map((r, i) =>
        `<div class="q" data-q="${c.k}${i + 1}"><div class="qt"><em>${i + 1}</em>${esc(r)}</div><div class="sc">${[1, 2, 3, 4, 5].map(v =>
          `<label><input type="radio" name="${c.k}${i + 1}" value="${v}"><b>${v}</b><span>${esc(c.scale[v - 1])}</span></label>`).join("")}</div></div>`).join("")}</div></div>`;
    case "incidents":
      return `<div class="fld"><span class="lb">${esc(c.l)} <span class="req">*</span></span><div class="box" style="padding:0"><table class="inc"><tr><th>Type d'incident</th><th>Avant</th><th>Après</th></tr>${c.rows.map((r, i) =>
        `<tr><td>${esc(r)}</td><td><input type="number" min="0" inputmode="numeric" name="av${i + 1}"></td><td><input type="number" min="0" inputmode="numeric" name="ap${i + 1}"></td></tr>`).join("")}</table></div></div>`;
    case "rows":
      return `<div class="fld"><span class="lb">${esc(c.l)}${req}</span><div class="box" style="padding:0"><table class="inc rows" data-rows="${c.k}"><tr><th style="width:32px">N°</th>${c.cols.map(x => `<th${x.w ? ` style="width:${x.w}"` : ""}>${esc(x.l)}</th>`).join("")}<th style="width:36px"></th></tr></table></div>
        <div class="actions" style="margin-top:8px"><button type="button" class="btn sec addrow" data-k="${c.k}">Ajouter un élève</button></div></div>`;
  }
  return "";
}
function addRow(c, table) {
  const n = table.rows.length;
  const tr = table.insertRow();
  tr.innerHTML = `<td style="text-align:center;font-weight:700;color:var(--vert)">${n}</td>` + c.cols.map(x => `<td>${x.opts
    ? `<select data-c="${x.k}"><option value="">${esc(x.l)}</option>${x.opts.map(o => `<option>${esc(o)}</option>`).join("")}</select>`
    : `<input placeholder="${esc(x.l)}" type="${x.num ? "number" : "text"}" ${x.num ? 'step="any" min="0" max="5" inputmode="decimal"' : ""} data-c="${x.k}">`}</td>`).join("") +
    `<td><button type="button" class="del" title="Supprimer">✕</button></td>`;
  tr.querySelector(".del").onclick = () => { tr.remove(); [...table.rows].slice(1).forEach((r, i) => r.cells[0].textContent = i + 1); };
}

function blocs(champs) {
  const out = []; let cur = { t: "Identification", items: [] };
  const push = () => { if (cur.items.length) out.push(cur); };
  for (const c of champs) {
    if (c.t === "section") { push(); cur = { t: c.l, items: [] }; }
    else if (["likert", "incidents", "rows"].includes(c.t)) { push(); out.push({ t: c.l, items: [c], solo: true }); cur = { t: "Observations et validation", items: [] }; }
    else cur.items.push(c);
  }
  push(); return out;
}
function renderForm(key) {
  const f = FORMS[key];
  if (!f) { location.href = "index.html"; return; }
  const ph = new URLSearchParams(location.search).get("phase");
  const phaseVal = ph === "avant" ? "Avant le programme" : ph === "apres" ? "Après le programme" : "";
  const titre = f.titre + (phaseVal ? (ph === "avant" ? ", avant le programme" : ", après le programme") : "");
  document.title = titre + " — La Noblesse du Cœur";
  app().innerHTML = header(f.ong ? "ong" : "") + BANDEAU(f.img, `<span class="eyebrow" style="--k:0">${f.ong ? "Inscription" : "Saisie du programme"}</span><h1>${esc(titre)}</h1><p class="lead" style="--k:1">${esc(f.desc)}</p>`, true) + `
  <div class="progression"><div class="wrap"><b>${esc(f.court || f.titre)}</b><span class="jauge" role="progressbar" aria-label="Avancement"><i></i></span><small id="pc">0 %</small></div></div>
  <main class="wrap" id="contenu" tabindex="-1"><form class="f" novalidate><input type="text" name="site_web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">${DEMO()}
    ${blocs(f.champs).map(b => `<fieldset class="bloc${b.solo ? " solo" : ""}" style="border:1px solid var(--filet)"><h2>${esc(b.t)}</h2><div class="row">${b.items.map(field).join("")}</div></fieldset>`).join("")}
    <div id="err"></div>
    <div class="envoi"><div class="actions" style="margin:0"><button class="btn" type="submit">Envoyer la fiche</button>${f.ong ? "" : '<a class="btn sec" href="index.html">Retour à l\'accueil</a>'}</div>
    <p class="help" style="margin:8px 0 0">Les champs marqués <span class="req">*</span> sont obligatoires.</p></div>
  </form><datalist id="etabs"></datalist><datalist id="eleves"></datalist></main>` + (f.ong ? FOOT_ONG : FOOT);
  store.get("ndc_etabs", []).forEach(e => $("#etabs").insertAdjacentHTML("beforeend", `<option value="${esc(e)}">`));
  const last = store.get("ndc_last", {}); ["etab", "classe", "enseignant", "resp", "resp_prog", "chef", "ville"].forEach(k => { const el = $(`input[name=${k}]`); if (el && last[k]) el.value = last[k]; });
  if (phaseVal) { const r = $(`input[name=phase][value="${phaseVal}"]`); if (r) { r.checked = true; document.querySelectorAll("input[name=phase]").forEach(i => { if (!i.checked) i.closest("label").style.display = "none"; }); } }
  const lien = new URLSearchParams(location.search);   // liens préremplis (ex. lycee=mamie&groupe=1)
  Object.entries(f.prefill || {}).forEach(([param, [champ, valeurs]]) => { const v = valeurs[lien.get(param)], el = $(`select[name=${champ}]`); if (v && el) el.value = v; });
  f.champs.filter(c => c.t === "rows").forEach(c => { const t = $(`[data-rows=${c.k}]`); for (let i = 0; i < 5; i++) addRow(c, t); $(`.addrow[data-k=${c.k}]`).onclick = () => addRow(c, t); });
  const majEleves = () => { const g = store.get("ndc_eleves", {}), k = ["etab", "classe"].map(n => { const i = $(`input[name=${n}]`); return i ? i.value.trim().toLowerCase() : ""; }).join("|"); $("#eleves").innerHTML = (g[k] || []).map(n => `<option value="${esc(n)}">`).join(""); };
  ["etab", "classe"].forEach(n => { const i = $(`input[name=${n}]`); if (i) i.addEventListener("input", majEleves); }); majEleves();
  const form = $("form");
  const maj = () => {   // avancement : champs obligatoires et lignes d'échelle remplis
    let tot = 0, ok = 0;
    f.champs.forEach(c => {
      if (c.t === "likert") c.rows.forEach((r, i) => { tot++; if (form.querySelector(`input[name="${c.k}${i + 1}"]:checked`)) ok++; });
      else if (c.t === "incidents") c.rows.forEach((r, i) => ["av", "ap"].forEach(p => { tot++; if (form.querySelector(`[name=${p}${i + 1}]`).value !== "") ok++; }));
      else if (c.t === "rows") { tot++; if ([...form.querySelectorAll(`[data-rows=${c.k}] [data-c=${c.cols[0].k}]`)].some(x => x.value.trim())) ok++; }
      else if (c.req && c.t !== "section") { tot++; if (c.t === "radio" || c.t === "checks" ? form.querySelector(`input[name="${c.k}"]:checked`) : (form.querySelector(`[name="${c.k}"]`).value || "").trim()) ok++; }
    });
    const p = tot ? Math.round(ok / tot * 100) : 0; jauge(p / 100); $("#pc").textContent = p + " %";
  };
  form.addEventListener("input", maj); form.addEventListener("change", maj); maj();
  form.addEventListener("submit", ev => { ev.preventDefault(); submit(key, ev.target); });
  // le message d'un champ disparaît dès que l'élève le corrige ; un clic dans le résumé mène au champ concerné
  const corrige = e => { const fld = e.target.closest && e.target.closest(".fld.invalide"); if (!fld) return; fld.classList.remove("invalide"); fld.querySelectorAll(".err-champ").forEach(x => x.remove()); fld.querySelectorAll("[aria-invalid]").forEach(x => { x.removeAttribute("aria-invalid"); x.removeAttribute("aria-describedby"); }); };
  form.addEventListener("input", corrige); form.addEventListener("change", corrige);
  $("#err").addEventListener("click", e => {
    const a = e.target.closest("a[data-i]"); if (!a || !form._miss) return;
    e.preventDefault(); const el = form._miss[+a.dataset.i].el; el.scrollIntoView({ behavior: UI_REDUIT() ? "auto" : "smooth", block: "center" }); el.focus({ preventScroll: true });
  });
  UIok();
}

/* Lit le formulaire. Chaque champ manquant est repéré avec son élément (el) et son message : voir signaler(). */
function collect(key, form) {
  const f = FORMS[key], data = { form: key }, miss = [];
  effacerErreurs(form);
  const manque = (t, el, msg, ligne) => miss.push({ t, el, msg, ligne });
  for (const c of f.champs) {
    if (c.t === "section") continue;
    if (c.t === "likert") {
      c.rows.forEach((r, i) => {
        const n = c.k + (i + 1), v = form.querySelector(`input[name="${n}"]:checked`);
        data[n] = v ? Number(v.value) : "";
        if (c.req && !v) manque(`${c.l} — ${r}`, form.querySelector(`input[name="${n}"]`), "", form.querySelector(`[data-q="${n}"]`));
      });
    } else if (c.t === "incidents") {
      c.rows.forEach((r, i) => ["av", "ap"].forEach(p => {
        const el = form.querySelector(`[name=${p}${i + 1}]`); data[p + (i + 1)] = el.value === "" ? "" : Number(el.value);
        if (el.value === "") manque(`${r} (${p === "av" ? "avant" : "après"})`, el, "Saisissez un nombre dans chaque case (0 s'il n'y a aucun incident).");
      }));
    } else if (c.t === "rows") {
      data[c.k] = [...form.querySelectorAll(`[data-rows=${c.k}] tr`)].slice(1).map(tr => {
        const o = {}; tr.querySelectorAll("[data-c]").forEach(i => o[i.dataset.c] = i.value.trim()); return o;
      }).filter(o => o[c.cols[0].k]);
      if (c.req && !data[c.k].length) manque(c.l + " (au moins un élève)", form.querySelector(`[data-rows=${c.k}] [data-c]`), "Écrivez au moins un nom.");
    } else if (c.t === "radio") {
      const v = form.querySelector(`input[name="${c.k}"]:checked`); data[c.k] = v ? v.value : "";
      if (c.req && !v) manque(c.l, form.querySelector(`input[name="${c.k}"]`), "Choisissez une réponse.");
    } else if (c.t === "checks") {
      data[c.k] = [...form.querySelectorAll(`input[name="${c.k}"]:checked`)].map(i => i.value).join(", ");
      if (c.req && !data[c.k]) manque(c.l, form.querySelector(`input[name="${c.k}"]`), "Cochez au moins une case.");
    } else {
      const el = form.querySelector(`[name="${c.k}"]`); data[c.k] = el.value.trim();
      if (c.req && !data[c.k]) manque(c.l, el, c.t === "select" ? "Choisissez dans la liste." : "Ce champ est obligatoire.");
    }
  }
  return { data, miss };
}

function effacerErreurs(form) {
  form.querySelectorAll(".invalide").forEach(e => e.classList.remove("invalide"));
  form.querySelectorAll(".err-champ").forEach(e => e.remove());
  form.querySelectorAll("[aria-invalid]").forEach(e => { e.removeAttribute("aria-invalid"); e.removeAttribute("aria-describedby"); });
  form.querySelectorAll(".miss").forEach(e => e.classList.remove("miss"));
}

/* Règles d'accessibilité : un message à côté de chaque champ en défaut (relié par aria-describedby), un résumé en tête
   qui reçoit le focus et dont chaque ligne mène au champ concerné. */
function signaler(form, miss) {
  miss.forEach((m, i) => {
    m.el.setAttribute("aria-invalid", "true");
    if (m.ligne) m.ligne.classList.add("miss");
    const fld = m.el.closest(".fld");
    if (!fld || !m.msg || fld.classList.contains("invalide")) return;
    fld.classList.add("invalide");
    const p = document.createElement("p"); p.className = "err-champ"; p.id = "err-champ-" + i; p.textContent = m.msg; fld.appendChild(p);
    m.el.setAttribute("aria-describedby", p.id);
  });
  form._miss = miss;
  const n = miss.length;
  $("#err").innerHTML = `<div class="warn" role="alert" tabindex="-1" id="resume-err"><b>${n} point${n > 1 ? "s" : ""} à corriger avant d'envoyer :</b><ul style="margin:8px 0 0;padding-left:20px">${miss.map((m, i) => `<li><a href="#" data-i="${i}">${esc(m.t)}</a></li>`).join("")}</ul></div>`;
  const r = $("#resume-err"); r.scrollIntoView({ behavior: UI_REDUIT() ? "auto" : "smooth", block: "center" }); r.focus({ preventScroll: true });
}

async function submit(key, form) {
  const { data, miss } = collect(key, form), err = $("#err");
  const hp = form.querySelector("[name=site_web]"); if (hp && hp.value) data.site_web = hp.value;
  if (miss.length) { signaler(form, miss); return; }
  err.innerHTML = "";
  const last = store.get("ndc_last", {}); ["etab", "classe", "enseignant", "resp", "resp_prog", "chef", "ville"].forEach(k => data[k] && (last[k] = data[k])); store.set("ndc_last", last);
  if (data.etab) { const l = new Set(store.get("ndc_etabs", [])); l.add(data.etab); store.set("ndc_etabs", [...l].slice(-30)); }
  if (data.nom && data.etab && data.classe) { const g = store.get("ndc_eleves", {}), k = [data.etab, data.classe].map(s => s.trim().toLowerCase()).join("|"), l = new Set(g[k] || []); l.add(data.nom); g[k] = [...l].slice(-80); store.set("ndc_eleves", g); }
  const btn = form.querySelector("button[type=submit]"); window.UI ? UI.charge(btn, true, "Envoi en cours…") : (btn.disabled = true);
  let res = { ok: true, demo: true };
  if (!notConfigured()) {
    try { res = await (await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })).json(); }
    catch (e) { res = { ok: false, error: "Connexion impossible. Vérifiez internet puis réessayez." }; }
  }
  if (!res.ok) { window.UI ? UI.charge(btn, false, "Envoyer la fiche") : (btn.disabled = false); err.innerHTML = `<div class="warn" role="alert">${esc(res.error || "Erreur")}</div>`; return; }
  const f = FORMS[key], again = location.search;
  form.innerHTML = `<div class="bloc no-rv" style="padding-bottom:14px"><div class="ok centre"><svg class="coche" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25"/><path d="M14 27l8 8 16-17"/></svg><h3 tabindex="-1" id="merci">${res.demo ? "Fiche complète (mode démonstration, non enregistrée)" : "Fiche enregistrée"}</h3>
    ${res.numero ? `<p style="font-size:18px">Numéro : <b>${esc(res.numero)}</b></p><p>Notez ce numéro : il identifie le dossier.</p>` : ""}
    <p>Merci ! ${["eval", "ens", "suivi"].includes(key) ? "Vous pouvez saisir l'élève suivant : l'établissement et la classe sont conservés." : ""}</p></div>
    <div class="actions"><a class="btn" href="form.html${esc(again)}">${f.ong ? "Inscrire une autre personne" : f.autre || "Saisir une autre fiche"}</a>${f.ong ? "" : '<a class="btn sec" href="index.html">Retour à l\'accueil</a>'}</div>`;
  jauge(1); $("#pc").textContent = "100 %"; scrollTo({ top: 0, behavior: UI_REDUIT() ? "auto" : "smooth" });
  const m = $("#merci"); if (m) m.focus({ preventScroll: true });   // le lecteur d'écran annonce la confirmation
}
const UI_REDUIT = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- pages 404 et hors connexion ---------------- */
function renderVide(titre, grand, h1, texte, boutons) {
  document.title = titre + " — La Noblesse du Cœur";
  app().innerHTML = header() + `<main id="contenu" tabindex="-1" class="vide"><span class="eyebrow">${esc(titre)}</span><div class="grand" aria-hidden="true">${grand}</div><h1>${h1}</h1><p>${esc(texte)}</p><div class="actions">${boutons}</div></main>` + FOOT;
  UIok();
}
const render404 = () => renderVide("Page introuvable", "404", "Cette page n'existe <em>pas</em>", "Le lien est peut-être ancien ou mal recopié. Revenez à l'accueil pour retrouver tous les formulaires et les quiz.",
  '<a class="btn" href="index.html">Retour à l\'accueil</a><a class="btn sec" href="quiz.html">Quiz des élèves</a>');
const renderHorsLigne = () => renderVide("Hors connexion", "·&nbsp;·&nbsp;·", "Vous êtes <em>hors connexion</em>", "Cette page n'a pas encore été ouverte sur cet appareil. Les pages déjà visitées restent disponibles ; reconnectez-vous pour afficher celle-ci.",
  '<button type="button" class="btn" onclick="location.reload()">Réessayer</button><a class="btn sec" href="index.html">Retour à l\'accueil</a>');

/* ---------------- certificat ---------------- */
function renderCertificat() {
  document.title = "Certificat Ambassadeur Junior";
  const p = new URLSearchParams(location.search);
  app().innerHTML = `<div class="noprint">${header()}<main class="wrap" id="contenu" tabindex="-1"><h2 class="sec">Certificat Ambassadeur Junior</h2>
    <div class="bloc" style="margin-top:12px"><div class="row"><div class="fld half"><label for="cn">Nom et prénoms de l'élève</label><input id="cn" type="text" value="${esc(p.get("nom") || "")}"></div>
    <div class="fld half"><label for="cd">Date</label><input id="cd" type="text" value="${esc(p.get("date") || new Date().toLocaleDateString("fr-FR"))}"></div></div>
    <div class="actions"><button class="btn" onclick="print()">Imprimer le certificat</button><span class="help" style="margin:0">Choisissez l'orientation paysage et les marges « aucune ».</span></div></div></main></div>
    <div class="cert"><img src="img/certificat.jpg" alt=""><div class="cn" id="vn"></div><div class="cdt" id="vd"></div></div><div class="noprint">${FOOT}</div>`;
  const up = () => { $("#vn").textContent = $("#cn").value; $("#vd").textContent = $("#cd").value; };
  $("#cn").oninput = $("#cd").oninput = up; up();
  UIok();
}

/* ---------------- tableau de bord ---------------- */
function renderDashboard() {
  document.title = "Tableau de bord — La Noblesse du Cœur";
  app().innerHTML = header() + BANDEAU("plateau", `<span class="eyebrow" style="--k:0">Accès réservé</span><h1>Tableau de <em>bord</em></h1><p class="lead" style="--k:1">Les résultats du programme et les inscriptions de l'ONG, mis à jour à chaque fiche envoyée.</p>`, true) + `
  <main class="wrap" id="dash" tabindex="-1"></main>` + FOOT;
  let saved = ""; try { saved = sessionStorage.getItem("ndc_code") || ""; } catch (e) {}
  if (saved) load(saved); else montrerLogin();
  UIok();
}
/* écran de saisie du code (le code reste masqué à l'écran) */
function montrerLogin(msg) {
  $("#dash").innerHTML = `<form class="bloc login" id="login" style="padding-bottom:16px"><div class="fld"><label for="code">Code d'accès</label><input id="code" type="password" autocomplete="off" required></div><button class="btn">Ouvrir le tableau de bord</button><div id="err" aria-live="polite">${msg ? `<div class="warn" role="alert">${esc(msg)}</div>` : ""}</div></form>`;
  $("#login").addEventListener("submit", e => { e.preventDefault(); load($("#code").value.trim(), $("#login .btn")); });
  if (msg) $("#code").focus();
  window.UI && UI.revele($("#dash"));
}
/* chargement : des blocs qui brillent à la place des chiffres, pour que la page ne paraisse jamais vide */
const SQUELETTE = `<div class="sk t"></div><div class="kpis">${'<div class="sk"></div>'.repeat(8)}</div><div class="sk t"></div><div class="kpis">${'<div class="sk"></div>'.repeat(6)}</div><div class="sk l" style="margin-top:14px"></div>`;
async function load(code, btn) {
  if (notConfigured()) { montrerLogin("La base de données n'est pas encore connectée."); return; }
  if (btn && window.UI) UI.charge(btn, true, "Vérification…"); else $("#dash").innerHTML = SQUELETTE;
  let d;
  try { d = await (await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "stats", code }) })).json(); }
  catch (e) { montrerLogin("Connexion impossible. Vérifiez internet puis réessayez."); return; }
  if (!d.ok) { try { sessionStorage.removeItem("ndc_code"); } catch (e) {} montrerLogin(d.error || "Code incorrect"); return; }
  try { sessionStorage.setItem("ndc_code", code); } catch (e) {}
  const fr = x => String(x).replace(".", ","), P = d.programme, O = d.ong, A = d.autres || {}, I = d.inscritsEleves || { total: 0, parGroupe: [] }, pct = x => x == null ? "—" : fr(x) + " %", n2 = x => x == null ? "—" : fr(x);
  const kpi = (v, l, s = "") => `<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;
  const bars = rows => rows.map(r => `<tr><td>${esc(r[0])}</td><td style="width:60px;text-align:right"><b>${r[1]}</b></td><td style="width:45%"><div class="bar"><i style="--w:${r[2] / 100}"></i></div></td><td style="width:60px">${fr(r[2])} %</td></tr>`).join("");
  const cert = e => `<a href="certificat.html?nom=${encodeURIComponent(e.nom)}" target="_blank">Certificat</a>`;
  const dbl = (P.doublons || []).length ? `<div class="warn"><b>Noms à vérifier : doublons probables.</b> Un même élève semble écrit de deux façons, ce qui fausse les totaux.<br>${P.doublons.map(x => `${esc(x.a)} / ${esc(x.b)} (${esc(x.etab)}, ${esc(x.classe)})`).join("<br>")}</div>` : "";
  $("#dash").innerHTML = `<div class="actions" style="margin:18px 0 0"><span class="puce-maj">Mis à jour : ${esc(d.maj)}</span><button class="btn sec" id="rf">Actualiser</button></div>
  <h2 class="sec">Participation</h2><div class="kpis">${kpi(A.responsables ?? 0, "Responsables engagés")}${kpi(P.etablissements, "Établissements")}${kpi(P.inscrits, "Élèves suivis")}${kpi(P.evalAvant, "Évaluations AVANT")}${kpi(P.evalApres, "Évaluations APRÈS")}${kpi(P.suivis, "Fiches de suivi")}${kpi(A.rapports ?? 0, "Rapports reçus")}${kpi(A.pv ?? 0, "PV de sélection")}</div>
  <h2 class="sec">Résultats</h2><div class="kpis">
    ${kpi(n2(P.moyAvant) + " → " + n2(P.moyApres), "Auto-évaluation /5", "avant → après")}
    ${kpi(pct(P.amelioration), "Amélioration moyenne")}
    ${kpi(pct(P.pctProgres), "Élèves en progrès", P.progres + " / " + P.paires)}
    ${kpi(n2(P.ensAvant) + " → " + n2(P.ensApres), "Note enseignant /5")}
    ${kpi(n2(P.suiviDebut) + " → " + n2(P.suiviFin), "Compétences /5", "début → fin")}
    ${kpi(pct(P.pctSansIncident), "Élèves sans incident", P.sansIncident + " / " + P.suivis)}
    ${kpi(P.incAvant + " → " + P.incApres, "Incidents (registres)", P.incAvant ? pct(P.reductionInc) + " de baisse" : "")}
    ${kpi(P.eligibles.length, "Élèves éligibles", pct(P.pctEligibles) + " des élèves suivis")}
    ${kpi(A.retenus ?? 0, "Élèves retenus (listes officielles)")}</div>
  ${dbl}<h2 class="sec">Élèves éligibles (calcul automatique)</h2><div class="panneau"><table class="tb"><tr><th>Élève</th><th>Établissement</th><th>Classe</th><th>Critères</th><th></th></tr>${P.eligibles.map(e => `<tr><td><b>${esc(e.nom)}</b></td><td>${esc(e.etab)}</td><td>${esc(e.classe)}</td><td class="yes">${e.crit}/4</td><td>${cert(e)}</td></tr>`).join("") || '<tr><td colspan="5">Aucun pour le moment.</td></tr>'}</table></div>
  <h2 class="sec">Par établissement</h2><div class="panneau"><table class="tb"><tr><th>Établissement</th><th>Élèves</th><th>Moy. avant</th><th>Moy. après</th><th>Éligibles</th></tr>${P.parEtab.map(e => `<tr><td>${esc(e.etab)}</td><td>${e.n}</td><td>${n2(e.av)}</td><td>${n2(e.ap)}</td><td>${e.elig}</td></tr>`).join("")}</table></div>
  <h2 class="sec">Tous les élèves</h2><div class="panneau"><table class="tb"><tr><th>Élève</th><th>Établissement</th><th>Classe</th><th>Avant</th><th>Après</th><th>Ens. après</th><th>Suivi fin</th><th>Incident</th><th>Critères</th></tr>${P.eleves.map(e => `<tr><td>${esc(e.nom)}</td><td>${esc(e.etab)}</td><td>${esc(e.classe)}</td><td>${n2(e.av)}</td><td>${n2(e.ap)}</td><td>${n2(e.ensAp)}</td><td>${n2(e.fin)}</td><td>${e.incident == null ? "—" : e.incident ? "Oui" : "Non"}</td><td class="${e.crit >= 3 ? "yes" : ""}">${e.crit}/4</td></tr>`).join("")}</table></div>
  <h2 class="sec">Campagne en milieu scolaire — inscriptions des élèves</h2><div class="kpis">${kpi(I.total, "Élèves inscrits")}</div>
  <div class="panneau"><table class="tb"><tr><th>Établissement</th><th>Groupe</th><th>Inscrits</th></tr>${I.parGroupe.map(x => `<tr><td>${esc(x.etab)}</td><td>${esc(x.groupe)}</td><td><b>${x.n}</b></td></tr>`).join("") || '<tr><td colspan="3">Aucune inscription pour le moment.</td></tr>'}</table></div>
  <h2 class="sec">ONG Lueur d'Espoir — bénéficiaires</h2><div class="kpis">${kpi(O.total, "Bénéficiaires inscrits")}</div>
  ${[["Type de handicap", O.handicap], ["Besoins identifiés", O.besoins], ["Sexe", O.sexe], ["Commune / quartier", O.commune]].map(([t, r]) => `<div class="panneau"><b>${t}</b><table class="tb">${bars(r) || "<tr><td>—</td></tr>"}</table></div>`).join("")}`;
  $("#rf").onclick = () => load(code, $("#rf"));
  window.UI && UI.revele($("#dash"));
}
