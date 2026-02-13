const VERSION = "v2";
const CACHE_NAME = `ds-static-${VERSION}`;

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/services.html",
  "/work.html",
  "/writing.html",
  "/projects.html",
  "/more.html",
  "/privacy.html",
  "/terms.html",
  "/refund.html",
  "/404.html",
  "/styles.css",
  "/script.js",
  "/nav.js",
  "/site-index.json",
  "/search.js",
  "/manifest.webmanifest",
  "/assets/img/icon-192.png",
  "/assets/img/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? Promise.resolve() : caches.delete(k))))
    )
  );
  self.clients.claim();
});

function networkFirst(req) {
  return fetch(req)
    .then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(req, copy));
      return res;
    })
    .catch(() => caches.match(req));
}

function staleWhileRevalidate(req) {
  return caches.match(req).then((cached) => {
    const fetcher = fetch(req)
      .then((res) => {
        if (res && res.ok) caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => null);

    return cached || fetcher;
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  const accept = req.headers.get("accept") || "";
  const isHTML = accept.includes("text/html");
  const isCSS = url.pathname.endsWith(".css");
  const isJS = url.pathname.endsWith(".js");

  if (isHTML || isCSS || isJS) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});
