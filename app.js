/* Plateforme BMT Green Academy × ONG Lueur d'Espoir — accueil, formulaires, liens, certificat, formations, tableau de bord */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BASE = location.href.replace(/[^/]*([?#].*)?$/, "");
const externe = u => /^https?:/.test(u);                                   // adresse d'un autre site : s'ouvre dans un nouvel onglet ; sinon, page de cette application
const cibleLien = u => externe(u) ? ' target="_blank" rel="noopener"' : "";
const notConfigured = () => !API_URL;
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

/* La page est construite dans #app : le préchargeur, les barres fines et les scripts restent en dehors et ne sont jamais effacés. */
const app = () => document.getElementById("app") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "app" }));
const jauge = p => { const j = $(".jauge i"); if (j) j.style.setProperty("--p", p); };   // barre de progression : transform, pas de largeur animée
const UIok = () => window.UI && UI.pret();

/* Appel au serveur Apps Script avec un délai maximal : jamais de roue qui tourne sans fin.
   Après 45 s sans réponse, l'envoi est abandonné et un message clair s'affiche. */
const DELAI_API = 45000;
async function appelApi(corps) {
  const ctrl = new AbortController(), minuteur = setTimeout(() => ctrl.abort(), DELAI_API);
  try { return await (await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(corps), signal: ctrl.signal })).json(); }
  catch (e) { return { ok: false, error: e.name === "AbortError" ? "Le serveur met trop de temps à répondre. Attendez quelques minutes, puis réessayez." : "Connexion impossible. Vérifiez internet puis réessayez." }; }
  finally { clearTimeout(minuteur); }
}

/* Navigation principale : la même liste sert à l'en-tête (écran large) et au tiroir (mobile) */
/* Profil de la personne (élève ou participant) : gardé sur son appareil après l'inscription. Il décide de ce qu'elle voit dans « Mon espace ». */
const FORMATION_NDC = "Programme de sensibilisation La Noblesse du Cœur";
const profil = () => { const p = store.get("ndc_profil", null); return p && p.type ? p : null; };
const acces = p => ({ quiz: !!p, examen: !!p && p.type === "eleve" });   // tout inscrit suit le parcours ; l'examen final noté est ouvert aux élèves des lycées pour l'instant
const NAV = [["index.html", "Accueil"], ["equipe.html", "Espace équipe"]];                                   // site public
const NAV_EQUIPE = [["equipe.html", "Parcours"], ["liens.html", "Liens"], ["dashboard.html", "Résultats"]];   // espace réservé à l'équipe
const ctaNav = mode => mode === "equipe" ? ["index.html", "Site public"] : profil() ? ["espace.html", "Mon espace"] : ["commencer.html", "Commencer"];
const courant = h => { const [p, q] = h.split("?"), ici = location.pathname.split("/").pop() || "index.html"; return p === ici && (!q || location.search.includes(q)); };
const lienNav = ([h, t]) => `<a href="${h}"${courant(h) ? ' aria-current="page"' : ""}>${t}</a>`;

function header(mode) {
  const NAVX = mode === "equipe" ? NAV_EQUIPE : NAV, CTA_NAV = ctaNav(mode);
  const saut = `<a class="saut" href="#contenu">Aller au contenu</a>`;
  if (mode === "ong")   // page publique de l'ONG : en-tête minimal, sans navigation vers le reste du site
    return `${saut}<header class="ident"><div class="wrap"><div class="logo"><span class="nom"><b>ONG <em>Lueur</em> d'Espoir</b><span>Aidez-nous à nous aider</span></span></div>
    <img src="img/logo_lueur-160.webp" width="64" height="64" alt="ONG Lueur d'Espoir"></div></header><div class="tricolore"></div>`;
  return `${saut}<header class="ident"><div class="wrap">
    <a class="logo" href="index.html" aria-label="La Noblesse du Cœur, accueil"><span class="paire-logos"><img src="img/logo_bmt-160.webp" width="65" height="62" alt=""><i class="trait-or"></i><img src="img/logo_lueur-160.webp" width="62" height="62" alt=""></span><span class="nom"><b>La Noblesse du <em>Cœur</em></b><span>BMT Green Academy et ONG Lueur d'Espoir</span></span></a>
    <nav class="nav" aria-label="Navigation principale">${NAVX.map(lienNav).join("")}<a class="btn" href="${CTA_NAV[0]}">${CTA_NAV[1]}</a></nav>
    <button class="burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="tiroir"><span></span><span></span></button></div></header>
  <div class="voile"></div>
  <nav class="tiroir" id="tiroir" aria-label="Menu" aria-hidden="true"><div class="t-tete"><img src="img/logo_bmt-160.webp" width="67" height="64" alt="BMT Green Academy"><img src="img/logo_lueur-160.webp" width="64" height="64" alt="ONG Lueur d'Espoir"></div>
    ${NAVX.map(lienNav).join("")}<a class="btn" href="${CTA_NAV[0]}">${CTA_NAV[1]}</a><p class="t-bas">BMT Green Academy · ONG Lueur d'Espoir</p></nav><div class="tricolore"></div>`;
}
/* les deux logos en très grand, présentés tels quels, sans fond (bandeau d'ouverture) */
const DUO = `<div class="duo" aria-hidden="true"><img src="img/logo_bmt-480.webp" width="502" height="480" alt=""><img src="img/logo_lueur-480.webp" width="480" height="480" alt=""></div>`;
/* bandeau d'ouverture : image en WebP (≈70 Ko, 30 Ko sur mobile au lieu de 250 Ko), animée par ui.js, avec le double médaillon */
const BANDEAU = (img, contenu, court) => `<section class="ouverture${court ? " court" : ""}" style="--img:url(img/${img}-1280.webp);--img-m:url(img/${img}-768.webp)"><div class="fond"></div><div class="wrap">${DUO}<div class="corps">${contenu}</div></div></section>`;
/* bande des deux organisations : les logos en très grand, avec leur nom */
const PARTENAIRES = `<section class="bande partenaires" aria-labelledby="deux-orgs"><div class="wrap">
  <p class="eyebrow" id="deux-orgs">Un programme porté par deux organisations</p>
  <div class="paire">
    <figure class="org"><img class="logo-xl" src="img/logo_bmt-480.webp" width="502" height="480" alt="Logo de BMT Green Academy" loading="lazy"><figcaption><b>BMT Green <em>Academy</em></b><span>École Internationale des Arts Thérapeutiques, du Leadership Social et des Métiers Verts</span></figcaption></figure>
    <span class="croix" aria-hidden="true">×</span>
    <figure class="org"><img class="logo-xl" src="img/logo_lueur-480.webp" width="480" height="480" alt="Logo de l'ONG Lueur d'Espoir" loading="lazy"><figcaption><b>ONG Lueur d'<em>Espoir</em></b><span>Aidez-nous à nous aider</span></figcaption></figure>
  </div>
  <p class="devise">Respect, dignité, leadership, paix.</p></div></section>`;
const FOOT = `<footer><div class="wrap">
  <div class="a-propos-pied"><div class="ronds"><img src="img/logo_bmt-160.webp" width="167" height="160" alt="BMT Green Academy" loading="lazy"><img src="img/logo_lueur-160.webp" width="160" height="160" alt="ONG Lueur d'Espoir" loading="lazy"></div><b>La Noblesse du <em>Cœur</em></b>Respect, dignité, leadership, paix.<br>Programme d'éducation citoyenne, Côte d'Ivoire.</div>
  <div><h4>Élèves et participants</h4><a href="commencer.html">Commencer : s'inscrire</a><a href="espace.html">Mon espace</a>${LIENS.academie ? `<a href="${LIENS.academie}" target="_blank" rel="noopener">Pôle formation BMT Green Academy</a>` : ""}${LIENS.ong ? `<a href="${LIENS.ong}"${cibleLien(LIENS.ong)}>ONG Lueur d'Espoir</a>` : ""}</div>
  <div><h4>L'équipe</h4><a href="equipe.html">Parcours du programme</a><a href="equipe.html#pdf">Fiches à imprimer</a><a href="liens.html">Tous les liens</a><a href="dashboard.html">Tableau de bord</a></div>
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
    ["eleve_inscr", "", "Inscription de l'élève (lien général)", "L'élève choisit son lycée dans la liste, puis donne son nom, ses prénoms et sa classe."],
    ["eleve_inscr", "lycee=mamie", "Lycée Mamie Faitai de Bingerville", "Lien à donner aux élèves de ce lycée : l'établissement est déjà choisi."],
    ["eleve_inscr", "lycee=gnalega", "Lycée de Garçons Gnaléga Mémé Jérémie de Bingerville", "Lien à donner aux élèves de ce lycée : l'établissement est déjà choisi."]] },
  { id: "quiz", court: "Parcours", t: "Parcours des *élèves*", s: "Pour les élèves : les cours et auto-évaluations de l'Axe 1 et de l'Axe 2, puis un examen final par axe.", items: [
    ["@espace.html", "", "Mon espace (parcours de l'élève)", "Inscription, évaluation initiale, Axe 1, Axe 2, examens finaux, évaluation finale."],
    ["@examen.html", "", "Examens finaux (Axe 1 et Axe 2)", "15 questions pour l'Axe 1 (dont la sensibilisation) et 10 pour l'Axe 2, corrigées par le serveur : une seule tentative par axe, note transmise à la direction."]] },
  { id: "pilotage", court: "Résultats", t: "*Résultats*", s: "Suivre le programme en direct.", items: [
    ["@dashboard.html", "", "Tableau de bord", "Inscrits, progrès, élèves éligibles et bénéficiaires.", true]] },
];
const href = (k, ph) => k.startsWith("@") ? k.slice(1) : `form.html?f=${k}${ph ? "&" + (ph.includes("=") ? ph : "phase=" + ph) : ""}`;   // ph = "avant" / "apres", ou un paramètre complet (ex. « lycee=mamie »)
const vignette = k => (FORMS[k] || {}).img || (k.includes("certificat") ? "basilique" : "plateau");

/* ---------------- accueil ---------------- */
function renderHome() {
  document.title = "Espace équipe — La Noblesse du Cœur";
  app().innerHTML = header("equipe") + BANDEAU("basilique", `
    <span class="eyebrow" style="--k:0">Espace équipe · Programme 2026-2027</span>
    <h1>Espace <em>équipe</em></h1>
    <p class="lead" style="--k:1">Saisissez ici les fiches du programme, étape par étape, puis suivez les résultats des élèves et des participants. Chaque formulaire se remplit en une à trois minutes.</p>
    <div class="cta" style="--k:2"><a class="btn or" href="#avant">Commencer le parcours</a><a class="btn clair" href="dashboard.html">Voir les résultats</a></div>`) + PARTENAIRES + `
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
  app().innerHTML = header("equipe") + BANDEAU("hkb", `<span class="eyebrow" style="--k:0">Pour l'équipe</span><h1>Tous les <em>liens</em></h1><p class="lead" style="--k:1">Chaque lien avec son intitulé, à copier ou à envoyer par WhatsApp.</p>`, true) + `
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
    case "fixe": return "";
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
  app().innerHTML = header(f.ong ? "ong" : f.profil ? "" : "equipe") + BANDEAU(f.img, `<span class="eyebrow" style="--k:0">${f.ong ? "Inscription" : f.profil ? "Étape 1 · Inscription" : "Saisie du programme"}</span><h1>${esc(titre)}</h1><p class="lead" style="--k:1">${esc(f.desc)}</p>`, true) + `
  <div class="progression"><div class="wrap"><b>${esc(f.court || f.titre)}</b><span class="jauge" role="progressbar" aria-label="Avancement"><i></i></span><small id="pc">0 %</small></div></div>
  <main class="wrap" id="contenu" tabindex="-1"><form class="f" novalidate><input type="text" name="site_web" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">${DEMO()}
    ${blocs(f.champs).map(b => `<fieldset class="bloc${b.solo ? " solo" : ""}" style="border:1px solid var(--filet)"><h2>${esc(b.t)}</h2><div class="row">${b.items.map(field).join("")}</div></fieldset>`).join("")}
    <div id="err"></div>
    <div class="envoi"><div class="actions" style="margin:0"><button class="btn" type="submit">Envoyer la fiche</button>${f.ong ? "" : f.profil ? '<a class="btn sec" href="commencer.html">Changer de profil</a>' : '<a class="btn sec" href="equipe.html">Retour à l\'espace équipe</a>'}</div>
    <p class="help" style="margin:8px 0 0">Les champs marqués <span class="req">*</span> sont obligatoires.</p></div>
  </form><datalist id="etabs"></datalist><datalist id="eleves"></datalist></main>` + (f.ong ? FOOT_ONG : FOOT);
  store.get("ndc_etabs", []).forEach(e => $("#etabs").insertAdjacentHTML("beforeend", `<option value="${esc(e)}">`));
  const last = store.get("ndc_last", {}); ["etab", "classe", "enseignant", "resp", "resp_prog", "chef", "ville"].forEach(k => { const el = $(`input[name=${k}]`); if (el && last[k]) el.value = last[k]; });
  if (phaseVal) { const r = $(`input[name=phase][value="${phaseVal}"]`); if (r) { r.checked = true; document.querySelectorAll("input[name=phase]").forEach(i => { if (!i.checked) i.closest("label").style.display = "none"; }); } }
  const lien = new URLSearchParams(location.search);   // liens préremplis (ex. lycee=mamie)
  Object.entries(f.prefill || {}).forEach(([param, [champ, valeurs]]) => { const v = valeurs[lien.get(param)], el = $(`select[name=${champ}]`); if (v && el) el.value = v; });
  const moi = lien.get("moi") && profil() && profil().type === "eleve" && key === "eval" ? profil() : null;   // évaluation faite par l'élève lui-même : identité reprise de son inscription
  if (moi) { [["etab", moi.etab], ["classe", moi.classe], ["nom", (moi.nom + " " + moi.prenom).trim()]].forEach(([n, v]) => { const el = $(`input[name=${n}]`); if (el) { el.value = v; el.readOnly = true; } }); }
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
    if (c.t === "fixe") { data[c.k] = c.v; continue; }
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
    res = await appelApi(data);
  }
  if (!res.ok) { window.UI ? UI.charge(btn, false, "Envoyer la fiche") : (btn.disabled = false); err.innerHTML = `<div class="warn" role="alert">${esc(res.error || "Erreur")}</div>`; return; }
  const f = FORMS[key], again = location.search;
  if (f.profil) { store.set("ndc_profil", profilDepuis(f.profil, data, res)); bienvenue(form, f.profil, data, res); return; }
  if (key === "eval" && new URLSearchParams(location.search).get("moi")) { etapeFaite("eval_" + (new URLSearchParams(location.search).get("phase") === "apres" ? "apres" : "avant")); finEvaluation(form, res); return; }
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
  '<a class="btn" href="index.html">Retour à l\'accueil</a><a class="btn sec" href="espace.html">Mon espace</a>');
const renderHorsLigne = () => renderVide("Hors connexion", "·&nbsp;·&nbsp;·", "Vous êtes <em>hors connexion</em>", "Cette page n'a pas encore été ouverte sur cet appareil. Les pages déjà visitées restent disponibles ; reconnectez-vous pour afficher celle-ci.",
  '<button type="button" class="btn" onclick="location.reload()">Réessayer</button><a class="btn sec" href="index.html">Retour à l\'accueil</a>');

/* ---------------- certificat ---------------- */
function renderCertificat() {
  document.title = "Certificat Ambassadeur Junior";
  const p = new URLSearchParams(location.search);
  app().innerHTML = `<div class="noprint">${header("equipe")}<main class="wrap" id="contenu" tabindex="-1"><h2 class="sec">Certificat Ambassadeur Junior</h2>
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
  app().innerHTML = header("equipe") + BANDEAU("plateau", `<span class="eyebrow" style="--k:0">Accès réservé</span><h1>Tableau de <em>bord</em></h1><p class="lead" style="--k:1">Les résultats du programme et les inscriptions de l'ONG, mis à jour à chaque fiche envoyée.</p>`, true) + `
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
  if (notConfigured()) { montrerLogin("La base de données n\'est pas encore connectée."); return; }
  if (btn && window.UI) UI.charge(btn, true, "Vérification…"); else $("#dash").innerHTML = SQUELETTE;
  const d = await appelApi({ action: "stats", code });
  if (!d.ok && btn && btn.id === "rf" && !/code/i.test(d.error || "")) {   // actualisation ratée (réseau, serveur lent) : on garde les chiffres à l'écran et on explique
    window.UI && UI.charge(btn, false, "Actualiser");
    let m = $("#err-rf"); if (!m) { m = Object.assign(document.createElement("div"), { id: "err-rf", className: "warn" }); m.setAttribute("role", "alert"); btn.closest(".actions").after(m); }
    m.textContent = (d.error || "Actualisation impossible.") + " Les chiffres affichés datent de la dernière mise à jour réussie."; return;
  }
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
  <div class="panneau"><table class="tb"><tr><th>Établissement</th>${I.parGroupe.some(x => x.groupe) ? "<th>Groupe</th>" : ""}<th>Inscrits</th></tr>${I.parGroupe.map(x => `<tr><td>${esc(x.etab)}</td>${I.parGroupe.some(g => g.groupe) ? `<td>${esc(x.groupe)}</td>` : ""}<td><b>${x.n}</b></td></tr>`).join("") || '<tr><td colspan="3">Aucune inscription pour le moment.</td></tr>'}</table></div>
  ${sectionsResultats(d, fr, kpi, pct, n2)}
  <h2 class="sec">ONG Lueur d'Espoir — bénéficiaires</h2><div class="kpis">${kpi(O.total, "Bénéficiaires inscrits")}</div>
  ${[["Type de handicap", O.handicap], ["Besoins identifiés", O.besoins], ["Sexe", O.sexe], ["Commune / quartier", O.commune]].map(([t, r]) => `<div class="panneau"><b>${t}</b><table class="tb">${bars(r) || "<tr><td>—</td></tr>"}</table></div>`).join("")}`;
  $("#rf").onclick = () => load(code, $("#rf"));
  const ex = $("#export-csv"); if (ex) ex.onclick = () => exporterCsv(d.personnes || []);
  brancherPersonnes();
  window.UI && UI.revele($("#dash"));
}

/* Examens finaux, auto-évaluations des modules et liste de toutes les personnes (élèves et participants), avec export pour Excel */
function sectionsResultats(d, fr, kpi, pct, n2) {
  const X = d.examens || { copies: 0, liste: [], parEtab: [] }, Q = d.quiz || { tentatives: 0, personnes: 0, parModule: [] }, L = d.personnes || [];
  const oui = b => b === true ? '<span class="yes">Réussi</span>' : b === false ? "Non" : "—";
  return `<h2 class="sec">Examen final noté</h2><div class="kpis">${kpi(X.copies, "Copies reçues")}${kpi(pct(X.moyennePct), "Note moyenne")}${kpi(X.reussis ?? 0, "Réussites", "seuil provisoire : " + (X.seuilPct ?? 70) + " %")}${kpi(pct(X.pctReussite), "Taux de réussite")}</div>
  <div class="panneau"><table class="tb"><tr><th>Établissement</th><th>Copies</th><th>Moyenne</th><th>Réussites</th><th>Certificats (max ${X.nbCertificats ?? 150})</th></tr>${(X.parEtab || []).map(e => `<tr><td>${esc(e.etab)}</td><td>${e.n}</td><td>${pct(e.moyennePct)}</td><td>${e.reussis}</td><td><b>${e.certificats}</b></td></tr>`).join("") || '<tr><td colspan="5">Aucune copie pour le moment.</td></tr>'}</table></div>
  <div class="panneau"><table class="tb"><tr><th>Élève</th><th>Établissement</th><th>Classe</th><th>Note</th><th>Axe 1</th><th>Axe 2</th><th></th></tr>${(X.liste || []).map(x => `<tr><td><b>${esc(x.nom)} ${esc(x.prenom)}</b></td><td>${esc(x.etab)}</td><td>${esc(x.classe)}</td><td>${x.note} / ${x.total}</td><td>${x.a1 ? x.axe1 : "—"}</td><td>${x.a2 ? x.axe2 : "—"}</td><td>${x.complet ? oui(x.reussi) : "Incomplet"}</td></tr>`).join("") || '<tr><td colspan="7">Aucune copie.</td></tr>'}</table></div>
  <h2 class="sec">Auto-évaluations des modules</h2><div class="kpis">${kpi(Q.tentatives, "Essais envoyés")}${kpi(Q.personnes, "Personnes concernées")}${kpi((d.autres || {}).reflexions ?? 0, "Réflexions écrites", "sensibilisation")}</div>
  <div class="panneau"><table class="tb"><tr><th>Module</th><th>Essais</th><th>Score moyen</th></tr>${(Q.parModule || []).map(m => `<tr><td>${esc(m.titre)}</td><td>${m.n}</td><td>${pct(m.moyennePct)}</td></tr>`).join("") || '<tr><td colspan="3">Aucun essai pour le moment.</td></tr>'}</table></div>
  <h2 class="sec">Toutes les personnes (${L.length})</h2><p class="help" style="margin:0 0 10px">Cherche un nom, filtre par profil ou par état, et clique sur une ligne pour voir le détail de la personne (modules de quiz, contact). « Télécharger » donne un fichier Excel avec tout le monde.</p>
  <div class="barre-outils"><input id="rech" type="search" placeholder="Rechercher un nom, une classe, un lycée…" aria-label="Rechercher une personne">
    <select id="filtre-profil" aria-label="Filtrer par profil"><option value="">Tous les profils</option><option>Élève</option><option>Participant</option></select>
    <select id="filtre-etat" aria-label="Filtrer par état"><option value="">Tous les états</option><option value="examen">A passé l'examen</option><option value="sans-examen">N'a pas passé l'examen</option><option value="quiz">A fait des quiz</option><option value="sans-quiz">Aucun quiz</option></select>
    <button class="btn" id="export-csv" type="button">Télécharger pour Excel</button></div>
  <p class="help" id="compte-p" aria-live="polite"></p>
  <div class="panneau"><table class="tb" id="tb-pers"><thead><tr><th>Profil</th><th>Nom</th><th>Établissement ou formation</th><th>Classe</th><th>Auto-évaluations</th><th>Examens</th></tr></thead><tbody>${L.map((p, n) => `<tr class="pers" tabindex="0" aria-expanded="false" data-n="${n}" data-profil="${esc(p.type)}" data-exam="${p.examPct == null ? 0 : 1}" data-quiz="${p.quizEssais ? 1 : 0}" data-q="${esc([p.type, p.nom, p.prenom, p.etab, p.classe, p.formation].join(" ").toLowerCase())}"><td>${esc(p.type)}</td><td><b>${esc((p.nom + " " + p.prenom).trim())}</b></td><td>${esc(p.etab || p.formation)}</td><td>${esc(p.classe)}</td><td>${p.quizEssais ? p.quizEssais + " essais · " + p.quizMoy + " %" : "—"}</td><td>${p.examPct == null ? "—" : fr(p.examPct) + " % " + (p.examReussi ? "✓" : "")}</td></tr>
      <tr class="detail" hidden data-d="${n}"><td colspan="6">${detailPersonne(p, fr)}</td></tr>`).join("") || '<tr><td colspan="6">Personne pour le moment.</td></tr>'}</tbody></table></div>`;
}
/* fiche d'une personne : contact, résultat à l'examen, meilleur score de chaque module de quiz */
function detailPersonne(p, fr) {
  const mod = (p.modules || []).map(m => `<li><span>${esc(m.titre)}</span><b>${m.best} %</b><small>${m.n} essai${m.n > 1 ? "s" : ""}</small></li>`).join("");
  return `<div class="fiche"><div><h4>Informations</h4><ul class="infos"><li><span>Profil</span><b>${esc(p.type)}</b></li>${p.etab ? `<li><span>Établissement</span><b>${esc(p.etab)}</b></li>` : ""}${p.classe ? `<li><span>Classe</span><b>${esc(p.classe)}</b></li>` : ""}${p.formation ? `<li><span>Formation</span><b>${esc(p.formation)}</b></li>` : ""}${p.tel ? `<li><span>Téléphone</span><b>${esc(p.tel)}</b></li>` : ""}
    <li><span>Examen final</span><b>${p.examPct == null ? "pas encore passé" : fr(p.examPct) + " % · " + (p.examReussi ? "réussi" : "non réussi")}</b></li></ul></div>
    <div><h4>Auto-évaluations des modules</h4>${mod ? `<ul class="scores">${mod}</ul>` : "<p class=\"help\">Aucune auto-évaluation faite pour le moment.</p>"}</div></div>`;
}
/* recherche, filtres et ouverture de la fiche d'une personne */
function brancherPersonnes() {
  const tb = $("#tb-pers"); if (!tb) return;
  const lignes = [...tb.querySelectorAll("tr.pers")], r = $("#rech"), fp = $("#filtre-profil"), fe = $("#filtre-etat"), c = $("#compte-p");
  const appliquer = () => {
    const q = r.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); let n = 0;
    lignes.forEach(l => {
      const e = fe.value, ok = (!q || l.dataset.q.normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)) && (!fp.value || l.dataset.profil === fp.value)
        && (!e || (e === "examen" ? l.dataset.exam === "1" : e === "sans-examen" ? l.dataset.exam === "0" : e === "quiz" ? l.dataset.quiz === "1" : l.dataset.quiz === "0"));
      l.hidden = !ok; const d = tb.querySelector(`tr.detail[data-d="${l.dataset.n}"]`); if (!ok) { d.hidden = true; l.setAttribute("aria-expanded", "false"); } if (ok) n++;
    });
    c.textContent = n + " personne" + (n > 1 ? "s" : "") + " affichée" + (n > 1 ? "s" : "") + " sur " + lignes.length + ".";
  };
  const basculer = l => { const d = tb.querySelector(`tr.detail[data-d="${l.dataset.n}"]`), ouvert = d.hidden; d.hidden = !ouvert; l.setAttribute("aria-expanded", ouvert); };
  lignes.forEach(l => { l.onclick = () => basculer(l); l.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); basculer(l); } }; });
  [r, fp, fe].forEach(x => x.addEventListener("input", appliquer)); appliquer();
}
function exporterCsv(L) {
  const cell = v => { v = String(v ?? ""); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };   // aucune cellule ne s'exécute comme une formule dans Excel
  const lignes = [["Profil", "Nom", "Prénoms", "Établissement", "Classe", "Formation", "Téléphone", "Auto-évaluations : essais", "Auto-évaluations : moyenne %", "Examens %", "Examens réussis"], ...L.map(p => [p.type, p.nom, p.prenom, p.etab, p.classe, p.formation, p.tel || "", p.quizEssais, p.quizMoy ?? "", p.examPct ?? "", p.examReussi == null ? "" : p.examReussi ? "oui" : "non"])];
  const blob = new Blob(["﻿" + lignes.map(l => l.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "noblesse-du-coeur-resultats.csv" });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* =====================================================================================================
   Parcours de la personne : accueil public → inscription (profil) → mon espace → quiz et examen
   ===================================================================================================== */
const profilDepuis = (type, d, res) => type === "eleve"
  ? { type, etab: d.etablissement, nom: d.nom, prenom: d.prenom, classe: d.classe, numero: (res && res.numero) || "" }
  : { type, nom: d.nom, tel: d.tel, formation: d.formation || "", structure: d.structure || "", numero: (res && res.numero) || "" };
const prenomDe = p => String((p && (p.prenom || p.nom)) || "").trim().split(/\s+/)[0];
const ICONE = {
  eleve: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 8 4 18l20 10 20-10L24 8z"/><path d="M12 24v10c0 3 6 6 12 6s12-3 12-6V24"/><path d="M44 18v12"/></svg>',
  participant: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="16" r="6"/><circle cx="33" cy="18" r="5"/><path d="M5 38c0-8 5-13 12-13s12 5 12 13"/><path d="M29 27c6-1 14 2 14 11"/></svg>'
};
const CARTES_PROFIL = `<div class="profils">
  <a class="carte-profil" href="commencer.html?p=eleve" style="--k:0"><span class="pic">${ICONE.eleve}</span><h3>Je suis <em>élève</em></h3>
    <p>Tu es dans un lycée partenaire. Tu choisis ton école dans la liste, puis tu suis le parcours : cours, auto-évaluations corrigées et examens finaux.</p><span class="aller">M'inscrire comme élève</span></a>
  <a class="carte-profil" href="commencer.html?p=participant" style="--k:1"><span class="pic">${ICONE.participant}</span><h3>Je suis <em>participant(e)</em></h3>
    <p>ONG, association, enseignant(e) ou particulier : tu suis le programme de sensibilisation La Noblesse du Cœur, où que tu sois en Côte d'Ivoire.</p><span class="aller">M'inscrire comme participant</span></a></div>`;

/* installation sur l'écran d'accueil (Android / ordinateur : bouton natif ; iPhone : le mode d'emploi) */
let inviteInstall = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); inviteInstall = e; document.querySelectorAll(".installer").forEach(b => { b.hidden = false; }); });
addEventListener("appinstalled", () => document.querySelectorAll(".installer").forEach(b => { b.hidden = true; }));
const INSTALLER = `<button type="button" class="btn sec installer" hidden>Installer l'application</button>`;
function brancherInstaller() { document.querySelectorAll(".installer").forEach(b => { b.hidden = !inviteInstall; b.onclick = async () => { if (!inviteInstall) return; inviteInstall.prompt(); await inviteInstall.userChoice.catch(() => {}); inviteInstall = null; b.hidden = true; }; }); }

/* ---------------- accueil public ---------------- */
function renderAccueil() {
  document.title = "La Noblesse du Cœur — Évaluation en ligne";
  const p = profil(), nom = prenomDe(p);
  app().innerHTML = header() + BANDEAU("basilique", `
    <h1>La Noblesse du <em>Cœur</em></h1>
    <p class="sous-titre" style="--k:1">L'art de la politesse</p>
    <p class="lead" style="--k:2">${p ? `Content de te revoir, ${esc(nom)}. Retrouve ton parcours, tes auto-évaluations, tes examens et tes résultats.` : "<strong>Évaluation en ligne</strong> : inscris-toi, suis les cours de l'Axe 1 et de l'Axe 2 avec leurs auto-évaluations corrigées, puis passe tes examens finaux. Tout se fait sur téléphone, à ton rythme."}</p>
    <div class="cta" style="--k:2">${p ? '<a class="btn or" href="espace.html">Entrer dans mon espace</a>' : '<a class="btn or" href="commencer.html">Commencer</a>'}<a class="btn clair" href="#parcours">Comment ça marche</a></div>`) + `
  <main id="contenu" tabindex="-1">${DEMO() ? `<div class="wrap">${DEMO()}</div>` : ""}
    <section class="bande" id="commencer"><div class="wrap"><div class="etape-tete"><div><h2>${p ? "Ton <em>espace</em>" : "Qui <em>es-tu</em> ?"}</h2><p>${p ? "Tu es déjà inscrit(e) sur cet appareil." : "Choisis ton profil : le site te montrera uniquement ce qui te concerne."}</p></div></div>
      ${p ? `<div class="actions"><a class="btn" href="espace.html">Entrer dans mon espace</a><a class="btn sec" href="commencer.html">Ce n'est pas moi</a>${INSTALLER}</div>` : CARTES_PROFIL}</div></section>
    <section class="bande sable" id="parcours"><div class="wrap"><div class="etape-tete"><div><h2>Ton parcours en <em>trois étapes</em></h2><p>Simple, rapide, et tes résultats arrivent directement à l'équipe du programme.</p></div></div>
      <ol class="pas">
        <li style="--k:0"><i>1</i><h3>Je m'inscris</h3><p>J'indique mon école, ma classe et mon nom : une minute suffit.</p></li>
        <li style="--k:1"><i>2</i><h3>J'étudie, module par module</h3><p>Pour chaque module : le cours, puis son auto-évaluation avec la correction expliquée.</p></li>
        <li style="--k:2"><i>3</i><h3>Je passe les examens finaux</h3><p>Un examen par axe, corrigé automatiquement. Ma copie est transmise à la direction.</p></li></ol>
      <div class="actions" style="justify-content:center">${INSTALLER}</div></div></section>
    <section class="bande" id="asynchrone"><div class="wrap"><div class="etape-tete"><div><h2>Une formation <em>asynchrone</em></h2><p>Tu avances à ton rythme, où que tu sois.</p></div></div>
      <div class="pas">
        <div class="pas-i" style="--k:0"><h3>Pas d'horaire imposé</h3><p>Les supports sont disponibles dès l'inscription. Tu les lis et tu t'exerces quand tu veux, sur téléphone.</p></div>
        <div class="pas-i" style="--k:1"><h3>Corrigés immédiats</h3><p>Chaque auto-évaluation explique la bonne réponse, même quand tu te trompes. Tu peux recommencer autant que tu veux.</p></div>
        <div class="pas-i" style="--k:2"><h3>Examen à date annoncée</h3><p>Seul l'examen final s'ouvre à une date communiquée par l'équipe. Il est corrigé automatiquement.</p></div></div></div></section>
    <section class="bande sable" id="plateformes"><div class="wrap"><div class="etape-tete"><div><h2>Les autres <em>formations</em></h2><p>BMT Green Academy propose bien d'autres formations sur sa plateforme éducative.</p></div></div>
      ${BOUTON_FORMATIONS()}<div class="actions" style="justify-content:center">${lienPlateforme(LIENS.ong, "Découvrir l'ONG Lueur d'Espoir")}</div></div></section>
  </main>` + PARTENAIRES + FOOT;
  brancherInstaller();
  UIok();
}

/* ---------------- commencer : choix du profil puis inscription ---------------- */
function renderCommencer() {
  const q = new URLSearchParams(location.search).get("p"), cle = { eleve: "eleve_inscr", participant: "inscription" }[q];
  if (cle) { renderForm(cle); return; }
  document.title = "Commencer — La Noblesse du Cœur";
  const p = profil();
  app().innerHTML = header() + BANDEAU("plateau", `<span class="eyebrow" style="--k:0">Étape 1 sur 2</span><h1>Qui <em>es-tu</em> ?</h1><p class="lead" style="--k:1">Choisis ton profil. Le site te montrera ensuite uniquement les cours, les auto-évaluations et les examens qui te concernent.</p>`, true) + `
  <main class="wrap" id="contenu" tabindex="-1">
    ${p ? `<div class="ok" style="margin-top:28px"><b>Tu es inscrit(e) sur cet appareil : ${esc(prenomDe(p))}.</b> <a href="espace.html">Aller à mon espace</a>. Pour inscrire quelqu'un d'autre, choisis un profil ci-dessous.</div>` : ""}
    <div style="margin:28px 0 8px">${CARTES_PROFIL}</div></main>` + FOOT;
  UIok();
}

/* ---------------- message de bienvenue après l'inscription ---------------- */
function bienvenue(form, type, data, res) {
  const nom = prenomDe(profilDepuis(type, data)), n = 22;
  const feu = UI_REDUIT() ? "" : Array.from({ length: n }, (_, k) => { const a = (k / n) * 2 * Math.PI + Math.random() * .3, r = 90 + Math.random() * 110; return `<i class="etincelle" style="--k:${k};--dx:${Math.round(Math.cos(a) * r)}px;--dy:${Math.round(Math.sin(a) * r)}px"></i>`; }).join("");
  form.innerHTML = `<div class="bloc no-rv bienvenue"><div class="feu" aria-hidden="true">${feu}</div>
    <svg class="coche" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25"/><path d="M14 27l8 8 16-17"/></svg>
    <p class="eyebrow">${res.demo ? "Mode démonstration : non enregistré" : "Inscription enregistrée"}</p>
    <h2 tabindex="-1" id="merci">Bienvenue, <em>${esc(nom)}</em> !</h2>
    <p class="lead-b">${type === "eleve" ? "Ton espace est prêt : l'Axe 1, l'Axe 2 et les examens finaux de La Noblesse du Cœur." : "Ton espace est prêt : retrouve ici les évaluations de ta formation."}</p>
    ${res.numero ? `<p class="idu-carte">Ton identifiant unique<b>${esc(res.numero)}</b><small>Il relie ton inscription, tes évaluations, tes quiz, ton examen et ton certificat. Garde-le précieusement.</small></p>` : ""}
    <div class="actions" style="justify-content:center"><a class="btn or" href="espace.html">Entrer dans mon espace</a></div></div>`;
  jauge(1); const pc = $("#pc"); if (pc) pc.textContent = "100 %";
  scrollTo({ top: 0, behavior: UI_REDUIT() ? "auto" : "smooth" });
  const m = $("#merci"); if (m) m.focus({ preventScroll: true });
}

/* ---------------- aides communes aux quiz et à « Mon espace » ---------------- */
const NB_QUESTIONS_EXAMEN = { 1: 15, 2: 10 };   // examen final : Axe 1 = 10 questions sur l'art de la paix + 5 sur la sensibilisation ; Axe 2 = 10 questions
const SEUIL_ACCES_EXAMEN = 70;               // % minimal à CHAQUE auto-évaluation d'un axe pour ouvrir son examen final (à confirmer par la coordination)
const SEUIL_QUIZ = 70;                       // % à partir duquel un module est « maîtrisé » (simple encouragement : l'examen final a son propre seuil)
const LETTRES = "ABCD";
const melanger = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sansMouvement = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const tousModules = () => typeof QUIZ === "undefined" ? [] : QUIZ.flatMap(a => a.modules.map(m => ({ ...m, axe: a.titre, axeId: a.id })));
const etatModule = (best, m) => best[m.id] == null ? "afaire" : best[m.id] >= SEUIL_QUIZ ? "maitrise" : "encours";
const LIBELLE_ETAT = { afaire: "À faire", encours: "À retravailler", maitrise: "Maîtrisé" };
const minutes = m => Math.max(2, Math.round(m.questions.length * 0.4));
/* L'examen d'un axe s'ouvre quand tous ses modules (sensibilisation comprise) ont une auto-évaluation validée. Règle côté site : elle guide l'élève (le serveur ne la contrôle pas). */
const axeProgres = id => { const best = store.get("ndc_quiz", {}) || {}, mods = tousModules().filter(m => m.axeId === id), restants = mods.filter(m => !(best[m.id] >= SEUIL_ACCES_EXAMEN)); return { mods, restants, pret: mods.length > 0 && restants.length === 0 }; };
/* bilan de la progression de la personne (meilleur score de chaque module, gardé sur son appareil) */
function bilanQuiz() {
  const best = store.get("ndc_quiz", {}), mods = tousModules();
  const essayes = mods.filter(m => best[m.id] != null), maitrises = mods.filter(m => etatModule(best, m) === "maitrise");
  const suivant = mods.find(m => best[m.id] == null) || mods.filter(m => etatModule(best, m) === "encours").sort((a, b) => best[a.id] - best[b.id])[0] || null;
  return { best, mods, essayes, maitrises, suivant, total: mods.length,
           moyenne: essayes.length ? Math.round(essayes.reduce((s, m) => s + best[m.id], 0) / essayes.length) : null,
           pct: mods.length ? maitrises.length / mods.length : 0 };
}
/* anneau de progression : l'anneau se remplit quand allumerAnneaux() ajoute la classe « go » */
const anneau = (p, texte, cls = "") => `<div class="anneau ${cls}" style="--p:${Math.max(0, Math.min(1, p))}"><svg viewBox="0 0 132 132" aria-hidden="true"><circle class="piste" cx="66" cy="66" r="52"/><circle class="val" cx="66" cy="66" r="52"/></svg><b>${texte}</b></div>`;
const allumerAnneaux = () => requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll(".anneau").forEach(a => a.classList.add("go"))));
const puce = (v, l) => `<div class="puce-stat"><b>${v}</b><span>${l}</span></div>`;

/* ---------- parcours automatisé de l'élève : étapes faites (gardées sur l'appareil) ---------- */
const etapes = () => store.get("ndc_etapes", {});
const etapeFaite = k => { const e = etapes(); e[k] = Date.now(); store.set("ndc_etapes", e); };
function finEvaluation(form, res) {
  const apres = new URLSearchParams(location.search).get("phase") === "apres";
  form.innerHTML = `<div class="bloc no-rv bienvenue"><svg class="coche" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25"/><path d="M14 27l8 8 16-17"/></svg>
    <h2 tabindex="-1" id="merci">${apres ? "Parcours <em>terminé</em>" : "Évaluation <em>enregistrée</em>"}</h2>
    <p class="lead-b">${apres ? "Merci. Tes réponses sont transmises à l'équipe du programme. Ton certificat sera préparé après la validation officielle des résultats." : "Merci. Tu peux maintenant lire les cours, puis t'entraîner avec les quiz."}</p>
    <div class="actions" style="justify-content:center"><a class="btn or" href="espace.html">Retour à mon espace</a></div></div>`;
  jauge(1); const pc = $("#pc"); if (pc) pc.textContent = "100 %";
  scrollTo({ top: 0, behavior: UI_REDUIT() ? "auto" : "smooth" });
  const m = $("#merci"); if (m) m.focus({ preventScroll: true });
}

/* ---------- images des modules (affiches) et fiches récapitulatives ---------- */
const IMG_MODULE = {
  a1m1: { c: "mod-a1m1" }, a1m2: { c: "mod-a1m2" }, a1m3: { c: "mod-a1m3" }, a1m4: { c: "mod-a1m4" },
  a1m5: { c: "mod-a1m5", doc: "axe1-preserver-sa-vie", taille: "4 Mo" },   // sensibilisation : son propre document
  a2m1: { c: "mod-a2m1", f: ["fiche-a2m1"] }, a2m2: { c: "mod-a2m2", f: ["fiche-a2m2"] }, a2m3: { c: "mod-a2m3", f: ["fiche-a2m3"] }, a2m4: { c: "mod-a2m4", f: ["fiche-a2m4"] },
  a2m5: { c: "mod-a2m5" }, a2m6: { c: "mod-a2m6", f: [1, 2, 3, 4, 5, 6].map(n => "fiche-a2m6-" + n) },
};

/* ---------- bibliothèque : cours, guides, fiches pratiques, carnets (PDF) ---------- */
const BIBLIO = [
  { id: "axe1", axe: "Axe 1 · L'art de la paix", intro: "Savoir-vivre, politesse, civisme et vivre ensemble : les 4 modules de l'Axe 1.", docs: [
    ["axe1-art-de-la-paix", "Le cours : L'art de la paix", "Les 4 modules de l'Axe 1.", "25 Mo"],
    ["axe1-guide-ambassadeur", "Guide : L'art de la dignité", "Guide de l'Ambassadeur de la Paix, de la Fraternité et de la Dignité.", "13 Mo"],
    ["axe1-preserver-sa-vie", "Sensibilisation : Préserver sa vie", "Document de sensibilisation, complément du cours.", "4 Mo"]] },
  { id: "axe2", axe: "Axe 2 · L'art de l'impact", intro: "Influence, éthique, réseaux sociaux et liberté d'expression : les 6 modules de l'Axe 2.", docs: [
    ["axe2-cours", "Le cours : L'art de l'impact", "Les 6 modules de l'Axe 2.", "29 Mo"],
    ["axe2-manuel-droit-numerique", "Manuel de l'élève : Droit numérique", "Droit numérique et citoyenneté digitale.", "13 Mo"],
    ["axe2-fiches-pratiques", "Fiches pratiques", "Des fiches à appliquer tout de suite.", "2 Mo"],
    ["axe2-carnets-de-suivi", "Carnets de suivi", "Pour suivre ta progression pas à pas.", "2 Mo"]] },
];
const coursAxe = id => (BIBLIO.find(c => c.id === id) || BIBLIO[0]).docs[0];
const coursModule = m => { const i = IMG_MODULE[m.id] || {}; return i.doc ? [i.doc, "Sensibilisation : Préserver sa vie", "", i.taille] : coursAxe(m.axeId); };   // le PDF propre au module, sinon le cours de l'axe
function renderBibliotheque() {
  const p = profil();
  if (!p) { location.replace("commencer.html"); return; }
  document.title = "Bibliothèque — La Noblesse du Cœur";
  app().innerHTML = header() + `<section class="qtete"><div class="wrap qtete-in"><div class="qtete-txt"><span class="eyebrow">Bibliothèque</span><h1>Cours, guides et <em>fiches</em></h1>
    <p>Tous les documents du programme, en PDF. Ouvre-les quand tu veux, à ton rythme. Les cours sont aussi proposés module par module, avec leur auto-évaluation, dans chaque axe.</p></div></div></section>
  <main class="wrap" id="contenu" tabindex="-1">
    ${BIBLIO.map(c => `<section class="axe"><h2 class="axe-t">${esc(c.axe)}<small><a class="lien-cours" href="parcours.html?a=${c.id}">Aller aux modules</a></small></h2><p class="help" style="margin:-6px 0 12px">${esc(c.intro)}</p>
      <div class="liste">${c.docs.map(([f, t, d, taille]) => `<a class="item" href="pdf/cours/${f}.pdf" target="_blank" rel="noopener"><span class="vignette pdf" aria-hidden="true"><b>PDF</b></span><span class="txt"><b>${esc(t)}</b><span>${esc(d)} · ${taille}</span></span><span class="chev" aria-hidden="true"></span></a>`).join("")}</div></section>`).join("")}
    <p class="help" style="margin-top:22px">Les fichiers sont volumineux : sur téléphone, télécharge-les une fois avec le wifi si tu peux.</p>
    <div class="actions"><a class="btn" href="espace.html">Retour à mon espace</a></div></main>` + FOOT;
  UIok();
}

/* ---------------- mon espace : Axe 1, Axe 2, examens finaux : simple et regroupé ---------------- */
const lienPlateforme = (url, txt, cls = "sec") => url ? `<a class="btn ${cls}" href="${esc(url)}"${cibleLien(url)}>${txt}</a>` : "";
/* Accès au pôle formation de BMT Green Academy : l'image du bouton (fond retiré), avec une phrase en vert gras au-dessus */
const BOUTON_FORMATIONS = () => LIENS.academie
  ? `<div class="acces-formations"><p class="acces-txt">Pour découvrir les autres formations, accède au <strong>pôle formation de BMT Green Academy</strong> : touche le bouton.</p>
  <a class="btn-image" href="${esc(LIENS.academie)}" target="_blank" rel="noopener" aria-label="Nos Formations : accéder au pôle formation de BMT Green Academy"><img src="img/bouton-formations.webp" width="640" height="382" alt="Nos Formations"></a></div>`
  : `<div class="acces-formations"><p class="acces-txt"><strong>Pôle formation de BMT Green Academy</strong> : l'accès s'ouvrira très bientôt, quand les deux plateformes seront reliées.</p>
  <span class="btn-image ferme" role="img" aria-label="Nos Formations : accès bientôt ouvert"><img src="img/bouton-formations.webp" width="640" height="382" alt=""></span><p class="bientot">Accès bientôt ouvert</p></div>`;
const EXPLICATION_ASYNCHRONE = `<div class="asynchrone"><h3>Une formation <em>asynchrone</em></h3>
  <p>Pas de cours à heure fixe : tu reçois les supports dès ton inscription et tu avances à ton rythme, quand tu veux, depuis ton téléphone. Les corrigés s'affichent tout de suite. Seule l'ouverture des examens finaux est annoncée par l'équipe.</p></div>`;
function renderEspace() {
  const p = profil();
  if (!p) { location.replace("commencer.html"); return; }
  document.title = "Mon espace — La Noblesse du Cœur";
  const ac = acces(p), B = bilanQuiz(), E = etapes(), F = store.get("ndc_examen_fait", {}) || {}, eleve = p.type === "eleve";
  const idu = p.numero ? `<span class="idu">Identifiant : ${esc(p.numero)}</span>` : "";
  const ident = eleve ? `${esc(p.etab)} · ${esc(p.classe)}` : esc(String(p.structure || "Participant(e)"));
  const axe = (id, nom, titre) => { const mods = B.mods.filter(m => m.axeId === id), faits = mods.filter(m => B.best[m.id] != null).length;
    return { t: `${nom} · ${titre}`, d: `${mods.length} modules : pour chacun, le cours puis son auto-évaluation. ${faits} module${faits > 1 ? "s" : ""} suivi${faits > 1 ? "s" : ""} sur ${mods.length}.`, fait: mods.length > 0 && faits === mods.length, href: "parcours.html?a=" + id, axe: true }; };
  const examensFaits = !!(F.axe1 && F.axe2);
  const parcours = [
    { t: "Inscription", d: "Ton profil et ton identifiant unique sont enregistrés.", fait: true },
    ...(eleve ? [{ t: "Évaluation initiale", d: "7 affirmations sur ton comportement : le point de départ.", fait: !!E.eval_avant, href: "form.html?f=eval&phase=avant&moi=1" }] : []),
    axe("axe1", "Axe 1", "L'art de la paix"),
    axe("axe2", "Axe 2", "L'art de l'impact"),
    ...(ac.examen ? [{ t: "Examens finaux", d: `Un examen par axe, une seule tentative chacun, une fois toutes les auto-évaluations de l'axe validées (${SEUIL_ACCES_EXAMEN} % minimum). Axe 1 : ${F.axe1 ? "envoyé" : axeProgres("axe1").pret ? "à passer" : "à débloquer"} · Axe 2 : ${F.axe2 ? "envoyé" : axeProgres("axe2").pret ? "à passer" : "à débloquer"}.`, fait: examensFaits, href: "examen.html" },
      { t: "Évaluation finale", d: "Les mêmes 7 affirmations : on mesure ta progression.", fait: !!E.eval_apres, href: "form.html?f=eval&phase=apres&moi=1", apres: examensFaits }] : []),
  ];
  const actuelle = parcours.findIndex(e => !e.fait);
  const etapeHtml = (e, n) => { const etat = e.fait ? "fait" : n === actuelle ? "en-cours" : "a-venir", ouvert = e.href && (e.apres === undefined || e.apres);
    return `<li class="etat-${etat}" style="--k:${n}"><span class="pastille">${e.fait ? "✓" : n + 1}</span><div><b>${e.t}</b><span>${e.d}</span></div>${ouvert && n > 0 ? `<a class="btn ${e.fait ? "sec" : "or"} petit" href="${e.href}">${e.fait ? "Revoir" : n === actuelle ? "Continuer" : "Ouvrir"}</a>` : e.apres === false ? '<span class="verrou">Après les examens</span>' : ""}</li>`; };
  const cible = actuelle >= 0 ? parcours[actuelle] : null;
  const suite = cible && cible.href && cible.apres !== false ? `<a class="continuer" href="${cible.href}"><span class="cont-eyebrow">Prochaine étape</span><b>${cible.t}</b><span>${cible.d}</span><i aria-hidden="true">→</i></a>` : "";
  const ensemble = B.mods.filter(m => B.best[m.id] != null).length;
  app().innerHTML = header() + `
  <section class="qtete"><div class="wrap qtete-in"><div class="qtete-txt"><span class="eyebrow">Mon espace</span><h1>Bonjour, <em>${esc(prenomDe(p))}</em></h1><p>${ident}</p>${idu}</div>
    <div class="qtete-anneau">${anneau(B.total ? ensemble / B.total : 0, ensemble + " / " + B.total, "petit")}<small>modules suivis</small></div></div></section>
  <main class="wrap" id="contenu" tabindex="-1">
    ${suite}
    <h2 class="sec">Ton parcours</h2><ol class="etapes-esp">${parcours.map(etapeHtml).join("")}</ol>
    <h2 class="sec">Support pédagogique</h2><div class="liste"><a class="item" href="bibliotheque.html"><span class="vignette pdf" aria-hidden="true"><b>PDF</b></span><span class="txt"><b>Bibliothèque</b><span>Les cours, le guide, le manuel, les fiches pratiques et les carnets de suivi.</span></span><span class="chev" aria-hidden="true"></span></a></div>
    ${EXPLICATION_ASYNCHRONE}
    <section class="plateforme-fin" aria-labelledby="pf-t"><h2 id="pf-t">Va plus <em>loin</em></h2>${BOUTON_FORMATIONS()}</section>
    <div class="actions" style="margin-top:22px">${INSTALLER}<button type="button" class="btn sec" id="autre">Ce n'est pas moi</button></div>
    <p class="help">Astuce : pour garder le site sur ton téléphone, ouvre le menu du navigateur et choisis « Ajouter à l'écran d'accueil ».</p></main>` + FOOT;
  $("#autre").onclick = () => { try { ["ndc_profil", "ndc_etapes", "ndc_examen_fait", "ndc_parcours", "ndc_quiz"].forEach(k => localStorage.removeItem(k)); } catch (e) {} location.href = "commencer.html"; };
  brancherInstaller(); allumerAnneaux();
  UIok();
}


/* ---------------- ONG Lueur d'Espoir : page dans l'application (logo de l'ONG, présentation, contact, presse) ---------------- */
function renderOng() {
  document.title = "ONG Lueur d'Espoir — La Noblesse du Cœur";
  const tel = "+225 01 01 73 68 12", presse = typeof PRESSE !== "undefined" ? PRESSE : [];
  const image = (f, w, h, alt) => `<figure class="ong-img"><a href="img/${f}.webp" target="_blank" rel="noopener"><img src="img/${f}.webp" width="${w}" height="${h}" loading="lazy" alt="${esc(alt)}"></a></figure>`;
  const don = "https://wa.me/2250101736812?text=" + encodeURIComponent("Bonjour, je souhaite faire un don à l'ONG Lueur d'Espoir.");
  app().innerHTML = header("ong") + `
  <section class="ong-tete"><div class="wrap ong-in"><img class="ong-logo" src="img/logo_lueur-480.webp" width="480" height="480" alt="Logo de l'ONG Lueur d'Espoir">
    <div class="ong-txt"><span class="eyebrow">ONG partenaire</span><h1>ONG Lueur <em>d'Espoir</em></h1>
      <p class="devise-ong">Redonner espoir, révéler les potentiels, transformer durablement les communautés.</p>
      <ul class="valeurs-ong"><li>Dignité humaine</li><li>Inclusion sociale</li><li>Paix et vivre-ensemble</li><li>Leadership positif</li><li>Engagement citoyen</li></ul>
      <div class="actions"><a class="btn or" href="tel:+2250101736812">Appeler le ${tel}</a><a class="btn" href="${don}" target="_blank" rel="noopener">Faire un don</a></div></div></div></section>
  <main class="wrap" id="contenu" tabindex="-1">
    <div class="ong-galerie">${image("ong-affiche", 720, 1080, "Affiche de l'ONG Lueur d'Espoir : redonner espoir, révéler les potentiels, transformer durablement les communautés")}
      ${image("ong-presentation", 906, 1080, "Présentation de l'ONG Lueur d'Espoir : qui sommes-nous, vision, mission, valeurs et engagement")}
      ${image("ong-partenariats", 906, 1080, "Partenariats, engagement et devise de l'ONG Lueur d'Espoir")}</div>
    ${presse.length ? `<h2 class="sec">Dans la presse</h2><div class="liste">${presse.map(x => `<a class="item" href="${esc(x.u)}" target="_blank" rel="noopener"><span class="vignette pdf" aria-hidden="true"><b>WEB</b></span><span class="txt"><b>${esc(x.t)}</b><span>${esc(x.s || "")}</span></span><span class="chev" aria-hidden="true"></span></a>`).join("")}</div>` : ""}
    <section class="don-ong" aria-labelledby="don-t"><h2 id="don-t">Faire un <em>don</em></h2><p>Soutenir la dignité, financer l'éducation, agir avec humanité. Écris-nous sur WhatsApp : l'ONG te répond.</p>
      <a class="btn or" href="${don}" target="_blank" rel="noopener">Faire un don sur WhatsApp</a></section>
    <div class="actions" style="margin-top:26px"><a class="btn sec" href="index.html">Retour à La Noblesse du Cœur</a></div></main>` + FOOT_ONG;
  UIok();
}
