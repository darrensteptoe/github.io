# Campaign Probability & Strategy Modeling Engine
## “Bible” — Single Source of Truth

---

# 0) What This Is

This is a district-level election modeling engine designed for strategy + planning.

It does **not** “predict elections.”
It models probability under your assumptions — and it **exposes risk**.

This tool exists to stop campaigns from lying to themselves with bad math.

---

# 1) What It Produces

Depending on toggles, it can produce:

- Deterministic structural math (win target + capacity)
- Win probability (Monte Carlo simulation)
- Margin distribution (mean / worst / best / volatility)
- Sensitivity (which lever moves probability most)
- Diagnostics (warnings when assumptions are aggressive)

---

# 2) Core Concepts (Plain Language)

## Registered voters
How many people can vote.

## Turnout rate
What percent you think will vote.

## Win target
Half the voters + 1 (in a two-way framing).

## Buffer
Extra votes added so you’re not aiming at “exact half + 1.”
Buffers acknowledge real-world uncertainty.

## Base vote
Votes you believe are already committed.

## Persuasion universe
The list you are treating as persuadable.

## Contact rate
What percent of that universe you realistically touch.

## Persuasion conversion
Of those contacted, what percent you actually flip.

## GOTV universe
People likely to support you if you can get them to the polls.

## GOTV conversion
The percent of that GOTV list you actually turn out.

---

# 3) The “Institutional Anchoring” Problem (Your Field Insight)

A big persuasion failure mode is not execution.

It’s that the “persuasion universe” is contaminated.

A voter scores as “persuadable.”
They may even say “undecided.”

But they are socially/institutionally anchored:

- Church
- Union
- Club
- Civic organization
- Community leader

They will follow institutional signals at decision time.

They don’t always tell you this on the phone.
You learn it by doing real field.

### What this means:
A portion of “persuasion universe” is not actually movable.

---

# 4) The Fix: Persuasion Movable Share %

If enabled, the tool applies:

Effective Persuasion Universe = Persuasion Universe × (Movable Share %)

This is a structural realism control — not a vibes knob.

Default mindset:
- Leave it OFF if you trust the persuasion classification
- Turn it ON when you suspect hidden lock-in / institutional anchoring

Examples:
- Movable Share = 60% → “I think only 60% is truly movable”
- Movable Share = 85% → “Mostly real persuadables, some noise”

---

# 5) The Math (Deterministic Core)

Projected Turnout:
T = V × t

Win number:
W = floor(T / 2) + 1

Buffered win target:
Wb = floor(W × (1 + buffer))

Persuasion yield:
Py = P_eff × contact_rate × persuasion_rate

GOTV yield:
Gy = G × gotv_rate

Total vote capacity:
C = base_vote + Py + Gy

Margin:
Margin = C − Wb

---

# 6) Monte Carlo Simulation (Probability Mode)

When Probability Simulation is ON, the tool runs many elections (default 8,000).

In each simulated election it randomizes:
- Turnout rate
- Contact rate
- Persuasion conversion
- GOTV conversion

Randomization uses a normal distribution (mean + standard deviation),
then clamps values between 0% and 100%.

Then it recalculates:
- Win target
- Vote yield
- Margin

Win Probability = (# simulations with margin ≥ 0) / (total simulations)

---

# 7) Margin Distribution (Why Probability Alone Isn’t Enough)

Two races can both show 63% win probability.

But they can be totally different:

- One is stable with small downside
- One is fragile with catastrophic left-tail outcomes

Distribution reporting shows:

- Mean Margin
- Worst Case (5th percentile)
- Best Case (95th percentile)
- Margin Volatility (standard deviation)
- Average Loss Size (only when losing)

This is firm-grade risk thinking.

---

# 8) Sensitivity (Where Leverage Actually Is)

Sensitivity bumps each variable by +1% and measures probability change.

Reported:
- Turnout Impact
- Contact Impact
- Persuasion Impact
- GOTV Impact

This answers:
“What lever moves probability the most?”

Use it for resource allocation decisions.

---

# 9) Diagnostics (Warnings)

Diagnostics are “assumption challenge flags.”

Examples:
- Contact rate > 75% (verify realism)
- Persuasion conversion > 20% (aggressive)
- GOTV conversion > 85% (aggressive)
- Volatility inputs all < 1% (overconfidence risk)
- Total capacity below win target (structural deficit)

Diagnostics do not block output.
They warn you where you might be lying to yourself.

---

# 10) Toggles (UI Guidance)

## Probability Simulation
ON → Monte Carlo probability modeling
OFF → deterministic-only

## Margin Distribution
Shows mean/worst/best/stddev/avg loss
Requires simulation

## Sensitivity
Shows leverage impacts (+1%)
Requires simulation

## Diagnostics
Shows warnings
Works in both modes, but most useful in simulation mode

## Institutional Anchoring Adjustment
Enables Movable Share %
Applies to persuasion universe before yield math

## Volatility Inputs
Controls whether std dev inputs matter
If OFF, volatility treated as 0 (stable assumptions)

---

# 11) How to Use This Tool Correctly

1) Enter conservative base vote
2) Use realistic universes (don’t inflate)
3) Use realistic contact rate assumptions
4) Use realistic conversion assumptions
5) Turn simulation on
6) Look at:
   - Win probability
   - Worst case
   - Mean margin
   - Sensitivity
   - Diagnostics
7) If persuasion is fragile, consider enabling Movable Share

---

# 12) Validation Against a Past Race

To validate:
1) Plug in real electorate + turnout
2) Estimate base, persuasion, GOTV realistically
3) Adjust volatility until distribution matches how races behave there
4) Compare mean/worst/best to actual margin patterns

If it consistently overestimates:
- your base is inflated
- your persuasion universe is contaminated
- your conversion assumptions are inflated
- your volatility is too low

---

# 13) Current Limitations

- No demographic splits
- No precinct-level modeling
- No voter score weighting
- No CSV import
- Password gate is not secure like a real backend

Next step (Option 3) is backend:
- Real authentication
- Hidden logic
- CSV upload + parsing
- Voter-score weighting
- Precinct modeling

---

# 14) Bottom Line

This engine is meant to create:
- strategic clarity
- assumption discipline
- risk awareness
- leverage identification

It is not comfort.
It is infrastructure.
