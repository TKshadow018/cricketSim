# resolveOutcome() Explanation

This document explains how `resolveOutcome(striker, bowler)` simulates one cricket delivery.

## Purpose

`resolveOutcome` returns one of these delivery results:
- wicket (`{ isWicket: true, runs: 0 }`)
- run outcome (`{ isWicket: false, runs: 0 | 1 | 2 | 3 | 4 | 6 }`)

It uses a dynamic probability model influenced by:
- batting approach, shot intent, and target sector (when user batting tactics are supplied)
- bowling plan, field, line, length, and variation (when user bowling tactics are supplied)
- legacy batting and bowling intents for callers and saves that do not provide tactics
- striker and bowler abilities
- pitch, outfield, weather
- match phase (remaining overs)

## Core Flow

1. **Build context-based weights**
   - Creates base weights for: `W, 0, 1, 2, 3, 4, 6`.
   - Adjusts values using intent bonuses, ability deltas, and match conditions.

2. **Normalize to exactly 100 slots**
   - Negative adjusted weights are clamped to zero.
   - When the non-dot outcomes fit within 100 slots, the dot outcome fills the remaining slots.
   - If adjusted outcomes overflow the 100-slot space, all non-negative weights are scaled
     proportionally and integer remainders are assigned deterministically. This preserves the
     relative chances of every outcome instead of truncating outcomes from the end of the list.

3. **Build the weighted outcome array**
   - The normalized counts fill a 100-item array in run, extra, and wicket order.

4. **Pick random index from 0 to 99**
   - Random number is generated with `Math.floor(Math.random() * 100)`.
   - The outcome at that weighted-array position is selected.

5. **Convert token to return object**
   - `toOutcomeResult(token)` converts:
     - `'W'` → wicket result
     - `'0'...'6'` → run result

## Special Rule: Free Hit

When batting intent is `freeHit`:
- wicket weight is forced to `0`
- the remaining outcomes are rebalanced to keep the total at 100

This guarantees no wicket from the weighted model during free-hit intent.

## Why the weighted model helps

- Keeps probability space fixed and transparent (`100` slots)
- Makes distribution easy to tune by changing weights only
- Preserves randomness while staying condition-aware
- Keeps every outcome represented when combined modifiers exceed the slot budget
