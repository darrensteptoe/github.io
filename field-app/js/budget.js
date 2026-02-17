// Phase 4 — Budget + ROI (deterministic cost layer)
// Design rule: this module NEVER mutates Phase 1–3 outcomes. It only computes cost lenses.

export function computeRoiRows({
  goalNetVotes,
  cr, sr, tr,
  tactics,
  overheadAmount = 0,
  includeOverhead = false,
  capAttempts = null,
  mcLast = null,
}){
  const rows = [];

  const need = (goalNetVotes != null && isFinite(goalNetVotes)) ? Math.max(0, goalNetVotes) : null;

  // Validate rates
  const ratesOk = (need != null) && (need > 0) && (cr != null && cr > 0) && (sr != null && sr > 0) && (tr != null && tr > 0);

  let requiredAttempts = null;
  if (ratesOk){
    requiredAttempts = need / (cr * sr * tr);
    if (!isFinite(requiredAttempts) || requiredAttempts <= 0) requiredAttempts = null;
  }

  const overheadPerAttempt = (includeOverhead && overheadAmount > 0 && requiredAttempts != null)
    ? (overheadAmount / requiredAttempts)
    : 0;

  const addRow = (key, label) => {
    const t = tactics?.[key];
    if (!t?.enabled) return;

    const baseCpa = (t.cpa != null && isFinite(t.cpa)) ? Math.max(0, t.cpa) : 0;
    const cpa = baseCpa + overheadPerAttempt;

    let costPerNetVote = null;
    let totalCost = null;

    if (ratesOk && cpa > 0 && requiredAttempts != null){
      costPerNetVote = cpa / (cr * sr * tr);
      totalCost = requiredAttempts * cpa;
    }

    // Capacity feasibility: compare required attempts (to close gap) vs cap ceiling.
    let feasibilityText = "—";
    if (requiredAttempts == null){
      feasibilityText = (need === 0) ? "No gap" : "Missing rates";
    } else if (capAttempts == null){
      feasibilityText = "Ceiling unknown";
    } else {
      feasibilityText = (requiredAttempts <= capAttempts) ? "Feasible (base)" : "Capacity shortfall";
    }

    rows.push({
      key,
      label,
      cpa: (cpa > 0) ? cpa : null,
      costPerNetVote,
      totalCost,
      feasibilityText,
    });
  };

  addRow("doors", "Doors");
  addRow("phones", "Phones");
  addRow("texts", "Texts");

  // Sort by cost per net vote (ascending), pushing nulls to bottom
  rows.sort((a,b) => {
    const av = (a.costPerNetVote == null) ? Infinity : a.costPerNetVote;
    const bv = (b.costPerNetVote == null) ? Infinity : b.costPerNetVote;
    return av - bv;
  });

  const banner = buildBanner({ need, ratesOk, requiredAttempts, capAttempts, overheadAmount, includeOverhead, mcLast });

  return { rows, banner };
}

function buildBanner({ need, ratesOk, requiredAttempts, capAttempts, overheadAmount, includeOverhead, mcLast }){
  if (need == null){
    return { kind: "warn", text: "ROI: Enter a valid universe + support inputs so the model can compute persuasion need." };
  }
  if (need === 0){
    return { kind: "ok", text: "ROI: Under current assumptions, no net persuasion votes are required (gap = 0)." };
  }
  if (!ratesOk){
    return { kind: "warn", text: "ROI: Enter Phase 2 Contact rate + Support rate and Phase 3 Turnout reliability to compute cost per net vote." };
  }
  if (includeOverhead && overheadAmount > 0 && requiredAttempts != null){
    const per = overheadAmount / requiredAttempts;
    if (isFinite(per) && per > 0){
      return { kind: "ok", text: `ROI: Overhead allocation on. Adds ~$${per.toFixed(2)} per required attempt (spread across the gap-closure plan).` };
    }
  }
  if (mcLast && mcLast.median != null && mcLast.needVotes != null){
    // mcLast.median is (delivered - need). So deliveredMedian = need + median.
    const delivered = mcLast.needVotes + mcLast.median;
    if (isFinite(delivered)){
      const label = delivered >= mcLast.needVotes ? "Median MC outcome meets/exceeds the gap." : "Median MC outcome falls short of the gap.";
      return { kind: delivered >= mcLast.needVotes ? "ok" : "warn", text: `ROI: ${label} (Median margin: ${fmtSignedLocal(mcLast.median)}).` };
    }
  }
  if (capAttempts != null && requiredAttempts != null){
    return { kind: (requiredAttempts <= capAttempts) ? "ok" : "warn", text: (requiredAttempts <= capAttempts)
      ? "ROI: Base-rate plan is within the Phase 3 capacity ceiling."
      : "ROI: Base-rate plan exceeds the Phase 3 capacity ceiling (capacity risk)."
    };
  }
  return null;
}

function fmtSignedLocal(v){
  if (v == null || !isFinite(v)) return "—";
  const n = Math.round(v);
  if (n === 0) return "0";
  return (n > 0 ? "+" : "−") + Math.abs(n).toLocaleString();
}
