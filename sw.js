const VERSION = "v1-contact1";
const CACHE_NAME = `ds-static-${VERSION}`;

const BASE = self.registration.scope;

const ASSETS = [
  "",
  "index.html",
  "services.html",
  "contact.html",
  "work.html",
  "writing.html",
  "projects.html",
"privacy.html",
  "terms.html",
  "refund.html",
  "404.html",
  "styles.css",
  "script.js",
  "nav.js",
  "site-index.json",
  "search.js",
  "manifest.webmanifest",
  "assets/img/icon-192.png",
  "assets/img/icon-512.png"
];

const toURL = (p) => new URL(p, BASE).toString();

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS.map(toURL))));
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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((cached) => cached || caches.match(toURL("404.html")))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        event.waitUntil(
          fetch(req)
            .then((res) => {
              if (res && res.ok) {
                caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
              }
            })
            .catch(() => {})
        );
        return cached;
      }
      return fetch(req).then((res) => {
        if (res && res.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
        }
        return res;
      });
    })
  );
});
