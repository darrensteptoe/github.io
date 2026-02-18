// js/selfTestGate.js
// Phase 11 — Self-Test Gate Badge state helper (pure)

export const GATE_UNVERIFIED = "UNVERIFIED";
export const GATE_VERIFIED = "VERIFIED";
export const GATE_FAILED = "FAILED";

export function gateStatusFromResult(result){
  // result shape: { total, passed, failed, failures? }
  const failed = Number(result?.failed || 0);
  const passed = Number(result?.passed || 0);
  if (failed > 0) return GATE_FAILED;
  if (passed > 0) return GATE_VERIFIED;
  return GATE_UNVERIFIED;
}
