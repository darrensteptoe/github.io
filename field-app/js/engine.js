// js/engine.js
// Field Path Engine 2.0 — Facade API over the sacred core engine.
// UI must call ONLY this module for computations/optimization/diagnostics/snapshot handling.

import { computeAll } from "./core/winMath.js";
import { computeConfidenceEnvelope } from "./core/confidenceEnvelope.js";
import { computeAvgLiftPP } from "./core/turnout.js";
import { optimizeMixBudget, optimizeMixCapacity } from "./core/optimize.js";
import { computeRoiRows, buildOptimizationTactics } from "./core/budget.js";
import { computeTimelineFeasibility } from "./core/timeline.js";
import { computeMaxAttemptsByTactic, optimizeTimelineConstrained } from "./core/timelineOptimizer.js";
import { computeMarginalValueDiagnostics } from "./core/marginalValue.js";
import { computeDecisionIntelligence } from "./core/decisionIntelligence.js";
import { computeSensitivitySurface } from "./core/sensitivitySurface.js";
import { UNIVERSE_DEFAULTS, computeUniverseAdjustedRates, normalizeUniversePercents } from "./core/universeLayer.js";

import { computeSnapshotHash } from "./core/hash.js";
import { migrateSnapshot, CURRENT_SCHEMA_VERSION } from "./core/migrate.js";
import { checkStrictImportPolicy } from "./core/importPolicy.js";
import {
  MODEL_VERSION,
  makeScenarioExport,
  deterministicStringify,
  validateScenarioExport,
  makeTimestampedFilename,
  planRowsToCsv,
  formatSummaryText,
  copyTextToClipboard,
  hasNonFiniteNumbers,
} from "./export.js";

import { runSelfTests } from "./core/selfTest.js";
import { gateFromSelfTestResult, SELFTEST_GATE } from "./core/selfTestGate.js";

// Core facade
export const engine = {
  // Required facade API
  compute(inputs, options){
    return computeAll(inputs, options);
  },

  runMonteCarlo(inputs, options){
    return computeConfidenceEnvelope(inputs, options);
  },

  optimize(inputs, options){
    // options.mode: "budget" | "capacity" | "timeline"
    const mode = (options && options.mode) || "budget";
    if (mode === "capacity") return optimizeMixCapacity(inputs, options);
    if (mode === "timeline") return optimizeTimelineConstrained(inputs, options);
    return optimizeMixBudget(inputs, options);
  },

  // Additional grouped access (still via facade)
  tactics: { computeRoiRows, buildOptimizationTactics },

  timeline: { computeTimelineFeasibility, computeMaxAttemptsByTactic },

  diagnostics: { computeMarginalValueDiagnostics, computeDecisionIntelligence, computeSensitivitySurface },

  turnout: { computeAvgLiftPP },

  universe: { UNIVERSE_DEFAULTS, computeUniverseAdjustedRates, normalizeUniversePercents },

  snapshot: {
    MODEL_VERSION,
    CURRENT_SCHEMA_VERSION,
    computeSnapshotHash,
    migrateSnapshot,
    checkStrictImportPolicy,
    makeScenarioExport,
    deterministicStringify,
    validateScenarioExport,
    makeTimestampedFilename,
    planRowsToCsv,
    formatSummaryText,
    copyTextToClipboard,
    hasNonFiniteNumbers,
  },

  selfTest: {
    runSelfTests,
    gateFromSelfTestResult,
    SELFTEST_GATE,
  },
};
