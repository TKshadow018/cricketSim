# AI Generated Player Stat Assignment

This document describes how AI-generated domestic players are assigned stats.

## Supported Player Types

- batsman [8 per team, 34.78%]
- wicketkeeper [3 per team, 13.04%]
- bowler spinner [2 per team, 8.70%]
- bowler pacer [4 per team, 17.39%]
- spin allrounder [3 per team, 13.04%]
- pace allrounder [3 per team, 13.04%]

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

- abilityToPlayPaceBall: 30-80
- abilityToPlaySpinBall: 30-80
- battingAggresion: 30-90
- paceAbility: 8-15
- spinAbility: 8-15
- isWicketKeeper: false


### bowler (Pacer / Spiner)

- abilityToPlayPaceBall: 8-15
- abilityToPlaySpinBall: 8-15
- battingAggresion: 10-80
- paceAbility: 30-80 (pace-primary) or 8-15 (spin-primary)
- spinAbility: 8-15 (pace-primary) or 30-80 (spin-primary)
- isWicketKeeper: false

### wicketkeeper

- abilityToPlayPaceBall: 35-75
- abilityToPlaySpinBall: 35-75
- battingAggresion: 40-80
- paceAbility: 8-15
- spinAbility: 8-15
- isWicketKeeper: true

### pace allrounder

- abilityToPlayPaceBall: 30-70
- abilityToPlaySpinBall: 30-70
- battingAggresion: 30-80
- paceAbility: 30-75
- spinAbility: 8-15
- isWicketKeeper: false

### spin allrounder

- abilityToPlayPaceBall: 30-70
- abilityToPlaySpinBall: 30-70
- battingAggresion: 30-80
- paceAbility: 8-15
- spinAbility: 30-75
- isWicketKeeper: false

## Notes
- Generated values are randomized per player within the ranges above.
- During matches, higher `battingOrderCoeff` players are placed earlier in the batting order.
