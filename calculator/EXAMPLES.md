# Worked Examples
## EXAMPLES.md — How to Set Inputs Like a Strategist

This file shows how to use the tool with realistic settings across different race types.
Numbers below are illustrative; adjust to the actual electorate and your voter file.

The goal is not “perfect forecasting.”
The goal is disciplined thinking:
- realistic universes
- honest volatility
- transparent assumptions
- clear leverage

---

# Quick reminders

**This tool outputs:**
- Win probability (if simulation is ON)
- Margin distribution (mean / worst / best / volatility)
- Sensitivity (which lever moves probability most)
- Diagnostics (flags aggressive assumptions)
- Optional: Movable Share (institutional anchoring filter)

**A healthy model workflow:**
1) Put in conservative base
2) Be skeptical of persuasion universe
3) Use volatility honestly
4) Read the distribution, not just probability
5) Use sensitivity to guide resource allocation
6) Turn on Movable Share when persuasion universe is “contaminated”

---

# Example 1: Swingy Municipal / Nonpartisan Race (Real persuasion exists)

## Situation
- Voters are less partisan, more “performance/issue” oriented
- Genuine swing voters exist
- Institutions matter, but not always rigidly partisan
- Persuasion can be real, but execution matters

## Suggested mindset
- Use moderate persuasion volatility
- Contact volatility can still be meaningful
- Movable Share often can stay OFF unless you have strong evidence of anchoring

## Sample inputs
- Total Registered Voters: 40,000
- Expected Turnout %: 28
- Safety Buffer %: 4
- Base Vote Secured: 4,800

Persuasion:
- Persuasion Universe: 12,000
- Contact Rate %: 55
- Persuasion Conversion %: 10
- Movable Share: OFF (or ON at 85–100 if needed)

GOTV:
- GOTV Universe: 6,000
- GOTV Conversion %: 70

Volatility:
- Turnout Vol: 3
- Contact Vol: 6
- Persuasion Vol: 4
- GOTV Vol: 5

## What you should expect in outputs
- Probability should move meaningfully when persuasion inputs shift
- Sensitivity might show persuasion/contact as major levers
- Worst case could be negative if contact/turnout swing against you
- If model shows stable probability with high persuasion, check realism

## How to interpret
If probability is decent but worst case ugly:
- You’re fragile: improve execution reliability or expand base/GOTV
If sensitivity shows contact >> persuasion:
- Your bottleneck is reaching people, not message effectiveness

---

# Example 2: Polarized Partisan Legislative Race (Persuasion universe often “contaminated”)

## Situation
- Many “undecideds” are socially anchored
- Score-based “persuasion” tiers may include lean opposition
- Persuasion conversion is often lower than staff believes
- GOTV usually matters more than persuasion

## Suggested mindset
- Turn ON Movable Share
- Use lower persuasion conversion assumptions
- Use higher contact volatility if relying on volunteers
- GOTV leverage often dominates

## Sample inputs
- Total Registered Voters: 110,000
- Expected Turnout %: 46
- Safety Buffer %: 4
- Base Vote Secured: 22,500

Persuasion:
- Persuasion Universe: 18,000
- Contact Rate %: 50
- Persuasion Conversion %: 7
- Movable Share: ON at 70 (institutional anchoring penalty)

GOTV:
- GOTV Universe: 24,000
- GOTV Conversion %: 68

Volatility:
- Turnout Vol: 3
- Contact Vol: 7
- Persuasion Vol: 3
- GOTV Vol: 5

## What you should expect in outputs
- Probability depends heavily on GOTV assumptions
- Sensitivity often shows GOTV impact > persuasion impact
- Diagnostics should stay mostly quiet if you’re realistic
- Margin distribution likely shows a tighter worst case than a naive model would

## How to interpret
If probability is okay but sensitivity shows GOTV dominates:
- Your “win strategy” is field + chase + turnout reliability
If persuasion seems to matter a lot in outputs:
- Double-check movable share and conversion realism (you may be inflating persuadables)

---

# Example 3: Special Election / Low Information Race (High volatility + weird turnout)

## Situation
- Turnout is unpredictable
- Voter behavior can shift fast
- Field operations and institutional networks can swing outcomes
- The tails matter (worst case can be catastrophic)

## Suggested mindset
- Increase turnout volatility
- Increase contact volatility if the program is chaotic
- Movable Share often ON if persuasion universe is questionable
- Buffer may be higher than normal

## Sample inputs
- Total Registered Voters: 75,000
- Expected Turnout %: 22
- Safety Buffer %: 5
- Base Vote Secured: 5,800

Persuasion:
- Persuasion Universe: 10,000
- Contact Rate %: 48
- Persuasion Conversion %: 8
- Movable Share: ON at 65

GOTV:
- GOTV Universe: 12,000
- GOTV Conversion %: 65

Volatility:
- Turnout Vol: 5
- Contact Vol: 8
- Persuasion Vol: 5
- GOTV Vol: 7

## What you should expect in outputs
- Probability should swing notably between runs (that’s the point)
- Worst case will often be ugly
- Margin volatility (std dev) will be high
- Sensitivity can change depending on your assumptions

## How to interpret
If probability looks “fine” but margin volatility is huge:
- This is a fragile race — you need buffers, redundancy, and a plan for shocks
If worst case is catastrophic:
- Consider expanding base/GOTV or accepting risk and planning triage decisions

---

# Example 4: High-Institution Environment (Anchoring is the game)

## Situation
- Voters follow institutional cues (church, union, club, community leaders)
- “Undecided” often means “waiting on the signal”
- Field organizers learn this only through real contact and listening

## Suggested mindset
- Movable Share ON
- Movable Share might be 55–75 depending on your read
- Persuasion conversion might be decent *within the truly movable slice*
- The key is not higher conversion — it’s accurate classification

## Sample inputs
- Total Registered Voters: 95,000
- Expected Turnout %: 40
- Safety Buffer %: 4
- Base Vote Secured: 18,000

Persuasion:
- Persuasion Universe: 20,000
- Contact Rate %: 55
- Persuasion Conversion %: 9
- Movable Share: ON at 60

GOTV:
- GOTV Universe: 18,000
- GOTV Conversion %: 72

Volatility:
- Turnout V
