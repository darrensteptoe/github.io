(() => {
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  const btn = document.getElementById("submitBtn");

  if (!form || !statusEl || !btn) return;

  const projectType = document.getElementById("projectType");
  const mediaFields = document.getElementById("mediaFields");
  const consultingFields = document.getElementById("consultingFields");
  const otherDetailsWrap = document.getElementById("otherDetailsWrap");
  const otherDetails = document.getElementById("otherDetails");

  const mediaType = document.getElementById("mediaType");
  const mediaDate = document.getElementById("mediaDate");
  const weddingPackageWrap = document.getElementById("weddingPackageWrap");
  const weddingPackage = document.getElementById("weddingPackage");
  const coverageHoursWrap = document.getElementById("coverageHoursWrap");
  const coverageHours = document.getElementById("coverageHours");
  const deliverables = document.getElementById("deliverables");

  const consultingEngagement = document.getElementById("consultingEngagement");
  const monthsWrap = document.getElementById("monthsWrap");
  const months = document.getElementById("months");

  const quoteText = document.getElementById("quoteText");

  const PRICING = {
    wedding: { bronze: 2400, silver: 3200, gold: 4200, platinum: 5200, extraHour: 125 },
    event: { halfDay: 600, fullDay: 1000, extraHour: 125 },
    consulting: {
      strategy: 250,
      municipalMin: 3000, municipalMax: 6000,
      stateMin: 5000, stateMax: 10000,
      congressMin: 10000, congressMax: 20000,
    },
    editingHourly: 85,
  };

  const setStatus = (msg, kind) => {
    statusEl.textContent = msg || "";
    statusEl.dataset.kind = kind || "";
  };

  const disableForm = (disabled) => {
    btn.disabled = disabled;
    Array.from(form.elements).forEach((el) => {
      if (el.tagName === "BUTTON") return;
      el.disabled = disabled;
    });
  };

  const setHidden = (el, hidden) => {
    if (!el) return;
    el.classList.toggle("hidden", !!hidden);
    el.setAttribute("aria-hidden", hidden ? "true" : "false");
  };

  const setRequired = (el, required) => {
    if (!el) return;
    if (required) el.setAttribute("required", "required");
    else el.removeAttribute("required");
  };

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const money = (n) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const updateQuote = () => {
    if (!quoteText) return;

    const pt = projectType?.value || "";
    if (!pt) {
      quoteText.textContent = "Select a project type to see a rough estimate.";
      return;
    }

    if (pt === "media") {
      const mt = mediaType?.value || "";
      if (!mt) {
        quoteText.textContent = "Choose a media type to see a rough estimate.";
        return;
      }

      if (mt === "wedding") {
        const pkg = weddingPackage?.value || "";
        if (!pkg) {
          quoteText.textContent = "Pick a wedding package to see a rough estimate.";
          return;
        }
        const base = PRICING.wedding[pkg] || 0;
        const hrs = num(coverageHours?.value);
        const included = { bronze: 6, silver: 8, gold: 10, platinum: 12 }[pkg] || 0;
        const extra = hrs > included ? (hrs - included) * PRICING.wedding.extraHour : 0;
        const est = base + extra;

        quoteText.textContent =
          `${money(est)} (base ${money(base)}${extra ? ` + ${money(extra)} estimated overage` : ""})`;
        return;
      }

      if (mt === "event") {
        const hrs = num(coverageHours?.value);
        if (!hrs) {
          quoteText.textContent =
            `Typical ranges: ${money(PRICING.event.halfDay)} (half day) or ${money(PRICING.event.fullDay)} (full day). Enter hours for a rough estimate.`;
          return;
        }
        let est = 0;
        if (hrs <= 4) est = PRICING.event.halfDay;
        else if (hrs <= 8) est = PRICING.event.fullDay;
        else est = PRICING.event.fullDay + (hrs - 8) * PRICING.event.extraHour;

        quoteText.textContent = `${money(est)} (based on ${hrs} hour${hrs === 1 ? "" : "s"})`;
        return;
      }

      if (mt === "editing") {
        quoteText.textContent = `${money(PRICING.editingHourly)} / hour (5-hour minimum per project phase)`;
        return;
      }

      quoteText.textContent = "Quote required — share scope, deliverables, and timeline for an accurate estimate.";
      return;
    }

    if (pt === "consulting") {
      const eng = consultingEngagement?.value || "";
      if (!eng) {
        quoteText.textContent = "Choose an engagement type to see a rough estimate.";
        return;
      }

      if (eng === "strategy") {
        quoteText.textContent = money(PRICING.consulting.strategy);
        return;
      }

      const m = Math.max(1, num(months?.value) || 1);

      if (eng === "municipal") {
        quoteText.textContent =
          `${money(PRICING.consulting.municipalMin)}–${money(PRICING.consulting.municipalMax)} / month ` +
          `(≈ ${money(PRICING.consulting.municipalMin * m)}–${money(PRICING.consulting.municipalMax * m)} total for ${m} month${m === 1 ? "" : "s"})`;
        return;
      }

      if (eng === "state") {
        quoteText.textContent =
          `${money(PRICING.consulting.stateMin)}–${money(PRICING.consulting.stateMax)} / month ` +
          `(≈ ${money(PRICING.consulting.stateMin * m)}–${money(PRICING.consulting.stateMax * m)} total for ${m} month${m === 1 ? "" : "s"})`;
        return;
      }

      if (eng === "congress") {
        quoteText.textContent =
          `${money(PRICING.consulting.congressMin)}–${money(PRICING.consulting.congressMax)}+ / month ` +
          `(≈ ${money(PRICING.consulting.congressMin * m)}–${money(PRICING.consulting.congressMax * m)}+ total for ${m} month${m === 1 ? "" : "s"})`;
        return;
      }

      quoteText.textContent = "Quote required — share the race, timeline, and the help you need.";
      return;
    }

    quoteText.textContent = "Quote required — share scope, deadline, and what success looks like.";
  };

  const syncVisibilityAndRequirements = () => {
    const pt = projectType?.value || "";

    setHidden(mediaFields, pt !== "media");
    setHidden(consultingFields, pt !== "consulting");
    setHidden(otherDetailsWrap, pt !== "other");

    setRequired(mediaType, pt === "media");
    setRequired(mediaDate, pt === "media");
    setRequired(consultingEngagement, pt === "consulting");
    setRequired(otherDetails, pt === "other");

    setRequired(weddingPackage, false);
    setHidden(weddingPackageWrap, true);
    setHidden(coverageHoursWrap, true);

    setHidden(monthsWrap, true);
    setRequired(months, false);

    const mt = mediaType?.value || "";
    if (pt === "media" && mt) {
      if (mt === "wedding") {
        setHidden(weddingPackageWrap, false);
        setRequired(weddingPackage, true);
        setHidden(coverageHoursWrap, false);
      } else if (mt === "event") {
        setHidden(coverageHoursWrap, false);
      } else {
        setHidden(coverageHoursWrap, mt === "editing");
      }
    }

    const eng = consultingEngagement?.value || "";
    if (pt === "consulting" && eng && eng !== "strategy" && eng !== "other") {
      setHidden(monthsWrap, false);
      setRequired(months, true);
    }

    updateQuote();
  };

  form.dataset.startedAt = String(Date.now());

  projectType?.addEventListener("change", syncVisibilityAndRequirements);
  mediaType?.addEventListener("change", syncVisibilityAndRequirements);
  weddingPackage?.addEventListener("change", updateQuote);
  coverageHours?.addEventListener("input", updateQuote);
  consultingEngagement?.addEventListener("change", syncVisibilityAndRequirements);
  months?.addEventListener("input", updateQuote);
  deliverables?.addEventListener("change", updateQuote);

  syncVisibilityAndRequirements();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const requiredEls = form.querySelectorAll("[required]");
    for (const el of requiredEls) {
      if (!String(el.value || "").trim()) {
        setStatus("Please fill out all required fields (*).", "error");
        el.focus();
        return;
      }
    }

    const gotcha = form.querySelector('input[name="_gotcha"]');
    if (gotcha && gotcha.value.trim()) {
      form.reset();
      syncVisibilityAndRequirements();
      setStatus("✅ Submitted. I’ll follow up within 48 hours.", "success");
      return;
    }

    const start = form.dataset.startedAt ? Number(form.dataset.startedAt) : Date.now();
    if (Date.now() - start < 2500) {
      setStatus("Please take a moment to review your details, then submit again.", "info");
      return;
    }

    setStatus("Submitting…", "info");
    disableForm(true);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });

      if (res.ok) {
        form.reset();
        syncVisibilityAndRequirements();
        setStatus("✅ Submitted. I’ll follow up within 48 hours.", "success");
        return;
      }

      let errMsg = "Something went wrong. Please try again.";
      try {
        const json = await res.json();
        if (json && json.errors && json.errors.length) {
          errMsg = json.errors.map((e) => e.message).join(" ");
        }
      } catch (_) {}

      setStatus(errMsg, "error");
    } catch (_) {
      setStatus("Network error. Please try again in a moment.", "error");
    } finally {
      disableForm(false);
    }
  });
})();
