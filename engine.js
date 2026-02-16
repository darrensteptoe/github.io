function randomNormal(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateDeterministic(inputs) {
  const projectedTurnout = inputs.totalVoters * (inputs.turnoutRate / 100);
  const winNumber = Math.floor(projectedTurnout / 2) + 1;
  const bufferedWin = Math.floor(winNumber * (1 + inputs.buffer / 100));

  const persuasionYield =
    inputs.persuasionUniverse *
    (inputs.contactRate / 100) *
    (inputs.persuasionRate / 100);

  const gotvYield =
    inputs.gotvUniverse *
    (inputs.gotvRate / 100);

  const totalCapacity =
    inputs.baseVote + persuasionYield + gotvYield;

  const votesNeeded =
    bufferedWin - inputs.baseVote;

  return {
    projectedTurnout,
    winNumber,
    bufferedWin,
    persuasionYield,
    gotvYield,
    totalCapacity,
    votesNeeded
  };
}

function runMonteCarlo(inputs, simulations = 8000) {
  let wins = 0;
  let margins = [];
  let losses = [];

  for (let i = 0; i < simulations; i++) {

    const turnoutRate = clamp(
      randomNormal(inputs.turnoutRate, inputs.turnoutVolatility),
      0, 100
    );

    const contactRate = clamp(
      randomNormal(inputs.contactRate, inputs.contactVolatility),
      0, 100
    );

    const persuasionRate = clamp(
      randomNormal(inputs.persuasionRate, inputs.persuasionVolatility),
      0, 100
    );

    const gotvRate = clamp(
      randomNormal(inputs.gotvRate, inputs.gotvVolatility),
      0, 100
    );

    const simulatedTurnout =
      inputs.totalVoters * (turnoutRate / 100);

    const winNumber =
      Math.floor(simulatedTurnout / 2) + 1;

    const bufferedWin =
      Math.floor(winNumber * (1 + inputs.buffer / 100));

    const persuasionYield =
      inputs.persuasionUniverse *
      (contactRate / 100) *
      (persuasionRate / 100);

    const gotvYield =
      inputs.gotvUniverse *
      (gotvRate / 100);

    const totalVotes =
      inputs.baseVote + persuasionYield + gotvYield;

    const margin = totalVotes - bufferedWin;
    margins.push(margin);

    if (margin >= 0) {
      wins++;
    } else {
      losses.push(margin);
    }
  }

  margins.sort((a, b) => a - b);

  const winProbability = (wins / simulations) * 100;

  const meanMargin =
    margins.reduce((a, b) => a + b, 0) / simulations;

  const percentile5 =
    margins[Math.floor(simulations * 0.05)];

  const percentile95 =
    margins[Math.floor(simulations * 0.95)];

  const variance =
    margins.reduce((sum, m) => sum + Math.pow(m - meanMargin, 2), 0) / simulations;

  const stdDevMargin = Math.sqrt(variance);

  const averageLoss =
    losses.length > 0
      ? losses.reduce((a, b) => a + b, 0) / losses.length
      : 0;

  return {
    winProbability,
    meanMargin,
    worstCase: percentile5,
    bestCase: percentile95,
    stdDevMargin,
    averageLoss
  };
}

function sensitivityAnalysis(inputs, baseProbability) {
  const bump = 1;

  function test(field) {
    const modified = { ...inputs };
    modified[field] += bump;
    return runMonteCarlo(modified, 3000).winProbability;
  }

  return {
    turnoutImpact: test("turnoutRate") - baseProbability,
    contactImpact: test("contactRate") - baseProbability,
    persuasionImpact: test("persuasionRate") - baseProbability,
    gotvImpact: test("gotvRate") - baseProbability
  };
}
