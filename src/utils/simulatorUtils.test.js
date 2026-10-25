import {
  battingActionList,
  bowlingActionList,
  canSelectBowler,
  canSelectNextBatter,
  createBattingStats,
  createBowlingStats,
  formatBallProgress,
  getBestBowlerIndex,
  getEligibleBowlerIndices,
  getMaxOversPerBowler,
  getNextBatterIndex,
  getOpponentDecision,
  getTopOpenerIndices,
  isEligibleBowler,
  isInningsReadyForNextBall,
  matchVisual,
  oversDisplay,
  randomFrom,
  replaceName,
  resolveResultSummary,
  stageOrder,
} from './simulatorUtils';

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

describe('match and innings helpers', () => {
  test('exposes the stage and action catalogs used by the match flow', () => {
    expect(stageOrder.length).toBeGreaterThan(10);
    expect(battingActionList.map(({ label }) => label)).toEqual([
      'Defend',
      'Normal',
      'Hit Big',
      'Super Shot',
      'Free Hit',
    ]);
    expect(bowlingActionList.map(({ label }) => label)).toEqual([
      'Normal',
      'Wicket Ball',
      'Save Run',
      'Special Bowl',
    ]);
    expect(matchVisual).toEqual({
      micro: 'MICRO',
      mini: 'MINI',
      t10: 'T10',
      t20: 'T20',
      ODI: 'ODI',
      test: 'TEST',
      practiceTestMicro: 'P-MIC',
      practiceTestMini: 'P-MIN',
    });
  });

  test('selects random items and substitutes player names with safe fallbacks', () => {
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(randomFrom(['first', 'last'])).toBe('last');
    expect(randomFrom()).toBeUndefined();
    expect(replaceName('$$$$$ runs with #####', 'Batter', 'Runner')).toBe('Batter runs with Runner');
    expect(replaceName('$$$$$ runs with #####')).toBe('Batsman runs with Runner');
    random.mockRestore();
  });

  test('returns opener defaults for empty and one-player squads and uses skill to break coefficient ties', () => {
    expect(getTopOpenerIndices()).toEqual([0, 1]);
    expect(getTopOpenerIndices([{ battingOrderCoeff: 7 }])).toEqual([0, 0]);
    expect(
      getTopOpenerIndices([
        { battingOrderCoeff: 50, battingAggresion: 10 },
        { battingOrderCoeff: 50, battingAggresion: 20 },
      ])
    ).toEqual([1, 0]);
    expect(getTopOpenerIndices([undefined, undefined])).toEqual([0, 1]);
  });

  test('chooses no batter when every squad member is out or occupying the crease', () => {
    expect(getNextBatterIndex([{ battingOrderCoeff: 80 }, { battingOrderCoeff: 70 }], [0], [1])).toBe(-1);
    expect(getNextBatterIndex([{ battingOrderCoeff: 80 }, { battingOrderCoeff: 70 }], [], [null])).toBe(0);
    expect(getNextBatterIndex([undefined])).toBe(0);
  });

  test('chooses a best bowler with empty, excluded, and single-player squads', () => {
    const players = [
      { paceAbility: 50, spinAbility: 10 },
      { paceAbility: 20, spinAbility: 70 },
    ];
    expect(getBestBowlerIndex()).toBe(0);
    expect(getBestBowlerIndex(players)).toBe(1);
    expect(getBestBowlerIndex(players, 1)).toBe(0);
    expect(getBestBowlerIndex(players.slice(0, 1), 0)).toBe(0);
    expect(getBestBowlerIndex([{}])).toBe(0);
  });

  test('uses every eligibility fallback when the squad cannot meet the bowler minimum', () => {
    expect(getEligibleBowlerIndices([{ isWicketKeeper: true, paceAbility: 100 }])).toEqual([]);
    expect(getEligibleBowlerIndices([{ paceAbility: 10 }, { spinAbility: 29 }])).toEqual([0, 1]);
    expect(getEligibleBowlerIndices([{ paceAbility: 60 }, { spinAbility: 20 }], 1)).toEqual([0]);
    expect(getEligibleBowlerIndices()).toEqual([]);
    expect(getEligibleBowlerIndices([], 0)).toEqual([]);
    expect(isEligibleBowler({ isWicketKeeper: true, paceAbility: 100 })).toBe(false);
    expect(isEligibleBowler({ spinAbility: 25 }, 25)).toBe(true);
  });

  test('calculates bowler limits, batting eligibility, and bowling eligibility', () => {
    const inningState = {
      outBatterIndices: [1],
      strikerIndex: 0,
      nonStrikerIndex: 2,
      lastOverBowlerIndex: 3,
      bowlingStats: [{ balls: 12 }, { balls: 0 }, { balls: 0 }, { balls: 0 }],
    };

    expect(getMaxOversPerBowler(20)).toBe(4);
    expect(getMaxOversPerBowler(0)).toBe(1);
    expect(canSelectNextBatter(inningState, 3)).toBe(true);
    expect(canSelectNextBatter(inningState, 1)).toBe(false);
    expect(canSelectNextBatter(inningState, 0)).toBe(false);
    expect(canSelectBowler({ inningState, bowlerIndex: 0, maxOversPerBowler: 2 })).toBe(false);
    expect(canSelectBowler({ inningState, bowlerIndex: 3, maxOversPerBowler: 2 })).toBe(false);
    expect(canSelectBowler({ inningState, bowlerIndex: 2, maxOversPerBowler: 2 })).toBe(true);
    expect(canSelectBowler({ inningState: { ...inningState, bowlingStats: [] }, bowlerIndex: 2, maxOversPerBowler: 2 })).toBe(true);
  });

  test('creates fresh batting and bowling score rows', () => {
    expect(createBattingStats([{}, {}])).toHaveLength(2);
    expect(createBattingStats()[0]).toBeUndefined();
    expect(createBowlingStats([{}])).toEqual([{ balls: 0, runsConceded: 0, wickets: 0 }]);
    expect(createBowlingStats()).toEqual([]);
  });

  test('formats balls and overs at over boundaries', () => {
    expect(formatBallProgress(0)).toBe('0.0');
    expect(formatBallProgress(7)).toBe('1.1');
    expect(oversDisplay(7)).toBe('1.1');
  });

  test('blocks deliveries whenever the innings needs user selection or has ended', () => {
    const ready = {
      balls: 0,
      wickets: 0,
      needsOpeners: false,
      waitingForNextBatter: false,
      waitingForNextBowler: false,
      strikerIndex: 0,
      nonStrikerIndex: 1,
      currentBowlerIndex: 2,
    };

    expect(isInningsReadyForNextBall(ready, 120)).toBe(true);
    expect(isInningsReadyForNextBall({ ...ready, balls: 120 }, 120)).toBe(false);
    expect(isInningsReadyForNextBall({ ...ready, wickets: 10 }, 120)).toBe(false);
    expect(isInningsReadyForNextBall({ ...ready, needsOpeners: true }, 120)).toBe(false);
    expect(isInningsReadyForNextBall({ ...ready, waitingForNextBatter: true }, 120)).toBe(false);
    expect(isInningsReadyForNextBall({ ...ready, waitingForNextBowler: true }, 120)).toBe(false);
    expect(isInningsReadyForNextBall({ ...ready, strikerIndex: null }, 120)).toBe(false);
    expect(isInningsReadyForNextBall({ ...ready, nonStrikerIndex: null }, 120)).toBe(false);
    expect(isInningsReadyForNextBall({ ...ready, currentBowlerIndex: null }, 120)).toBe(false);
  });

  test('selects an opponent decision from conditions with fallback profiles', () => {
    expect(getOpponentDecision({ pitch: 'dead', outfield: 'fastAndHard', weather: 'sunny' })).toBe('bat');
    expect(getOpponentDecision({ pitch: 'invalid', outfield: 'invalid', weather: 'stormy' })).toBe('bowl');
    expect(getOpponentDecision({ pitch: 'sporting', outfield: 'wetWithDew', weather: 'rainy' })).toBe('bat');
  });

  test('summarizes wins by wickets, runs, and ties', () => {
    expect(
      resolveResultSummary({
        firstInningsScore: 100,
        secondInningsScore: 101,
        secondInningsWickets: 3,
        firstInningsTeamName: 'A',
        secondInningsTeamName: 'B',
      })
    ).toBe('B won by 7 wickets');
    expect(
      resolveResultSummary({
        firstInningsScore: 101,
        secondInningsScore: 100,
        secondInningsWickets: 10,
        firstInningsTeamName: 'A',
        secondInningsTeamName: 'B',
      })
    ).toBe('A won by 1 runs');
    expect(
      resolveResultSummary({
        firstInningsScore: 100,
        secondInningsScore: 100,
        firstInningsTeamName: 'A',
        secondInningsTeamName: 'B',
      })
    ).toBe('The match is tied. What a thriller!');
  });
});