// js/importPolicy.js
// Phase 11 — Optional Strict Import Mode policy (pure)

function toParts(v){
  if (typeof v !== "string") return [0,0,0];
  const parts = v.split(".").map(x => {
    const n = Number(String(x).replace(/[^0-9]/g, ""));
    return Number.isFinite(n) ? n : 0;
  });
  while (parts.length < 3) parts.push(0);
  return parts.slice(0,3);
}

export function compareSemver(a, b){
  const A = toParts(a);
  const B = toParts(b);
  for (let i=0;i<3;i++){
    if (A[i] > B[i]) return 1;
    if (A[i] < B[i]) return -1;
  }
  return 0;
}

export function shouldBlockImport({ strict, importedSchemaVersion, currentSchemaVersion, exportedHash, recomputedHash }){
  if (!strict) return { block:false, reason:"" };

  if (compareSemver(importedSchemaVersion, currentSchemaVersion) > 0){
    return { block:true, reason:`Import blocked: snapshot schemaVersion (${importedSchemaVersion}) is newer than this build (${currentSchemaVersion}).` };
  }

  if (exportedHash && recomputedHash && exportedHash !== recomputedHash){
    return { block:true, reason:"Import blocked: snapshot hash mismatch (integrity verification failed)." };
  }

  return { block:false, reason:"" };
}
