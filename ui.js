/* Couche d'interface — La Noblesse du Cœur.
   Préchargeur, transitions entre pages, barre de défilement, révélations, chiffres animés, parallaxe du bandeau.
   Aucune dépendance. Tout est coupé quand l'appareil demande « réduire les animations ».
   Règle de mouvement : seulement transform et opacity (voir style.css). */
(() => {
  const racine = document.documentElement;
  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const frein = (t, d) => 1 - Math.pow(1 - t, 3) * (d || 1);           // sortie douce (ease-out cubique)
  /* Préchargeur enrichi : titre lettre par lettre, halos dorés autour des logos, étincelles qui montent,
     et un mot de bienvenue personnalisé pour une personne déjà inscrite sur cet appareil. */
  (() => {
    const pre = $("#pre"), titre = pre && $(".pre-titre", pre); if (!pre || !titre || reduit) return;
    const lettres = titre.textContent.trim();
    titre.setAttribute("aria-label", lettres);
    titre.innerHTML = [...lettres].map((c, i) => `<span class="l" aria-hidden="true" style="--k:${i}">${c === " " ? "&nbsp;" : c}</span>`).join("");
    let prenom = ""; try { const p = JSON.parse(localStorage.getItem("ndc_profil")); prenom = p ? String(p.prenom || p.nom || "").split(/\s+/)[0] : ""; } catch (e) {}
    const mot = prenom ? `Bienvenue, ${prenom.replace(/[&<>"]/g, "")}` : "Bienvenue";
    $(".pre-sous", pre).insertAdjacentHTML("afterend", `<p class="pre-bienv">${mot}</p>`);
    const f = document.createElement("div"); f.className = "pre-feu"; f.setAttribute("aria-hidden", "true");
    f.innerHTML = Array.from({ length: 16 }, (_, k) => `<i style="--x:${(k * 37 + 11) % 100}%;--k:${k};--t:${2.6 + (k % 5) * .5}s"></i>`).join("");
    pre.prepend(f);
  })();

  let secours = setTimeout(() => UI.pret(), 4000);                   // quoi qu'il arrive, la page apparaît au bout de 4 s
  let deja = false;

  const UI = window.UI = {
    reduit,

    /* avancement du ruban du préchargeur (0 à 1) */
    etape(p) { const pre = $("#pre"); if (pre) pre.style.setProperty("--p", p); },

    /* à appeler quand la page est construite : attend polices et image du bandeau, puis lève le rideau */
    pret() {
      if (deja) return; deja = true; clearTimeout(secours);
      const pre = $("#pre");
      const montrer = () => { racine.classList.remove("prep"); UI.revele(document); UI.mots($(".ouverture h1")); };
      if (!pre || reduit) { if (pre) pre.remove(); montrer(); return; }
      UI.etape(.7);
      const attendre = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]).catch(() => {});
      const fond = $(".ouverture .fond"), url = fond && (getComputedStyle(fond).backgroundImage.match(/url\(["']?(.*?)["']?\)/) || [])[1];
      const image = url ? new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = url; }) : Promise.resolve();
      const police = document.fonts ? document.fonts.ready : Promise.resolve();
      Promise.all([attendre(police, 1200), attendre(image, 1400), new Promise(r => setTimeout(r, Math.max(0, 850 - performance.now())))]).then(() => {
        UI.etape(1);
        setTimeout(() => {
          montrer(); pre.classList.add("fin");
          try { sessionStorage.setItem("ndc_vu", "1"); } catch (e) {}
          setTimeout(() => pre.remove(), 600);
        }, 260);
      });
    },

    /* découpe un titre en mots qui montent un à un ; le mot en <em> garde son italique doré ;
       deux morceaux collés (« d'<em>entraînement</em> ») restent collés */
    mots(h) {
      if (!h || reduit || h.dataset.mots) return;
      const texte = h.textContent.trim(); h.dataset.mots = "1"; h.setAttribute("aria-label", texte);
      const echapper = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
      const jetons = []; let finBlanc = true;
      h.childNodes.forEach(n => {
        const em = n.nodeType === 1 && n.tagName === "EM", t = n.textContent || "";
        const mots = t.split(/\s+/).filter(Boolean);
        mots.forEach((m, j) => jetons.push({ espace: j > 0 || /^\s/.test(t) || finBlanc, html: em ? `<em>${echapper(m)}</em>` : echapper(m) }));
        if (mots.length) finBlanc = /\s$/.test(t);
      });
      h.innerHTML = jetons.map((x, k) => (k && x.espace ? " " : "") + `<span class="m" aria-hidden="true"><span style="--k:${k}">${x.html}</span></span>`).join("");
    },

    /* révélation au défilement (fondu + légère montée, en cascade) ; anime les chiffres des tuiles quand elles apparaissent */
    revele(racineEl) {
      const cibles = [...racineEl.querySelectorAll(".etape-tete,.liste,.bloc:not(.no-rv),.kpi,.panneau,h2.sec,.dl a,.envoi,.lnk,.puce-maj,.org,.croix,.devise")].filter(e => !e.classList.contains("rv"));
      const suivis = [...racineEl.querySelectorAll(".etape")];
      if (reduit) { UI.chiffres(racineEl); return; }
      if (!("IntersectionObserver" in window)) { cibles.concat(suivis).forEach(e => e.classList.add("vu")); UI.chiffres(racineEl); return; }
      const parParent = new Map();
      cibles.forEach(e => { const n = parParent.get(e.parentElement) || 0; parParent.set(e.parentElement, n + 1); e.style.setProperty("--i", Math.min(n, 7)); e.classList.add("rv"); });
      try {
        const io = new IntersectionObserver(entrees => entrees.forEach(en => {
          if (!en.isIntersecting) return;
          const e = en.target; e.classList.add("vu"); io.unobserve(e);
          if (e.classList.contains("kpi")) UI.chiffres(e);
        }), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
        cibles.concat(suivis).forEach(e => io.observe(e));
      } catch (err) { cibles.concat(suivis).forEach(e => e.classList.add("vu")); }
    },

    /* chiffres qui montent jusqu'à leur valeur (« 2,71 → 3,05 », « 42,5 % », « 12 / 40 »…) */
    chiffres(r) {
      const zone = r.matches && r.matches(".kpi") ? [r] : [...r.querySelectorAll(".kpi")];
      zone.forEach(k => {
        const v = k.querySelector(".v"); if (!v || v.dataset.fait) return; v.dataset.fait = "1";
        const final = v.textContent, morceaux = final.split(/(\d+(?:,\d+)?)/);
        if (reduit || morceaux.length < 3) return;
        const nombres = morceaux.map((m, i) => i % 2 ? { v: parseFloat(m.replace(",", ".")), d: (m.split(",")[1] || "").length } : null);
        const debut = performance.now(), duree = 1000;
        const image = t => {
          const p = Math.min(1, (t - debut) / duree), e = 1 - Math.pow(1 - p, 3);
          v.textContent = morceaux.map((m, i) => nombres[i] ? (nombres[i].v * e).toFixed(nombres[i].d).replace(".", ",") : m).join("");
          if (p < 1) requestAnimationFrame(image); else v.textContent = final;
        };
        requestAnimationFrame(image);
      });
    },

    /* trait doré glissant sous l'étape active de la frise, et étape active ramenée au centre */
    trait(ol, a) {
      const t = $(".trait", ol), li = a && a.closest("li"); if (!t || !li) return;
      t.style.setProperty("--x", li.offsetLeft + "px"); t.style.setProperty("--s", li.offsetWidth / 100);
      if (ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: li.offsetLeft - (ol.clientWidth - li.offsetWidth) / 2, behavior: reduit ? "auto" : "smooth" });
    },

    /* bouton en cours d'envoi */
    charge(btn, oui, texte) { btn.disabled = !!oui; btn.classList.toggle("charge", !!oui); if (texte) btn.textContent = texte; },
  };

  /* barres fines (défilement, navigation) et bouton « retour en haut » */
  document.body.insertAdjacentHTML("afterbegin", '<div id="sb" aria-hidden="true"></div><div id="nb" aria-hidden="true"></div>');
  document.body.insertAdjacentHTML("beforeend", '<button type="button" class="haut" aria-label="Retour en haut de la page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>');
  const sb = $("#sb"), nb = $("#nb"), haut = $(".haut");
  haut.addEventListener("click", () => scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" }));
  let attente = false;
  const defiler = () => {
    attente = false;
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    sb.style.setProperty("--sp", h > 0 ? Math.min(1, y / h) : 0);
    haut.classList.toggle("on", y > 700);
    const id = $(".ident"); if (id) id.classList.toggle("ombre", y > 8);
    const fond = $(".ouverture .fond");
    if (fond && !reduit) { const hero = fond.parentElement.offsetHeight; fond.style.setProperty("--py", (y < hero ? Math.min(y * .2, hero * .07) : 0) + "px"); }
  };
  addEventListener("scroll", () => { if (!attente) { attente = true; requestAnimationFrame(defiler); } }, { passive: true });
  addEventListener("resize", defiler, { passive: true });
  defiler();

  /* sortie en fondu quand on change de page (la nouvelle page entre en fondu) */
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute("download")) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || !/\.html?$|\/$/.test(u.pathname)) return;                  // PDF, images, liens externes : comportement normal
    if (u.pathname === location.pathname && u.search === location.search) return;                  // simple ancre dans la même page
    e.preventDefault();
    document.body.classList.add("sort"); nb.classList.add("on");
    setTimeout(() => { location.href = u.href; }, reduit ? 0 : 170);
  });
  addEventListener("pageshow", e => { if (e.persisted) { document.body.classList.remove("sort"); nb.classList.remove("on"); } });   // retour arrière (cache de page)

  /* menu mobile : tiroir latéral ; le focus y entre, Échap le ferme et rend le focus au bouton */
  const tiroir = () => $("#tiroir");
  const menu = oui => {
    const t = tiroir(), b = $(".burger"), v = $(".voile"); if (!t || !b) return;
    t.classList.toggle("on", oui); if (v) v.classList.toggle("on", oui);
    t.setAttribute("aria-hidden", String(!oui)); b.setAttribute("aria-expanded", String(oui)); b.setAttribute("aria-label", oui ? "Fermer le menu" : "Ouvrir le menu");
    document.body.style.overflow = oui ? "hidden" : "";
    if (oui) { const a = t.querySelector("a"); if (a) a.focus({ preventScroll: true }); }
  };
  document.addEventListener("click", e => {
    if (!tiroir()) return;
    if (e.target.closest(".burger")) menu(!tiroir().classList.contains("on"));
    else if (e.target.closest(".voile") || e.target.closest(".tiroir a")) menu(false);
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && tiroir() && tiroir().classList.contains("on")) { menu(false); const b = $(".burger"); if (b) b.focus(); } });
  matchMedia("(min-width: 981px)").addEventListener("change", e => { if (e.matches) menu(false); });
})();
