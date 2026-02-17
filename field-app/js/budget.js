// Phase 4 — Budget + ROI (deterministic cost layer)
// Design rule: this module NEVER mutates Phase 1–3 outcomes. It only computes cost lenses.

export function computeRoiRows({
  goalNetVotes,
  baseRates,
  tactics,
  overheadAmount = 0,
  includeOverhead = false,
  caps = null,
  mcLast = null,
}){
  const rows = [];

  const need = (goalNetVotes != null && isFinite(goalNetVotes)) ? Math.max(0, goalNetVotes) : null;

  const baseCr = baseRates?.cr ?? null;
  const baseSr = baseRates?.sr ?? null;
  const baseTr = baseRates?.tr ?? null;

  const ratesOkBase = (need != null) && (need > 0) && (baseCr != null && baseCr > 0) && (baseSr != null && baseSr > 0) && (baseTr != null && baseTr > 0);

  const addRow = (key, label) => {
    const t = tactics?.[key];
    if (!t?.enabled) return;

    const tCr = pctOverrideToDecimal(t?.crPct, baseCr);
    const tSr = pctOverrideToDecimal(t?.srPct, baseSr);
    const tTr = baseTr;

    const ratesOk = (need != null) && (need > 0) && (tCr != null && tCr > 0) && (tSr != null && tSr > 0) && (tTr != null && tTr > 0);

    let requiredAttempts = null;
    if (ratesOk){
      requiredAttempts = need / (tCr * tSr * tTr);
      if (!isFinite(requiredAttempts) || requiredAttempts <= 0) requiredAttempts = null;
    }

    const overheadPerAttempt = (includeOverhead && overheadAmount > 0 && requiredAttempts != null)
      ? (overheadAmount / requiredAttempts)
      : 0;

    const baseCpa = (t.cpa != null && isFinite(t.cpa)) ? Math.max(0, t.cpa) : 0;
    const cpa = baseCpa + overheadPerAttempt;

    let costPerNetVote = null;
    let totalCost = null;

    if (ratesOk && cpa > 0 && requiredAttempts != null){
      costPerNetVote = cpa / (tCr * tSr * tTr);
      totalCost = requiredAttempts * cpa;
    }

    // Capacity feasibility: compare required attempts (to close gap) vs cap ceiling.
    let feasibilityText = "—";
    const capForTactic = (caps && typeof caps === "object")
      ? (caps[key] ?? caps.total ?? null)
      : null;

    if (requiredAttempts == null){
      feasibilityText = (need === 0) ? "No gap" : "Missing rates";
    } else if (capForTactic == null){
      feasibilityText = "Ceiling unknown";
    } else {
      feasibilityText = (requiredAttempts <= capForTactic) ? "Feasible (base)" : "Capacity shortfall";
    }

    rows.push({
      key,
      label,
      cpa: (cpa > 0) ? cpa : null,
      costPerNetVote,
      totalCost,
      feasibilityText,
      // surface which rates were used (optional for future tooltips)
      used: { cr: tCr, sr: tSr, tr: tTr },
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

  const banner = buildBanner({ need, ratesOkBase, overheadAmount, includeOverhead, mcLast });

  return { rows, banner };
}

function pctOverrideToDecimal(pctMaybe, fallbackDecimal){
  if (pctMaybe == null || pctMaybe === "" || !isFinite(pctMaybe)) return fallbackDecimal;
  const v = Math.max(0, Math.min(100, Number(pctMaybe)));
  return v / 100;
}


function buildBanner({ need, ratesOkBase, overheadAmount, includeOverhead, mcLast }){
  if (need == null){
    return { kind: "warn", text: "ROI: Enter a valid universe + support inputs so the model can compute persuasion need." };
  }
  if (need === 0){
    return { kind: "ok", text: "ROI: Under current assumptions, no net persuasion votes are required (gap = 0)." };
  }
  if (!ratesOkBase){
    return { kind: "warn", text: "ROI: Enter Phase 2 Contact rate + Support rate and Phase 3 Turnout reliability to compute ROI." };
  }
  if (includeOverhead && overheadAmount > 0){
    return { kind: "ok", text: "ROI: Overhead allocation is ON (spread deterministically across the gap-closure plan for each tactic)." };
  }
  if (mcLast && mcLast.median != null && mcLast.needVotes != null){
    const deliveredMedian = mcLast.needVotes + mcLast.median;
    if (isFinite(deliveredMedian) && deliveredMedian > 0){
      return { kind: "warn", text: "ROI: Monte Carlo results exist — interpret ROI alongside risk (median and downside outcomes can change delivered net votes)." };
    }
  }
  return { kind: "ok", text: "ROI: Deterministic cost lens using Attempts → Conversations → Support IDs → Net Votes. You can override CR/SR per channel in Phase 4B." };
}

function fmtSignedLocal(v){
  if (v == null || !isFinite(v)) return "—";
  const n = Math.round(v);
  if (n === 0) return "0";
  return (n > 0 ? "+" : "−") + Math.abs(n).toLocaleString();
}


// Phase 5 — Optimization helper (pure; does not change ROI math)
// Returns enabled tactics with per-attempt deterministic cost + net-vote yield,
// using the SAME CR/SR override logic as Phase 4B ROI.
export function buildOptimizationTactics({ baseRates, tactics, gotv = null }){
  const baseCr = baseRates?.cr ?? null;
  const baseSr = baseRates?.sr ?? null;
  const baseTr = baseRates?.tr ?? null;

  const out = [];

  const addPers = (key, label) => {
    const t = tactics?.[key];
    if (!t?.enabled) return;

    const cr = pctOverrideToDecimal(t?.crPct, baseCr);
    const sr = pctOverrideToDecimal(t?.srPct, baseSr);
    const tr = baseTr;

    const netVotesPerAttempt = (cr != null && cr > 0 && sr != null && sr > 0 && tr != null && tr > 0)
      ? (cr * sr * tr)
      : 0;

    const costPerAttempt = (t?.cpa != null && isFinite(t.cpa)) ? Math.max(0, Number(t.cpa)) : 0;

    out.push({
      id: key,
      label,
      costPerAttempt,
      netVotesPerAttempt,
      used: { cr, sr, tr }
    });
  };

  const addGotv = (key, label) => {
    // GOTV pool is optional and must be explicitly enabled
    const g = gotv?.tactics?.[key];
    if (!g?.enabled) return;

    const t = tactics?.[key];
    // If the base tactic is disabled in ROI, we still allow a GOTV pool only if it has a CPA value.
    const costPerAttempt = (t?.cpa != null && isFinite(t.cpa)) ? Math.max(0, Number(t.cpa)) : 0;

    const cr = pctOverrideToDecimal(t?.crPct, baseCr);
    const lift = (g?.liftPct != null && isFinite(g.liftPct)) ? Math.max(0, Math.min(100, Number(g.liftPct))) / 100 : null;

    const nonVoterShare = (gotv?.nonVoterShare != null && isFinite(gotv.nonVoterShare))
      ? Math.max(0, Math.min(1, Number(gotv.nonVoterShare)))
      : null;

    // Deterministic expected votes per attempt (linear backbone)
    const netVotesPerAttempt = (cr != null && cr > 0 && lift != null && lift > 0 && nonVoterShare != null && nonVoterShare > 0)
      ? (cr * lift * nonVoterShare)
      : 0;

    // Optional realism: provide a saturation cap + decay tiers (used only when Phase 5 "diminishing returns" is ON)
    let maxAttempts = null;
    let decayTiers = null;

    const baseUniverse = gotv?.baseUniverse;
    if (baseUniverse != null && isFinite(baseUniverse) && baseUniverse > 0 && cr != null && cr > 0 && lift != null && lift > 0){
      // 95% saturation point for random-contact model: V = N*(1-exp(-rA/B)); solve for A at 95% -> ln(20) ≈ 3.0
      const r = cr * lift;
      maxAttempts = (3 * baseUniverse) / r;

      if (isFinite(maxAttempts) && maxAttempts > 0){
        const a1 = maxAttempts * 0.25;
        const a2 = maxAttempts * 0.50;
        const a3 = maxAttempts * 0.75;
        decayTiers = [
          { upto: a1, mult: Math.exp(-3 * 0.00) },
          { upto: a2, mult: Math.exp(-3 * 0.25) },
          { upto: a3, mult: Math.exp(-3 * 0.50) },
          { upto: maxAttempts, mult: Math.exp(-3 * 0.75) },
          { upto: Infinity, mult: Math.exp(-3 * 1.00) },
        ];
      } else {
        maxAttempts = null;
      }
    } else {
      maxAttempts = null;
    }

    out.push({
      id: `${key}_gotv`,
      label: `${label} (GOTV)`,
      costPerAttempt,
      netVotesPerAttempt,
      maxAttempts,
      decayTiers,
      used: { cr, lift, nonVoterShare }
    });
  };

  addPers("doors", "Doors");
  addPers("phones", "Phones");
  addPers("texts", "Texts");

  // Phase 6 — optional GOTV pools (separate from persuasion)
  addGotv("doors", "Doors");
  addGotv("phones", "Phones");
  addGotv("texts", "Texts");

  return out;
}

