import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITE = resolve(ROOT, "_site");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function readUtf8(p) {
  return readFileSync(p, "utf8");
}

function isExternal(u) {
  return /^(https?:)?\/\//i.test(u) || /^mailto:/i.test(u) || /^tel:/i.test(u);
}

function stripQueryHash(u) {
  return u.split("#")[0].split("?")[0];
}

function normalizeInternal(u) {
  if (!u) return null;
  if (isExternal(u)) return null;
  if (u.startsWith("#")) return null;
  if (u.startsWith("data:")) return null;
  const clean = stripQueryHash(u.trim());
  if (!clean) return null;
  if (clean.startsWith("/")) return clean;
  return "/" + clean.replace(/^\.?\//, "");
}

function ensure(cond, msg) {
  if (!cond) throw new Error(msg);
}

function build() {
  run("bundle exec jekyll build");
  ensure(existsSync(SITE), "_site not created");
}

function parseFrontMatter(src) {
  if (!src.startsWith("---\n")) return { data: {}, body: src };
  const end = src.indexOf("\n---\n", 4);
  if (end === -1) return { data: {}, body: src };
  const raw = src.slice(4, end + 1);
  const body = src.slice(end + 5);
  const lines = raw.split(/\r?\n/);
  const data = {};
  let key = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    if (/^\s*-\s+/.test(line) && key) {
      const v = line.replace(/^\s*-\s+/, "").trim();
      if (!Array.isArray(data[key])) data[key] = [];
      data[key].push(v);
      continue;
    }
    const m = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    key = m[1];
    let v = m[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      const inner = v.slice(1, -1).trim();
      data[key] = inner ? inner.split(",").map(x => x.trim()).filter(Boolean) : [];
      continue;
    }
    if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (v === "true") data[key] = true;
    else if (v === "false") data[key] = false;
    else if (/^\d+$/.test(v)) data[key] = Number(v);
    else data[key] = v;
  }
  return { data, body };
}

function validateContentContracts() {
  const checks = [];
  const postsDir = resolve(ROOT, "_posts");
  const papersDir = resolve(ROOT, "_papers");
  const pages = walk(ROOT).filter(p => {
    const rel = p.replace(ROOT + "/", "");
    if (rel.startsWith("_")) return false;
    if (rel.startsWith("assets/")) return false;
    if (rel.startsWith("tools/")) return false;
    if (rel.startsWith(".git")) return false;
    if (rel.startsWith("node_modules/")) return false;
    const e = extname(p).toLowerCase();
    return e === ".html" || e === ".md";
  });

  const posts = existsSync(postsDir) ? walk(postsDir).filter(p => extname(p).toLowerCase() === ".md") : [];
  const papers = existsSync(papersDir) ? walk(papersDir).filter(p => extname(p).toLowerCase() === ".md") : [];

  function requireFields(kind, fm, req) {
    for (const f of req) ensure(fm[f] !== undefined && fm[f] !== null && String(fm[f]).trim().length, `${kind} missing ${f}`);
  }

  function checkNavOrderUniqueness() {
    const seen = new Map();
    for (const p of pages) {
      const src = readUtf8(p);
      const { data } = parseFrontMatter(src);
      if (data.nav_exclude === true) continue;
      if (data.nav_order === undefined || data.nav_order === null || data.nav_order === "") continue;
      ensure(Number.isInteger(data.nav_order), `nav_order must be integer: ${p.replace(ROOT + "/", "")}`);
      const k = data.nav_order;
      if (seen.has(k)) throw new Error(`duplicate nav_order ${k}: ${seen.get(k)} and ${p.replace(ROOT + "/", "")}`);
      seen.set(k, p.replace(ROOT + "/", ""));
    }
  }

  for (const p of posts) {
    const src = readUtf8(p);
    const { data } = parseFrontMatter(src);
    requireFields("post", data, ["layout", "title", "date", "description"]);
    ensure(String(data.layout) === "post", `post layout must be post: ${p.replace(ROOT + "/", "")}`);
    if (data.tags !== undefined) ensure(Array.isArray(data.tags), `post tags must be array: ${p.replace(ROOT + "/", "")}`);
    if (data.categories !== undefined) ensure(Array.isArray(data.categories), `post categories must be array: ${p.replace(ROOT + "/", "")}`);
  }

  for (const p of papers) {
    const src = readUtf8(p);
    const { data } = parseFrontMatter(src);
    requireFields("paper", data, ["layout", "title", "date", "description"]);
    ensure(String(data.layout) === "paper", `paper layout must be paper: ${p.replace(ROOT + "/", "")}`);
    if (data.tags !== undefined) ensure(Array.isArray(data.tags), `paper tags must be array: ${p.replace(ROOT + "/", "")}`);
    if (data.category !== undefined) ensure(typeof data.category === "string" && data.category.trim().length, `paper category must be string: ${p.replace(ROOT + "/", "")}`);
    if (data.pdf !== undefined) ensure(typeof data.pdf === "string" && data.pdf.startsWith("/"), `paper pdf must be root path: ${p.replace(ROOT + "/", "")}`);
  }

  for (const p of pages) {
    const rel = p.replace(ROOT + "/", "");
    if (rel === "README.md") continue;
    if (rel.startsWith("docs/")) continue;
    if (rel === "robots.txt") continue;
    const src = readUtf8(p);
    const { data } = parseFrontMatter(src);
    if (!src.startsWith("---\n")) continue;
    if (data.search_exclude === true) continue;
    if (data.title !== undefined) ensure(String(data.title).trim().length, `page title empty: ${rel}`);
    if (data.description !== undefined) ensure(String(data.description).trim().length, `page description empty: ${rel}`);
  }

  checkNavOrderUniqueness();
}

function loadSearchIndex() {
  const p = resolve(SITE, "assets", "data", "search-index.json");
  ensure(existsSync(p), "search index missing: /assets/data/search-index.json");
  const raw = readUtf8(p);
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error("search index is not valid JSON"); }
  ensure(Array.isArray(data), "search index must be an array");
  for (const item of data) {
    ensure(item && typeof item === "object", "search index item must be an object");
    ensure(typeof item.title === "string" && item.title.trim().length, "search index item missing title");
    ensure(typeof item.url === "string" && item.url.startsWith("/"), "search index item missing url");
    ensure(typeof item.type === "string" && item.type.trim().length, "search index item missing type");
    if (item.pdf !== undefined) ensure(typeof item.pdf === "string" && item.pdf.startsWith("/"), "search index item pdf must be root path");
  }
  const blocked = ["/privacy.html", "/terms.html", "/refund.html", "/404.html", "/assets/data/search-index.json"];
  for (const b of blocked) ensure(!data.some(x => x.url === b), `search index includes excluded url: ${b}`);
  return data;
}

function checkInternalLinks() {
  const htmlFiles = walk(SITE).filter(p => extname(p).toLowerCase() === ".html");
  const missing = new Set();
  const checked = new Set();

  for (const file of htmlFiles) {
    const html = readUtf8(file);
    const attrs = [];
    const reHref = /\bhref\s*=\s*["']([^"']+)["']/gi;
    const reSrc = /\bsrc\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = reHref.exec(html))) attrs.push(m[1]);
    while ((m = reSrc.exec(html))) attrs.push(m[1]);

    for (const u0 of attrs) {
      const u = normalizeInternal(u0);
      if (!u) continue;
      const path = stripQueryHash(u);
      if (checked.has(path)) continue;
      checked.add(path);

      const fsPath = resolve(SITE, "." + path);
      const ok = existsSync(fsPath) || existsSync(fsPath + ".html") || existsSync(join(fsPath, "index.html"));
      if (!ok) missing.add(path);
    }
  }

  ensure(missing.size === 0, "missing internal targets:\n" + Array.from(missing).sort().join("\n"));
}

function checkJsonLdParses() {
  const htmlFiles = walk(SITE).filter(p => extname(p).toLowerCase() === ".html");
  const bad = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const file of htmlFiles) {
    const html = readUtf8(file);
    let m;
    while ((m = re.exec(html))) {
      const raw = m[1].trim();
      if (!raw) continue;
      try { JSON.parse(raw); } catch { bad.push(file.replace(SITE + "/", "")); break; }
    }
  }
  ensure(bad.length === 0, "invalid JSON-LD in:\n" + bad.sort().join("\n"));
}

function checkPapersHavePdfs(index) {
  const papers = index.filter(x => x.type === "paper");
  const missing = [];
  for (const p of papers) {
    const pdf = p.pdf;
    if (!pdf) continue;
    const fsPath = resolve(SITE, "." + stripQueryHash(pdf));
    if (!existsSync(fsPath)) missing.push(pdf);
  }
  ensure(missing.length === 0, "missing paper PDFs:\n" + missing.sort().join("\n"));
}

function bytesToMb(b) {
  return b / (1024 * 1024);
}

function checkAssetSizes() {
  const files = walk(resolve(ROOT, "assets")).filter(p => statSync(p).isFile());
  const tooBig = [];
  for (const f of files) {
    const s = statSync(f).size;
    const rel = f.replace(ROOT + "/", "");
    const ext = extname(f).toLowerCase();
    const mb = bytesToMb(s);
    const limit =
      ext === ".pdf" ? 12 :
      [".png",".jpg",".jpeg",".webp",".gif",".svg"].includes(ext) ? 2.5 :
      [".js",".css",".json",".scss"].includes(ext) ? 0.5 :
      5;
    if (mb > limit) tooBig.push(`${rel} (${mb.toFixed(2)}MB)`);
  }
  ensure(tooBig.length === 0, "oversized assets:\n" + tooBig.sort().join("\n"));
}

function main() {
  validateContentContracts();
  build();
  const index = loadSearchIndex();
  checkInternalLinks();
  checkJsonLdParses();
  checkPapersHavePdfs(index);
  checkAssetSizes();
  console.log("Self-Test: PASS — contracts ok; build ok; search ok; links ok; jsonld ok; assets ok");
}

main();
