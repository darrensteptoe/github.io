(() => {
  const q = document.getElementById("q");
  const clearBtn = document.getElementById("clear");
  const resultsEl = document.getElementById("results");
  const countEl = document.getElementById("count");
  const dirEl = document.getElementById("dir");
  const yearEl = document.getElementById("year");

  yearEl.textContent = String(new Date().getFullYear());

  let pages = [];
  let filtered = [];

  const escapeHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const normalize = (s) => String(s ?? "").toLowerCase().trim();

  const renderDirectory = () => {
    dirEl.innerHTML = pages
      .filter(p => !p.hidden)
      .map(p => `<li><a href="${p.url}">${escapeHtml(p.title || p.url)}</a></li>`)
      .join("");
  };

  const renderResults = () => {
    resultsEl.innerHTML = filtered
      .map(p => {
        const title = escapeHtml(p.title || p.url);
        const desc = escapeHtml(p.desc || "");
        const url = p.url || "#";
        return `
          <li>
            <div class="resultTitle"><a href="${url}">${title}</a></div>
            ${desc ? `<div class="resultDesc">${desc}</div>` : ""}
          </li>
        `;
      })
      .join("");
    countEl.textContent = String(filtered.length);
  };

  const applyFilter = () => {
    const term = normalize(q.value);
    if (!term) {
      filtered = pages.filter(p => !p.hidden);
      renderResults();
      return;
    }

    const terms = term.split(/\s+/).filter(Boolean);

    filtered = pages
      .filter(p => !p.hidden)
      .map(p => {
        const hay = normalize([p.title, p.desc, (p.tags || []).join(" ")].join(" "));
        let score = 0;
        for (const t of terms) if (hay.includes(t)) score += 1;
        return { p, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.p);

    renderResults();
  };

  const openTopResult = () => {
    if (!filtered.length) return;
    const top = filtered[0];
    if (top?.url) window.location.href = top.url;
  };

  const load = async () => {
    try {
      const res = await fetch("./search-index.json", { cache: "no-store" });
      const data = await res.json();
      pages = Array.isArray(data) ? data : [];
    } catch {
      pages = [];
    }

    filtered = pages.filter(p => !p.hidden);
    renderDirectory();
    renderResults();
  };

  q.addEventListener("input", applyFilter);

  q.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      openTopResult();
    }
    if (e.key === "Escape") {
      q.value = "";
      applyFilter();
    }
  });

  clearBtn.addEventListener("click", () => {
    q.value = "";
    q.focus();
    applyFilter();
  });

  load();
})();
