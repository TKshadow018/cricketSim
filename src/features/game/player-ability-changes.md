# Player Ability Changes - Career and Match Lifecycle

This document describes the currently implemented player progression logic in career mode.

## Quick Summary

- Core abilities now change after matches and at season end.
- Match progression is performance-based and role-weighted.
- Season progression uses age bands plus leaderboard bonuses.
- Injuries can cause random ability loss.
- Form and confidence are tracked separately from long-term ability.

## Ability Fields Affected by Progression

Long-term ability progression updates these fields:

- abilityToPlayPaceBall
- abilityToPlaySpinBall
- battingAggresion
- paceAbility
- spinAbility

Progression does not directly alter:

- playerType
- isWicketKeeper
- battingOrderCoeff

## Match-Level Ability Progression

Ability changes are applied after each domestic match through career update processing.

### Participation Gate

If a player did not bat and did not bowl in the match, long-term ability change is 0 for that match.

### MOM-Based Ability Delta

For players who batted or bowled:

- wins Man of the Match: +3 ability points
- appears in MOM shortlist: +2 ability points
- in top half of shortlist: +1 ability point
- in remaining half of shortlist: -1 ability point

Net ability delta is the sum of applicable items above.

### Injury Ability Delta

Per match, each player has a random injury chance:

- chance: 0.5 percent
- injury penalty: -10 to -25 ability points

Injury penalty is added to the match ability delta before distribution.

## Ability Point Distribution by Role

Ability delta is distributed across fields by role-specific weighting.

### Batsman and Wicketkeeper

80 percent is applied to batting trio:

- abilityToPlayPaceBall
- abilityToPlaySpinBall
- battingAggresion

Remaining points are distributed to bowling ability fields.

### Bowler

50 percent is applied to dominant bowling style:

- paceAbility if paceAbility >= spinAbility
- otherwise spinAbility

Remaining points are distributed across secondary bowling plus batting fields.

### Allrounder

30 percent is applied to dominant bowling style.

15 percent each is applied to:

- abilityToPlayPaceBall
- abilityToPlaySpinBall
- battingAggresion

Remaining points are distributed to other ability fields.

## Dynamic Condition Layer

These fields change match to match and are separate from long-term ability progression.

### fitness

- default: 100
- all players recover +5 after each domestic match processing
- if selected in XI: additional -10 to -30
- clamped to 0-100

### morale

- default: 50
- if selected in XI: +1
- if not selected in XI: -2
- if in MOM shortlist: +5
- if MOM winner: +5
- clamped to 0-100

### form

- default: 50
- selected and made batting/bowling impact: +1
- selected with no batting/bowling impact: unchanged baseline for impact bonus
- not selected: -1
- shortlist: +1
- MOM winner: +2
- shortlist bottom half: -2
- injury: -5
- clamped to 0-100

### confidence

- default: 50
- selected in XI: +1
- not selected in XI: -1
- shortlist: +1
- MOM winner: +2
- injury: -5
- clamped to 0-100

## End-of-Season Ability Progression

At season rollover, every domestic player receives an age-based ability delta.

### Age Band Delta

- age 16-20: +5 to +15
- age 21-28: +3 to +10
- age 29-34: -5 to +5
- age 35-40: -25 to -15

### Leaderboard Bonus Delta

Additional end-of-season bonuses are applied from League Player Statistics (per format):

- top 20 scorer or top 20 wicket taker: +3
- top 5 scorer or top 5 wicket taker: additional +3

These bonuses stack with age-band delta.

## Batting Order Coefficient

battingOrderCoeff is assigned at setup and used in batting order and AI XI logic.

Typical ranges:

- batsman: 50-100
- wicketkeeper: 40-90
- bowler: 1-30
- allrounder: 40-90

Current progression logic does not auto-adjust battingOrderCoeff.

## Notes

- Progression is applied in both user-played and AI-simulated career fixtures.
- Match deltas and season-end deltas are both clamped through field-level bounds (0-100).
