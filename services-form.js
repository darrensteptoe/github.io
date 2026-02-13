(() => {
  "use strict";

  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  const btn = document.getElementById("submitBtn");

  if (!form || !statusEl || !btn) return;

  const projectType = document.getElementById("projectType");

  const mediaFields = document.getElementById("mediaFields");
  const consultingFields = document.getElementById("consultingFields");

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

  const otherDetailsWrap = document.getElementById("otherDetailsWrap");
  const otherDetails = document.getElementById("otherDetails");

  const quoteText = document.getElementById("quoteText");

  const PRICING = {
    wedding: { bronze: 2400, silver: 3200, gold: 4200, platinum: 5200, extraHour: 125 },
    event: { halfDay: 600, fullDay: 1000, extraHour: 150 },
    interview: { base: 450, extraHour: 125 },
    commercial: { base: 900, extraHour: 200 },
    architecture: { base: 650, extraHour: 150 },
    editing: { hourly: 95 },
    consulting: {
      one_hour: 175,
      project: { min: 450, typical: 900 },
      retainer: { min: 1200, typical: 2400 },
      training: { min: 350, typical: 750 }
    }
  };

  const show = (el, visible) => {
    if (!el) return;
    el.classList.toggle("hidden", !visible);
    el.setAttribute("aria-hidden", visible ? "false" : "true");
  };

  const setRequired = (el, required) => {
    if (!el) return;
    if (required) el.setAttribute("required", "required");
    else el.removeAttribute("required");
  };

  const setStatus = (msg, kind) => {
    statusEl.textContent = msg || "";
    statusEl.dataset.kind = kind || "";
  };

  const money = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return "";
    return v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  };

  const num = (v) => {
    const n = Number(String(v || "").trim());
    return Number.isFinite(n) ? n : 0;
  };

  const disableForm = (disabled) => {
    btn.disabled = disabled;
    Array.from(form.elements).forEach((el) => {
      if (el.tagName === "BUTTON") return;
      el.disabled = disabled;
    });
  };

  const resetMediaSubfields = () => {
    show(weddingPackageWrap, false);
    show(coverageHoursWrap, false);
    show(otherDetailsWrap, false);

    if (weddingPackage) weddingPackage.value = "";
    if (coverageHours) coverageHours.value = "";
    if (otherDetails) otherDetails.value = "";

    setRequired(weddingPackage, false);
    setRequired(otherDetails, false);
  };

  const resetConsultingSubfields = () => {
    show(monthsWrap, false);
    if (months) months.value = "";
    setRequired(months, false);
  };

  const updateVisibility = () => {
    const pt = projectType?.value || "";

    show(mediaFields, pt === "media");
    show(consultingFields, pt === "consulting");

    if (pt !== "media") {
      resetMediaSubfields();
      if (mediaType) mediaType.value = "";
      if (mediaDate) mediaDate.value = "";
      if (deliverables) deliverables.value = "";
    }

    if (pt !== "consulting") {
      resetConsultingSubfields();
      if (consultingEngagement) consultingEngagement.value = "";
    }

    setRequired(mediaType, pt === "media");
    setRequired(mediaDate, pt === "media");
    setRequired(consultingEngagement, pt === "consulting");

    updateMediaMode();
    updateConsultingMode();
    updateQuote();
  };

  const updateMediaMode = () => {
    const pt = projectType?.value || "";
    if (pt !== "media") return;

    const mt = mediaType?.value || "";

    resetMediaSubfields();

    if (!mt) {
      updateQuote();
      return;
    }

    if (mt === "wedding") {
      show(weddingPackageWrap, true);
      show(coverageHoursWrap, true);
      setRequired(weddingPackage, true);
    } else if (mt === "event") {
      show(coverageHoursWrap, true);
    } else if (mt === "interview" || mt === "commercial" || mt === "architecture") {
      show(coverageHoursWrap, true);
    } else if (mt === "editing") {
      show(coverageHoursWrap, true);
    } else if (mt === "other") {
      show(otherDetailsWrap, true);
      setRequired(otherDetails, true);
    }

    updateQuote();
  };

  const updateConsultingMode = () => {
    const pt = projectType?.value || "";
    if (pt !== "consulting") return;

    const ce = consultingEngagement?.value || "";

    resetConsultingSubfields();

    if (ce === "retainer") {
      show(monthsWrap, true);
      setRequired(months, true);
    }

    updateQuote();
  };

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
        quoteText.textContent = `${money(base + extra)} (base ${money(base)}${extra ? ` + ${money(extra)} estimated overage` : ""})`;
        return;
      }

      if (mt === "event") {
        const hrs = num(coverageHours?.value);
        if (!hrs) {
          quoteText.textContent = `Typical ranges: ${money(PRICING.event.halfDay)} (half day) or ${money(PRICING.event.fullDay)} (full day). Enter hours for a rough estimate.`;
          return;
        }
        let est = 0;
        if (hrs <= 4) est = PRICING.event.halfDay;
        else if (hrs <= 8) est = PRICING.event.fullDay;
        else est = PRICING.event.fullDay + (hrs - 8) * PRICING.event.extraHour;
        quoteText.textContent = `${money(est)} (based on ~${hrs} hours)`;
        return;
      }

      if (mt === "interview") {
        const hrs = num(coverageHours?.value);
        if (!hrs) {
          quoteText.textContent = `Typical starting point: ${money(PRICING.interview.base)}. Enter hours for a rough estimate.`;
          return;
        }
        const est = PRICING.interview.base + Math.max(0, hrs - 2) * PRICING.interview.extraHour;
        quoteText.textContent = `${money(est)} (base ${money(PRICING.interview.base)} for ~2 hours, then hourly)`;
        return;
      }

      if (mt === "commercial") {
        const hrs = num(coverageHours?.value);
        if (!hrs) {
          quoteText.textContent = `Typical starting point: ${money(PRICING.commercial.base)}. Enter hours for a rough estimate.`;
          return;
        }
        const est = PRICING.commercial.base + Math.max(0, hrs - 3) * PRICING.commercial.extraHour;
        quoteText.textContent = `${money(est)} (base ${money(PRICING.commercial.base)} for ~3 hours, then hourly)`;
        return;
      }

      if (mt === "architecture") {
        const hrs = num(coverageHours?.value);
        if (!hrs) {
          quoteText.textContent = `Typical starting point: ${money(PRICING.architecture.base)}. Enter hours for a rough estimate.`;
          return;
        }
        const est = PRICING.architecture.base + Math.max(0, hrs - 3) * PRICING.architecture.extraHour;
        quoteText.textContent = `${money(est)} (base ${money(PRICING.architecture.base)} for ~3 hours, then hourly)`;
        return;
      }

      if (mt === "editing") {
        const hrs = num(coverageHours?.value);
        if (!hrs) {
          quoteText.textContent = `Editing typically starts around ${money(PRICING.editing.hourly)} / hour. Enter hours for a rough estimate.`;
          return;
        }
        quoteText.textContent = `${money(hrs * PRICING.editing.hourly)} (~${hrs} hours at ${money(PRICING.editing.hourly)}/hr)`;
        return;
      }

      if (mt === "other") {
        quoteText.textContent = "Describe what you need and I’ll reply with a clean scope + estimate.";
        return;
      }

      quoteText.textContent = "Select options above to see a rough estimate.";
      return;
    }

    if (pt === "consulting") {
      const ce = consultingEngagement?.value || "";
      if (!ce) {
        quoteText.textContent = "Choose an engagement type to see a rough estimate.";
        return;
      }

      if (ce === "one_hour") {
        quoteText.textContent = `${money(PRICING.consulting.one_hour)} (1-hour strategy call)`;
        return;
      }

      if (ce === "project") {
        quoteText.textContent = `${money(PRICING.consulting.project.min)}–${money(PRICING.consulting.project.typical)} (typical range for scoped deliverables)`;
        return;
      }

      if (ce === "training") {
        quoteText.textContent = `${money(PRICING.consulting.training.min)}–${money(PRICING.consulting.training.typical)} (training session range)`;
        return;
      }

      if (ce === "retainer") {
        const m = num(months?.value);
        const monthly = PRICING.consulting.retainer.typical;
        if (!m) {
          quoteText.textContent = `${money(PRICING.consulting.retainer.min)}–${money(PRICING.consulting.retainer.typical)} per month. Enter months for a rough estimate.`;
          return;
        }
        quoteText.textContent = `${money(m * monthly)} (~${m} months at ${money(monthly)}/mo typical)`;
        return;
      }

      quoteText.textContent = "Describe what you need and I’ll reply with a clean scope + estimate.";
    }
  };

  const valid = () => {
    setStatus("", "");
    const pt = projectType?.value || "";
    if (!pt) {
      setStatus("Choose a project type first.", "error");
      return false;
    }

    if (pt === "media") {
      if (!mediaType?.value) {
        setStatus("Choose a media type.", "error");
        return false;
      }
      if (!mediaDate?.value) {
        setStatus("Add a date (or target date).", "error");
        return false;
      }
      if (mediaType.value === "wedding" && !weddingPackage?.value) {
        setStatus("Pick a wedding package.", "error");
        return false;
      }
      if (mediaType.value === "other" && !String(otherDetails?.value || "").trim()) {
        setStatus("Please describe what you’re looking for.", "error");
        return false;
      }
    }

    if (pt === "consulting") {
      if (!consultingEngagement?.value) {
        setStatus("Choose an engagement type.", "error");
        return false;
      }
      if (consultingEngagement.value === "retainer") {
        const m = num(months?.value);
        if (!m) {
          setStatus("Enter how many months for a retainer.", "error");
          return false;
        }
      }
    }

    return true;
  };

  projectType?.addEventListener("change", updateVisibility);
  mediaType?.addEventListener("change", updateMediaMode);
  weddingPackage?.addEventListener("change", updateQuote);
  coverageHours?.addEventListener("input", updateQuote);
  consultingEngagement?.addEventListener("change", updateConsultingMode);
  months?.addEventListener("input", updateQuote);
  otherDetails?.addEventListener("input", updateQuote);

  updateVisibility();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!valid()) return;

    disableForm(true);
    setStatus("Sending…", "info");

    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      });

      if (res.ok) {
        form.reset();
        updateVisibility();
        setStatus("Sent. I’ll get back to you soon.", "ok");
      } else {
        setStatus("Something went wrong. Please try again, or email me directly.", "error");
      }
    } catch {
      setStatus("Network error. Please try again.", "error");
    } finally {
      disableForm(false);
    }
  });
})();
