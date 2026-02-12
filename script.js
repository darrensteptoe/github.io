// small, intentional JS only
(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // PWA-lite: register service worker (safe no-op if unsupported)
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // silent fail: the site still works normally
      });
    });
  }
})();
