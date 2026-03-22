# dice-slop

A dice probability calculator for tabletop games. Type `2d6+3`, get the exact
distribution — not a simulation of it.

The name is accurate about the effort, not the math. The math is the one part
of this that is genuinely careful.

## Why exact and not just rolling a lot

Most dice calculators on the web run a Monte Carlo simulation and show you the
histogram. That works, and it is also unnecessary: the distribution of a sum of
independent dice is a **discrete convolution**, and convolution is cheap.

`src/lib/statistics.ts` builds the probability mass function by convolving each
die group's distribution into a running total:

```
d6      → [1,1,1,1,1,1] / 6
2d6     → convolve(d6, d6)      → the familiar triangle peaking at 7
2d6+1d4 → convolve(that, d4)
```

So `P(sum = 7)` is an exact rational, not `0.1667 ± noise`. Every statistic —
mean, variance, median, mode, percentiles, `P(X ≥ DC)` — is read straight off
that PMF.

**Advantage and disadvantage** are the interesting case. Rolling twice and
keeping the higher is not a new convolution; it is a transformation of the
cumulative distribution. If `F(k) = P(X ≤ k)`, then rolling twice and taking
the max gives `F(k)²`, and taking the min gives `1 − (1 − F(k))²`. The PMF is
recovered by differencing. This means advantage on `2d6+1d4` is handled by the
same code path as advantage on `1d20`, for free, which is the sort of thing
that makes you briefly feel clever before remembering it is in every
probability textbook.

The Monte Carlo simulator in `src/lib/simulation.ts` is still there, and it is
deliberately redundant: running it next to the exact curve is a free correctness
check. If the sampled histogram drifts away from the analytic one, something is
wrong with one of them.

## What you get

- **Dice tray + text input** — click `d20`, or type `4d6+2d8-1`. Parser in `src/lib/dice.ts`.
- **Exact distribution chart**, PMF or cumulative, via Recharts.
- **Full statistics** — expected value, variance, standard deviation, median, mode, percentiles.
- **Threshold calculator** — "what are the odds I beat DC 15", with `>`, `≥`, `<`, `≤` all computed off the CDF.
- **Distribution comparison** — overlay two expressions to see whether `2d6+4` really beats `1d12+4`. (Same mean. Very different tails. This is the entire reason the feature exists.)
- **Advantage / disadvantage toggle**, applied analytically as described above.

## Running it

```bash
bun install
bun run dev
```

Vite dev server on `:5173`. `bun run build` for a production bundle.

## Stack

React 19 + TypeScript, Vite, Recharts. No backend, no persistence, no accounts —
it is a calculator. The entire thing is static and could be hosted on a potato.

## Honest limitations

- No tests. The math is verifiable by eye against the simulator, which is not
  the same thing as a test suite, and I am aware of that.
- Dice expression parsing handles `NdS`, modifiers, and multiple groups. It does
  not do exploding dice, rerolls, keep-highest-N, or any of the more exotic
  systems. Those are genuinely harder — keep-highest-3-of-4d6 needs order
  statistics rather than plain convolution.
- The distribution array is built eagerly over the full range, so something
  absurd like `1000d100` will allocate a large array and think about it. Nobody
  has needed this.
