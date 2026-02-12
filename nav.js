(() => {
  const list = document.getElementById("site-pages");
  if (!list) return;

  const currentPath = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  const escapeHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const sortOrder = {
    "index.html": 0,
    "services.html": 1,
    "work.html": 2,
    "writing.html": 3,
    "projects.html": 4,
    "more.html": 5,
  };

  const normalizeUrlToFile = (url) => {
    const u = String(url || "");
    const file = u.split("/").pop() || u;
    return file.toLowerCase();
  };

  const render = (pages) => {
    const visible = pages.filter((p) => !p.hidden);
    visible.sort((a, b) => {
      const af = normalizeUrlToFile(a.url);
      const bf = normalizeUrlToFile(b.url);
      const ao = (af in sortOrder) ? sortOrder[af] : 999;
      const bo = (bf in sortOrder) ? sortOrder[bf] : 999;
      if (ao !== bo) return ao - bo;
      return String(a.title || af).localeCompare(String(b.title || bf));
    });

    list.innerHTML = visible
      .map((p) => {
        const title = escapeHtml(p.title || p.url);
        const url = p.url || "#";
        const file = normalizeUrlToFile(url);
        const isCurrent = file === currentPath;
        return `<li><a href="${url}"${isCurrent ? " aria-current=\"page\"" : ""}>${title}</a></li>`;
      })
      .join("");
  };

  const load = async () => {
    try {
      const res = await fetch("./site-index.json", { cache: "no-store" });
      const pages = await res.json();
      render(Array.isArray(pages) ? pages : []);
    } catch {
      list.innerHTML = "";
    }
  };

  load();
})();
