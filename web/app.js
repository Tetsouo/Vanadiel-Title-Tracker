/* ============================================================================
   Vana'diel Title Tracker — front logic (bilingual FR / EN)
   Catalogue (all BG-Wiki titles) is static; ownership is a per-player overlay
   imported from the Windower add-on exports and persisted in localStorage.
   No backend. UI language is switchable and persisted.
   ========================================================================== */
(function () {
  "use strict";

  const DATA = window.__DATA__ || { totalGame: 0, missing: [], owned: [], categories: [], npcs: [], catColors: {}, character: null };
  const ADDON = window.__ADDON__ || { files: {} };
  const LS = "ffxi_tracker_v2";
  const RING_C = 314.159;

  // ── i18n ──
  const I18N = {
    fr: {
      "tab.todo": "À faire", "tab.done": "Accomplis",
      "search.ph": "Rechercher un titre, une quête, un PNJ…",
      "lang.toggle": "Langue (FR / EN)", "theme.toggle": "Basculer clair / sombre",
      "setup.title": "Importer mes titres / installer l'addon", "setup.btn": "Importer / Addon",
      "filter.cat": "Catégorie", "filter.npc": "PNJ", "filter.all": "Toutes", "npc.all": "Tous les PNJ",
      "reset": "↺ Réinitialiser",
      "kpi.completed": "Complété", "kpi.owned": "Obtenus", "kpi.todo": "À faire", "kpi.total": "Total",
      "th.title": "Titre", "th.how": "Obtention", "th.npc": "PNJ", "th.cat": "Catégorie",
      "empty.todo.title": "Aucun titre à afficher", "empty.todo.msg": "Ajustez vos filtres ou votre recherche.",
      "empty.done.title": "Aucun titre accompli", "empty.done.msg": "Validez un titre avec le bouton ✓ pour le retrouver ici.",
      "toast.undo": "↩ Annuler", "toast.unlocked": "accompli",
      "modal.title": "Configuration", "modal.close": "Fermer",
      "mtab.import": "1 · Importer mes titres", "mtab.install": "2 · Installer l'addon",
      "import.intro": "Importe les fichiers produits par l'addon Windower (<code>&lt;Perso&gt;-owned.txt</code> et <code>&lt;Perso&gt;-missing.txt</code>). Le fichier <b>owned</b> suffit : tout le reste est « à faire ». Tes données restent locales.",
      "import.ownedLabel": "Fichier <b>owned</b> (titres obtenus)", "import.missingLabel": "Fichier <b>missing</b> (optionnel)",
      "import.btn": "Importer",
      "import.need": "Sélectionne au moins le fichier « owned » (ou « missing »).",
      "import.ok": "✓ Import réussi : ", "import.matchedOwned": "titres possédés reconnus", "import.matchedMissing": "titres manquants reconnus",
      "import.unmatched": "non reconnu(s) (ignorés).",
      "install.intro": "Choisis ton dossier <b>Windower</b> : l'addon est écrit directement dans <code>…\\addons\\titles\\</code>.",
      "install.pickBtn": "📁 Choisir le dossier & installer",
      "install.pickHint": "Sélectionne ton dossier <b>Windower</b> (ou son sous-dossier <code>addons</code>) et autorise l'écriture.",
      "install.noPick": "Ton navigateur ne permet pas l'installation directe (mets à jour Chrome). Installe manuellement :",
      "install.manualSummary": "Installer manuellement",
      "install.manualP": "Crée le dossier <code>…\\addons\\titles\\</code> (+ sous-dossiers <code>data</code> et <code>export</code>) et places-y :",
      "install.cmdsTitle": "Ensuite, en jeu",
      "install.cmd1": "<code>//lua load titles</code>",
      "install.cmd2": "Visite les PNJ de titres et/ou change de zone pour enregistrer.",
      "install.cmd3": "<code>//titles owned export</code> puis <code>//titles missing export</code>",
      "install.cmd4": "Les fichiers apparaissent dans <code>…\\addons\\titles\\export\\</code> → reviens ici (onglet 1) pour les importer.",
      "install.installing": "Installation en cours…",
      "install.okPre": "✓ Addon installé (", "install.okFiles": " fichiers) dans ", "install.okCmd": ". En jeu : ",
      "install.failPick": "Sélection impossible ici — installe manuellement via les liens ci-dessous.",
      "install.fail": "Échec : ",
      "_cat": { "Quest": "Quête", "Enemy": "Ennemi", "Battlefield": "Battlefield", "Mission": "Mission", "Item / Guild": "Item / Guilde", "Job Points": "Job Points", "HELM": "HELM", "Minigames": "Mini-jeux", "NPC": "PNJ", "Other": "Autre" },
    },
    en: {
      "tab.todo": "To do", "tab.done": "Completed",
      "search.ph": "Search a title, quest, NPC…",
      "lang.toggle": "Language (FR / EN)", "theme.toggle": "Toggle light / dark",
      "setup.title": "Import my titles / install the add-on", "setup.btn": "Import / Add-on",
      "filter.cat": "Category", "filter.npc": "NPC", "filter.all": "All", "npc.all": "All NPCs",
      "reset": "↺ Reset",
      "kpi.completed": "Completed", "kpi.owned": "Owned", "kpi.todo": "To do", "kpi.total": "Total",
      "th.title": "Title", "th.how": "How to obtain", "th.npc": "NPC", "th.cat": "Category",
      "empty.todo.title": "No titles to show", "empty.todo.msg": "Adjust your filters or your search.",
      "empty.done.title": "No titles completed", "empty.done.msg": "Mark a title with ✓ to see it here.",
      "toast.undo": "↩ Undo", "toast.unlocked": "unlocked",
      "modal.title": "Setup", "modal.close": "Close",
      "mtab.import": "1 · Import my titles", "mtab.install": "2 · Install the add-on",
      "import.intro": "Import the files produced by the Windower add-on (<code>&lt;Char&gt;-owned.txt</code> and <code>&lt;Char&gt;-missing.txt</code>). The <b>owned</b> file is enough: everything else becomes “to do”. Your data stays local.",
      "import.ownedLabel": "<b>owned</b> file (unlocked titles)", "import.missingLabel": "<b>missing</b> file (optional)",
      "import.btn": "Import",
      "import.need": "Select at least the “owned” file (or “missing”).",
      "import.ok": "✓ Import done: ", "import.matchedOwned": "owned titles matched", "import.matchedMissing": "missing titles matched",
      "import.unmatched": "not recognized (ignored).",
      "install.intro": "Pick your <b>Windower</b> folder: the add-on is written straight into <code>…\\addons\\titles\\</code>.",
      "install.pickBtn": "📁 Pick folder & install",
      "install.pickHint": "Select your <b>Windower</b> folder (or its <code>addons</code> subfolder) and allow writing.",
      "install.noPick": "Your browser can't install directly (update Chrome). Install manually:",
      "install.manualSummary": "Install manually",
      "install.manualP": "Create the <code>…\\addons\\titles\\</code> folder (+ <code>data</code> and <code>export</code> subfolders) and put inside:",
      "install.cmdsTitle": "Then, in-game",
      "install.cmd1": "<code>//lua load titles</code>",
      "install.cmd2": "Visit title NPCs and/or change zones to record them.",
      "install.cmd3": "<code>//titles owned export</code> then <code>//titles missing export</code>",
      "install.cmd4": "Files appear in <code>…\\addons\\titles\\export\\</code> → come back here (tab 1) to import them.",
      "install.installing": "Installing…",
      "install.okPre": "✓ Add-on installed (", "install.okFiles": " files) into ", "install.okCmd": ". In-game: ",
      "install.failPick": "Can't pick here — install manually via the links below.",
      "install.fail": "Failed: ",
      "_cat": { "Quest": "Quest", "Enemy": "Enemy", "Battlefield": "Battlefield", "Mission": "Mission", "Item / Guild": "Item / Guild", "Job Points": "Job Points", "HELM": "HELM", "Minigames": "Minigames", "NPC": "NPC", "Other": "Other" },
    },
  };
  let lang = "fr";
  const t = (k) => { const d = I18N[lang] || I18N.en; return k in d ? d[k] : (I18N.en[k] !== undefined ? I18N.en[k] : k); };
  const catLabel = (c) => { const m = (I18N[lang] || I18N.en)._cat; return (m && m[c]) || c; };

  const $ = (id) => document.getElementById(id);
  const qs = (s) => document.querySelector(s);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const setText = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const norm = (s) => String(s).replace(/’/g, "'").replace(/[™š]/g, "").replace(/[★☆✦✩✪✫✬✭✮✯]/g, "").replace(/\s+/g, " ").trim();

  const CATALOG = [...(DATA.missing || []), ...(DATA.owned || [])];
  const defaultOwned = (DATA.owned || []).map((r) => r.title);

  let state = {
    tab: "missing", cat: "ALL", npc: "ALL", search: "", theme: "dark", lang: null,
    sortMissing: { col: -1, asc: true }, sortOwned: { col: -1, asc: true },
    scrollY: 0, owned: null, character: DATA.character || null,
  };
  const sortState = { missing: { col: -1, asc: true }, owned: { col: -1, asc: true } };
  let ownedSet = new Set();

  const save = () => { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} };
  const load = () => { try { const s = localStorage.getItem(LS); if (s) state = { ...state, ...JSON.parse(s) }; } catch (e) {} };

  function initOwnership() {
    if (Array.isArray(state.owned)) ownedSet = new Set(state.owned);
    else {
      ownedSet = new Set(defaultOwned);
      if (Array.isArray(state.validated)) state.validated.forEach((tt) => ownedSet.add(tt));
      state.owned = [...ownedSet];
    }
  }
  function persistOwned() { state.owned = [...ownedSet]; save(); }

  // ── Langue ──
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((e) => { e.textContent = t(e.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach((e) => { e.placeholder = t(e.dataset.i18nPh); });
    document.querySelectorAll("[data-i18n-title]").forEach((e) => { const v = t(e.dataset.i18nTitle); e.title = v; e.setAttribute("aria-label", v); });
    document.querySelectorAll("[data-i18n-html]").forEach((e) => { e.innerHTML = t(e.dataset.i18nHtml); });
    relabelCategories();
    setText("langCode", lang.toUpperCase());
  }
  function toggleLang() { lang = lang === "fr" ? "en" : "fr"; state.lang = lang; applyLang(); save(); }
  function relabelCategories() {
    document.querySelectorAll('.filter-btn[data-filter="cat"]').forEach((b) => {
      const lab = b.querySelector(".chip-label"); if (!lab) return;
      lab.textContent = b.dataset.value === "ALL" ? t("filter.all") : catLabel(b.dataset.value);
    });
    document.querySelectorAll(".cat-cell .badge").forEach((bd) => {
      const tr = bd.closest("tr"); if (tr) bd.textContent = catLabel(tr.dataset.cat);
    });
  }

  // ── Thème ──
  function applyTheme() {
    if (state.theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  }
  function toggleTheme() { state.theme = state.theme === "light" ? "dark" : "light"; applyTheme(); save(); }

  // ── Rendu ──
  function rowEl(item) {
    const owned = ownedSet.has(item.title);
    const color = DATA.catColors[item.cat] || "#9aa6ba";
    const btn = owned
      ? '<button class="act-btn undo-btn" type="button">↩</button>'
      : '<button class="act-btn validate-btn" type="button">✓</button>';
    const titleCls = owned ? "title-cell done-cell" : "title-cell";
    const npc = item.npc ? esc(item.npc) : '<span class="empty">—</span>';
    const enemy = item.enemy ? '<span class="etag">' + esc(item.enemy) + "</span>" : "";
    const tr = document.createElement("tr");
    tr.dataset.cat = item.cat;
    tr.dataset.npc = item.npc || "";
    tr.dataset.title = item.title;
    tr.dataset.tab = owned ? "owned" : "missing";
    tr.innerHTML =
      '<td class="' + titleCls + '"><div class="title-flex">' + btn +
        '<span class="title-name">' + esc(item.title) + "</span></div></td>" +
      '<td class="how-cell">' + (item.how || "") + enemy + "</td>" +
      '<td class="npc-cell">' + npc + "</td>" +
      '<td class="cat-cell"><span class="badge" style="--c:' + color + '">' + esc(catLabel(item.cat)) + "</span></td>";
    return tr;
  }
  function renderRows() {
    const mb = qs("#tableMissing tbody");
    const ob = qs("#tableOwned tbody");
    mb.innerHTML = ""; ob.innerHTML = "";
    const fm = document.createDocumentFragment();
    const fo = document.createDocumentFragment();
    CATALOG.forEach((it) => (ownedSet.has(it.title) ? fo : fm).appendChild(rowEl(it)));
    mb.appendChild(fm); ob.appendChild(fo);
    wireLinks();
  }
  function buildFilters() {
    const cf = $("catFilters");
    cf.querySelectorAll(".filter-btn").forEach((b) => b.remove());
    const all = document.createElement("button");
    all.className = "filter-btn active";
    all.dataset.filter = "cat"; all.dataset.value = "ALL";
    all.innerHTML = '<span class="dot"></span><span class="chip-label"></span><span class="chip-count"></span>';
    cf.appendChild(all);
    DATA.categories.forEach((c) => {
      const color = DATA.catColors[c] || "#9aa6ba";
      const b = document.createElement("button");
      b.className = "filter-btn"; b.dataset.filter = "cat"; b.dataset.value = c;
      b.style.setProperty("--accent", color);
      b.innerHTML = '<span class="dot"></span><span class="chip-label"></span><span class="chip-count"></span>';
      cf.appendChild(b);
    });
    const sel = $("npcSelect");
    sel.querySelectorAll('option:not([value="ALL"])').forEach((o) => o.remove());
    DATA.npcs.forEach((n) => { const o = document.createElement("option"); o.value = n; o.textContent = n; sel.appendChild(o); });
  }
  function setHeader() { const el = $("brandChar"); if (el) el.textContent = state.character || ""; }

  // ── Onglets ──
  function switchTab(tab) {
    state.tab = tab;
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + tab));
    applyFilters(); updateFilterCounts(); save();
  }

  // ── Déplacement de ligne ──
  function moveRow(row, dest, flash) {
    const destTbody = qs(dest === "owned" ? "#tableOwned tbody" : "#tableMissing tbody");
    const btn = row.querySelector(".act-btn");
    if (dest === "owned") { btn.className = "act-btn undo-btn"; btn.textContent = "↩"; row.querySelector(".title-cell").classList.add("done-cell"); }
    else { btn.className = "act-btn validate-btn"; btn.textContent = "✓"; row.querySelector(".title-cell").classList.remove("done-cell"); }
    row.dataset.tab = dest;
    destTbody.appendChild(row);
    if (flash !== false) { row.classList.add("row-flash"); setTimeout(() => row.classList.remove("row-flash"), 1100); }
  }

  // ── Valider / Annuler ──
  function validateTitle(row) {
    const tt = row.dataset.title;
    ownedSet.add(tt); persistOwned();
    row.classList.add("leaving");
    setTimeout(() => { row.classList.remove("leaving"); moveRow(row, "owned"); updateCounts(); applyFilters(); }, 240);
    showToast(row.querySelector(".title-name").textContent, row);
  }
  function undoTitle(row) {
    const tt = row.dataset.title;
    ownedSet.delete(tt); persistOwned();
    row.classList.add("leaving");
    setTimeout(() => { row.classList.remove("leaving"); moveRow(row, "missing"); updateCounts(); applyFilters(); }, 240);
    hideToast();
  }

  // ── Toast ──
  let toastRow = null, toastTimer = null;
  function showToast(name, row) {
    toastRow = row;
    $("toastMsg").innerHTML = "<b>" + esc(name) + "</b> " + t("toast.unlocked");
    $("toast").classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 4500);
  }
  function hideToast() { $("toast").classList.remove("show"); }

  // ── Compteurs ──
  function updateCounts() {
    const nm = document.querySelectorAll("#tableMissing tbody tr").length;
    const no = document.querySelectorAll("#tableOwned tbody tr").length;
    setText("missingCount", nm); setText("ownedCount", no);
    setText("tabMissingCount", nm); setText("tabOwnedCount", no);
    setText("totalCount", DATA.totalGame);
    const pct = DATA.totalGame > 0 ? (no / DATA.totalGame * 100) : 0;
    $("topbarFill").style.width = pct + "%";
    $("ringFill").style.strokeDashoffset = (RING_C * (1 - pct / 100)).toFixed(2);
    setText("ringPct", Math.round(pct) + "%");
    updateFilterCounts();
  }
  function updateFilterCounts() {
    const sel = state.tab === "missing" ? "#tableMissing" : "#tableOwned";
    const counts = {}; let total = 0;
    document.querySelectorAll(sel + " tbody tr").forEach((r) => { counts[r.dataset.cat] = (counts[r.dataset.cat] || 0) + 1; total++; });
    document.querySelectorAll('.filter-btn[data-filter="cat"]').forEach((b) => {
      const cc = b.querySelector(".chip-count"); if (!cc) return;
      cc.textContent = b.dataset.value === "ALL" ? total : (counts[b.dataset.value] || 0);
    });
  }

  // ── Filtres ──
  function applyFilters() {
    const sel = state.tab === "missing" ? "#tableMissing" : "#tableOwned";
    let visible = 0;
    document.querySelectorAll(sel + " tbody tr").forEach((r) => {
      const show = (state.cat === "ALL" || r.dataset.cat === state.cat)
                && (state.npc === "ALL" || r.dataset.npc === state.npc)
                && (!state.search || r.textContent.toLowerCase().includes(state.search));
      r.classList.toggle("hidden", !show);
      if (show) visible++;
    });
    const empty = $("empty-" + state.tab);
    if (empty) empty.classList.toggle("show", visible === 0);
  }

  // ── Tri ──
  function applySort(tab, col, asc) {
    const tableId = tab === "missing" ? "#tableMissing" : "#tableOwned";
    const tbody = qs(tableId + " tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));
    rows.sort((a, b) => {
      const x = a.cells[col].textContent.trim().toLowerCase();
      const y = b.cells[col].textContent.trim().toLowerCase();
      return asc ? x.localeCompare(y) : y.localeCompare(x);
    });
    document.querySelectorAll(tableId + " th").forEach((th) => {
      th.classList.remove("sorted-asc", "sorted-desc");
      if (+th.dataset.col === col) th.classList.add(asc ? "sorted-asc" : "sorted-desc");
    });
    rows.forEach((r) => tbody.appendChild(r));
    sortState[tab] = { col, asc };
  }
  function sortTable(tab, col) {
    const ss = sortState[tab];
    const asc = ss.col === col ? !ss.asc : true;
    applySort(tab, col, asc);
    state["sort" + cap(tab)] = { col, asc };
    save();
  }

  // ── Synchro UI ──
  function syncUI() {
    document.querySelectorAll('.filter-btn[data-filter="cat"]').forEach((b) => b.classList.toggle("active", b.dataset.value === state.cat));
    $("npcSelect").value = state.npc;
    $("searchInput").value = state.search;
    switchTab(state.tab);
  }
  function wireLinks() { document.querySelectorAll(".how-cell a").forEach((a) => { a.target = "_blank"; a.rel = "noopener noreferrer"; }); }

  function refreshAll() {
    renderRows();
    ["missing", "owned"].forEach((tab) => { const ss = state["sort" + cap(tab)]; if (ss && ss.col > -1) applySort(tab, ss.col, ss.asc); });
    setHeader(); relabelCategories(); applyFilters(); updateCounts();
  }

  // ── Import ──
  const parseList = (txt) => txt.replace(/\r\n/g, "\n").split("\n").map((s) => s.trim()).filter(Boolean);
  function importTitles(ownedText, missingText, ownedName) {
    const byNorm = new Map();
    CATALOG.forEach((it) => byNorm.set(norm(it.title), it.title));
    const result = { mode: "", matched: 0, unmatched: [] };
    if (ownedText) {
      const set = new Set();
      parseList(ownedText).forEach((n) => { const k = byNorm.get(norm(n)); if (k) set.add(k); else result.unmatched.push(n); });
      ownedSet = set; result.mode = "owned"; result.matched = set.size;
    } else if (missingText) {
      const miss = new Set();
      parseList(missingText).forEach((n) => { const k = byNorm.get(norm(n)); if (k) miss.add(k); else result.unmatched.push(n); });
      ownedSet = new Set(CATALOG.map((it) => it.title).filter((tt) => !miss.has(tt)));
      result.mode = "missing"; result.matched = miss.size;
    }
    if (ownedName) { const m = /^(.+?)-owned\.txt$/i.exec(ownedName); if (m) state.character = m[1]; }
    persistOwned();
    refreshAll();
    return result;
  }

  // ── Installation ──
  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function b64ToBytes(b64) {
    const bin = atob(b64); const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function okHtml(count, dest) {
    return t("install.okPre") + count + t("install.okFiles") + "<b>" + esc(dest) + "</b>" + t("install.okCmd") + "<code>//lua load titles</code>";
  }
  async function installViaElectron() {
    const res = $("pickResult");
    res.className = "import-result"; res.style.display = "block"; res.textContent = t("install.installing");
    try {
      const r = await window.electronAPI.installAddon();
      if (!r || r.canceled) { res.style.display = "none"; res.textContent = ""; return; }
      if (r.ok) { res.className = "import-result ok"; res.innerHTML = okHtml(r.count, r.dest); }
      else { res.className = "import-result err"; res.textContent = t("install.fail") + r.error; }
    } catch (e) { res.className = "import-result err"; res.textContent = t("install.fail") + ((e && e.message) || e); }
  }
  async function installViaPicker() {
    const res = $("pickResult");
    res.className = "import-result"; res.textContent = "";
    let dir;
    try { dir = await window.showDirectoryPicker({ mode: "readwrite", id: "windower" }); }
    catch (e) { if (e && e.name === "AbortError") return; res.className = "import-result err"; res.style.display = "block"; res.textContent = t("install.failPick"); return; }
    try {
      let addons;
      if (dir.name.toLowerCase() === "addons") addons = dir;
      else { try { addons = await dir.getDirectoryHandle("addons"); } catch (e) { addons = await dir.getDirectoryHandle("addons", { create: true }); } }
      const titlesDir = await addons.getDirectoryHandle("titles", { create: true });
      await titlesDir.getDirectoryHandle("data", { create: true });
      await titlesDir.getDirectoryHandle("export", { create: true });
      let n = 0;
      for (const name of Object.keys(ADDON.files)) {
        const fh = await titlesDir.getFileHandle(name, { create: true });
        const w = await fh.createWritable(); await w.write(b64ToBytes(ADDON.files[name])); await w.close(); n++;
      }
      res.className = "import-result ok"; res.style.display = "block"; res.innerHTML = okHtml(n, dir.name + "\\addons\\titles");
    } catch (e) { res.className = "import-result err"; res.style.display = "block"; res.textContent = t("install.fail") + ((e && e.message) || e); }
  }
  function buildDownloadLinks() {
    const box = $("dlLinks"); if (!box) return;
    box.innerHTML = "";
    Object.keys(ADDON.files || {}).forEach((name) => {
      const btn = document.createElement("button");
      btn.className = "btn-ghost"; btn.type = "button"; btn.textContent = "⬇ " + name;
      btn.addEventListener("click", () => download(name, b64ToBytes(ADDON.files[name]), "text/plain"));
      box.appendChild(btn);
    });
  }

  // ── Modale ──
  function openModal() { $("setupModal").hidden = false; }
  function closeModal() { $("setupModal").hidden = true; }
  function switchModalTab(name) {
    document.querySelectorAll(".mtab").forEach((b) => b.classList.toggle("active", b.dataset.mtab === name));
    document.querySelectorAll(".msec").forEach((s) => s.classList.toggle("active", s.id === "msec-" + name));
  }
  function readFile(input) {
    return new Promise((resolve) => {
      const f = input.files && input.files[0];
      if (!f) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve({ text: r.result, name: f.name });
      r.onerror = () => resolve(null);
      r.readAsText(f);
    });
  }

  // ── Événements ──
  function wireEvents() {
    document.querySelectorAll(".tab-btn").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
    $("catFilters").addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn"); if (!btn) return;
      state.cat = btn.dataset.value;
      $("catFilters").querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
      applyFilters(); save();
    });
    $("npcSelect").addEventListener("change", (e) => { state.npc = e.target.value; applyFilters(); save(); });
    $("searchInput").addEventListener("input", (e) => { state.search = e.target.value.toLowerCase().trim(); applyFilters(); save(); });
    $("resetBtn").addEventListener("click", () => { state.cat = "ALL"; state.npc = "ALL"; state.search = ""; syncUI(); applyFilters(); save(); });

    document.addEventListener("click", (e) => {
      const v = e.target.closest(".validate-btn"); if (v) { validateTitle(v.closest("tr")); return; }
      const u = e.target.closest(".undo-btn"); if (u) { undoTitle(u.closest("tr")); return; }
    });
    document.querySelectorAll("#tableMissing th").forEach((th) => th.addEventListener("click", () => sortTable("missing", +th.dataset.col)));
    document.querySelectorAll("#tableOwned th").forEach((th) => th.addEventListener("click", () => sortTable("owned", +th.dataset.col)));
    $("toastUndo").addEventListener("click", () => { if (toastRow) undoTitle(toastRow); hideToast(); });
    $("themeToggle").addEventListener("click", toggleTheme);
    $("langToggle").addEventListener("click", toggleLang);

    $("setupBtn").addEventListener("click", openModal);
    $("setupClose").addEventListener("click", closeModal);
    $("setupModal").addEventListener("click", (e) => { if (e.target === $("setupModal")) closeModal(); });
    document.querySelectorAll(".mtab").forEach((b) => b.addEventListener("click", () => switchModalTab(b.dataset.mtab)));

    $("doImport").addEventListener("click", async () => {
      const o = await readFile($("importOwned"));
      const m = await readFile($("importMissing"));
      const res = $("importResult");
      if (!o && !m) { res.className = "import-result err"; res.textContent = t("import.need"); return; }
      const r = importTitles(o && o.text, m && m.text, o && o.name);
      let msg = t("import.ok") + r.matched + " " + (r.mode === "owned" ? t("import.matchedOwned") : t("import.matchedMissing")) + ".";
      if (r.unmatched.length) msg += " " + r.unmatched.length + " " + t("import.unmatched");
      res.className = "import-result ok"; res.textContent = msg;
    });

    if (window.electronAPI && window.electronAPI.installAddon) {
      $("pickWrap").hidden = false; $("pickInstall").addEventListener("click", installViaElectron);
    } else if (typeof window.showDirectoryPicker === "function") {
      $("pickWrap").hidden = false; $("pickInstall").addEventListener("click", installViaPicker);
    } else { $("noPick").hidden = false; }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("setupModal").hidden) { closeModal(); return; }
      if (e.key === "/" && document.activeElement.id !== "searchInput" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); $("searchInput").focus(); }
      else if (e.key === "Escape" && document.activeElement.id === "searchInput") { $("searchInput").value = ""; state.search = ""; applyFilters(); save(); $("searchInput").blur(); }
    });

    window.addEventListener("beforeunload", () => { state.scrollY = window.scrollY; save(); });
    window.addEventListener("resize", updateStickyOffset);
  }
  function updateStickyOffset() { const c = qs(".controls"); if (c) document.documentElement.style.setProperty("--controls-h", c.offsetHeight + "px"); }

  // ── Init ──
  function init() {
    load();
    lang = state.lang || ((navigator.language || "en").toLowerCase().indexOf("fr") === 0 ? "fr" : "en");
    state.lang = lang;
    initOwnership();
    applyTheme();
    renderRows();
    buildFilters();
    buildDownloadLinks();
    setHeader();
    wireEvents();
    applyLang();
    ["missing", "owned"].forEach((tab) => { const ss = state["sort" + cap(tab)]; if (ss && ss.col > -1) applySort(tab, ss.col, ss.asc); });
    syncUI();
    applyFilters();
    updateCounts();
    updateStickyOffset();
    requestAnimationFrame(() => window.scrollTo(0, state.scrollY || 0));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
