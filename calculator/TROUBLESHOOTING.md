# Troubleshooting Guide
## TROUBLESHOOTING.md — Interpreting Weird or Concerning Output

This document exists for one reason:

When the model outputs something confusing, extreme, or counterintuitive,
you need a disciplined way to diagnose what’s happening.

This file walks through common scenarios and what they usually mean.

---

# SECTION 1 — “My probability is high but the mean margin is small.”

## What you’re seeing
- Win Probability: 72%
- Mean Margin: +140 votes
- Worst Case: -850 votes

## What this means
You are barely clearing the win threshold in most simulations.

The model is saying:
“You usually win, but not by much.”

This is fragile stability.

## Likely causes
- Base vote just barely enough
- Persuasion doing the heavy lifting
- Low volatility inputs
- Thin structural margin

## What to check
- Increase volatility slightly and see if probability collapses
- Turn on Movable Share if persuasion universe feels optimistic
- Examine sensitivity — if one lever dominates, you’re exposed

---

# SECTION 2 — “My probability is high no matter what I change.”

## What you’re seeing
You adjust inputs moderately and probability barely moves.

## Likely causes
- Volatility too low (overconfidence)
- Base vote too high
- Persuasion conversion unrealistically strong
- Buffer too small

## What to check
- Raise volatility (especially contact + GOTV)
- Reduce persuasion conversion 2–3 points
- Turn on Movable Share and reduce to 70–80%
- Increase buffer from 3% to 4–5%

If probability still doesn’t move,
your base vote assumption may be inflated.

---

# SECTION 3 — “Worst case is catastrophically bad.”

## What you’re seeing
- Worst Case: -2,500 votes
- Mean Margin: +300

## What this means
You are structurally exposed to downside volatility.

This is common in:
- Special elections
- Low turnout environments
- Volunteer-heavy operations
- Races with high persuasion dependence

## What to check
- Is turnout volatility realistic?
- Is contact volatility too high?
- Are you relying on persuasion too heavily?
- Does sensitivity show one fragile lever?

This is not necessarily wrong.
It may reflect reality.

---

# SECTION 4 — “Sensitivity says GOTV matters most.”

## Interpretation
Your persuasion is not your bottleneck.

Increasing GOTV by 1% yields more probability gain than persuasion.

This usually means:
- You’re closer to the threshold than you think.
- Field turnout reliability matters more than message shifts.

Operational implication:
- Invest in chase
- Improve vote plan discipline
- Protect early vote infrastructure

---

# SECTION 5 — “Sensitivity says persuasion matters most.”

## Interpretation
You are persuasion-dependent.

Your win path depends on converting more persuadables.

Risks:
- Message discipline
- Opposition attack impact
- Institutional anchoring
- Late breaks

What to check:
- Turn on Movable Share and test structural realism
- Increase persuasion volatility to stress-test fragility
- Reduce conversion rate slightly and observe probability shift

If probability collapses quickly, your persuasion math is brittle.

---

# SECTION 6 — “Probability changes too much each time I run it.”

## Why this happens
Monte Carlo simulation uses randomness.
Small variation is normal.

If swings are large (e.g., 62% → 71% → 58% repeatedly):

Likely causes:
- Volatility inputs too high
- Small margin relative to volatility
- High persuasion dependence

## What to do
- Reduce volatility slightly
- Increase simulation count (backend version later)
- Examine margin volatility (std dev)

High fluctuation is often a signal of fragility — not a bug.

---

# SECTION 7 — “Probability is low but deterministic math says I clear the target.”

## What’s happening
Deterministic math assumes perfect execution.
Simulation includes volatility.

You may be structurally fine in theory,
but fragile under realistic variance.

## What to check
- Look at mean margin vs worst case
- Examine which volatility input is driving losses
- Review sensitivity

This is exactly why simulation exists.

---

# SECTION 8 — “Turning on Movable Share destroys my probability.”

## What this means
Your persuasion universe was structurally inflated.

Institutional anchoring or social allegiance is reducing effective persuasion.

This is not a modeling failure.
This is the model exposing structural fragility.

## What to do
- Reduce persuasion dependence
- Expand base
- Expand GOTV universe
- Improve contact rate realism
- Accept narrower path

---

# SECTION 9 — “Diagnostics are firing constantly.”

Diagnostics flag:
- Aggressive contact
- Aggressive persuasion conversion
- Aggressive GOTV conversion
- Low volatility
- Structural capacity deficit

If diagnostics fire:
- It does not mean the model is broken.
- It means you should re-evaluate realism.

Use diagnostics as discipline, not punishment.

---

# SECTION 10 — “Mean margin is positive but average loss size is large.”

This means:
When you lose, you lose badly.

Interpretation:
- You are exposed to tail risk.
- Volatility is asymmetric.
- Execution variability is high.

Action:
- Increase buffer
- Reduce volatility (if unrealistic)
- Diversify win path (don’t rely on one lever)

---

# SECTION 11 — “Everything looks too stable.”

If:
- Win probability barely moves
- Margin volatility very small
- Worst case close to mean
- Sensitivity low

Likely causes:
- Volatility inputs too low
- Persuasion conversion too optimistic
- Movable Share too generous
- Base vote too high

This tool should rarely look “boring.”

If it does, double-check your assumptions.

---

# SECTION 12 — “How do I know the model is behaving properly?”

Healthy behavior:
- Probability responds to reasonable assumption shifts
- Sensitivity matches field intuition
- Diagnostics fire when you get aggressive
- Distribution shows believable tails

Unhealthy behavior:
- Probability stuck near 100% regardless of inputs
- No change when volatility increases
- Diagnostics never trigger even with extreme assumptions
- Massive swings with tiny input changes (unless volatility is high)

---

# Final principle

When output feels wrong,
it is almost always:
- a structural assumption problem
- not a code problem

This model does not create fragility.
It reveals it.

Use it to challenge yourself,
not to confirm comfort.
