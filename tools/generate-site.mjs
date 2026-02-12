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
  "contact.html": 6,
};

const HIDDEN_IN_NAV = new Set(["privacy.html", "terms.html", "refund.html", "404.html"]);

const SECTION_EXCLUDE = new Set([
  "navigation",
  "pages",
  "site search",
  "search",
]);

function slugify(s) {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripHtml(s) {
  return String(s ?? "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAttr(attrs, name) {
  const re = new RegExp(`${name}=["']([^"']+)["']`, "i");
  const m = String(attrs ?? "").match(re);
  return m ? m[1].trim() : "";
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

function getMainHtml(html) {
  const m = html.match(/<main\b[^>]*id=["']main["'][^>]*>([\s\S]*?)<\/main>/i);
  if (m) return m[1];
  // fallback: use body
  const b = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return b ? b[1] : html;
}

function getH2Title(sectionHtml) {
  const m = sectionHtml.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  return m ? stripHtml(m[1]) : "";
}

function extractSections(html) {
  const main = getMainHtml(html);
  const sections = [];
  const seen = new Set();

  const re = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
  let match;
  while ((match = re.exec(main))) {
    const attrs = match[1] || "";
    const inner = match[2] || "";

    // only panels
    if (!/class=["'][^"']*\bpanel\b[^"']*["']/i.test(attrs)) continue;

    const aria = getAttr(attrs, "aria-label");
    const title = (aria || getH2Title(inner) || "").trim();
    if (!title) continue;

    const norm = title.toLowerCase().trim();
    if (SECTION_EXCLUDE.has(norm)) continue;

    const text = stripHtml(inner);
    if (!text || text.length < 25) continue;

    // stable anchor derived from title
    let anchor = slugify(title) || "section";
    let uniq = anchor;
    let i = 2;
    while (seen.has(uniq)) {
      uniq = `${anchor}-${i++}`;
    }
    seen.add(uniq);
    anchor = uniq;

    sections.push({
      title,
      anchor,
      text: text.slice(0, 1400),
    });
  }

  return sections;
}

function buildTags(title, desc, filename, sections) {
  const sectionWords = (sections || [])
    .map((s) => s.title)
    .join(" ");

  const base = `${title} ${desc} ${sectionWords} ${filename.replace(/\.html$/i, "")}`
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const seen = new Set();
  const tags = [];
  for (const w of base) {
    if (w.length < 2) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    tags.push(w);
  }
  return tags.slice(0, 50);
}

function buildIndex() {
  const items = [];

  for (const file of PUBLIC_HTML) {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");

    const title = getTitle(html) || file;
    const desc = getMeta(html, "description") || "";

    const sections = extractSections(html);

    // full-text content for robust search:
    // - prefer panel text inside <main>
    // - exclude nav/search panels (already filtered)
    const content = sections.map((s) => s.text).join(" ").slice(0, 20000);

    items.push({
      title,
      url: `./${file}`,
      desc,
      tags: buildTags(title, desc, file, sections),
      content,
      sections,
      hidden: HIDDEN_IN_NAV.has(file) ? true : undefined,
      order: NAV_ORDER[file] ?? 999,
    });
  }

  items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title));

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
