                        7U67WQA U8U# Created Player Stat Assignment

This document describes how career-mode created-player stats are assigned from selected player type.

## Supported Player Types

- batsman
- bowler
- wicketkeeper
- pace allrounder
- spin allrounder
- pacer
- spiner

## Assigned Fields

- abilityToPlayPaceBall
- abilityToPlaySpinBall
- battingAggresion
- battingOrderCoeff
- fitness
- isWicketKeeper
- morale
- spinAbility
- paceAbility

## Default State Fields

- fitness: `100`
- morale: `50`
- battingOrderCoeff:
	- batsman: `50-100`
	- wicketkeeper: `40-90`
	- bowler of any type: `1-30`
	- allrounder of any type: `40-90`

## Match Effects

- playing a domestic match reduces fitness by a random `10-30`
- after every domestic match, all domestic players recover `+5` fitness
- participating in a match gives `+1` morale
- making the 5-player man of the match shortlist gives `+5` morale
- winning man of the match gives another `+5` morale
- not being selected in the match XI gives `-2` morale

## Range Rules by Type

### batsman

- abilityToPlayPaceBall: 40-60
- abilityToPlaySpinBall: 40-60
- battingAggresion: 50-70
- paceAbility: 8-15
- spinAbility: 8-15
- isWicketKeeper: false


### bowler (Pacer / Spiner)

- abilityToPlayPaceBall: 8-15
- abilityToPlaySpinBall: 8-15
- battingAggresion: 10-60
- paceAbility: 40-60 (pace-primary) or 8-15 (spin-primary)
- spinAbility: 8-15 (pace-primary) or 40-60 (spin-primary)
- isWicketKeeper: false

### wicketkeeper

- abilityToPlayPaceBall: 35-55
- abilityToPlaySpinBall: 35-55
- battingAggresion: 40-60
- paceAbility: 8-15
- spinAbility: 8-15
- isWicketKeeper: true

### pace allrounder

- abilityToPlayPaceBall: 30-50
- abilityToPlaySpinBall: 30-50
- battingAggresion: 40-60
- paceAbility: 30-50
- spinAbility: 8-15
- isWicketKeeper: false

### spin allrounder

- abilityToPlayPaceBall: 30-50
- abilityToPlaySpinBall: 30-50
- battingAggresion: 40-60
- paceAbility: 8-15
- spinAbility: 30-50
- isWicketKeeper: false

## Notes

- If an unknown player type is provided, the assignment falls back to batsman rules.
- Generated values are randomized per player within the ranges above.
- During matches, higher `battingOrderCoeff` players are placed earlier in the batting order.
