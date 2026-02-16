function runCalculation() {
  const inputs = {
    totalVoters: parseFloat(document.getElementById("totalVoters").value),
    turnoutRate: parseFloat(document.getElementById("turnoutRate").value),
    turnoutVolatility: parseFloat(document.getElementById("turnoutVolatility").value),
    buffer: parseFloat(document.getElementById("buffer").value),
    baseVote: parseFloat(document.getElementById("baseVote").value),
    persuasionUniverse: parseFloat(document.getElementById("persuasionUniverse").value),
    contactRate: parseFloat(document.getElementById("contactRate").value),
    persuasionRate: parseFloat(document.getElementById("persuasionRate").value),
    gotvUniverse: parseFloat(document.getElementById("gotvUniverse").value),
    gotvRate: parseFloat(document.getElementById("gotvRate").value)
  };

  const deterministic = calculateDeterministic(inputs);
  const winProbability = runMonteCarlo(inputs);

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
  `;
}
