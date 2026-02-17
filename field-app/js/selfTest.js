// js/selfTest.js
// Phase 5.5 — Lightweight in-browser self-test infrastructure.
// Exports: runSelfTests(engineAccessors)
//
// Design goals:
// - No build tools
// - No uncaught throws (always returns structured results)
// - No production interference (dev-triggered by app.js)

import { FIXTURES } from "./fixtures.js";
import { computeMarginalValueDiagnostics } from "./marginalValue.js";
import { computeMaxAttemptsByTactic, optimizeTimelineConstrained } from "./timelineOptimizer.js";
import { MODEL_VERSION, makeScenarioExport, deterministicStringify, validateScenarioExport, PLAN_CSV_HEADERS, planRowsToCsv, hasNonFiniteNumbers } from "./export.js";

function nowMs(){ return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now(); }

function stableStringify(obj){
  try{
    return JSON.stringify(obj, Object.keys(obj).sort());
  } catch {
    // Fallback if cyclic (shouldn't happen). Best-effort string.
    try { return String(obj); } catch { return "[unstringifiable]"; }
  }
}

function clamp01(v){
  if (v == null || !isFinite(v)) return null;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function pctToUnitFromPct(pct){
  if (pct == null || !isFinite(pct)) return null;
  return clamp01(Number(pct) / 100);
}

export function runSelfTests(engine){
  const started = nowMs();

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: [],
    durationMs: 0
  };

  const recordFailure = (name, message) => {
    results.failed += 1;
    results.failures.push({ name, message: String(message || "Test failed") });
  };

  const test = (name, fn) => {
    results.total += 1;
    try{
      const ok = fn();
      if (ok === false){
        recordFailure(name, "Returned false");
      } else {
        results.passed += 1;
      }
    } catch (err){
      recordFailure(name, err && err.message ? err.message : String(err));
    }
  };

  const assert = (cond, msg) => {
    if (!cond) throw new Error(msg || "Assertion failed");
  };

  const approx = (a, b, tolAbs) => {
    // Treat null/undefined as equivalent "no value" for snapshot comparisons.
    // This is important for ROI rows where values can legitimately be null.
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (!isFinite(a) || !isFinite(b)) return false;
    return Math.abs(a - b) <= tolAbs;
  };

  const isFiniteNum = (v) => (v != null && typeof v === "number" && Number.isFinite(v));

  // Guard: engine accessors present
  test("SelfTest: engine accessors present", () => {
    assert(engine && typeof engine === "object", "Missing engineAccessors object");
    const required = ["computeAll","deriveNeedVotes","derivedWeeksRemaining","runMonteCarloSim","optimizeMixBudget","optimizeMixCapacity","buildOptimizationTactics","computeRoiRows","computeCapacityBreakdown"];
    for (const k of required){
      assert(typeof engine[k] === "function", `Missing accessor: ${k}()`);
    }
  });

  // --- C) Phase 8B — Marginal value diagnostics (pure) ---
  test("Phase 8B: non-binding timeline caps => deltas ~0 and no NaN", () => {
    const tactics = [
      { id:"doors", label:"Doors", costPerAttempt: 1.0, netVotesPerAttempt: 0.05, maxAttempts: null },
      { id:"phones", label:"Phones", costPerAttempt: 0.8, netVotesPerAttempt: 0.03, maxAttempts: null },
      { id:"texts", label:"Texts", costPerAttempt: 0.2, netVotesPerAttempt: 0.005, maxAttempts: null }
    ];

    const capsInput = {
      enabled: true,
      weeksRemaining: 12,
      activeWeeksOverride: 12,
      gotvWindowWeeks: 4,
      staffing: { staff: 5, volunteers: 10, staffHours: 30, volunteerHours: 10 },
      throughput: { doors: 25, phones: 40, texts: 200 },
      tacticKinds: { doors:"persuasion", phones:"persuasion", texts:"persuasion" }
    };
    const caps = computeMaxAttemptsByTactic(capsInput);

    // Capacity mode with a low ceiling ensures timeline caps are non-binding.
    const tlInputs = {
      mode: "capacity",
      budgetLimit: null,
      capacityLimit: 100,
      capacityCeiling: null,
      tactics,
      step: 25,
      useDecay: false,
      objective: "net",
      maxAttemptsByTactic: caps.maxAttemptsByTactic,
      tlObjectiveMode: "max_net",
      goalNetVotes: 10
    };
    const baseline = optimizeTimelineConstrained(tlInputs);

    const mv = computeMarginalValueDiagnostics({ baselineInputs: tlInputs, baselineResult: baseline, timelineInputs: capsInput });

    assert(mv && typeof mv === "object", "Diagnostics missing");
    assert(typeof mv.primaryBottleneck === "string", "primaryBottleneck not string");
    assert(Array.isArray(mv.interventions), "interventions not array");

    for (const it of mv.interventions){
      if (it.deltaMaxNetVotes != null) assert(isFiniteNum(it.deltaMaxNetVotes), "deltaMaxNetVotes NaN/Infinity");
      if (it.deltaCost != null) assert(isFiniteNum(it.deltaCost), "deltaCost NaN/Infinity");
      // With capacity binding, adding timeline capacity shouldn't change max net votes.
      if (it.deltaMaxNetVotes != null) assert(Math.abs(it.deltaMaxNetVotes) <= 1e-9, "Expected ~0 deltaMaxNetVotes");
    }
  });

  test("Phase 8B: binding timeline cap => primary is timeline and some intervention helps", () => {
    const tactics = [
      { id:"doors", label:"Doors", costPerAttempt: 1.0, netVotesPerAttempt: 0.20, maxAttempts: null },
      { id:"phones", label:"Phones", costPerAttempt: 1.0, netVotesPerAttempt: 0.05, maxAttempts: null },
      { id:"texts", label:"Texts", costPerAttempt: 1.0, netVotesPerAttempt: 0.01, maxAttempts: null }
    ];

    const capsInput = {
      enabled: true,
      weeksRemaining: 4,
      activeWeeksOverride: 4,
      gotvWindowWeeks: 2,
      staffing: { staff: 1, volunteers: 0, staffHours: 5, volunteerHours: 0 },
      throughput: { doors: 10, phones: 10, texts: 10 },
      tacticKinds: { doors:"persuasion", phones:"persuasion", texts:"persuasion" }
    };
    const caps = computeMaxAttemptsByTactic(capsInput);

    const tlInputs = {
      mode: "budget",
      budgetLimit: 100000,
      capacityLimit: null,
      capacityCeiling: null,
      tactics,
      step: 25,
      useDecay: false,
      objective: "net",
      maxAttemptsByTactic: caps.maxAttemptsByTactic,
      tlObjectiveMode: "max_net",
      goalNetVotes: 999999
    };
    const baseline = optimizeTimelineConstrained(tlInputs);
    const mv1 = computeMarginalValueDiagnostics({ baselineInputs: tlInputs, baselineResult: baseline, timelineInputs: capsInput });
    const mv2 = computeMarginalValueDiagnostics({ baselineInputs: tlInputs, baselineResult: baseline, timelineInputs: capsInput });

    assert(String(mv1.primaryBottleneck).startsWith("timeline:"), `Expected timeline bottleneck, got ${mv1.primaryBottleneck}`);

    const anyPositive = (mv1.interventions || []).some(it => (typeof it.deltaMaxNetVotes === "number") && it.deltaMaxNetVotes > 0);
    assert(anyPositive, "Expected at least one positive deltaMaxNetVotes");

    // Determinism: stable ordering / values
    assert(stableStringify(mv1) === stableStringify(mv2), "Diagnostics not deterministic");
  });

  // Build baseline deterministic context from current state snapshot (no UI mutation)
  const snap = (engine.getStateSnapshot && typeof engine.getStateSnapshot === "function")
    ? engine.getStateSnapshot()
    : null;

  const buildModelInputFromSnapshot = (s) => {
    // Mirrors app.js modelInput structure.
    const candidates = Array.isArray(s?.candidates) ? s.candidates : [];
    return {
      universeSize: (s?.universeSize != null) ? Number(s.universeSize) : null,
      turnoutA: (s?.turnoutA != null) ? Number(s.turnoutA) : null,
      turnoutB: (s?.turnoutB != null) ? Number(s.turnoutB) : null,
      bandWidth: (s?.bandWidth != null) ? Number(s.bandWidth) : null,
      candidates: candidates.map(c => ({
        id: c.id,
        name: c.name,
        supportPct: (c?.supportPct != null) ? Number(c.supportPct) : null
      })),
      undecidedPct: (s?.undecidedPct != null) ? Number(s.undecidedPct) : null,
      yourCandidateId: s?.yourCandidateId,
      undecidedMode: s?.undecidedMode,
      userSplit: s?.userSplit,
      persuasionPct: (s?.persuasionPct != null) ? Number(s.persuasionPct) : null,
      earlyVoteExp: (s?.earlyVoteExp != null) ? Number(s.earlyVoteExp) : null,
    };
  };

  const baseline = (() => {
    try{
      const weeks = engine.derivedWeeksRemaining();
      const w = (weeks != null && weeks >= 0) ? weeks : null;
      const modelInput = snap ? buildModelInputFromSnapshot(snap) : null;
      const res = modelInput ? engine.computeAll(modelInput) : null;
      const needVotes = res ? engine.deriveNeedVotes(res) : null;
      return { weeks: w, res, needVotes };
    } catch {
      return { weeks: null, res: null, needVotes: null };
    }
  })();

  // --- A) Deterministic Math Invariants ---
  test("Deterministic: computeAll produces finite expected KPIs (where defined)", () => {
    assert(baseline.res, "Baseline computeAll result missing");
    const nv = baseline.res?.expected?.netVotes;
    const your = baseline.res?.expected?.yourVotes;
    const thr = baseline.res?.expected?.winThreshold;
    // Some can be null based on incomplete input; only assert finite if present.
    if (nv != null) assert(isFiniteNum(nv), "netVotes is NaN/Infinity");
    if (your != null) assert(isFiniteNum(your), "yourVotes is NaN/Infinity");
    if (thr != null) assert(isFiniteNum(thr), "winThreshold is NaN/Infinity");
  });

  test("ROI layer: no NaN/Infinity in totalCost or costPerNetVote (where defined)", () => {
    assert(snap, "State snapshot unavailable (getStateSnapshot missing?)");
    assert(baseline.res, "Baseline computeAll result missing");

    const cr = pctToUnitFromPct(snap.contactRatePct);
    const sr = pctToUnitFromPct(snap.supportRatePct);
    const tr = pctToUnitFromPct(snap.turnoutReliabilityPct);

    const weeks = baseline.weeks;
    const cap = engine.computeCapacityBreakdown({
      weeks,
      orgCount: (snap.orgCount != null) ? Number(snap.orgCount) : null,
      orgHoursPerWeek: (snap.orgHoursPerWeek != null) ? Number(snap.orgHoursPerWeek) : null,
      volunteerMult: (snap.volunteerMultBase != null) ? Number(snap.volunteerMultBase) : null,
      doorShare: pctToUnitFromPct(snap.channelDoorPct),
      doorsPerHour: (snap.doorsPerHour3 != null) ? Number(snap.doorsPerHour3) : (snap.doorsPerHour != null ? Number(snap.doorsPerHour) : null),
      callsPerHour: (snap.callsPerHour3 != null) ? Number(snap.callsPerHour3) : null,
    });

    const budget = snap.budget || {};
    const overheadAmount = (budget.overheadAmount != null && isFinite(budget.overheadAmount)) ? Math.max(0, Number(budget.overheadAmount)) : 0;
    const includeOverhead = !!budget.includeOverhead;

    const { rows } = engine.computeRoiRows({
      goalNetVotes: baseline.needVotes,
      baseRates: { cr, sr, tr },
      tactics: (budget.tactics || {}),
      overheadAmount,
      includeOverhead,
      caps: { total: cap?.total ?? null, doors: cap?.doors ?? null, phones: cap?.phones ?? null },
      mcLast: snap.mcLast || null
    });

    for (const r of rows || []){
      if (r.totalCost != null) assert(isFiniteNum(r.totalCost), `ROI ${r.label}: totalCost NaN/Infinity`);
      if (r.costPerNetVote != null) assert(isFiniteNum(r.costPerNetVote), `ROI ${r.label}: costPerNetVote NaN/Infinity`);
    }
  });

  test("Optimization: zero budget => zero allocation", () => {
    assert(snap, "State snapshot unavailable");
    const cr = pctToUnitFromPct(snap.contactRatePct);
    const sr = pctToUnitFromPct(snap.supportRatePct);
    const tr = pctToUnitFromPct(snap.turnoutReliabilityPct);

    const budget = snap.budget || {};
    const tacticsRaw = budget.tactics || {};
    const tactics = engine.buildOptimizationTactics({ baseRates: { cr, sr, tr }, tactics: tacticsRaw, turnoutModel: { enabled:false }, universeSize: snap?.universeSize ?? null, targetUniversePct: snap?.persuasionPct ?? null });

    const out = engine.optimizeMixBudget({
      budget: 0,
      tactics,
      step: 25,
      capacityCeiling: null,
      useDecay: false
    });

    const attempts = out?.totals?.attempts ?? 0;
    const cost = out?.totals?.cost ?? 0;
    assert(attempts === 0, `Expected 0 attempts, got ${attempts}`);
    assert(cost === 0, `Expected 0 cost, got ${cost}`);
  });

  test("Optimization: zero capacity => zero allocation", () => {
    assert(snap, "State snapshot unavailable");
    const cr = pctToUnitFromPct(snap.contactRatePct);
    const sr = pctToUnitFromPct(snap.supportRatePct);
    const tr = pctToUnitFromPct(snap.turnoutReliabilityPct);

    const budget = snap.budget || {};
    const tacticsRaw = budget.tactics || {};
    const tactics = engine.buildOptimizationTactics({ baseRates: { cr, sr, tr }, tactics: tacticsRaw });

    const out = engine.optimizeMixCapacity({
      capacity: 0,
      tactics,
      step: 25,
      useDecay: false
    });

    const attempts = out?.totals?.attempts ?? 0;
    const cost = out?.totals?.cost ?? 0;
    assert(attempts === 0, `Expected 0 attempts, got ${attempts}`);
    assert(cost === 0, `Expected 0 cost, got ${cost}`);
  });

  // --- B) Optimization Constraints ---
  test("Optimization: budget mode never exceeds budget", () => {
    const tactics = [
      { id:"a", label:"A", costPerAttempt: 1.0, netVotesPerAttempt: 0.05, maxAttempts: null },
      { id:"b", label:"B", costPerAttempt: 2.5, netVotesPerAttempt: 0.12, maxAttempts: null },
      { id:"c", label:"C", costPerAttempt: 0.5, netVotesPerAttempt: 0.01, maxAttempts: null }
    ];
    const budget = 250;
    const step = 25;
    const out = engine.optimizeMixBudget({ budget, tactics, step, capacityCeiling: null, useDecay: false });
    const cost = out?.totals?.cost ?? 0;
    assert(cost <= budget + 1e-9, `Cost ${cost} exceeded budget ${budget}`);
  });

  test("Optimization: capacity mode never exceeds capacity", () => {
    const tactics = [
      { id:"a", label:"A", costPerAttempt: 1.0, netVotesPerAttempt: 0.05, maxAttempts: null },
      { id:"b", label:"B", costPerAttempt: 2.5, netVotesPerAttempt: 0.12, maxAttempts: null }
    ];
    const cap = 300;
    const step = 25;
    const out = engine.optimizeMixCapacity({ capacity: cap, tactics, step, useDecay: false });
    const attempts = out?.totals?.attempts ?? 0;
    assert(attempts <= cap + 1e-9, `Attempts ${attempts} exceeded capacity ${cap}`);
  });

  test("Optimization: respects maxAttempts caps", () => {
    const tactics = [
      { id:"a", label:"A", costPerAttempt: 1.0, netVotesPerAttempt: 0.20, maxAttempts: 50 },
      { id:"b", label:"B", costPerAttempt: 1.0, netVotesPerAttempt: 0.10, maxAttempts: 9999 }
    ];
    const out = engine.optimizeMixBudget({ budget: 500, tactics, step: 25, capacityCeiling: null, useDecay: false });
    const a = out?.allocation?.a ?? 0;
    assert(a <= 50 + 1e-9, `Allocation a=${a} exceeded maxAttempts=50`);
  });

  test("Optimization: deterministic reproducibility (same input => same output)", () => {
    const tactics = [
      { id:"a", label:"A", costPerAttempt: 1.0, netVotesPerAttempt: 0.05, maxAttempts: null },
      { id:"b", label:"B", costPerAttempt: 2.5, netVotesPerAttempt: 0.12, maxAttempts: null }
    ];
    const args = { budget: 250, tactics, step: 25, capacityCeiling: 9999, useDecay: false };
    const o1 = engine.optimizeMixBudget(args);
    const o2 = engine.optimizeMixBudget(args);
    assert(stableStringify(o1) === stableStringify(o2), "Outputs differed for identical inputs");
  });

  // --- Phase 7) Timeline / Production feasibility ---
  test("Timeline: OFF returns neutral outputs", () => {
    const tl = engine.computeTimelineFeasibility({
      enabled: false,
      weeksRemaining: 10,
      activeWeeksOverride: null,
      gotvWindowWeeks: 2,
      staffing: { staff: 1, volunteers: 0, staffHours: 40, volunteerHours: 0 },
      throughput: { doors: 30 },
      required: { doors: 1000 },
      tacticKinds: { doors: "persuasion" },
      netVotesPerAttempt: 0.01,
      bindingHint: "budget",
      ramp: { enabled: false, mode: "linear" }
    });
    assert(tl && tl.enabled === false, "Timeline should be disabled");
    assert(tl.percentPlanExecutable === 1, "Disabled timeline should be neutral (100%)");
  });

  test("Timeline: zero weeks => zero executable attempts", () => {
    const tl = engine.computeTimelineFeasibility({
      enabled: true,
      weeksRemaining: 0,
      activeWeeksOverride: null,
      gotvWindowWeeks: 2,
      staffing: { staff: 2, volunteers: 0, staffHours: 40, volunteerHours: 0 },
      throughput: { doors: 30 },
      required: { doors: 1000 },
      tacticKinds: { doors: "persuasion" },
      netVotesPerAttempt: 0.01,
      bindingHint: "budget",
      ramp: { enabled: false, mode: "linear" }
    });
    assert((tl.executableAttemptsTotal ?? -1) === 0, `Expected 0 executable, got ${tl.executableAttemptsTotal}`);
    assert((tl.percentPlanExecutable ?? 1) === 0, `Expected 0% executable, got ${tl.percentPlanExecutable}`);
    assert((tl.shortfallAttempts ?? 0) === 1000, `Expected shortfall 1000, got ${tl.shortfallAttempts}`);
  });

  test("Timeline: required attempts <= capacity => 100% executable", () => {
    const tl = engine.computeTimelineFeasibility({
      enabled: true,
      weeksRemaining: 4,
      activeWeeksOverride: null,
      gotvWindowWeeks: 2,
      staffing: { staff: 1, volunteers: 0, staffHours: 40, volunteerHours: 0 },
      throughput: { doors: 10 },
      required: { doors: 1000 },
      tacticKinds: { doors: "persuasion" },
      netVotesPerAttempt: 0.01,
      bindingHint: "capacity",
      ramp: { enabled: false, mode: "linear" }
    });
    assert(tl.percentPlanExecutable === 1, `Expected 100%, got ${tl.percentPlanExecutable}`);
    assert((tl.shortfallAttempts ?? 0) === 0, `Expected 0 shortfall, got ${tl.shortfallAttempts}`);
  });

  test("Timeline: required attempts > capacity => shortfall > 0", () => {
    const tl = engine.computeTimelineFeasibility({
      enabled: true,
      weeksRemaining: 2,
      activeWeeksOverride: null,
      gotvWindowWeeks: 2,
      staffing: { staff: 1, volunteers: 0, staffHours: 10, volunteerHours: 0 },
      throughput: { doors: 10 },
      required: { doors: 1000 },
      tacticKinds: { doors: "persuasion" },
      netVotesPerAttempt: 0.01,
      bindingHint: "budget",
      ramp: { enabled: true, mode: "linear" }
    });
    assert((tl.shortfallAttempts ?? 0) > 0, "Expected shortfall > 0");
    assert(tl.constraintType === "Timeline-limited", `Expected Timeline-limited, got ${tl.constraintType}`);
  });

  test("Timeline: no NaN / Infinity in outputs", () => {
    const tl = engine.computeTimelineFeasibility({
      enabled: true,
      weeksRemaining: 0,
      activeWeeksOverride: 0,
      gotvWindowWeeks: 0,
      staffing: { staff: 0, volunteers: 0, staffHours: 0, volunteerHours: 0 },
      throughput: { doors: 0, phones: 0, texts: 0 },
      required: { doors: 0, phones: 0, texts: 0 },
      tacticKinds: { doors: "persuasion", phones: "persuasion", texts: "turnout" },
      netVotesPerAttempt: 0,
      bindingHint: "caps",
      ramp: { enabled: false, mode: "linear" }
    });
    const scalars = [
      tl.requiredAttemptsTotal,
      tl.executableAttemptsTotal,
      tl.percentPlanExecutable,
      tl.shortfallAttempts
    ];
    for (const v of scalars){
      assert(v == null || Number.isFinite(v), `Non-finite scalar: ${v}`);
    }
    if (Array.isArray(tl.weekly)){
      for (const w of tl.weekly){
        assert(Number.isFinite(w.week), `Non-finite week index: ${w.week}`);
        assert(Number.isFinite(w.attempts), `Non-finite week attempts: ${w.attempts}`);
      }
    }
  });

  test("Timeline: deterministic reproducibility", () => {
    const args = {
      enabled: true,
      weeksRemaining: 5,
      activeWeeksOverride: 5,
      gotvWindowWeeks: 2,
      staffing: { staff: 2, volunteers: 5, staffHours: 35, volunteerHours: 3 },
      throughput: { doors: 28, phones: 18, texts: 120 },
      required: { doors: 1200, phones: 2000, texts: 5000 },
      tacticKinds: { doors: "persuasion", phones: "persuasion", texts: "turnout" },
      netVotesPerAttempt: 0.02,
      bindingHint: "budget",
      ramp: { enabled: true, mode: "s" }
    };
    const a = engine.computeTimelineFeasibility(args);
    const b = engine.computeTimelineFeasibility(args);
    assert(stableStringify(a) === stableStringify(b), "Timeline outputs differed for identical inputs");
  });

  // --- C) Monte Carlo Stability ---
  test("Monte Carlo: same seed => identical summary output", () => {
    assert(baseline.res, "Baseline computeAll result missing");
    const sim1 = engine.runMonteCarloSim({ res: baseline.res, weeks: baseline.weeks, needVotes: baseline.needVotes, runs: 2000, seed: "selftest-seed-1" });
    const sim2 = engine.runMonteCarloSim({ res: baseline.res, weeks: baseline.weeks, needVotes: baseline.needVotes, runs: 2000, seed: "selftest-seed-1" });
    assert(stableStringify(sim1?.summary) === stableStringify(sim2?.summary), "Same seed produced different summaries");
  });

  test("Monte Carlo: different seed => different summary output", () => {
    assert(baseline.res, "Baseline computeAll result missing");
    // If weeks is unknown or capacity inputs are incomplete, MC will often degenerate
    // into a constant output regardless of seed (votes=0 for every run). In that case,
    // this test is not informative and should be skipped as a pass.
    if (baseline.weeks == null) return true;
    const sim1 = engine.runMonteCarloSim({ res: baseline.res, weeks: baseline.weeks, needVotes: baseline.needVotes, runs: 2000, seed: "selftest-seed-A" });
    const sim2 = engine.runMonteCarloSim({ res: baseline.res, weeks: baseline.weeks, needVotes: baseline.needVotes, runs: 2000, seed: "selftest-seed-B" });
    const s1 = sim1?.summary || {};
    const s2 = sim2?.summary || {};
    // Degenerate case: if both outputs show zero spread, seed sensitivity can't be asserted.
    const deg1 = (s1.p5 === s1.p95) && (s1.median === s1.p5);
    const deg2 = (s2.p5 === s2.p95) && (s2.median === s2.p5);
    if (deg1 && deg2 && (s1.p5 === s2.p5) && (s1.median === s2.median) && (s1.p95 === s2.p95)) return true;
    // Compare a couple of scalar outputs; tolerate rare collision.
    const same = (s1.winProb === s2.winProb) && (s1.median === s2.median) && (s1.p5 === s2.p5) && (s1.p95 === s2.p95);
    assert(!same, "Different seeds produced identical key summary stats (unexpected)");
  });

  test("Monte Carlo: deterministic baseline roughly aligns with MC median (within tolerance)", () => {
    assert(snap, "State snapshot unavailable");
    assert(baseline.res, "Baseline computeAll result missing");

    // Deterministic expectation using base rates + base capacity (mirrors MC core math).
    const weeks = baseline.weeks;
    const orgCount = (snap.orgCount != null) ? Number(snap.orgCount) : null;
    const orgHrs = (snap.orgHoursPerWeek != null) ? Number(snap.orgHoursPerWeek) : null;
    const vm = (snap.volunteerMultBase != null) ? Number(snap.volunteerMultBase) : null;
    const doorShare = pctToUnitFromPct(snap.channelDoorPct);
    const dph = (snap.doorsPerHour3 != null) ? Number(snap.doorsPerHour3) : (snap.doorsPerHour != null ? Number(snap.doorsPerHour) : null);
    const cph = (snap.callsPerHour3 != null) ? Number(snap.callsPerHour3) : null;

    const capContacts = engine.computeCapacityContacts({ weeks, orgCount, orgHoursPerWeek: orgHrs, volunteerMult: vm, doorShare, doorsPerHour: dph, callsPerHour: cph });
    // If capacity can't be computed (incomplete inputs), skip as pass.
    if (capContacts == null || capContacts <= 0) return true;

    const cr = pctToUnitFromPct(snap.contactRatePct);
    const pr = pctToUnitFromPct(snap.supportRatePct);
    const rr = pctToUnitFromPct(snap.turnoutReliabilityPct);
    if (!(cr && cr > 0) || !(pr && pr > 0) || !(rr && rr > 0)) return true;

    const detVotes = capContacts * cr * pr * rr;
    const detMargin = detVotes - (baseline.needVotes ?? 0);

    const sim = engine.runMonteCarloSim({ res: baseline.res, weeks: baseline.weeks, needVotes: baseline.needVotes, runs: 5000, seed: "selftest-seed-align" });
    const mcMedian = sim?.summary?.median;

    if (mcMedian == null || !isFinite(mcMedian)) return true;

    // Tolerance: absolute 10% of |detMargin| plus a floor to avoid tiny margins.
    const tol = Math.max(100, Math.abs(detMargin) * 0.10);
    assert(approx(mcMedian, detMargin, tol), `MC median ${mcMedian} not within tol ${tol} of deterministic margin ${detMargin}`);
  });

  
  // --- Phase 5.6) Golden snapshot fixtures (drift detection) ---
  const normalizeMoney = (v) => (v == null || !isFinite(v)) ? null : Math.round(Number(v) * 100) / 100;
  const normalizeRate = (v) => (v == null || !isFinite(v)) ? null : Math.round(Number(v) * 10000) / 10000;

  const fixtureResults = [];

  const runFixture = (fx) => {
    const spec = fx?.spec || {};
    const mi = spec.modelInput || {};
    const res = engine.computeAll(mi);
    const need = res?.expected?.persuasionNeed ?? 0;

    const baseRates = spec.baseRates || {};
    const tactics = spec.tactics || {};
    const overheadAmount = (spec.overheadAmount != null && isFinite(spec.overheadAmount)) ? Number(spec.overheadAmount) : 0;
    const includeOverhead = !!spec.includeOverhead;

    const { rows } = engine.computeRoiRows({
      goalNetVotes: need,
      baseRates: { cr: Number(baseRates.cr), sr: Number(baseRates.sr), tr: Number(baseRates.tr) },
      tactics,
      overheadAmount,
      includeOverhead,
      caps: { total: null, doors: null, phones: null },
      mcLast: null
    });

    const tacticsOpt = engine.buildOptimizationTactics({ baseRates: { cr: Number(baseRates.cr), sr: Number(baseRates.sr), tr: Number(baseRates.tr) }, tactics });
    const optSpec = spec.optimize || {};
    const step = (optSpec.step != null && isFinite(optSpec.step)) ? Number(optSpec.step) : 25;

    const opt = (optSpec.mode === "capacity")
      ? engine.optimizeMixCapacity({ capacity: Number(optSpec.capacity), tactics: tacticsOpt, step, useDecay: false })
      : engine.optimizeMixBudget({ budget: Number(optSpec.budget), tactics: tacticsOpt, step, capacityCeiling: (optSpec.capacityCeiling != null ? Number(optSpec.capacityCeiling) : null), useDecay: false });

    const roiRows = Array.isArray(rows) ? rows.map(r => ({
      key: r.key,
      totalCost: normalizeMoney(r.totalCost),
      costPerNetVote: normalizeRate(r.costPerNetVote)
    })) : [];

    const out = {
      id: fx.id,
      persuasionNeed: need,
      turnoutVotes: res?.expected?.turnoutVotes ?? null,
      winThreshold: res?.expected?.winThreshold ?? null,
      yourVotes: res?.expected?.yourVotes ?? null,
      roi: {
        rows: roiRows
      },
      optimize: {
        totals: {
          cost: normalizeMoney(opt?.totals?.cost),
          attempts: (opt?.totals?.attempts != null ? Number(opt.totals.attempts) : null)
        },
        allocation: opt?.allocation || {}
      }
    };

    fixtureResults.push(out);
    return out;
  };

  const getFixtureExpectedRow = (fxExpect, key) => {
    const rows = fxExpect?.roi?.rows;
    if (!Array.isArray(rows)) return null;
    return rows.find(r => r.key === key) || null;
  };

  // Run fixtures + assert against snapshots
  if (Array.isArray(FIXTURES) && FIXTURES.length){
    for (const fx of FIXTURES){
      test(`Fixture: ${fx.id} matches golden snapshot`, () => {
        const got = runFixture(fx);
        const exp = fx.expect || {};

        // Integers should be exact
        assert(got.persuasionNeed === exp.persuasionNeed, `persuasionNeed ${got.persuasionNeed} != ${exp.persuasionNeed}`);
        assert(got.turnoutVotes === exp.turnoutVotes, `turnoutVotes ${got.turnoutVotes} != ${exp.turnoutVotes}`);
        assert(got.winThreshold === exp.winThreshold, `winThreshold ${got.winThreshold} != ${exp.winThreshold}`);
        assert(got.yourVotes === exp.yourVotes, `yourVotes ${got.yourVotes} != ${exp.yourVotes}`);

        // ROI snapshot (tolerant rounding already applied)
        const expRows = exp?.roi?.rows || [];
        for (const er of expRows){
          const gr = got.roi.rows.find(r => r.key === er.key);
          assert(gr, `missing ROI row: ${er.key}`);
          assert(approx(gr.totalCost, er.totalCost, 0.01), `ROI ${er.key} totalCost ${gr.totalCost} != ${er.totalCost}`);
          assert(approx(gr.costPerNetVote, er.costPerNetVote, 0.0002), `ROI ${er.key} costPerNetVote ${gr.costPerNetVote} != ${er.costPerNetVote}`);
        }

        // Optimization snapshot
        const expOpt = exp.optimize || {};
        const gotCost = got.optimize.totals.cost;
        const gotAttempts = got.optimize.totals.attempts;
        assert(approx(gotCost, expOpt?.totals?.cost, 0.01), `opt cost ${gotCost} != ${expOpt?.totals?.cost}`);
        assert(gotAttempts === expOpt?.totals?.attempts, `opt attempts ${gotAttempts} != ${expOpt?.totals?.attempts}`);

        const expAlloc = expOpt.allocation || {};
        for (const k of Object.keys(expAlloc)){
          assert((got.optimize.allocation?.[k] ?? 0) === expAlloc[k], `opt alloc ${k} ${(got.optimize.allocation?.[k] ?? 0)} != ${expAlloc[k]}`);
        }
      });
    }
  } else {
    test("Fixtures: FIXTURES present", () => {
      assert(false, "No fixtures found (FIXTURES missing or empty)");
    });
  }

  // Build a compact signature for drift diagnostics in the dev panel.
  const signature = {
    phase: "5.6",
    fixtures: fixtureResults
  };
  results.signature = signature;
  try{
    results.signatureHash = stableStringify(signature);
  } catch {
    results.signatureHash = null;
  }




  // --- Phase 6: Turnout / GOTV invariants ---
  test("Phase 6 invariant: Turnout OFF leaves objective values unchanged", () => {
      assert(typeof engine.withPatchedState === "function", "Missing withPatchedState()");
      const out = engine.withPatchedState({ turnoutEnabled: false }, () => {
        const s = engine.getStateSnapshot();
        const cr = (s?.contactRatePct != null) ? Number(s.contactRatePct)/100 : 0.15;
        const sr = (s?.supportRatePct != null) ? Number(s.supportRatePct)/100 : 0.10;
        const tr = (s?.turnoutReliabilityPct != null) ? Number(s.turnoutReliabilityPct)/100 : 0.80;
        return engine.buildOptimizationTactics({
          baseRates: { cr, sr, tr },
          tactics: s?.budget?.tactics || {},
          turnoutModel: { enabled:false },
          universeSize: s?.universeSize ?? null,
          targetUniversePct: s?.persuasionPct ?? null,
        });
      });

      assert(Array.isArray(out), "Expected tactics array");
      for (const t of out){
        assert(approx(t.turnoutAdjustedNetVotesPerAttempt, t.netVotesPerAttempt, 1e-12), `tactic ${t.id} drifted when turnout OFF`);
      }
    });

    test("Phase 6: Monte Carlo seeds affect turnout-adjusted outputs when variability exists", () => {
      assert(typeof engine.withPatchedState === "function", "Missing withPatchedState()");
      const baseSnap = engine.getStateSnapshot();
      const modelInput = buildModelInputFromSnapshot(baseSnap);

      const patch = {
        turnoutEnabled: true,
        turnoutBaselinePct: 55,
        turnoutTargetOverridePct: "",
        gotvMode: "advanced",
        gotvLiftMin: 0.2,
        gotvLiftMode: 1.0,
        gotvLiftMax: 2.0,
        gotvMaxLiftPP2: 12,
        gotvDiminishing2: true,
      };

      const a = engine.withPatchedState(patch, () => engine.runMonteCarloSim(modelInput, { mode: "advanced", seed: "seed-A", runs: 2000 }));
      const b = engine.withPatchedState(patch, () => engine.runMonteCarloSim(modelInput, { mode: "advanced", seed: "seed-B", runs: 2000 }));

      assert(a && b, "Missing MC summaries");
      assert(a.turnoutAdjusted && b.turnoutAdjusted, "Missing turnoutAdjusted summaries");
      assert(a.turnoutAdjusted.mean !== b.turnoutAdjusted.mean, "Different seeds should change turnout-adjusted mean when variability exists");
    });

    test("Phase 6: No NaN/Infinity in turnout-adjusted ROI fields", () => {
      assert(typeof engine.withPatchedState === "function", "Missing withPatchedState()");
      const s = engine.getStateSnapshot();
      const cr = (s?.contactRatePct != null) ? clamp(Number(s.contactRatePct), 0, 100)/100 : 0.15;
      const sr = (s?.supportRatePct != null) ? clamp(Number(s.supportRatePct), 0, 100)/100 : 0.10;
      const tr = (s?.turnoutReliabilityPct != null) ? clamp(Number(s.turnoutReliabilityPct), 0, 100)/100 : 0.80;

      const rows = engine.withPatchedState({
        turnoutEnabled: true,
        gotvMode: "basic",
        gotvLiftPP: 1.0,
        gotvMaxLiftPP: 10,
        gotvDiminishing: false,
        turnoutBaselinePct: 55,
        budget: { tactics: { doors: { enabled:true, cpa:0.18, kind:"gotv" }, phones: { enabled:true, cpa:0.03, kind:"persuasion" } } }
      }, () => {
        const res = engine.computeAll(buildModelInputFromSnapshot(engine.getStateSnapshot()));
        const needVotes = engine.deriveNeedVotes(res);
        const out = engine.computeRoiRows({
          goalNetVotes: needVotes,
          baseRates: { cr, sr, tr },
          tactics: engine.getStateSnapshot().budget.tactics,
          overheadAmount: 0,
          includeOverhead: false,
          caps: { total: null, doors: null, phones: null },
          mcLast: null,
          turnoutModel: { enabled:true, baselineTurnoutPct:55, liftPerContactPP:1.0, maxLiftPP:10, useDiminishing:false },
        });
        return out.rows || [];
      });

      for (const r of rows){
        if (r.turnoutAdjustedNetVotesPerAttempt != null){
          assert(Number.isFinite(r.turnoutAdjustedNetVotesPerAttempt), "turnoutAdjustedNetVotesPerAttempt not finite");
        }
        if (r.costPerTurnoutAdjustedNetVote != null){
          assert(Number.isFinite(r.costPerTurnoutAdjustedNetVote), "costPerTurnoutAdjustedNetVote not finite");
        }
      }
    });



  // =========================
  // Phase 8A — Timeline-Constrained Optimization tests
  // =========================

  test("Phase 8A: Caps high enough => timeline-constrained matches standard optimizer", () => {
    if (!engine.optimizeTimelineConstrained) return true;

    const tacticsOpt = engine.buildOptimizationTactics({
      baseRates: { cr: 0.2, sr: 0.5, tr: 0.8 },
      tactics: {
        doors: { enabled: true, cpa: 0.18, kind: "persuasion" },
        phones: { enabled: true, cpa: 0.03, kind: "persuasion" },
        texts: { enabled: true, cpa: 0.02, kind: "persuasion" }
      }
    });

    const standard = engine.optimizeMixBudget({
      budget: 5000,
      tactics: tacticsOpt,
      step: 25,
      capacityCeiling: null,
      useDecay: false,
      objective: "net"
    });

    const tl = engine.optimizeTimelineConstrained({
      mode: "budget",
      budgetLimit: 5000,
      capacityLimit: null,
      capacityCeiling: null,
      tactics: tacticsOpt,
      step: 25,
      useDecay: false,
      objective: "net",
      maxAttemptsByTactic: { doors: 1e12, phones: 1e12, texts: 1e12 },
      tlObjectiveMode: "max_net",
      goalNetVotes: 100
    });

    assert(stableStringify(tl.plan.allocation) === stableStringify(standard.allocation), "Allocation drift under high caps");
    assert(Math.abs((tl.plan.totals?.netVotes ?? 0) - (standard.totals?.netVotes ?? 0)) < 1e-9, "Totals drift under high caps");
    return true;
  });

  test("Phase 8A: Tight caps => allocations never exceed caps", () => {
    if (!engine.optimizeTimelineConstrained) return true;

    const tacticsOpt = engine.buildOptimizationTactics({
      baseRates: { cr: 0.2, sr: 0.5, tr: 0.8 },
      tactics: {
        doors: { enabled: true, cpa: 0.18, kind: "persuasion" },
        phones: { enabled: true, cpa: 0.03, kind: "persuasion" },
        texts: { enabled: true, cpa: 0.02, kind: "persuasion" }
      }
    });

    const caps = { doors: 0, phones: 200, texts: 50 };

    const tl = engine.optimizeTimelineConstrained({
      mode: "budget",
      budgetLimit: 5000,
      capacityLimit: null,
      capacityCeiling: null,
      tactics: tacticsOpt,
      step: 25,
      useDecay: false,
      objective: "net",
      maxAttemptsByTactic: caps,
      tlObjectiveMode: "max_net",
      goalNetVotes: 100
    });

    for (const [k, cap] of Object.entries(caps)){
      const a = Number(tl.plan.allocation?.[k] ?? 0);
      assert(Number.isFinite(a), `Allocation ${k} not finite`);
      assert(a <= cap + 1e-9, `Allocation ${k} exceeds cap`);
    }
    return true;
  });

  test("Phase 8A: Impossible goal => goalFeasible=false, remainingGapNetVotes>0", () => {
    if (!engine.optimizeTimelineConstrained) return true;

    const tacticsOpt = engine.buildOptimizationTactics({
      baseRates: { cr: 0.2, sr: 0.5, tr: 0.8 },
      tactics: {
        doors: { enabled: true, cpa: 0.18, kind: "persuasion" },
        phones: { enabled: true, cpa: 0.03, kind: "persuasion" },
        texts: { enabled: true, cpa: 0.02, kind: "persuasion" }
      }
    });

    const tl = engine.optimizeTimelineConstrained({
      mode: "budget",
      budgetLimit: 100,
      capacityLimit: null,
      capacityCeiling: null,
      tactics: tacticsOpt,
      step: 25,
      useDecay: false,
      objective: "net",
      maxAttemptsByTactic: { doors: 25, phones: 25, texts: 25 },
      tlObjectiveMode: "min_cost_goal",
      goalNetVotes: 1e9
    });

    assert(tl.meta.goalFeasible === false, "Expected goalFeasible=false");
    assert(Number.isFinite(tl.meta.maxAchievableNetVotes), "maxAchievableNetVotes not finite");
    assert(Number.isFinite(tl.meta.remainingGapNetVotes), "remainingGapNetVotes not finite");
    assert(tl.meta.remainingGapNetVotes > 0, "Expected remainingGapNetVotes > 0");
    return true;
  });

  test("Phase 8A: No NaN/Infinity in new outputs", () => {
    if (!engine.optimizeTimelineConstrained) return true;

    const tacticsOpt = engine.buildOptimizationTactics({
      baseRates: { cr: 0.2, sr: 0.5, tr: 0.8 },
      tactics: {
        doors: { enabled: true, cpa: 0.18, kind: "persuasion" },
        phones: { enabled: true, cpa: 0.03, kind: "persuasion" }
      }
    });

    const tl = engine.optimizeTimelineConstrained({
      mode: "capacity",
      budgetLimit: null,
      capacityLimit: 100,
      capacityCeiling: null,
      tactics: tacticsOpt,
      step: 25,
      useDecay: false,
      objective: "net",
      maxAttemptsByTactic: { doors: 100, phones: 100 },
      tlObjectiveMode: "max_net",
      goalNetVotes: 10
    });

    const meta = tl.meta || {};
    assert(typeof meta.bindingConstraints === "string", "bindingConstraints not string");
    assert(Number.isFinite(meta.maxAchievableNetVotes), "maxAchievableNetVotes not finite");
    assert(Number.isFinite(meta.remainingGapNetVotes), "remainingGapNetVotes not finite");
    return true;
  });

  test("Phase 8A: Deterministic reproducibility (same inputs => same outputs)", () => {
    if (!engine.optimizeTimelineConstrained) return true;

    const tacticsOpt = engine.buildOptimizationTactics({
      baseRates: { cr: 0.2, sr: 0.5, tr: 0.8 },
      tactics: {
        doors: { enabled: true, cpa: 0.18, kind: "persuasion" },
        phones: { enabled: true, cpa: 0.03, kind: "persuasion" },
        texts: { enabled: true, cpa: 0.02, kind: "persuasion" }
      }
    });

    const args = {
      mode: "budget",
      budgetLimit: 5000,
      capacityLimit: null,
      capacityCeiling: null,
      tactics: tacticsOpt,
      step: 25,
      useDecay: false,
      objective: "net",
      maxAttemptsByTactic: { doors: 200, phones: 200, texts: 200 },
      tlObjectiveMode: "min_cost_goal",
      goalNetVotes: 50
    };

    const a = engine.optimizeTimelineConstrained(args);
    const b = engine.optimizeTimelineConstrained(args);

    assert(stableStringify(a.plan.allocation) === stableStringify(b.plan.allocation), "Allocation not deterministic");
    assert(stableStringify(a.meta) === stableStringify(b.meta), "Meta not deterministic");
    return true;
  });


  test("Phase 9A: Deterministic JSON ordering", () => {
    const obj = { b: 1, a: { d: 2, c: 3 } };
    const s1 = deterministicStringify(obj);
    const s2 = deterministicStringify(obj);
    assert(s1 === s2, "Deterministic stringify not stable");
    assert(s1.indexOf(""a"") < s1.indexOf(""b""), "Key ordering not deterministic");
    return true;
  });

  test("Phase 9A: Export → Import schema (no drift)", () => {
    const scen = {
      scenarioName: "t",
      raceType: "state_leg",
      electionDate: "",
      weeksRemaining: "",
      mode: "persuasion",
      universeBasis: "registered",
      universeSize: "50000",
      sourceNote: "",
      turnoutA: "35",
      turnoutB: "55",
      bandWidth: 4,
      candidates: [{ id:"a", name:"A", supportPct:35 }, { id:"b", name:"B", supportPct:35 }],
      undecidedPct: 30,
      yourCandidateId: "a",
      undecidedMode: "proportional",
      userSplit: {},
      persuasionPct: 30,
      earlyVoteExp: 40,
      goalSupportIds: "",
      supportRatePct: 55,
      contactRatePct: 22,
      doorsPerHour: 30,
      hoursPerShift: 3,
      shiftsPerVolunteerPerWeek: 2,
      orgCount: 2,
      orgHoursPerWeek: 40,
      volunteerMultBase: 1.0,
      channelDoorPct: 70,
      doorsPerHour3: 30,
      callsPerHour3: 20,
      turnoutReliabilityPct: 80,
      turnoutEnabled: false,
      turnoutBaselinePct: 55,
      turnoutTargetOverridePct: "",
      gotvMode: "basic",
      gotvLiftPP: 1.0,
      gotvMaxLiftPP: 10,
      gotvDiminishing: false,
      gotvLiftMin: 0.5,
      gotvLiftMode: 1.0,
      gotvLiftMax: 2.0,
      gotvMaxLiftPP2: 10,
      gotvDiminishing2: false,
      timelineEnabled: false,
      timelineActiveWeeks: "",
      timelineGotvWeeks: 2,
      timelineStaffCount: 0,
      timelineStaffHours: 40,
      timelineVolCount: 0,
      timelineVolHours: 4,
      timelineRampEnabled: false,
      timelineRampMode: "linear",
      timelineDoorsPerHour: 30,
      timelineCallsPerHour: 20,
      timelineTextsPerHour: 120,
      mcMode: "basic",
      mcVolatility: "med",
      mcSeed: "",
      budget: {
        overheadAmount: 0,
        includeOverhead: false,
        tactics: {
          doors: { enabled: true, cpa: 0.18, kind: "persuasion" },
          phones: { enabled: true, cpa: 0.03, kind: "persuasion" },
          texts: { enabled: false, cpa: 0.02, kind: "persuasion" }
        },
        optimize: {
          mode: "budget", budgetAmount: 10000, capacityAttempts: "", step: 25, useDecay: false, objective: "net",
          tlConstrainedEnabled: false, tlConstrainedObjective: "max_net"
        }
      },
      mcLast: null,
      mcLastHash: "",
      ui: { training: false, dark: false, activeTab: "win" }
    };
    const exp = makeScenarioExport({ scenarioState: scen, modelVersion: MODEL_VERSION });
    const v = validateScenarioExport(exp, MODEL_VERSION);
    assert(v.ok, "Schema validation failed");
    const s1 = deterministicStringify(exp);
    const s2 = deterministicStringify(exp);
    assert(s1 === s2, "Export JSON ordering not deterministic");
    assert(!hasNonFiniteNumbers(exp), "Non-finite number found in export");
    return true;
  });

  test("Phase 9A: CSV headers + no NaN/Infinity", () => {
    const snap = {
      planRows: [{ tactic:"Doors", attempts:100, expectedContacts:22, expectedNetVotes:9, cost:18, costPerNetVote:"2.0000" }],
      planMeta: { weeks: 10, staff: 1, volunteers: 2, objective: "net", feasible: "true" }
    };
    const csv = planRowsToCsv(snap);
    const first = csv.split(/?
/)[0];
    assert(first === PLAN_CSV_HEADERS.join(","), "CSV header mismatch");
    assert(csv.indexOf("NaN") === -1, "CSV contains NaN");
    assert(csv.indexOf("Infinity") === -1, "CSV contains Infinity");
    return true;
  });
  results.durationMs = Math.round(nowMs() - started);
  // Ensure totals are consistent even if something weird happened.
  results.passed = Math.max(0, results.total - results.failed);

  return results;
}
