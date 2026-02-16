function randomNormal(mean, stdDev) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function calculateDeterministic(inputs) {
  const projectedTurnout = inputs.totalVoters * (inputs.turnoutRate / 100);
  const winNumber = Math.floor(projectedTurnout / 2) + 1;
  const bufferedWin = Math.floor(winNumber * (1 + inputs.buffer / 100));

  const persuasionYield = inputs.persuasionUniverse *
    (inputs.contactRate / 100) *
    (inputs.persuasionRate / 100);

  const gotvYield = inputs.gotvUniverse *
    (inputs.gotvRate / 100);

  const totalCapacity = inputs.baseVote + persuasionYield + gotvYield;

  const votesNeeded = bufferedWin - inputs.baseVote;

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

function runMonteCarlo(inputs, simulations = 7000) {
  let wins = 0;

  for (let i = 0; i < simulations; i++) {
    const simulatedTurnoutRate = randomNormal(
      inputs.turnoutRate,
      inputs.turnoutVolatility
    );

    const simulatedTurnout = inputs.totalVoters *
      (simulatedTurnoutRate / 100);

    const winNumber = Math.floor(simulatedTurnout / 2) + 1;
    const bufferedWin = Math.floor(winNumber *
      (1 + inputs.buffer / 100));

    const persuasionYield =
      inputs.persuasionUniverse *
      (inputs.contactRate / 100) *
      (inputs.persuasionRate / 100);

    const gotvYield =
      inputs.gotvUniverse *
      (inputs.gotvRate / 100);

    const totalVotes =
      inputs.baseVote + persuasionYield + gotvYield;

    if (totalVotes >= bufferedWin) {
      wins++;
    }
  }

  return (wins / simulations) * 100;
}
