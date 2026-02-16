# Campaign Probability Calculator Manual

## Purpose
This tool models district-level election outcomes using deterministic math and Monte Carlo simulation.

---

## Core Formulas

Projected Turnout:
T = V × t

Win Number:
W = (T / 2) + 1

Buffered Win Target:
Wb = W × (1 + buffer)

Persuasion Yield:
Py = P × contact_rate × persuasion_rate

GOTV Yield:
Gy = G × gotv_rate

Total Vote Capacity:
C = base_vote + Py + Gy

---

## Monte Carlo Simulation

The model runs 7,000 simulated elections.

Each simulation:
1. Randomly varies turnout using normal distribution.
2. Recalculates win target.
3. Compares total capacity to required target.

Win Probability:
Wins / Total Simulations

---

## Interpreting Results

70%+ → Stable
55%–70% → Tight
Below 55% → High Risk

---

## When Data Is Likely Skewed

- Overestimated base vote
- Inflated persuasion conversion
- Unrealistic contact rate
- Turnout volatility too low
- Outdated voter file

---

## How To Validate

1. Use a past race.
2. Plug actual turnout.
3. Adjust volatility.
4. Compare probability to real result.

If simulation consistently mispredicts, adjust volatility assumption.

---

## Limitations

- Does not yet model demographic splits.
- Does not weight voter file scores.
- Assumes independent turnout volatility.

Future upgrades can include:
- Precinct-level modeling
- Score weighting
- CSV uploads
