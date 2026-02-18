// js/confidenceEnvelope.js
// Phase 14 — Confidence Envelope (Risk Framing Layer)
// Pure post-processing of Monte Carlo margin outcomes.
// NOTE: Must not mutate inputs.

function isFiniteNumber(x){
  return typeof x === "number" && isFinite(x);
}

function mean(arr){
  let s = 0;
  for (let i=0;i<arr.length;i++) s += arr[i];
  return arr.length ? (s / arr.length) : 0;
}

function stdev(arr){
  const n = arr.length;
  if (!n) return 0;
  const m = mean(arr);
  let v = 0;
  for (let i=0;i<n;i++){
    const d = arr[i] - m;
    v += d*d;
  }
  v /= n;
  return Math.sqrt(v);
}

function quantileSorted(sorted, q){
  const n = sorted.length;
  if (!n) return 0;
  if (q <= 0) return sorted[0];
  if (q >= 1) return sorted[n-1];
  const i = q * (n - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  const t = i - lo;
  return sorted[lo] + t * (sorted[hi] - sorted[lo]);
}

export function computeConfidenceEnvelope({ margins, sortedMargins, winProb, winRule }){
  const arr = Array.isArray(margins) ? margins : [];
  const n = arr.length;
  const out = {
    version: "14.0",
    runs: n,
    winProb: (typeof winProb === "number" && isFinite(winProb)) ? winProb : null,
    percentiles: { p10: 0, p50: 0, p90: 0 },
    bands: {
      downside: { lo: 0, hi: 0 },
      central:  { lo: 0, hi: 0 },
      upside:   { lo: 0, hi: 0 },
    },
    risk: {
      marginOfSafety: 0,
      downsideRiskMass: 0,
      expectedShortfall10: 0,
      breakEven: {
        targetMargin: 0,
        pWinAtTarget: 0,
        requiredShiftP50: 0,
        requiredShiftP10: 0
      },
      fragility: {
        slopeAtBreakeven: 0,
        fragilityIndex: 0,
        cliffRisk: 0
      }
    },
    diagnostics: {
      min: 0, max: 0, mean: 0, stdev: 0,
      skewHint: "",
      monotonicChecks: { ok: true, notes: [] }
    }
  };

  if (!n) return out;

  // Validate / filter
  for (let i=0;i<n;i++){
    if (!isFiniteNumber(arr[i])){
      out.diagnostics.monotonicChecks.ok = false;
      out.diagnostics.monotonicChecks.notes.push("non-finite margin detected");
      // Continue; downstream stats will become NaN if not filtered.
      // We choose to hard-fail by returning zeros with diagnostic.
      return out;
    }
  }

  const sorted = Array.isArray(sortedMargins) && sortedMargins.length === n
    ? sortedMargins.slice()
    : arr.slice().sort((a,b)=>a-b);

  const p10 = quantileSorted(sorted, 0.10);
  const p50 = quantileSorted(sorted, 0.50);
  const p90 = quantileSorted(sorted, 0.90);

  out.percentiles = { p10, p50, p90 };
  out.bands.downside = { lo: p10, hi: p50 };
  out.bands.central  = { lo: p10, hi: p90 };
  out.bands.upside   = { lo: p50, hi: p90 };

  // Win rule
  const rule = (winRule === "gt0") ? "gt0" : "gte0";
  let wins = 0;
  let losses = 0;
  for (let i=0;i<n;i++){
    const m = arr[i];
    const isWin = (rule === "gt0") ? (m > 0) : (m >= 0);
    if (isWin) wins++; else losses++;
  }
  const pWinAtTarget = wins / n;

  out.winProb = out.winProb == null ? pWinAtTarget : out.winProb;
  out.risk.downsideRiskMass = losses / n;
  out.risk.breakEven.pWinAtTarget = pWinAtTarget;

  // Margin of safety (robust)
  out.risk.marginOfSafety = p10;

  // Expected shortfall (bottom 10%)
  const k = Math.max(1, Math.ceil(0.10 * n));
  let s = 0;
  for (let i=0;i<k;i++) s += sorted[i];
  out.risk.expectedShortfall10 = s / k;

  // Break-even shift requirements
  out.risk.breakEven.requiredShiftP50 = Math.max(0, -p50);
  out.risk.breakEven.requiredShiftP10 = Math.max(0, -p10);

  // Diagnostics
  out.diagnostics.min = sorted[0];
  out.diagnostics.max = sorted[n-1];
  out.diagnostics.mean = mean(arr);
  out.diagnostics.stdev = stdev(arr);
  if (n < 200) out.diagnostics.skewHint = "low_n";

  // Fragility
  const sd = out.diagnostics.stdev;
  const eps = Math.max(1, Math.round(0.01 * (sd || 0)));
  let winsMinus = 0;
  for (let i=0;i<n;i++){
    const m = arr[i];
    const isWinMinus = (rule === "gt0") ? (m > eps) : (m >= eps);
    if (isWinMinus) winsMinus++;
  }
  const pMinus = winsMinus / n;
  const slope = (pWinAtTarget - pMinus) / eps;

  out.risk.fragility.slopeAtBreakeven = slope;
  out.risk.fragility.fragilityIndex = slope * 100;

  const w = Math.max(1, Math.round(Math.min(25, 0.5 * (sd || 0))));
  let near = 0;
  for (let i=0;i<n;i++){
    const m = arr[i];
    if (Math.abs(m) <= w) near++;
  }
  out.risk.fragility.cliffRisk = near / n;

  // Invariants
  if (!(p10 <= p50 && p50 <= p90)){
    out.diagnostics.monotonicChecks.ok = false;
    out.diagnostics.monotonicChecks.notes.push("percentiles not monotonic");
  }
  if (!(out.risk.expectedShortfall10 <= p10)){
    out.diagnostics.monotonicChecks.ok = false;
    out.diagnostics.monotonicChecks.notes.push("expected shortfall > p10");
  }

  return out;
}
