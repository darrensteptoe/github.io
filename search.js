const input = document.getElementById("q");
const resultsList = document.getElementById("results");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear");

let SITE_INDEX = [];

/* =========================
   Helpers
========================= */

function clearResults() {
  resultsList.innerHTML = "";
  countEl.textContent = "0";
}

function renderResults(items) {
  resultsList.innerHTML = "";
  countEl.textContent = items.length;

  if (!items.length) return;

  items.forEach(item => {
    const li = document.createElement("li");

    const link = document.createElement("a");
    link.href = item.url;
    link.textContent = item.title;

    li.appendChild(link);

    if (item.desc) {
      const meta = document.createElement("div");
      meta.className = "resultMeta";
      meta.textContent = item.desc;
      li.appendChild(meta);
    }

    resultsList.appendChild(li);
  });
}

function searchIndex(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    clearResults();
    return;
  }

  const results = SITE_INDEX.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.desc.toLowerCase().includes(q) ||
    (item.content && item.content.toLowerCase().includes(q))
  );

  renderResults(results);
}

/* =========================
   Init
========================= */

fetch("./site-index.json")
  .then(res => res.json())
  .then(data => {
    SITE_INDEX = data;
  })
  .catch(() => {
    SITE_INDEX = [];
  });

clearResults(); // 🔥 Ensures blank state on load

/* =========================
   Events
========================= */

input.addEventListener("input", e => {
  searchIndex(e.target.value);
});

clearBtn.addEventListener("click", () => {
  input.value = "";
  clearResults();
  input.focus();
});
