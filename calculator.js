function runCalculation() {
const inputs = {
  totalVoters: parseFloat(document.getElementById("totalVoters").value),
  turnoutRate: parseFloat(document.getElementById("turnoutRate").value),
  turnoutVolatility: parseFloat(document.getElementById("turnoutVolatility").value),
  buffer: parseFloat(document.getElementById("buffer").value),
  baseVote: parseFloat(document.getElementById("baseVote").value),
  persuasionUniverse: parseFloat(document.getElementById("persuasionUniverse").value),
  contactRate: parseFloat(document.getElementById("contactRate").value),
  contactVolatility: parseFloat(document.getElementById("contactVolatility").value),
  persuasionRate: parseFloat(document.getElementById("persuasionRate").value),
  persuasionVolatility: parseFloat(document.getElementById("persuasionVolatility").value),
  gotvUniverse: parseFloat(document.getElementById("gotvUniverse").value),
  gotvRate: parseFloat(document.getElementById("gotvRate").value),
  gotvVolatility: parseFloat(document.getElementById("gotvVolatility").value)
};

  const deterministic = calculateDeterministic(inputs);
  const winProbability = runMonteCarlo(inputs);
let warnings = [];

if (inputs.contactRate > 75) {
  warnings.push("Contact rate exceeds 75%. Verify realism.");
}

if (inputs.persuasionRate > 20) {
  warnings.push("Persuasion conversion above 20%. Historically aggressive.");
}

if (inputs.gotvRate > 85) {
  warnings.push("GOTV conversion above 85%. Confirm universe quality.");
}

if (
  inputs.turnoutVolatility < 1 &&
  inputs.contactVolatility < 1 &&
  inputs.persuasionVolatility < 1 &&
  inputs.gotvVolatility < 1
) {
  warnings.push("All volatility inputs are low. Model may be overconfident.");
}

if (deterministic.baseVote > deterministic.bufferedWin) {
  warnings.push("Base vote exceeds win target. Confirm base accuracy.");
}

if (deterministic.totalCapacity < deterministic.bufferedWin) {
  warnings.push("Total vote capacity below buffered win target.");
}

  let riskClass = "risk-safe";
  let riskLabel = "SAFE";

  if (winProbability < 70) {
    riskClass = "risk-tight";
    riskLabel = "TIGHT";
  }

  if (winProbability < 55) {
    riskClass = "risk-danger";
    riskLabel = "HIGH RISK";
  }

document.getElementById("results").innerHTML = `
  <h2>Results</h2>
  <p>Projected Turnout: ${deterministic.projectedTurnout.toFixed(0)}</p>
  <p>Raw Win Number: ${deterministic.winNumber}</p>
  <p>Buffered Win Target: ${deterministic.bufferedWin}</p>
  <p>Votes Needed Beyond Base: ${deterministic.votesNeeded}</p>
  <p>Persuasion Yield Capacity: ${deterministic.persuasionYield.toFixed(0)}</p>
  <p>GOTV Yield Capacity: ${deterministic.gotvYield.toFixed(0)}</p>
  <p>Total Vote Capacity: ${deterministic.totalCapacity.toFixed(0)}</p>
  <p>Win Probability: ${winProbability.toFixed(2)}%</p>
  <p class="${riskClass}">Risk Status: ${riskLabel}</p>
  ${warnings.length > 0 ? `
    <h3>Diagnostics</h3>
    <ul>
      ${warnings.map(w => `<li>${w}</li>`).join("")}
    </ul>
  ` : ""}
`;
