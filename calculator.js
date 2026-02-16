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
  const simulation = runMonteCarlo(inputs);
  const sensitivity = sensitivityAnalysis(inputs, simulation.winProbability);

  let riskClass = "risk-safe";
  let riskLabel = "SAFE";

  if (simulation.winProbability < 70) {
    riskClass = "risk-tight";
    riskLabel = "TIGHT";
  }

  if (simulation.winProbability < 55) {
    riskClass = "risk-danger";
    riskLabel = "HIGH RISK";
  }

  let warnings = [];

  if (inputs.contactRate > 75)
    warnings.push("Contact rate exceeds 75%. Verify realism.");

  if (inputs.persuasionRate > 20)
    warnings.push("Persuasion conversion above 20%. Historically aggressive.");

  if (inputs.gotvRate > 85)
    warnings.push("GOTV conversion above 85%. Confirm universe quality.");

  if (
    inputs.turnoutVolatility < 1 &&
    inputs.contactVolatility < 1 &&
    inputs.persuasionVolatility < 1 &&
    inputs.gotvVolatility < 1
  )
    warnings.push("All volatility inputs are low. Model may be overconfident.");

  if (deterministic.totalCapacity < deterministic.bufferedWin)
    warnings.push("Total vote capacity below buffered win target.");

  document.getElementById("results").innerHTML = `
    <h2>Results</h2>
    <p>Projected Turnout: ${deterministic.projectedTurnout.toFixed(0)}</p>
    <p>Buffered Win Target: ${deterministic.bufferedWin}</p>
    <p>Total Vote Capacity: ${deterministic.totalCapacity.toFixed(0)}</p>
    <p>Win Probability: ${simulation.winProbability.toFixed(2)}%</p>
    <p class="${riskClass}">Risk Status: ${riskLabel}</p>

    <h3>Margin Distribution</h3>
    <p>Mean Margin: ${simulation.meanMargin.toFixed(0)}</p>
    <p>Worst Case (5th %): ${simulation.worstCase.toFixed(0)}</p>
    <p>Best Case (95th %): ${simulation.bestCase.toFixed(0)}</p>
    <p>Margin Volatility (Std Dev): ${simulation.stdDevMargin.toFixed(0)}</p>
    <p>Average Loss Size: ${simulation.averageLoss.toFixed(0)}</p>

    <h3>Sensitivity Analysis (+1% shift)</h3>
    <p>Turnout Impact: ${sensitivity.turnoutImpact.toFixed(2)}%</p>
    <p>Contact Impact: ${sensitivity.contactImpact.toFixed(2)}%</p>
    <p>Persuasion Impact: ${sensitivity.persuasionImpact.toFixed(2)}%</p>
    <p>GOTV Impact: ${sensitivity.gotvImpact.toFixed(2)}%</p>

    ${warnings.length > 0 ? `
      <h3>Diagnostics</h3>
      <ul>
        ${warnings.map(w => `<li>${w}</li>`).join("")}
      </ul>
    ` : ""}
  `;
}
