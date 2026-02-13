// small, intentional JS only
(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Add stable IDs to panels based on aria-label / H2 text.
  // This enables deep-linking like /work.html#documentary-work without manual IDs.
  const slugify = (s) =>
    String(s ?? "")
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const ensurePanelIds = () => {
    const panels = Array.from(document.querySelectorAll("main#main section.panel"));
    const used = new Set();
    for (const el of panels) {
      if (el.id) {
        used.add(el.id);
        continue;
      }
      const label = el.getAttribute("aria-label") || el.querySelector("h2")?.textContent || "";
      const base = slugify(label) || "section";
      let id = base;
      let i = 2;
      while (used.has(id) || document.getElementById(id)) {
        id = `${base}-${i++}`;
      }
      el.id = id;
      used.add(id);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensurePanelIds);
  } else {
    ensurePanelIds();
  }

  // PWA-lite: register service worker (safe no-op if unsupported)
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // silent fail: the site still works normally
      });
    });
  }
})();
