/* Plateforme BMT Green Academy × ONG Lueur d'Espoir — accueil, formulaires, liens, certificat, formations, tableau de bord */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BASE = location.href.replace(/[^/]*([?#].*)?$/, "");
const notConfigured = () => !API_URL;
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

function header(mode) {
  const ong = mode === "ong";
  return `<header class="ident"><div class="wrap">${ong ? "" : '<a href="index.html" aria-label="Accueil"><img src="img/logo_bmt.png" alt="BMT Green Academy"></a>'}
  <div class="nom"><b>${ong ? "ONG Lueur d'Espoir" : "La Noblesse du Cœur"}</b><span>${ong ? "Aidez-nous à nous aider" : "BMT Green Academy et ONG Lueur d'Espoir"}</span></div>
  <img src="img/logo_lueur.png" alt="ONG Lueur d'Espoir"></div></header><div class="tricolore"></div>`;
}
const FOOT = `<footer><div class="wrap"><div><b>Respect, dignité, leadership, paix</b><br>Programme d'éducation citoyenne, Côte d'Ivoire</div><div><a href="index.html">Accueil</a> &nbsp; <a href="liens.html">Tous les liens</a> &nbsp; <a href="dashboard.html">Tableau de bord</a></div></div></footer>`;
const DEMO = () => notConfigured() ? '<div class="warn"><b>Mode démonstration.</b> La base de données n\'est pas encore connectée : les formulaires fonctionnent, mais les réponses ne sont pas enregistrées.</div>' : "";

/* Le parcours du programme : chaque étape et ses supports */
const ETAPES = [
  { id: "avant", court: "Avant", t: "Avant la formation", s: "Enregistrer l'établissement et mesurer le point de départ.", items: [
    ["engagement", "", "Kit du responsable", "Enregistrement de l'établissement et engagement du responsable."],
    ["eval", "avant", "Évaluation de l'élève, avant", "7 affirmations notées de 1 à 5, une fiche par élève."],
    ["ens", "avant", "Grille enseignant, avant", "5 comportements notés par l'enseignant, une grille par élève."]] },
  { id: "pendant", court: "Pendant", t: "Pendant la formation", s: "Noter les incidents de chaque classe.", items: [
    ["inc", "", "Registre des incidents", "Conflits, bagarres, insultes et sanctions, avant et après."]] },
  { id: "apres", court: "Après", t: "Après la formation", s: "Mesurer les progrès et faire le bilan.", items: [
    ["eval", "apres", "Évaluation de l'élève, après", "Les mêmes 7 affirmations, pour comparer avec le départ."],
    ["ens", "apres", "Grille enseignant, après", "Les mêmes 5 comportements, notés à la fin."],
    ["suivi", "", "Fiche de suivi individuel", "4 compétences au début et à la fin, et les incidents éventuels."],
    ["rapport", "", "Rapport d'évaluation", "Le bilan de l'établissement et le retour des enseignants."]] },
  { id: "selection", court: "Sélection", t: "Sélection et reconnaissance", s: "Retenir les élèves à fort potentiel et les honorer.", items: [
    ["pv", "", "Procès-verbal de sélection", "La validation officielle de la sélection, un PV par établissement."],
    ["liste", "", "Liste des élèves retenus", "La liste nominative jointe au PV."],
    ["@certificat.html", "", "Certificat Ambassadeur Junior", "Saisir le nom de l'élève et imprimer son certificat."]] },
  { id: "ong", court: "ONG", t: "ONG Lueur d'Espoir", s: "Inscrire les personnes accompagnées par l'ONG.", items: [
    ["ong", "", "Inscription des bénéficiaires", "Chaque inscription ouvre un dossier avec un numéro unique."]] },
  { id: "pilotage", court: "Résultats", t: "Résultats", s: "Suivre le programme en direct.", items: [
    ["@dashboard.html", "", "Tableau de bord", "Inscrits, progrès, élèves éligibles et bénéficiaires.", true]] },
];
const href = (k, ph) => k.startsWith("@") ? k.slice(1) : `form.html?f=${k}${ph ? "&phase=" + ph : ""}`;
const vignette = k => (FORMS[k] || {}).img || (k.includes("certificat") ? "basilique" : "plateau");

/* ---------------- accueil ---------------- */
function renderHome() {
  document.title = "La Noblesse du Cœur — saisie et suivi du programme";
  document.body.innerHTML = header() + `
  <section class="ouverture" style="background-image:url(img/basilique.jpg)"><div class="wrap">
    <h1>La Noblesse du Cœur</h1>
    <p>Saisissez ici les fiches du programme, étape par étape. Chaque formulaire se remplit en une à trois minutes, à partir de la fiche papier.</p></div></section>
  <nav class="frise" aria-label="Étapes du programme"><ol>${ETAPES.map((e, i) => `<li><a href="#${e.id}"><i>${i + 1}</i>${e.court}</a></li>`).join("")}</ol></nav>
  <main class="wrap">${DEMO()}
    ${ETAPES.map((e, i) => `<section class="etape" id="${e.id}"><div class="etape-tete"><span class="num">${i + 1}</span><div><h2>${esc(e.t)}</h2><p>${esc(e.s)}</p></div></div>
      <div class="liste">${e.items.map(([k, ph, label, d, prive]) => `<a class="item${prive ? " prive" : ""}" href="${href(k, ph)}"><span class="vignette" style="background-image:url(img/${vignette(k)}.jpg)"></span>
        <span class="txt"><b>${esc(label)}</b><span>${esc(d)}</span></span><span class="chev" aria-hidden="true"></span></a>`).join("")}</div></section>`).join("")}
    <section class="etape" id="pdf"><div class="etape-tete"><div><h2>Fiches à imprimer</h2><p>Les mêmes supports en PDF, à imprimer ou à remplir sur l'écran.</p></div></div>
      <div class="dl">${PDFS.map(([f, l]) => `<a href="pdf/${f}.pdf" download>${l}</a>`).join("")}</div></section>
    <p style="margin-top:24px"><a href="liens.html">Copier les liens pour WhatsApp</a></p>
  </main>` + FOOT;
  const liens = [...document.querySelectorAll(".frise a")], secs = ETAPES.map(e => document.getElementById(e.id));
  const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) liens.forEach(a => a.classList.toggle("actif", a.hash === "#" + x.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
  secs.forEach(s => io.observe(s));
}
const PDFS = [["Kit_complet_La_Noblesse_du_Coeur", "Kit complet"], ["01_Kit_responsable_etablissement", "Kit du responsable"], ["02_Evaluation_eleve_AVANT", "Évaluation avant"],
  ["03_Evaluation_eleve_APRES", "Évaluation après"], ["04_Grille_evaluation_enseignant", "Grille enseignant"], ["05_Registre_des_incidents", "Registre des incidents"],
  ["06_Fiche_suivi_individuel", "Suivi individuel"], ["07_Rapport_evaluation_programme", "Rapport d'évaluation"], ["08_PV_selection", "PV de sélection"],
  ["09_Liste_eleves_retenus", "Liste des retenus"], ["10_Certificat_Ambassadeur_Junior", "Certificat"], ["Fiche_beneficiaire_ONG_Lueur_dEspoir", "Fiche bénéficiaire ONG"]];

/* ---------------- page des liens ---------------- */
function renderLinks() {
  document.title = "Tous les liens — La Noblesse du Cœur";
  const text = ETAPES.map((e, i) => `*${i + 1}. ${e.t}*\n` + e.items.map(it => `${it[2]} :\n${BASE + href(it[0], it[1])}`).join("\n\n")).join("\n\n");
  const titre = "La Noblesse du Cœur — liens des formulaires\n\n";
  document.body.innerHTML = header() + `<section class="ouverture court" style="background-image:url(img/hkb.jpg)"><div class="wrap"><h1>Tous les liens</h1><p>Chaque lien avec son intitulé, à copier ou à envoyer par WhatsApp.</p></div></section>
  <main class="wrap"><div class="actions" style="margin:20px 0 4px"><button class="btn" id="cpall">Copier toute la liste</button>
    <a class="btn sec" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(titre + text)}">Envoyer par WhatsApp</a></div>
  ${ETAPES.map((e, i) => `<section class="etape"><div class="etape-tete"><span class="num">${i + 1}</span><div><h2>${esc(e.t)}</h2></div></div><div class="liste">${e.items.map(it => { const u = BASE + href(it[0], it[1]); return `
    <div class="lnk"><div><b>${esc(it[2])}</b><a href="${u}">${esc(u)}</a></div><button class="btn sec cp" data-u="${esc(u)}">Copier</button></div>`; }).join("")}</div></section>`).join("")}
  </main>` + FOOT;
  const copy = (t, b) => navigator.clipboard.writeText(t).then(() => { const o = b.textContent; b.textContent = "Copié"; setTimeout(() => b.textContent = o, 1500); });
  document.querySelectorAll(".cp").forEach(b => b.onclick = () => copy(b.dataset.u, b));
  $("#cpall").onclick = e => copy(titre + text, e.target);
}

/* ---------------- formulaire ---------------- */
function field(c) {
  const req = c.req ? ' <span class="req">*</span>' : "";
  const help = c.help ? `<div class="help">${esc(c.help)}</div>` : "";
  const cls = "fld" + (c.half ? " half" : "");
  switch (c.t) {
    case "section": return `<div class="fld"><div class="sect">${esc(c.l)}</div></div>`;
    case "text": case "number": case "date": case "tel":
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
  tr.innerHTML = `<td style="text-align:center;font-weight:700;color:var(--g)">${n}</td>` + c.cols.map(x => `<td>${x.opts
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
  document.body.innerHTML = header(f.ong ? "ong" : "") + `
  <section class="ouverture court" style="background-image:url(img/${f.img}.jpg)"><div class="wrap"><h1>${esc(titre)}</h1><p>${esc(f.desc)}</p></div></section>
  <div class="progression"><div class="wrap"><b>${esc(f.court || f.titre)}</b><span class="jauge" role="progressbar" aria-label="Avancement"><i></i></span><small id="pc">0 %</small></div></div>
  <main class="wrap"><form class="f" novalidate>${DEMO()}
    ${blocs(f.champs).map(b => `<fieldset class="bloc${b.solo ? " solo" : ""}" style="border:1px solid var(--filet)"><h2>${esc(b.t)}</h2><div class="row">${b.items.map(field).join("")}</div></fieldset>`).join("")}
    <div id="err"></div>
    <div class="envoi"><div class="actions" style="margin:0"><button class="btn" type="submit">Envoyer la fiche</button>${f.ong ? "" : '<a class="btn sec" href="index.html">Retour à l\'accueil</a>'}</div>
    <p class="help" style="margin:8px 0 0">Les champs marqués <span class="req">*</span> sont obligatoires.</p></div>
  </form><datalist id="etabs"></datalist></main>` + FOOT;
  store.get("ndc_etabs", []).forEach(e => $("#etabs").insertAdjacentHTML("beforeend", `<option value="${esc(e)}">`));
  const last = store.get("ndc_last", {}); ["etab", "classe", "enseignant", "resp", "resp_prog", "chef", "ville"].forEach(k => { const el = $(`input[name=${k}]`); if (el && last[k]) el.value = last[k]; });
  if (phaseVal) { const r = $(`input[name=phase][value="${phaseVal}"]`); if (r) { r.checked = true; document.querySelectorAll("input[name=phase]").forEach(i => { if (!i.checked) i.closest("label").style.display = "none"; }); } }
  f.champs.filter(c => c.t === "rows").forEach(c => { const t = $(`[data-rows=${c.k}]`); for (let i = 0; i < 5; i++) addRow(c, t); $(`.addrow[data-k=${c.k}]`).onclick = () => addRow(c, t); });
  const form = $("form");
  const maj = () => {   // avancement : champs obligatoires et lignes d'échelle remplis
    let tot = 0, ok = 0;
    f.champs.forEach(c => {
      if (c.t === "likert") c.rows.forEach((r, i) => { tot++; if (form.querySelector(`input[name="${c.k}${i + 1}"]:checked`)) ok++; });
      else if (c.t === "incidents") c.rows.forEach((r, i) => ["av", "ap"].forEach(p => { tot++; if (form.querySelector(`[name=${p}${i + 1}]`).value !== "") ok++; }));
      else if (c.t === "rows") { tot++; if ([...form.querySelectorAll(`[data-rows=${c.k}] [data-c=${c.cols[0].k}]`)].some(x => x.value.trim())) ok++; }
      else if (c.req && c.t !== "section") { tot++; if (c.t === "radio" || c.t === "checks" ? form.querySelector(`input[name="${c.k}"]:checked`) : (form.querySelector(`[name="${c.k}"]`).value || "").trim()) ok++; }
    });
    const p = tot ? Math.round(ok / tot * 100) : 0; $(".jauge i").style.width = p + "%"; $("#pc").textContent = p + " %";
  };
  form.addEventListener("input", maj); form.addEventListener("change", maj); maj();
  form.addEventListener("submit", ev => { ev.preventDefault(); submit(key, ev.target); });
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
    } else if (c.t === "rows") {
      data[c.k] = [...form.querySelectorAll(`[data-rows=${c.k}] tr`)].slice(1).map(tr => {
        const o = {}; tr.querySelectorAll("[data-c]").forEach(i => o[i.dataset.c] = i.value.trim()); return o;
      }).filter(o => o[c.cols[0].k]);
      if (c.req && !data[c.k].length) miss.push(c.l + " (au moins un élève)");
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
  const last = store.get("ndc_last", {}); ["etab", "classe", "enseignant", "resp", "resp_prog", "chef", "ville"].forEach(k => data[k] && (last[k] = data[k])); store.set("ndc_last", last);
  if (data.etab) { const l = new Set(store.get("ndc_etabs", [])); l.add(data.etab); store.set("ndc_etabs", [...l].slice(-30)); }
  const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Envoi…";
  let res = { ok: true, demo: true };
  if (!notConfigured()) {
    try { res = await (await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })).json(); }
    catch (e) { res = { ok: false, error: "Connexion impossible. Vérifiez internet puis réessayez." }; }
  }
  if (!res.ok) { btn.disabled = false; btn.textContent = "Envoyer"; err.innerHTML = `<div class="warn">${esc(res.error || "Erreur")}</div>`; return; }
  const f = FORMS[key], again = location.search;
  form.innerHTML = `<div class="bloc" style="padding-bottom:14px"><div class="ok"><h3>${res.demo ? "Fiche complète (mode démonstration, non enregistrée)" : "Fiche enregistrée"}</h3>
    ${res.numero ? `<p style="font-size:18px">Numéro : <b>${esc(res.numero)}</b></p><p>Notez ce numéro : il identifie le dossier.</p>` : ""}
    <p>Merci ! ${["eval", "ens", "suivi"].includes(key) ? "Vous pouvez saisir l'élève suivant : l'établissement et la classe sont conservés." : ""}</p></div>
    <div class="actions"><a class="btn" href="form.html${esc(again)}">${f.ong ? "Inscrire une autre personne" : "Saisir une autre fiche"}</a>${f.ong ? "" : '<a class="btn sec" href="index.html">Retour à l\'accueil</a>'}</div>`;
  form.insertAdjacentHTML("beforeend", "</div>"); $(".jauge i").style.width = "100%"; $("#pc").textContent = "100 %"; scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------- certificat ---------------- */
function renderCertificat() {
  document.title = "Certificat Ambassadeur Junior";
  const p = new URLSearchParams(location.search);
  document.body.innerHTML = `<div class="noprint">${header()}<main class="wrap"><h2 class="sec">Certificat Ambassadeur Junior</h2>
    <div class="bloc" style="margin-top:12px"><div class="row"><div class="fld half"><label for="cn">Nom et prénoms de l'élève</label><input id="cn" type="text" value="${esc(p.get("nom") || "")}"></div>
    <div class="fld half"><label for="cd">Date</label><input id="cd" type="text" value="${esc(p.get("date") || new Date().toLocaleDateString("fr-FR"))}"></div></div>
    <div class="actions"><button class="btn" onclick="print()">Imprimer le certificat</button><span class="help" style="margin:0">Choisissez l'orientation paysage et les marges « aucune ».</span></div></div></main></div>
    <div class="cert"><img src="img/certificat.jpg" alt=""><div class="cn" id="vn"></div><div class="cdt" id="vd"></div></div><div class="noprint">${FOOT}</div>`;
  const up = () => { $("#vn").textContent = $("#cn").value; $("#vd").textContent = $("#cd").value; };
  $("#cn").oninput = $("#cd").oninput = up; up();
}

/* ---------------- tableau de bord ---------------- */
function renderDashboard() {
  document.title = "Tableau de bord — La Noblesse du Cœur";
  document.body.innerHTML = header() + `<section class="ouverture court" style="background-image:url(img/plateau.jpg)"><div class="wrap"><h1>Tableau de bord</h1><p>Les résultats du programme et les inscriptions de l'ONG, mis à jour à chaque fiche envoyée.</p></div></section>
  <main class="wrap" id="dash"><form class="bloc login" id="login" style="padding-bottom:16px"><div class="fld"><label for="code">Code d'accès</label><input id="code" type="text" autocomplete="off" required></div><button class="btn">Ouvrir le tableau de bord</button><div id="err"></div></form></main>` + FOOT;
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
  const fr = x => String(x).replace(".", ","), P = d.programme, O = d.ong, A = d.autres || {}, pct = x => x == null ? "—" : fr(x) + " %", n2 = x => x == null ? "—" : fr(x);
  const kpi = (v, l, s = "") => `<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;
  const bars = rows => rows.map(r => `<tr><td>${esc(r[0])}</td><td style="width:60px;text-align:right"><b>${r[1]}</b></td><td style="width:45%"><div class="bar"><i style="width:${r[2]}%"></i></div></td><td style="width:60px">${fr(r[2])} %</td></tr>`).join("");
  const cert = e => `<a href="certificat.html?nom=${encodeURIComponent(e.nom)}" target="_blank">Certificat</a>`;
  $("#dash").innerHTML = `<div class="actions" style="margin:14px 0"><span class="help" style="margin:0">Mis à jour : ${esc(d.maj)}</span><button class="btn sec" id="rf">Actualiser</button></div>
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
  <h2 class="sec">Élèves éligibles (calcul automatique)</h2><div class="panneau"><table class="tb"><tr><th>Élève</th><th>Établissement</th><th>Classe</th><th>Critères</th><th></th></tr>${P.eligibles.map(e => `<tr><td><b>${esc(e.nom)}</b></td><td>${esc(e.etab)}</td><td>${esc(e.classe)}</td><td class="yes">${e.crit}/4</td><td>${cert(e)}</td></tr>`).join("") || '<tr><td colspan="5">Aucun pour le moment.</td></tr>'}</table></div>
  <h2 class="sec">Par établissement</h2><div class="panneau"><table class="tb"><tr><th>Établissement</th><th>Élèves</th><th>Moy. avant</th><th>Moy. après</th><th>Éligibles</th></tr>${P.parEtab.map(e => `<tr><td>${esc(e.etab)}</td><td>${e.n}</td><td>${n2(e.av)}</td><td>${n2(e.ap)}</td><td>${e.elig}</td></tr>`).join("")}</table></div>
  <h2 class="sec">Tous les élèves</h2><div class="panneau"><table class="tb"><tr><th>Élève</th><th>Établissement</th><th>Classe</th><th>Avant</th><th>Après</th><th>Ens. après</th><th>Suivi fin</th><th>Incident</th><th>Critères</th></tr>${P.eleves.map(e => `<tr><td>${esc(e.nom)}</td><td>${esc(e.etab)}</td><td>${esc(e.classe)}</td><td>${n2(e.av)}</td><td>${n2(e.ap)}</td><td>${n2(e.ensAp)}</td><td>${n2(e.fin)}</td><td>${e.incident == null ? "—" : e.incident ? "Oui" : "Non"}</td><td class="${e.crit >= 3 ? "yes" : ""}">${e.crit}/4</td></tr>`).join("")}</table></div>
  <h2 class="sec">ONG Lueur d'Espoir — bénéficiaires</h2><div class="kpis">${kpi(O.total, "Bénéficiaires inscrits")}</div>
  ${[["Type de handicap", O.handicap], ["Besoins identifiés", O.besoins], ["Sexe", O.sexe], ["Commune / quartier", O.commune]].map(([t, r]) => `<div class="panneau"><b>${t}</b><table class="tb">${bars(r) || "<tr><td>—</td></tr>"}</table></div>`).join("")}`;
  $("#rf").onclick = () => load(code);
}
