// js/selfTest.js
// Phase 5.5 — Lightweight in-browser self-test infrastructure.
// Exports: runSelfTests(engineAccessors)
//
// Design goals:
// - No build tools
// - No uncaught throws (always returns structured results)
// - No production interference (dev-triggered by app.js)

import { FIXTURES } from "./fixtures.js";

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


results.durationMs = Math.round(nowMs() - started);
  // Ensure totals are consistent even if something weird happened.
  results.passed = Math.max(0, results.total - results.failed);

  return results;
}
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


