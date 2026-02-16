function setVisibility(id, isVisible) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("hidden", !isVisible);
}

function readNumber(id) {
  const v = parseFloat(document.getElementById(id).value);
  return Number.isFinite(v) ? v : 0;
}

function clampNum(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function validateInputs(inputs) {
  const errors = [];

  if (!(inputs.totalVoters > 0)) errors.push("Total Registered Voters must be greater than 0.");
  if (!(inputs.turnoutRate >= 0 && inputs.turnoutRate <= 100)) errors.push("Expected Turnout % must be between 0 and 100.");
  if (!(inputs.buffer >= 0 && inputs.buffer <= 50)) errors.push("Safety Buffer % must be between 0 and 50.");

  if (!(inputs.contactRate >= 0 && inputs.contactRate <= 100)) errors.push("Contact Rate % must be between 0 and 100.");
  if (!(inputs.persuasionRate >= 0 && inputs.persuasionRate <= 100)) errors.push("Persuasion Conversion % must be between 0 and 100.");
  if (!(inputs.gotvRate >= 0 && inputs.gotvRate <= 100)) errors.push("GOTV Conversion % must be between 0 and 100.");

  if (inputs.useMovableShare) {
    if (!(inputs.movableShare >= 0 && inputs.movableShare <= 100)) errors.push("Persuasion Movable Share % must be between 0 and 100.");
  }

  const vols = [
    ["Turnout Volatility", inputs.turnoutVolatility],
    ["Contact Volatility", inputs.contactVolatility],
    ["Persuasion Volatility", inputs.persuasionVolatility],
    ["GOTV Volatility", inputs.gotvVolatility]
  ];

  vols.forEach(([name, v]) => {
    if (v < 0) errors.push(`${name} cannot be negative.`);
    if (v > 30) errors.push(`${name} above 30% is extremely high — confirm this is intentional.`);
  });

  return errors;
}

function wireToggles() {
  const tSim = document.getElementById("toggleSimulation");
  const tDist = document.getElementById("toggleDistribution");
  const tSens = document.getElementById("toggleSensitivity");
  const tMove = document.getElementById("toggleMovableShare");
  const tVol = document.getElementById("toggleVolatilityInputs");

  function sync() {
    const simOn = tSim.checked;
    setVisibility("volatilityPanel", simOn && tVol.checked);
    setVisibility("movableShareBlock", tMove.checked);

    tDist.disabled = !simOn;
    tSens.disabled = !simOn;
  }

  [tSim, tDist, tSens, tMove, tVol].forEach(el => el.addEventListener("change", sync));
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

    turnoutVolatility: toggleVolatilityInputs ? readNumber("turnoutVolatility") : 0,
    contactVolatility: toggleVolatilityInputs ? readNumber("contactVolatility") : 0,
    persuasionVolatility: toggleVolatilityInputs ? readNumber("persuasionVolatility") : 0,
    gotvVolatility: toggleVolatilityInputs ? readNumber("gotvVolatility") : 0
  };

  inputs.turnoutRate = clampNum(inputs.turnoutRate, 0, 100);
  inputs.contactRate = clampNum(inputs.contactRate, 0, 100);
  inputs.persuasionRate = clampNum(inputs.persuasionRate, 0, 100);
  inputs.gotvRate = clampNum(inputs.gotvRate, 0, 100);
  inputs.buffer = clampNum(inputs.buffer, 0, 50);
  inputs.movableShare = clampNum(inputs.movableShare, 0, 100);

  const errors = validateInputs(inputs);
  if (errors.length) {
    document.getElementById("results").innerHTML = `
      <h2>Fix Inputs</h2>
      <ul>${errors.map(e => `<li>${e}</li>`).join("")}</ul>
    `;
    return;
  }

  const deterministic = calculateDeterministic(inputs);

  if (!toggleSimulation) {
    const gap = deterministic.totalCapacity - deterministic.bufferedWin;
    const statusClass = gap >= 0 ? "risk-safe" : "risk-danger";
    const statusLabel = gap >= 0 ? "MEETS TARGET" : "BELOW TARGET";

    document.getElementById("results").innerHTML = `
      <h2>Deterministic Results (Simulation Off)</h2>
      <p>Projected Turnout (rounded): ${deterministic.projectedTurnout.toFixed(0)}</p>
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

  const simulation = runMonteCarlo(inputs);

  let riskClass = "risk-safe";
  let riskLabel = "SAFE";
  if (simulation.winProbability < 70) { riskClass = "risk-tight"; riskLabel = "TIGHT"; }
  if (simulation.winProbability < 55) { riskClass = "risk-danger"; riskLabel = "HIGH RISK"; }

  const warnings = [];
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

    if (inputs.baseVote > deterministic.bufferedWin)
      warnings.push("Base vote exceeds buffered win target. Confirm base vote realism.");
  }

  const sensitivity = toggleSensitivity ? sensitivityAnalysis(inputs, simulation.winProbability) : null;

  let html = `
    <h2>Results</h2>
    <p>Projected Turnout (rounded): ${deterministic.projectedTurnout.toFixed(0)}</p>
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
