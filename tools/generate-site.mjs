import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const PUBLIC_HTML = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith(".html"))
  .filter((f) => !["base.html"].includes(f))
  .filter((f) => !f.startsWith("admin"));

const DOMAIN = (() => {
  try {
    const cname = fs.readFileSync(path.join(ROOT, "CNAME.txt"), "utf8").trim();
    return cname ? `https://${cname}` : "";
  } catch {
    return "";
  }
})();

const NAV_ORDER = {
  "index.html": 0,
  "services.html": 1,
  "work.html": 2,
  "writing.html": 3,
  "projects.html": 4,
  "more.html": 5,
};

const HIDDEN_IN_NAV = new Set(["privacy.html", "terms.html", "refund.html", "404.html"]);

function stripHtml(s) {
  return s
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMeta(html, name) {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function getTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  if (!m) return "";
  return m[1].trim().replace(/\s+—\s+Darren Steptoe$/i, "");
}

function buildTags(title, desc, filename) {
  const base = `${title} ${desc} ${filename.replace(/\.html$/i, "")}`
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // de-dupe but keep order
  const seen = new Set();
  const tags = [];
  for (const w of base) {
    if (w.length < 2) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    tags.push(w);
  }
  return tags.slice(0, 40);
}

function buildIndex() {
  const items = [];

  for (const file of PUBLIC_HTML) {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");

    const title = getTitle(html) || file;
    const desc = getMeta(html, "description") || "";

    // lightweight content for better search (first ~1200 chars)
    const text = stripHtml(html);
    const content = text.slice(0, 1200);

    items.push({
      title,
      url: `./${file}`,
      desc,
      tags: buildTags(title, desc, file),
      content,
      hidden: HIDDEN_IN_NAV.has(file) ? true : undefined,
      order: NAV_ORDER[file] ?? 999,
    });
  }

  items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title));

  // remove helper fields we don’t need in the final json
  const clean = items.map(({ order, ...rest }) => {
    if (rest.hidden === undefined) delete rest.hidden;
    return rest;
  });

  fs.writeFileSync(path.join(ROOT, "site-index.json"), JSON.stringify(clean, null, 2) + "\n");
}

function buildSitemapAndRobots() {
  if (!DOMAIN) return;

  const urls = [
    `${DOMAIN}/`,
    ...PUBLIC_HTML
      .filter((f) => f !== "base.html")
      .filter((f) => f !== "404.html")
      .map((f) => `${DOMAIN}/${f}`),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
    `\n</urlset>\n`;

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}/sitemap.xml\n`;
  fs.writeFileSync(path.join(ROOT, "robots.txt"), robots);
}

buildIndex();
buildSitemapAndRobots();
console.log("Generated: site-index.json, sitemap.xml, robots.txt");
