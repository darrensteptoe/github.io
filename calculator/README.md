# Campaign Probability & Strategy Modeling Engine
## Internal Strategy Manual

---

# PURPOSE

This tool is a district-level probabilistic election modeling engine.

It is designed to:

- Model win probability using Monte Carlo simulation
- Model turnout volatility
- Model persuasion volatility
- Model GOTV volatility
- Evaluate structural vote capacity
- Surface risk exposure
- Identify strategic leverage points
- Quantify downside risk

This is not a basic win-number calculator.
This is a probabilistic system model.

---

# CORE PHILOSOPHY

Traditional campaign math asks:

“How many votes do we need?”

This engine asks:

“What is the probability we achieve that under real-world volatility?”

And further:

“If we lose, how badly do we lose?”
“Where does marginal effort move probability the most?”

This shifts thinking from arithmetic to risk modeling.

---

# MODEL ARCHITECTURE

The engine operates in four layers:

1. Deterministic Core
2. Efficiency Reality Layer
3. Volatility Simulation (Monte Carlo)
4. Distribution & Sensitivity Reporting

---

# 1. DETERMINISTIC CORE

These formulas calculate the baseline structure of the race.

## Projected Turnout

T = V × t

Where:
V = Total registered voters
t = Expected turnout rate

---

## Raw Win Number

W = (T / 2) + 1

---

## Buffered Win Target

Wb = W × (1 + buffer)

Buffer accounts for:
- Recount margin
- Late swings
- Reporting error
- Opposition GOTV surge

---

## Vote Capacity

Persuasion Yield:
Py = P × contact_rate × persuasion_rate

GOTV Yield:
Gy = G × gotv_rate

Total Capacity:
C = base_vote + Py + Gy

---

# 2. VOLATILITY MODELING

Real elections do not operate on static inputs.

The engine simulates variation in:

- Turnout rate
- Contact rate
- Persuasion conversion rate
- GOTV conversion rate

Each variable is modeled using a normal distribution:

X_sim = randomNormal(mean, stdDev)

Values are clamped between 0–100%.

This models:
- Weather
- Opposition spending
- Volunteer quality
- Message resonance
- Timing
- Turnout shocks

Default simulation count: 8,000 runs.

---

# 3. MONTE CARLO SIMULATION

For each simulated election:

1. Randomize turnout
2. Randomize contact rate
3. Randomize persuasion rate
4. Randomize GOTV rate
5. Recalculate win threshold
6. Calculate total vote yield
7. Compute margin

Win Probability = Wins / Total Simulations

---

# 4. MARGIN DISTRIBUTION

Probability alone is incomplete.

The engine reports:

Mean Margin  
Average simulated margin

Worst Case (5th percentile)  
Bottom 5% outcome

Best Case (95th percentile)  
Top 5% outcome

Margin Volatility  
Standard deviation of margins

Average Loss Size  
Average negative margin when losing

This reveals:

- Fragility
- Upside ceiling
- Downside severity
- Structural stability

---

# 5. SENSITIVITY ANALYSIS

Each variable is bumped by +1%.

The engine measures change in win probability.

Reported impacts:

- Turnout impact
- Contact impact
- Persuasion impact
- GOTV impact

This answers:

“What lever moves probability most?”

This guides:
- Field staffing
- Messaging investment
- GOTV expansion
- Turnout modeling adjustments

---

# 6. RISK CLASSIFICATION

SAFE → ≥70% probability  
TIGHT → 55–69%  
HIGH RISK → <55%

These are strategic labels, not guarantees.

---

# 7. DIAGNOSTIC WARNINGS

The engine flags unrealistic assumptions:

Contact rate >75%  
Persuasion >20%  
GOTV >85%  
All volatility <1%  
Total capacity below buffered win

Diagnostics do not block output.
They challenge assumptions.

---

# HOW TO USE THIS TOOL PROPERLY

1. Start with realistic turnout from past cycles.
2. Set volatility based on historical variance.
3. Input base vote conservatively.
4. Model persuasion yield realistically.
5. Run simulation.
6. Study distribution, not just probability.
7. Check diagnostics.
8. Run sensitivity.
9. Adjust assumptions.
10. Stress test worst-case volatility.

---

# HOW TO VALIDATE AGAINST A PAST RACE

1. Select historical race.
2. Input actual turnout.
3. Estimate realistic persuasion.
4. Estimate realistic GOTV.
5. Adjust volatility until distribution approximates real outcome.
6. Confirm model stability.

If model consistently mispredicts:
- Volatility assumptions are wrong.
- Yield estimates are inflated.
- Base vote is overstated.

---

# WHEN DATA IS LIKELY SKEWED

- Inflated persuasion conversion
- Overestimated contact rate
- Underestimated volatility
- Using outdated voter file
- Ignoring drop-off
- Ignoring opposition field strength

---

# LIMITATIONS (CURRENT VERSION)

- No demographic splits
- No precinct-level modeling
- No voter score weighting
- No CSV import
- No backend security

Future backend version may include:
- Score weighting
- Geographic weighting
- CSV upload
- Persistent modeling
- Secure authentication

---

# STRATEGIC INTERPRETATION GUIDE

If probability is high but worst-case is severe:
→ Race is fragile.

If probability is moderate but downside small:
→ Stable narrow race.

If sensitivity shows GOTV high impact:
→ Field leverage exists.

If persuasion sensitivity high:
→ Messaging matters more than turnout.

If volatility increases collapse probability:
→ Race depends on stability assumptions.

---

# FINAL NOTE

This tool does not predict elections.

It models structural probability under specified assumptions.

Garbage assumptions will produce confident garbage.

Conservative assumptions with realistic volatility produce strategic clarity.

Use this as infrastructure.
Not as comfort.
