import { getEligibleBowlerIndices, getNextBatterIndex, getTopOpenerIndices, isEligibleBowler } from './simulatorUtils';

describe('bowler eligibility', () => {
  test('keeps the default threshold when it already yields at least six bowlers', () => {
    const players = [
      { name: 'P1', paceAbility: 45, spinAbility: 10 },
      { name: 'P2', paceAbility: 20, spinAbility: 35 },
      { name: 'P3', paceAbility: 39, spinAbility: 5 },
      { name: 'P4', paceAbility: 15, spinAbility: 31 },
      { name: 'P5', paceAbility: 30, spinAbility: 0 },
      { name: 'P6', paceAbility: 0, spinAbility: 30 },
      { name: 'P7', paceAbility: 29, spinAbility: 12 },
      { name: 'P8', paceAbility: 18, spinAbility: 28 },
    ];

    expect(getEligibleBowlerIndices(players)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(isEligibleBowler(players[6])).toBe(false);
  });

  test('expands eligibility to the six strongest non-wicketkeepers when the default threshold yields too few', () => {
    const players = [
      { name: 'WK', paceAbility: 50, spinAbility: 40, isWicketKeeper: true },
      { name: 'P1', paceAbility: 29, spinAbility: 8 },
      { name: 'P2', paceAbility: 28, spinAbility: 0 },
      { name: 'P3', paceAbility: 10, spinAbility: 27 },
      { name: 'P4', paceAbility: 35, spinAbility: 5 },
      { name: 'P5', paceAbility: 12, spinAbility: 26 },
      { name: 'P6', paceAbility: 24, spinAbility: 0 },
      { name: 'P7', paceAbility: 0, spinAbility: 23 },
      { name: 'P8', paceAbility: 16, spinAbility: 0 },
    ];

    expect(getEligibleBowlerIndices(players)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(isEligibleBowler(players[1])).toBe(false);
    expect(isEligibleBowler(players[4])).toBe(true);
  });
});

describe('batting order coefficient priority', () => {
  test('chooses openers by battingOrderCoeff first', () => {
    const players = [
      { name: 'A', battingOrderCoeff: 20, battingAggresion: 99, abilityToPlayPaceBall: 99, abilityToPlaySpinBall: 99 },
      { name: 'B', battingOrderCoeff: 95, battingAggresion: 40, abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40 },
      { name: 'C', battingOrderCoeff: 88, battingAggresion: 50, abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 50 },
    ];

    expect(getTopOpenerIndices(players)).toEqual([1, 2]);
  });

  test('picks next batter by highest available battingOrderCoeff', () => {
    const players = [
      { name: 'A', battingOrderCoeff: 65 },
      { name: 'B', battingOrderCoeff: 92 },
      { name: 'C', battingOrderCoeff: 77 },
      { name: 'D', battingOrderCoeff: 40 },
    ];

    expect(getNextBatterIndex(players, [1], [2])).toBe(0);
  });
});