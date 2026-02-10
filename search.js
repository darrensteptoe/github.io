(() => {
  const q = document.getElementById("q");
  const clearBtn = document.getElementById("clear");
  const results = document.getElementById("results");
  const count = document.getElementById("count");
  const year = document.getElementById("year");

  year.textContent = String(new Date().getFullYear());

  let pages = [];
  let filtered = [];

  const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#039;");

  const normalize = (s) => (s || "").toLowerCase().trim();

  const render = () => {
    results.innerHTML = filtered.map(p => {
      const title = escapeHtml(p.title || p.url);
      const desc = escapeHtml(p.desc || "");
      const url = p.url || "#";
      return `
        <li>
          <div class="resultTitle"><a href="${url}">${title}</a></div>
          ${desc ? `<div class="resultDesc">${desc}</div>` : ""}
        </li>
      `;
    }).join("");

    count.textContent = String(filtered.length);
  };

  const applyFilter = () => {
    const term = normalize(q.value);

    if (!term) {
      filtered = pages.slice();
      render();
      return;
    }

    const terms = term.split(/\s+/).filter(Boolean);

    filtered = pages
      .map(p => {
        const hay = normalize([p.title, p.desc, (p.tags || []).join(" ")].join(" "));
        let score = 0;
        for (const t of terms) {
          if (hay.includes(t)) score += 1;
        }
        return { p, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.p);

    render();
  };

  const openTopResult = () => {
    if (!filtered.length) return;
    const top = filtered[0];
    if (top && top.url) window.location.href = top.url;
  };

  const load = async () => {
    try {
      const res = await fetch("./search-index.json", { cache: "no-store" });
      pages = await res.json();
      if (!Array.isArray(pages)) pages = [];
    } catch {
      pages = [];
    }

    filtered = pages.slice();
    render();
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
