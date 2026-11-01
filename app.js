/* Plateforme BMT Green Academy × ONG Lueur d'Espoir — accueil, formulaires, liens, certificat, formations, tableau de bord */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BASE = location.href.replace(/[^/]*([?#].*)?$/, "");
const notConfigured = () => !API_URL;
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

function header(mode) {
  const ong = mode === "ong";
  return `<header class="top"><div class="wrap">${ong ? "" : '<a href="index.html"><img src="img/logo_bmt.png" alt="BMT Green Academy"></a>'}
  <div class="t"><b>${ong ? "ONG Lueur d'Espoir" : mode === "formation" ? "BMT Green Academy" : "La Noblesse du Cœur"}</b><small>${ong ? "« Aidez-nous à nous aider »" : mode === "formation" ? "Former · Inspirer · Bâtir un avenir durable" : "BMT Green Academy · ONG Lueur d'Espoir"}</small></div>
  <img src="img/logo_lueur.png" alt="ONG Lueur d'Espoir"></div></header><div class="flag"></div>`;
}
const FOOT = `<footer><b>RESPECT · DIGNITÉ · LEADERSHIP · PAIX</b>BMT Green Academy × ONG Lueur d'Espoir — Côte d'Ivoire<br><a href="index.html" style="color:#f1e5c3">Accueil</a> · <a href="liens.html" style="color:#f1e5c3">Tous les liens</a></footer>`;
const DEMO = () => notConfigured() ? '<div class="warn"><b>Mode démonstration :</b> la base de données n\'est pas encore connectée. Les formulaires s\'affichent mais les réponses ne sont pas encore enregistrées.</div>' : "";

/* Tous les liens, dans l'ordre du programme */
const ETAPES = [
  { t: "1. Avant la formation", items: [
    ["engagement", "", "Kit du responsable — engagement et enregistrement de l'établissement"],
    ["eval", "avant", "Évaluation de l'élève — AVANT le programme"],
    ["ens", "avant", "Grille d'évaluation enseignant — AVANT le programme"]] },
  { t: "2. Pendant la formation", items: [["inc", "", "Registre des incidents"]] },
  { t: "3. Après la formation", items: [
    ["eval", "apres", "Évaluation de l'élève — APRÈS le programme"],
    ["ens", "apres", "Grille d'évaluation enseignant — APRÈS le programme"],
    ["suivi", "", "Fiche de suivi individuel"],
    ["rapport", "", "Rapport d'évaluation du programme"]] },
  { t: "4. Sélection et reconnaissance", items: [
    ["pv", "", "Procès-verbal de sélection"],
    ["liste", "", "Liste officielle des élèves retenus"],
    ["@certificat.html", "", "Certificat Ambassadeur Junior — à imprimer"]] },
  { t: "5. ONG Lueur d'Espoir", items: [["ong", "", "Inscription des bénéficiaires de l'ONG"]] },
  { t: "6. Pilotage (accès réservé)", items: [["@dashboard.html", "", "Tableau de bord — résultats et statistiques"]] },
];
const href = (k, ph) => k.startsWith("@") ? k.slice(1) : `form.html?f=${k}${ph ? "&phase=" + ph : ""}`;

/* ---------------- accueil ---------------- */
function renderHome() {
  const card = ([k, ph, label]) => {
    const f = FORMS[k] || {}, img = f.img || (k.includes("certificat") ? "basilique" : k.includes("formations") ? "savane" : "plateau");
    const desc = f.desc || (k.includes("certificat") ? "Saisir le nom de l'élève retenu et imprimer son certificat officiel." : k.includes("formations") ? "Manuels et livrets des formations, consultables sur la tablette ou le téléphone avec le code d'accès." : "Inscrits, moyennes avant / après, pourcentages, élèves éligibles, bénéficiaires de l'ONG.");
    return `<a class="card" href="${href(k, ph)}"><div class="im" style="background-image:url(img/${img}.jpg)"></div>
      <div class="bd"><h3>${esc(label)}</h3><p>${esc(desc)}</p><span class="go">Ouvrir →</span></div></a>`;
  };
  document.body.innerHTML = header() + `
  <section class="hero" style="background-image:url(img/basilique.jpg)"><div class="wrap">
    <h1>La Noblesse du Cœur</h1><p>Paix intérieure — Impact extérieur · Plateforme de saisie, de suivi et de formation</p></div></section>
  <main class="wrap">${DEMO()}
    <div class="note">Les formulaires se remplissent sur téléphone, tablette ou ordinateur, à partir des fiches papier. Chaque formulaire prend 1 à 3 minutes. <a href="liens.html"><b>Voir la liste de tous les liens à partager →</b></a></div>
    ${ETAPES.map(e => `<h2 class="sec">${esc(e.t)}</h2><div class="grid">${e.items.map(card).join("")}</div>`).join("")}
    <h2 class="sec">Fiches à imprimer (PDF remplissables)</h2>
    <div class="dl">${PDFS.map(([f, l]) => `<a href="pdf/${f}.pdf" download>⬇ ${l}</a>`).join("")}</div>
  </main>` + FOOT;
}
const PDFS = [["Kit_complet_La_Noblesse_du_Coeur", "Kit complet"], ["01_Kit_responsable_etablissement", "Kit du responsable"], ["02_Evaluation_eleve_AVANT", "Évaluation AVANT"],
  ["03_Evaluation_eleve_APRES", "Évaluation APRÈS"], ["04_Grille_evaluation_enseignant", "Grille enseignant"], ["05_Registre_des_incidents", "Registre des incidents"],
  ["06_Fiche_suivi_individuel", "Suivi individuel"], ["07_Rapport_evaluation_programme", "Rapport"], ["08_PV_selection", "PV de sélection"],
  ["09_Liste_eleves_retenus", "Liste des retenus"], ["10_Certificat_Ambassadeur_Junior", "Certificat"], ["Fiche_beneficiaire_ONG_Lueur_dEspoir", "Fiche bénéficiaire ONG"]];

/* ---------------- page des liens ---------------- */
function renderLinks() {
  document.title = "Tous les liens — La Noblesse du Cœur";
  const all = ETAPES.flatMap(e => e.items.map(i => [e.t, i[2], BASE + href(i[0], i[1])]));
  const text = ETAPES.map(e => `*${e.t}*\n` + e.items.map(i => `${i[2]} :\n${BASE + href(i[0], i[1])}`).join("\n\n")).join("\n\n");
  document.body.innerHTML = header() + `<section class="hero" style="background-image:url(img/hkb.jpg);height:170px"><div class="wrap"><h1>Tous les liens</h1><p>Intitulé puis lien — à copier ou envoyer par WhatsApp</p></div></section>
  <main class="wrap"><div class="actions" style="margin:16px 0"><button class="btn" id="cpall">📋 Copier toute la liste</button>
    <a class="btn sec" target="_blank" href="https://wa.me/?text=${encodeURIComponent("La Noblesse du Cœur — liens des formulaires\n\n" + text)}">Envoyer par WhatsApp</a></div>
  ${ETAPES.map(e => `<h2 class="sec">${esc(e.t)}</h2><div class="box">${e.items.map(i => { const u = BASE + href(i[0], i[1]); return `
    <div class="lnk"><div><b>${esc(i[2])}</b><br><a href="${u}">${esc(u)}</a></div><button class="btn sec cp" data-u="${esc(u)}">Copier</button></div>`; }).join("")}</div>`).join("")}
  </main>` + FOOT;
  const copy = (t, b) => navigator.clipboard.writeText(t).then(() => { const o = b.textContent; b.textContent = "✔ Copié"; setTimeout(() => b.textContent = o, 1500); });
  document.querySelectorAll(".cp").forEach(b => b.onclick = () => copy(b.dataset.u, b));
  $("#cpall").onclick = e => copy("La Noblesse du Cœur — liens des formulaires\n\n" + text, e.target);
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
      return `<div class="fld"><span class="lb">${esc(c.l)}${req}</span><div class="help">${c.scale.map((s, i) => `${i + 1} = ${s}`).join(" · ")}</div><div class="lk">${c.rows.map((r, i) =>
        `<div class="q" data-q="${c.k}${i + 1}"><div class="qt">${i + 1}. ${esc(r)}</div><div class="sc">${[1, 2, 3, 4, 5].map(v =>
          `<label><input type="radio" name="${c.k}${i + 1}" value="${v}"><b>${v}</b><span>${esc(c.scale[v - 1])}</span></label>`).join("")}</div></div>`).join("")}</div></div>`;
    case "incidents":
      return `<div class="fld"><span class="lb">${esc(c.l)} <span class="req">*</span></span><div class="box" style="padding:0"><table class="inc"><tr><th>Type d'incident</th><th>Avant</th><th>Après</th></tr>${c.rows.map((r, i) =>
        `<tr><td>${esc(r)}</td><td><input type="number" min="0" inputmode="numeric" name="av${i + 1}"></td><td><input type="number" min="0" inputmode="numeric" name="ap${i + 1}"></td></tr>`).join("")}</table></div></div>`;
    case "rows":
      return `<div class="fld"><span class="lb">${esc(c.l)}${req}</span><div class="box" style="padding:0"><table class="inc rows" data-rows="${c.k}"><tr><th style="width:32px">N°</th>${c.cols.map(x => `<th${x.w ? ` style="width:${x.w}"` : ""}>${esc(x.l)}</th>`).join("")}<th style="width:36px"></th></tr></table></div>
        <div class="actions" style="margin-top:8px"><button type="button" class="btn sec addrow" data-k="${c.k}">+ Ajouter un élève</button></div></div>`;
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

function renderForm(key) {
  const f = FORMS[key];
  if (!f) { location.href = "index.html"; return; }
  const ph = new URLSearchParams(location.search).get("phase");
  const phaseVal = ph === "avant" ? "Avant le programme" : ph === "apres" ? "Après le programme" : "";
  const titre = f.titre + (phaseVal ? (ph === "avant" ? " — AVANT" : " — APRÈS") : "");
  document.title = titre + " — La Noblesse du Cœur";
  document.body.innerHTML = header(f.ong ? "ong" : f.formation ? "formation" : "") + `
  <section class="hero" style="background-image:url(img/${f.img}.jpg);height:210px"><div class="wrap" style="padding-bottom:42px"><h1>${esc(titre)}</h1><p>${esc(f.desc)}</p></div></section>
  <main class="wrap"><form class="f" novalidate>${DEMO()}
    <div class="row">${f.champs.map(field).join("")}</div>
    <div id="err"></div>
    <div class="actions"><button class="btn" type="submit">Envoyer</button>${f.ong ? "" : '<a class="btn sec" href="index.html">Accueil</a>'}<span class="help" style="margin:0">Les champs marqués <span class="req">*</span> sont obligatoires.</span></div>
  </form><datalist id="etabs"></datalist></main>` + FOOT;
  store.get("ndc_etabs", []).forEach(e => $("#etabs").insertAdjacentHTML("beforeend", `<option value="${esc(e)}">`));
  const last = store.get("ndc_last", {}); ["etab", "classe", "enseignant", "resp", "resp_prog", "chef", "ville"].forEach(k => { const el = $(`input[name=${k}]`); if (el && last[k]) el.value = last[k]; });
  if (phaseVal) { const r = $(`input[name=phase][value="${phaseVal}"]`); if (r) { r.checked = true; document.querySelectorAll("input[name=phase]").forEach(i => { if (!i.checked) i.closest("label").style.display = "none"; }); } }
  f.champs.filter(c => c.t === "rows").forEach(c => { const t = $(`[data-rows=${c.k}]`); for (let i = 0; i < 5; i++) addRow(c, t); $(`.addrow[data-k=${c.k}]`).onclick = () => addRow(c, t); });
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
  form.innerHTML = `<div class="ok"><h3 style="margin:0 0 6px;color:var(--g)">✔ ${res.demo ? "Formulaire valide (mode démonstration)" : "Réponse enregistrée"}</h3>
    ${res.numero ? `<p style="font-size:18px">Numéro : <b>${esc(res.numero)}</b></p><p>Notez ce numéro : il identifie le dossier.</p>` : ""}
    <p>Merci ! ${["eval", "ens", "suivi"].includes(key) ? "Vous pouvez saisir l'élève suivant : l'établissement et la classe sont conservés." : ""}</p></div>
    <div class="actions"><a class="btn" href="form.html${esc(again)}">${f.ong || f.formation ? "Nouvelle inscription" : "Saisir une autre fiche"}</a>${f.ong ? "" : '<a class="btn sec" href="index.html">Accueil</a>'}</div>`;
  scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------- certificat ---------------- */
function renderCertificat() {
  document.title = "Certificat Ambassadeur Junior";
  const p = new URLSearchParams(location.search);
  document.body.innerHTML = `<div class="noprint">${header()}<main class="wrap"><h2 class="sec">Certificat Ambassadeur Junior</h2>
    <div class="box"><div class="row"><div class="fld half"><label for="cn">Nom et prénoms de l'élève</label><input id="cn" type="text" value="${esc(p.get("nom") || "")}"></div>
    <div class="fld half"><label for="cd">Date</label><input id="cd" type="text" value="${esc(p.get("date") || new Date().toLocaleDateString("fr-FR"))}"></div></div>
    <div class="actions"><button class="btn" onclick="print()">🖨 Imprimer / enregistrer en PDF</button><span class="help" style="margin:0">Orientation paysage, marges « aucune ».</span></div></div></main></div>
    <div class="cert"><img src="img/certificat.jpg" alt=""><div class="cn" id="vn"></div><div class="cdt" id="vd"></div></div><div class="noprint">${FOOT}</div>`;
  const up = () => { $("#vn").textContent = $("#cn").value; $("#vd").textContent = $("#cd").value; };
  $("#cn").oninput = $("#cd").oninput = up; up();
}

/* ---------------- formations (cours chiffrés) ---------------- */
const COURS = [
  { id: "fengshui_manuel", t: "Feng Shui professionnel — Manuel de cours", d: "Les 10 modules complets, illustrés (292 pages).", img: "plateau", taille: "25 Mo", code: "fengshui" },
  { id: "fengshui_livret", t: "Feng Shui professionnel — Livret de l'apprenant", d: "Carnet de suivi personnel et évaluation finale, à remplir.", img: "bassam", taille: "3 Mo", code: "fengshui" },
  { id: "fengshui_corrige", t: "Feng Shui — Corrigé du formateur", d: "Réservé aux formateurs BMT Green Academy.", img: "hkb", taille: "0,1 Mo", code: "formateur" },
];
function renderFormations() {
  document.title = "Formations — BMT Green Academy";
  document.body.innerHTML = header("formation") + `<section class="hero" style="background-image:url(img/savane.jpg);height:200px"><div class="wrap"><h1>Bibliothèque des formations</h1><p>Supports de cours BMT Green Academy — sur tablette, téléphone ou ordinateur</p></div></section>
  <main class="wrap"><div class="note">Les cours sont protégés : saisissez le <b>code d'accès</b> remis après votre inscription. Une fois ouvert, un cours reste disponible sur cet appareil, même sans internet. <a href="form.html?f=inscription"><b>S'inscrire à une formation →</b></a></div>
  <h2 class="sec">Cours</h2><div class="grid">${COURS.map(c => `<div class="card"><div class="im" style="background-image:url(img/${c.img}.jpg)"></div><div class="bd"><h3>${esc(c.t)}</h3><p>${esc(c.d)} · ${c.taille}</p>
    <div class="actions"><input type="text" placeholder="Code d'accès" data-code="${c.id}" value="${esc(store.get("code_" + c.code, ""))}" style="flex:1;min-width:140px"><button class="btn open" data-id="${c.id}">Ouvrir</button></div><div class="msg" data-msg="${c.id}"></div></div></div>`).join("")}</div>
  <h2 class="sec">Programme La Noblesse du Cœur (accès libre)</h2><div class="dl">${PDFS.map(([f, l]) => `<a href="pdf/${f}.pdf" target="_blank">📄 ${l}</a>`).join("")}</div></main>` + FOOT;
  document.querySelectorAll(".open").forEach(b => b.onclick = () => openCours(COURS.find(c => c.id === b.dataset.id)));
}
async function openCours(c) {
  const code = $(`[data-code=${c.id}]`).value.trim().toUpperCase(), msg = $(`[data-msg=${c.id}]`);
  if (!code) { msg.innerHTML = '<div class="warn">Saisissez le code d\'accès.</div>'; return; }
  msg.innerHTML = '<div class="help">Ouverture… (le premier chargement peut prendre une minute)</div>';
  try {
    const buf = new Uint8Array(await (await fetch(`cours/${c.id}.enc`)).arrayBuffer());
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: buf.slice(0, 16), iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const pdf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(16, 28) }, key, buf.slice(28));
    store.set("code_" + c.code, code);
    const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
    msg.innerHTML = `<div class="ok" style="padding:8px 12px">✔ Cours déverrouillé. <a href="${url}" target="_blank"><b>Lire</b></a> · <a href="${url}" download="${c.id}.pdf"><b>Télécharger</b></a></div>`;
    open(url, "_blank");
  } catch (e) { msg.innerHTML = '<div class="warn">Code incorrect ou connexion interrompue.</div>'; }
}

/* ---------------- tableau de bord ---------------- */
function renderDashboard() {
  document.title = "Tableau de bord — La Noblesse du Cœur";
  document.body.innerHTML = header() + `<section class="hero" style="background-image:url(img/plateau.jpg);height:180px"><div class="wrap"><h1>Tableau de bord</h1><p>Résultats du programme, ONG et formations</p></div></section>
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
  const fr = x => String(x).replace(".", ","), P = d.programme, O = d.ong, A = d.autres || {}, pct = x => x == null ? "—" : fr(x) + " %", n2 = x => x == null ? "—" : fr(x);
  const kpi = (v, l, s = "") => `<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;
  const bars = rows => rows.map(r => `<tr><td>${esc(r[0])}</td><td style="width:60px;text-align:right"><b>${r[1]}</b></td><td style="width:45%"><div class="bar"><i style="width:${r[2]}%"></i></div></td><td style="width:60px">${fr(r[2])} %</td></tr>`).join("");
  const cert = e => `<a href="certificat.html?nom=${encodeURIComponent(e.nom)}" target="_blank">Certificat</a>`;
  $("#dash").innerHTML = `<div class="actions" style="margin:14px 0"><span class="help" style="margin:0">Mis à jour : ${esc(d.maj)}</span><button class="btn sec" id="rf">↻ Actualiser</button></div>
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
  <h2 class="sec">Élèves éligibles (calcul automatique)</h2><div class="box"><table class="tb"><tr><th>Élève</th><th>Établissement</th><th>Classe</th><th>Critères</th><th></th></tr>${P.eligibles.map(e => `<tr><td><b>${esc(e.nom)}</b></td><td>${esc(e.etab)}</td><td>${esc(e.classe)}</td><td class="yes">${e.crit}/4</td><td>${cert(e)}</td></tr>`).join("") || '<tr><td colspan="5">Aucun pour le moment.</td></tr>'}</table></div>
  <h2 class="sec">Par établissement</h2><div class="box"><table class="tb"><tr><th>Établissement</th><th>Élèves</th><th>Moy. avant</th><th>Moy. après</th><th>Éligibles</th></tr>${P.parEtab.map(e => `<tr><td>${esc(e.etab)}</td><td>${e.n}</td><td>${n2(e.av)}</td><td>${n2(e.ap)}</td><td>${e.elig}</td></tr>`).join("")}</table></div>
  <h2 class="sec">Tous les élèves</h2><div class="box"><table class="tb"><tr><th>Élève</th><th>Établissement</th><th>Classe</th><th>Avant</th><th>Après</th><th>Ens. après</th><th>Suivi fin</th><th>Incident</th><th>Critères</th></tr>${P.eleves.map(e => `<tr><td>${esc(e.nom)}</td><td>${esc(e.etab)}</td><td>${esc(e.classe)}</td><td>${n2(e.av)}</td><td>${n2(e.ap)}</td><td>${n2(e.ensAp)}</td><td>${n2(e.fin)}</td><td>${e.incident == null ? "—" : e.incident ? "Oui" : "Non"}</td><td class="${e.crit >= 3 ? "yes" : ""}">${e.crit}/4</td></tr>`).join("")}</table></div>
  <h2 class="sec">ONG Lueur d'Espoir — bénéficiaires</h2><div class="kpis">${kpi(O.total, "Bénéficiaires inscrits")}</div>
  ${[["Type de handicap", O.handicap], ["Besoins identifiés", O.besoins], ["Sexe", O.sexe], ["Commune / quartier", O.commune]].map(([t, r]) => `<div class="box"><b style="color:var(--g)">${t}</b><table class="tb" style="margin-top:6px">${bars(r) || "<tr><td>—</td></tr>"}</table></div>`).join("")}`;
  $("#rf").onclick = () => load(code);
}
