# Model Theory & Mathematical Notes
## MODEL_THEORY.md — Technical Appendix

This document explains the theory behind the calculator.

This is not required to use the tool.
This exists so you understand what the engine is actually doing.

This file covers:

1) Why Monte Carlo is used
2) Why normal distributions were chosen
3) What assumptions are embedded
4) Where the model is simplified
5) Where it can break
6) How a backend version would improve it
7) What this model is and is not

---

# 1) Why Monte Carlo Simulation?

Traditional campaign math is deterministic:

Votes = Universe × Contact × Conversion

But real elections are stochastic.

Turnout shifts.
Execution varies.
Messaging moves.
Weather hits.
Institutions signal late.
Opposition counter-mobilizes.

Monte Carlo simulation acknowledges this by:

- Randomizing key variables
- Running thousands of simulated elections
- Observing how often the campaign wins

Instead of asking:
“Do we clear the target?”

It asks:
“How often do we clear the target under realistic variance?”

This shifts thinking from arithmetic to probability.

---

# 2) Why Normal Distributions?

Each randomized variable is modeled using:

randomNormal(mean, standardDeviation)

Why normal?

Because:
- It is symmetric
- It is easy to parameterize
- It produces realistic mid-range clustering
- It avoids extreme tails (unless volatility is large)
- It is computationally light

This is appropriate for:
- turnout rate
- contact rate
- persuasion conversion
- GOTV conversion

However:

Real election variables are not perfectly normal.

They can be:
- skewed
- bounded
- clustered
- correlated

Normal distribution is a pragmatic modeling choice,
not a claim about political physics.

---

# 3) Independence Assumption (Important)

The model currently assumes:

Turnout, contact, persuasion, and GOTV vary independently.

This is not perfectly true.

In reality:
- High turnout environments may reduce persuasion effectiveness.
- High-contact operations may correlate with better GOTV.
- Institutional anchoring may correlate with turnout behavior.
- Opposition mobilization may correlate with your turnout.

The model does NOT currently model correlated shocks.

That is a known simplification.

---

# 4) Structural Assumptions Embedded

The model assumes:

- Win threshold = 50% + 1 (two-way framing)
- Vote yield scales linearly within variables
- Persuasion universe can be adjusted via Movable Share
- Volatility is symmetric around the mean
- Conversion rates are uniform across the effective universe

These are simplifications.

They are defensible.
But they are not exhaustive representations of electoral behavior.

---

# 5) Where the Model Can Break

This model can produce misleading comfort when:

- Base vote is inflated
- Persuasion universe is contaminated
- Volatility is unrealistically low
- Conversion assumptions are inflated
- Opposition capacity is ignored

It can also understate reality when:

- True coalition effects dominate
- Demographic splits matter more than aggregate math
- Institutional mobilization effects are clustered
- Opposition has asymmetric turnout advantages

---

# 6) Why Margin Distribution Matters

Probability alone hides risk.

Two races can both show 65% probability.

But:

Race A:
- Mean margin +400
- Worst case -200

Race B:
- Mean margin +75
- Worst case -1,100

Distribution reveals fragility.

This tool surfaces:
- Mean margin
- 5th percentile outcome
- 95th percentile outcome
- Standard deviation
- Average loss size

These allow strategic risk assessment.

---

# 7) Why Sensitivity Exists

Sensitivity answers:

“If I improve this variable by 1%, how much does probability move?”

This approximates marginal leverage.

It
