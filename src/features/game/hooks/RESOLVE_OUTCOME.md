# resolveOutcome() Explanation

This document explains how `resolveOutcome(striker, bowler)` simulates one cricket delivery.

## Purpose

`resolveOutcome` returns one of these delivery results:
- wicket (`{ isWicket: true, runs: 0 }`)
- run outcome (`{ isWicket: false, runs: 0 | 1 | 2 | 3 | 4 | 6 }`)

It uses a dynamic probability model influenced by:
- batting intent
- bowling intent
- striker and bowler abilities
- pitch, outfield, weather
- match phase (remaining overs)

## Core Flow

1. **Build context-based weights**
   - Creates base weights for: `W, 0, 1, 2, 3, 4, 6`.
   - Adjusts values using intent bonuses, ability deltas, and match conditions.

2. **Normalize to exactly 100 slots**
   - `normalizeToHundred(weights)` scales all weights so they total `100`.
   - This gives a fixed-size probability space.

3. **Create a 3D probability cube (5 × 5 × 4 = 100)**
   - `buildOutcomeCube(weights)` fills a 100-item slot array using normalized counts.
   - Slots are shuffled to distribute outcomes randomly.
   - Slots are mapped into a 3D cube for deterministic index addressing.

4. **Pick random index from 1 to 100**
   - Random number is generated with `Math.floor(Math.random() * 100) + 1`.
   - `pickFromCube(cube, randomNumber)` converts that number into cube coordinates.

5. **Convert token to return object**
   - `toOutcomeResult(token)` converts:
     - `'W'` → wicket result
     - `'0'...'6'` → run result

## Special Rule: Free Hit

When batting intent is `freeHit`:
- wicket weight is forced to `0`
- boundary chances (`4`, `6`) are increased

This guarantees no wicket from the weighted model during free-hit intent.

## Why the 3D model helps

- Keeps probability space fixed and transparent (`100` slots)
- Makes distribution easy to tune by changing weights only
- Preserves randomness while staying condition-aware
- Aligns with the requirement: **outcome = probabilityArray[randomNumber]** (implemented via cube index mapping)
