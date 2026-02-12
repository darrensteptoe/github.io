(() => {
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  const btn = document.getElementById("submitBtn");

  if (!form || !statusEl || !btn) return;

  const eventTypeSelect = document.getElementById("eventTypeSelect");
  const eventTypeOtherWrap = document.getElementById("eventTypeOtherWrap");
  const eventTypeOther = document.getElementById("eventTypeOther");

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

  const hideOther = () => {
    if (!eventTypeOtherWrap || !eventTypeOther) return;
    eventTypeOtherWrap.classList.add("hidden");
    eventTypeOther.removeAttribute("required");
    eventTypeOther.value = "";
  };

  const showOther = () => {
    if (!eventTypeOtherWrap || !eventTypeOther) return;
    eventTypeOtherWrap.classList.remove("hidden");
    eventTypeOther.setAttribute("required", "required");
  };

  if (eventTypeSelect && eventTypeOtherWrap && eventTypeOther) {
    // Ensure initial state
    hideOther();

    eventTypeSelect.addEventListener("change", () => {
      if (eventTypeSelect.value === "Other") showOther();
      else hideOther();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Basic required-field check (Formspree still validates server-side)
    const requiredEls = form.querySelectorAll("[required]");
    for (const el of requiredEls) {
      if (!String(el.value || "").trim()) {
        setStatus("Please fill out all required fields (*).", "error");
        el.focus();
        return;
      }
    }

    if (eventTypeSelect && eventTypeOther && eventTypeSelect.value === "Other" && !eventTypeOther.value.trim()) {
      setStatus("Please specify your event type.", "error");
      eventTypeOther.focus();
      return;
    }

    // Honeypot (bots will fill this)
    const gotcha = form.querySelector('input[name="_gotcha"]');
    if (gotcha && gotcha.value.trim()) {
      form.reset();
      hideOther();
      setStatus("✅ Submitted. I’ll follow up within 48 hours.", "success");
      return;
    }

    // Time-to-submit guard (simple bot filter)
    const start = form.dataset.startedAt ? Number(form.dataset.startedAt) : Date.now();
    const elapsedMs = Date.now() - start;
    if (elapsedMs < 2500) {
      setStatus("Please take a moment to review your details, then submit again.", "info");
      return;
    }

    setStatus("Submitting…", "info");
    disableForm(true);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form),
      });

      if (res.ok) {
        form.reset();
        hideOther();
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

  // Start timer after the page is ready
  form.dataset.startedAt = String(Date.now());
})();
