function randomNormal(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function quantile(sortedArr, p) {
  // sortedArr must already be sorted ascending
  if (!sortedArr.length) return 0;
  const pp = clamp(p, 0, 1);
  const idx = Math.floor((sortedArr.length - 1) * pp);
  return sortedArr[idx];
}

function applyStructuralAdjustments(inputs) {
  const adjusted = { ...inputs };

  if (adjusted.useMovableShare) {
    const ms = clamp(adjusted.movableShare, 0, 100);
    adjusted.effectivePersuasionUniverse = adjusted.persuasionUniverse * (ms / 100);
  } else {
    adjusted.effectivePersuasionUniverse = adjusted.persuasionUniverse;
  }

  return adjusted;
}

function calculateDeterministic(inputsRaw) {
  const inputs = applyStructuralAdjustments(inputsRaw);

  // Turnout is an integer count of voters in reality, so we round.
  const projectedTurnout = Math.round(inputs.totalVoters * (inputs.turnoutRate / 100));
  const winNumber = Math.floor(projectedTurnout / 2) + 1;

  // IMPORTANT: buffer should not round down. Use ceil.
  const bufferedWin = Math.ceil(winNumber * (1 + inputs.buffer / 100));

  const persuasionYield =
    inputs.effectivePersuasionUniverse *
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
    votesNeeded,
    effectivePersuasionUniverse: inputs.effectivePersuasionUniverse
  };
}

function runMonteCarlo(inputsRaw, simulations = 8000) {
  const inputs = applyStructuralAdjustments(inputsRaw);

  let wins = 0;
  const margins = [];
  const losses = [];

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

    const simulatedTurnout = Math.round(inputs.totalVoters * (turnoutRate / 100));
    const winNumber = Math.floor(simulatedTurnout / 2) + 1;

    // IMPORTANT: buffer should not round down. Use ceil.
    const bufferedWin = Math.ceil(winNumber * (1 + inputs.buffer / 100));

    const persuasionYield =
      inputs.effectivePersuasionUniverse *
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
  const meanMargin = margins.reduce((a, b) => a + b, 0) / simulations;

  const worstCase = quantile(margins, 0.05);
  const bestCase = quantile(margins, 0.95);

  const variance =
    margins.reduce((sum, m) => sum + Math.pow(m - meanMargin, 2), 0) / simulations;

  const stdDevMargin = Math.sqrt(variance);

  const averageLoss =
    losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  return {
    winProbability,
    meanMargin,
    worstCase,
    bestCase,
    stdDevMargin,
    averageLoss
  };
}

function sensitivityAnalysis(inputsRaw, baseProbability) {
  const bump = 1;

  function test(field) {
    const modified = { ...inputsRaw };
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
