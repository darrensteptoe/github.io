function setVisibility(id, isVisible) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("hidden", !isVisible);
}

function readNumber(id) {
  const v = parseFloat(document.getElementById(id).value);
  return Number.isFinite(v) ? v : 0;
}

function wireToggles() {
  const tSim = document.getElementById("toggleSimulation");
  const tDist = document.getElementById("toggleDistribution");
  const tSens = document.getElementById("toggleSensitivity");
  const tDiag = document.getElementById("toggleDiagnostics");
  const tMove = document.getElementById("toggleMovableShare");
  const tVol = document.getElementById("toggleVolatilityInputs");

  function sync() {
    const simOn = tSim.checked;

    // If simulation is off, hide simulation-dependent outputs toggles visually (still your choice)
    // but we also hide volatility inputs because they don’t matter.
    setVisibility("volatilityPanel", simOn && tVol.checked);

    // Movable share input block
    setVisibility("movableShareBlock", tMove.checked);

    // If simulation is off, distribution/sensitivity are irrelevant — we’ll just not compute them.
    // (You can leave them checked; we ignore them when sim is off.)
    tDist.disabled = !simOn;
    tSens.disabled = !simOn;
  }

  [tSim, tDist, tSens, tDiag, tMove, tVol].forEach(el => el.addEventListener("change", sync));
  sync();
}

window.addEventListener("DOMContentLoaded", wireToggles);

function runCalculation() {
  const toggleSimulation = document.getElementById("toggleSimulation").checked;
  const toggleDistribution = document.getElementById("toggleDistribution").checked;
  const toggleSensitivity = document.getElementById("toggleSensitivity").checked;
  const toggleDiagnostics = document.getElementById("toggleDiagnostics").checked;
  const toggleMovableShare = document.getElementById("toggleMovableShare").checked;
  const toggleVolatilityInputs = document.getElementById("toggleVolatilityInputs").checked;

  const inputs = {
    totalVoters: readNumber("totalVoters"),
    turnoutRate: readNumber("turnoutRate"),
    buffer: readNumber("buffer"),
    baseVote: readNumber("baseVote"),

    persuasionUniverse: readNumber("persuasionUniverse"),
    contactRate: readNumber("contactRate"),
    persuasionRate: readNumber("persuasionRate"),

    gotvUniverse: readNumber("gotvUniverse"),
    gotvRate: readNumber("gotvRate"),

    useMovableShare: toggleMovableShare,
    movableShare: readNumber("movableShare"),

    // If volatility panel is “off”, treat std dev as 0 to make sim stable.
    turnoutVolatility: toggleVolatilityInputs ? readNumber("turnoutVolatility") : 0,
    contactVolatility: toggleVolatilityInputs ? readNumber("contactVolatility") : 0,
    persuasionVolatility: toggleVolatilityInputs ? readNumber("persuasionVolatility") : 0,
    gotvVolatility: toggleVolatilityInputs ? readNumber("gotvVolatility") : 0
  };

  const deterministic = calculateDeterministic(inputs);

  // Deterministic-only mode
  if (!toggleSimulation) {
    const gap = deterministic.totalCapacity - deterministic.bufferedWin;
    const statusClass = gap >= 0 ? "risk-safe" : "risk-danger";
    const statusLabel = gap >= 0 ? "MEETS TARGET" : "BELOW TARGET";

    document.getElementById("results").innerHTML = `
      <h2>Deterministic Results (Simulation Off)</h2>
      <p>Projected Turnout: ${deterministic.projectedTurnout.toFixed(0)}</p>
      <p>Buffered Win Target: ${deterministic.bufferedWin}</p>
      <p>Effective Persuasion Universe: ${deterministic.effectivePersuasionUniverse.toFixed(0)}</p>
      <p>Persuasion Yield Capacity: ${deterministic.persuasionYield.toFixed(0)}</p>
      <p>GOTV Yield Capacity: ${deterministic.gotvYield.toFixed(0)}</p>
      <p>Total Vote Capacity: ${deterministic.totalCapacity.toFixed(0)}</p>
      <p class="${statusClass}">Status: ${statusLabel}</p>
      <p class="hint">Turn simulation back on to get probability, distribution, and sensitivity.</p>
    `;
    return;
  }

  // Simulation mode
  const simulation = runMonteCarlo(inputs);

  let riskClass = "risk-safe";
  let riskLabel = "SAFE";
  if (simulation.winProbability < 70) { riskClass = "risk-tight"; riskLabel = "TIGHT"; }
  if (simulation.winProbability < 55) { riskClass = "risk-danger"; riskLabel = "HIGH RISK"; }

  let warnings = [];
  if (toggleDiagnostics) {
    if (inputs.contactRate > 75) warnings.push("Contact rate exceeds 75%. Verify realism.");
    if (inputs.persuasionRate > 20) warnings.push("Persuasion conversion above 20%. Historically aggressive.");
    if (inputs.gotvRate > 85) warnings.push("GOTV conversion above 85%. Confirm universe quality.");

    if (
      inputs.turnoutVolatility < 1 &&
      inputs.contactVolatility < 1 &&
      inputs.persuasionVolatility < 1 &&
      inputs.gotvVolatility < 1
    ) warnings.push("All volatility inputs are low. Model may be overconfident.");

    if (deterministic.totalCapacity < deterministic.bufferedWin)
      warnings.push("Total vote capacity below buffered win target.");
  }

  const sensitivity = toggleSensitivity ? sensitivityAnalysis(inputs, simulation.winProbability) : null;

  // Build output sections based on toggles
  let html = `
    <h2>Results</h2>
    <p>Projected Turnout: ${deterministic.projectedTurnout.toFixed(0)}</p>
    <p>Buffered Win Target: ${deterministic.bufferedWin}</p>
    <p>Effective Persuasion Universe: ${deterministic.effectivePersuasionUniverse.toFixed(0)}</p>
    <p>Total Vote Capacity: ${deterministic.totalCapacity.toFixed(0)}</p>
    <p>Win Probability: ${simulation.winProbability.toFixed(2)}%</p>
    <p class="${riskClass}">Risk Status: ${riskLabel}</p>
  `;

  if (toggleDistribution) {
    html += `
      <h3>Margin Distribution</h3>
      <p>Mean Margin: ${simulation.meanMargin.toFixed(0)}</p>
      <p>Worst Case (5th %): ${simulation.worstCase.toFixed(0)}</p>
      <p>Best Case (95th %): ${simulation.bestCase.toFixed(0)}</p>
      <p>Margin Volatility (Std Dev): ${simulation.stdDevMargin.toFixed(0)}</p>
      <p>Average Loss Size: ${simulation.averageLoss.toFixed(0)}</p>
    `;
  }

  if (toggleSensitivity && sensitivity) {
    html += `
      <h3>Sensitivity (+1% shift)</h3>
      <p>Turnout Impact: ${sensitivity.turnoutImpact.toFixed(2)}%</p>
      <p>Contact Impact: ${sensitivity.contactImpact.toFixed(2)}%</p>
      <p>Persuasion Impact: ${sensitivity.persuasionImpact.toFixed(2)}%</p>
      <p>GOTV Impact: ${sensitivity.gotvImpact.toFixed(2)}%</p>
    `;
  }

  if (toggleDiagnostics && warnings.length > 0) {
    html += `
      <h3>Diagnostics</h3>
      <ul>
        ${warnings.map(w => `<li>${w}</li>`).join("")}
      </ul>
    `;
  }

  document.getElementById("results").innerHTML = html;
}
