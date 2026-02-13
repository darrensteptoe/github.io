(() => {
  const q = document.getElementById("q");
  const clearBtn = document.getElementById("clear");
  const resultsEl = document.getElementById("results");
  const countEl = document.getElementById("count");

  // meta can be either #resultsMeta OR .resultsMeta (supports both)
  const metaEl =
    document.getElementById("resultsMeta") ||
    document.querySelector(".resultsMeta") ||
    null;

  if (!q || !clearBtn || !resultsEl || !countEl) return;

  let pages = [];
  let filtered = [];

  const escapeHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const normalize = (s) => String(s ?? "").toLowerCase();

  const setVisible = (on) => {
    // Works even if you don’t use .hidden in HTML
    if (metaEl) metaEl.classList.toggle("hidden", !on);
    resultsEl.classList.toggle("hidden", !on);
  };

  const clearResults = () => {
    filtered = [];
    resultsEl.innerHTML = "";
    countEl.textContent = "0";
    setVisible(false);
  };

  const makeSnippet = (text, terms) => {
    const t = String(text ?? "").replace(/\s+/g, " ").trim();
    if (!t) return "";
    if (!terms.length) return t.slice(0, 180) + (t.length > 180 ? "…" : "");

    const low = t.toLowerCase();
    let idx = -1;
    for (const term of terms) {
      const i = low.indexOf(term);
      if (i !== -1 && (idx === -1 || i < idx)) idx = i;
    }
    if (idx === -1) return t.slice(0, 180) + (t.length > 180 ? "…" : "");

    const start = Math.max(0, idx - 70);
    const end = Math.min(t.length, idx + 110);
    let snippet = t.slice(start, end);
    if (start > 0) snippet = "…" + snippet;
    if (end < t.length) snippet = snippet + "…";
    return snippet;
  };

  const highlight = (snippet, terms) => {
    if (!snippet || !terms.length) return escapeHtml(snippet);
    const escaped = escapeHtml(snippet);
    let out = escaped;
    for (const term of terms) {
      if (!term) continue;
      const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
      out = out.replace(re, "<mark>$1</mark>");
    }
    return out;
  };

  const renderResults = () => {
    resultsEl.innerHTML = filtered
      .map((r) => {
        const p = r.p || r;
        const title = escapeHtml(p.title || p.url);
        const desc = escapeHtml(p.desc || "");
        const sectionTitle = escapeHtml(r.sectionTitle || "");
        const snippet = highlight(r.snippet || "", r.terms || []);
        const url = (p.url || "#") + (r.anchor ? `#${encodeURIComponent(r.anchor)}` : "");

        return `
          <li>
            <div class="resultTitle"><a href="${url}">${title}</a></div>
            ${sectionTitle ? `<div class="resultMeta">${sectionTitle}</div>` : ""}
            ${snippet ? `<div class="resultSnippet">${snippet}</div>` : (desc ? `<div class="resultDesc">${desc}</div>` : "")}
          </li>
        `;
      })
      .join("");

    countEl.textContent = String(filtered.length);
    setVisible(true);
  };

  const applyFilter = () => {
    const termRaw = normalize(q.value).trim();
    const terms = termRaw ? termRaw.split(/\s+/).filter(Boolean) : [];

    // ✅ Blank state when empty
    if (!terms.length) {
      clearResults();
      return;
    }

    filtered = pages
      .filter((p) => !p.hidden)
      .map((p) => {
        const title = normalize(p.title);
        const desc = normalize(p.desc);
        const tags = normalize((p.tags || []).join(" "));
        const content = normalize(p.content || "");

        let score = 0;

        const scoreField = (hay, weight) => {
          let s = 0;
          for (const t of terms) if (hay.includes(t)) s += weight;
          return s;
        };

        score += scoreField(title, 8);
        score += scoreField(tags,
