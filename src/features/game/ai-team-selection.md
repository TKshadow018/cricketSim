# AI Team Selection - How It Works

This document explains how the simulator builds an AI playing XI for career and AI-controlled matches.

## Where It Is Used

The AI XI selection logic is used when:

- a career match is launched
- an AI-vs-AI career fixture is simulated
- the opponent team is auto-picked in pre-match setup

The shared selector lives in `src/features/game/utils/controllerCommonUtils.js`.

## Match 1 Selection

For a team’s first match, the XI is built from role-based priorities:

1. Pick 1 wicketkeeper with the best batting score.
2. Pick 3-4 batsmen with the highest batting score.
3. Pick 6-7 bowler/allrounders with the highest bowling score.
4. Fill any remaining spots from the best available players.

### Scoring Rules

- Batting score = `abilityToPlayPaceBall + abilityToPlaySpinBall`
- Bowling score = `max(paceAbility, spinAbility)`

## Match 2+ Selection

For later matches, the AI starts from the previous XI and updates it based on performance and condition.

### Replacement Rules

A player is replaced if:

- fitness is below `30`
- morale is below `10`
- a carried-over batsman scored fewer than `10` runs in the last match
- the team needs to refresh its weakest bowler/allrounder

A player is replaced by similar type player
batsman by batsman
bowler by bowler
wicketkeeper by wicketkeeper
allrounder by allrounder [spin and pace alrounder switch allowed]

extra: 
allrounder might be replaced with batsman if selected team batsman < 4
allrounder might be replaced with bowler if selected team spin bowler + pace bowler < 3


### Bowling Refresh Rule

The selector can replace `1` to `3` of the weakest bowlers/allrounders with better bench options.

Weak bowler ranking is based on:

- last match wickets
- then bowling score

## Role Safety Rules

The selector keeps the XI balanced by preserving or restoring:

- at least one wicketkeeper
- batting depth when bench replacements are applied
- valid 11-player selection

## Fallback Behavior

If the roster does not provide enough clear role candidates, the selector falls back to the best available players by batting and bowling strength.

## Notes

- The morale rule is treated as a drop/replacement rule when morale is below `10`.
- The selector uses player metadata such as fitness, morale, batting order coefficient, and role type when available.
- This logic is shared so career matches, AI-vs-AI fixtures, and auto-pick flows behave consistently.
