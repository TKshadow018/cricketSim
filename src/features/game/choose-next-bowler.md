# Choose Next Bowler - How It Works

This document explains the `Choose Next Bowler` section shown during an innings.

## Where It Appears

The selector UI is rendered in `InningsStage` when:

- `waitingForNextBowler === true`

It shows candidate buttons from `bowlerCandidates` with disabled reasons where applicable.

## When It Is Triggered

`waitingForNextBowler` is turned on in two main cases:

1. Start of innings (user is bowling)
- In `buildPreparedInnings` (`src/features/game/utils/controllerInningsSetupUtils.js`), if user is bowling and at least one eligible bowler exists, innings starts with:
  - `waitingForNextBowler = true`
  - `currentBowlerIndex = null`

2. End of each completed over (user is bowling)
- In `controllerDeliveryEngine` (`src/features/game/hooks/controller/controllerDeliveryEngine.js`), after a legal over completes:
  - striker/non-striker swap
  - over-level special counters reset
  - if user is bowling and an eligible bowler exists:
    - `waitingForNextBowler = true`
    - `currentBowlerIndex = null`
    - last event includes `Over complete. Choose next bowler.`

## Candidate Building Logic

Candidates are built in `buildInningsViewModel` (`src/features/game/hooks/controller/controllerInningsViewModel.js`).

### Step 1: Eligibility filter
A player is an eligible bowler only if:

- not wicketkeeper
- and has bowling skill threshold:
  - default rule: `paceAbility >= 30` OR `spinAbility >= 30`
  - fallback rule: if that leaves fewer than 6 eligible bowlers, the threshold is lowered for that team so the 6 strongest non-wicketkeepers become eligible

Rule source: `isEligibleBowler` in `src/utils/simulatorUtils.js`.

### Step 2: Disabled state in UI
Eligible bowlers can still be disabled if:

- they bowled the previous over (`lastOverBowlerIndex`)
- or they reached per-bowler over limit

Per-bowler max overs rule:

- `maxOversPerBowler = max(1, floor(totalOvers / 5))`

Rule source: `getMaxOversPerBowler` and `canSelectBowler` in `src/utils/simulatorUtils.js`.

### Step 3: Final selectable filter
After disabled flags are computed, selection is validated again using `canSelectBowler(...)` so only legal options remain selectable.

## What Happens On Click

Click action calls `handleSelectBowler(isFirstInnings, bowlerIndex)`.

Core behavior in `controllerInningsCore`:

- Ignore if not currently waiting (`waitingForNextBowler` must be true)
- Ignore illegal pick (same validation via `canSelectBowler`)
- If valid:
  - `waitingForNextBowler = false`
  - `currentBowlerIndex = bowlerIndex`
  - `lastEvent` updated to `<name> to bowl next.`
  - voice line announced

## Why Play Next Ball Is Blocked Until Selection

`Play Next Ball` depends on `canPlayNextBall`.

`isInningsReadyForNextBall` returns false when any of these are true:

- `needsOpeners`
- `waitingForNextBatter`
- `waitingForNextBowler`
- missing striker/non-striker
- missing current bowler
- innings complete by balls/wickets

So, when waiting for next bowler, the innings cannot proceed until a legal bowler is selected.

## Computer Bowling Path

If user is not bowling, no manual selector appears. The engine auto-assigns bowler using `selectComputerBowler(...)`.
