# Recommended Defaults (and Why)
## DEFAULTS.md — Companion to the Calculator Bible

This file explains the recommended starting values used for “first-pass” modeling.
These are NOT rules. They are safe starting points designed to prevent overconfidence.

Use these defaults when:
- you’re starting a new race model
- you don’t yet have strong empirical variance estimates
- you want a “firm-ish” baseline that doesn’t assume perfect execution

Then adjust based on:
- cycle environment
- race type (municipal vs partisan)
- special election dynamics
- voter file quality
- field capacity / staffing
- mail vote / early vote structure
- opposition strength

---

# 1) Safety Buffer Default: 4%

## Recommended
**Buffer = 4%**

## What it does
Buffer increases the win target beyond simple half + 1.

It accounts for:
- late break uncertainty
- reporting quirks / noise
- opposition surge
- campaign execution friction
- basic “don’t aim at exactly 50% + 1” discipline

## Why 4%
3–5% is a common practical safety range.
4% is a middle baseline that’s:
- not overly conservative
- not reckless
- easy to defend in conversation

When to raise it:
- low information race
- late-deciding electorate
- heavy misinformation environment
- “wave” years
- contested mail/early vote dynamics
- historically volatile turnout jurisdictions

When to lower it:
- high-information electorate
- stable partisanship
- strong incumbent with consistent base
- low-variance local election history

---

# 2) Turnout Volatility Default: 3%

## Recommended
**Turnout Volatility (std dev) = 3%**

## What it means
Across simulations, turnout rate is randomized around your expected turnout.

If expected turnout is 40% and volatility is 3%,
the model frequently tests turnout outcomes like:
- ~37%
- ~40%
- ~43%
(with tails beyond that)

## Why 3%
3% is a reasonable baseline for typical local-to-legislative races where:
- turnout is not fully stable
- but not wildly chaotic either

When to raise it:
- special election
- new district lines / new electorate
- major top-of-ticket environment shift
- major ballot measures
- historically erratic turnout precincts

When to lower it:
- very stable, habitual electorate
- highly predictable municipal cadence
- heavy vote-by-mail system with predictable returns

---

# 3) Contact Volatility Default: 6%

## Recommended
**Contact Volatility (std dev) = 6%**

## What it means
This randomizes the contact rate around your assumed contact rate.

Contact rate is one of the most execution-sensitive variables in campaign work.
It swings based on:
- staffing changes
- volunteer quality
- turf quality
- access (gated buildings, language barriers)
- timing (weather, holidays, events)
- schedule discipline
- list quality

## Why 6%
Because contact is usually the messiest part operationally.
A 6% standard deviation reflects:
- real implementation noise
- real week-to-week variance

When to raise it:
- volunteer-driven operation
- late-start campaign
- bad turf / rural long drives
- unpredictable FO staffing
- no paid canvass

When to lower it:
- mature paid canvass program
- strong turf systems
- predictable phone + SMS program
- high-repeat universe access

---

# 4) Persuasion Volatility Default: 3%

## Recommended
**Persuasion Volatility (std dev) = 3%**

## What it means
Randomizes persuasion conversion around your assumed persuasion rate.

Persuasion conversion changes based on:
- message discipline
- event shocks / scandals
- opponent attacks
- salience shifts
- candidate performance
- late info / endorsements

## Why 3%
In many races, persuasion conversion is variable but not infinitely variable.
3% creates meaningful movement without turning the model into chaos.

When to raise it:
- low-information race
- volatile news environment
- candidate unfamiliarity
- high negative campaigning
- messaging uncertainty

When to lower it:
- highly polarized electorate
- fixed partisan behavior
- limited persuasion opportunity in reality

---

# 5) GOTV Volatility Default: 5%

## Recommended
**GOTV Volatility (std dev) = 5%**

## What it means
Randomizes GOTV conversion around your assumed GOTV conversion.

GOTV conversion is influenced by:
- early vote structures
- ballot chase systems
- election day conditions (weather, lines)
- ride-to-polls capacity
- ballot cure programs
- vote plan discipline

## Why 5%
Because GOTV programs can be excellent or brittle depending on system maturity.
5% reflects that real variance exists, even in “good” GOTV ops.

When to raise it:
- election day-heavy system
- no chase program
- limited early vote culture
- operational instability

When to lower it:
- strong vote-by-mail chase
- stable early vote culture
- strong relational organizing infrastructure

---

# 6) Persuasion Movable Share Default: 100% (Neutral)

## Recommended
**Movable Share = 100%** (when the feature is ON)

## Why this default is neutral
This tool allows you to model “institutional anchoring” — hidden allegiance that makes part of the persuasion universe not actually movable.

But that factor is race-specific.

So the default is:
**neutral / no penalty** until you have reason to apply one.

When to reduce movable share:
- your persuasion tiers include hidden institutional blocks (church/club/union/community leader)
- you suspect “undecideds” are socially committed
- you’ve seen FO intel that indicates anchored behavior
- voter file persuasion classification is noisy / inflated

Example settings:
- 85% = mild anchoring
- 70% = moderate anchoring
- 55–60% = heavy anchoring (strong institutional alignment environment)

---

# 7) Quick “Starting Pack” Defaults

If you want a clean baseline:

- Buffer = 4%
- Turnout Vol = 3%
- Contact Vol = 6%
- Persuasion Vol = 3%
- GOTV Vol = 5%
- Movable Share = 100% (until you decide otherwise)

Then refine once you learn the race.

---

# 8) A final warning

Defaults are not “truth.”
They are guardrails against fake certainty.

If you want the model to be strong:
- be conservative about base
- be skeptical about persuasion universes
- use volatility honestly
- treat sensitivity as leverage, not destiny
