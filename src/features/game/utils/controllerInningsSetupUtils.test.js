import {
  getBestEligibleBowlerIndex,
  selectComputerBowler,
} from './controllerInningsSetupUtils';

const makeBowler = (pace, spin, isWicketKeeper = false) => ({ paceAbility: pace, spinAbility: spin, isWicketKeeper });

describe('getBestEligibleBowlerIndex', () => {
  it('returns index of highest-ability eligible bowler', () => {
    const players = [
      makeBowler(20, 20),  // not eligible (both < 30)
      makeBowler(70, 50),  // eligible, score 120
      makeBowler(80, 60),  // eligible, score 140 – best
    ];
    expect(getBestEligibleBowlerIndex(players)).toBe(2);
  });

  it('returns null when no eligible bowlers exist', () => {
    const players = [makeBowler(20, 10), makeBowler(25, 15)];
    expect(getBestEligibleBowlerIndex(players)).toBeNull();
  });

  it('excludes the specified index and returns next best', () => {
    const players = [
      makeBowler(50, 40), // eligible, score 90
      makeBowler(80, 70), // eligible, score 150 – best
    ];
    expect(getBestEligibleBowlerIndex(players, 1)).toBe(0);
  });

  it('still returns best if exclude index has no alternative', () => {
    const players = [makeBowler(70, 60)]; // only one eligible
    expect(getBestEligibleBowlerIndex(players, 0)).toBe(0);
  });

  it('ignores wicket keepers even with high ability', () => {
    const players = [
      makeBowler(90, 90, true), // keeper, ineligible
      makeBowler(40, 30, false), // eligible
    ];
    expect(getBestEligibleBowlerIndex(players)).toBe(1);
  });

  it('returns null for an empty player list', () => {
    expect(getBestEligibleBowlerIndex([])).toBeNull();
  });
});

describe('selectComputerBowler', () => {
  const makeInningState = (lastOverBowlerIndex = null, bowlingStats = [], completedOverBowlerIndices = []) => ({
    lastOverBowlerIndex,
    bowlingStats,
    completedOverBowlerIndices,
  });

  const eligibleBowlingSide = [
    makeBowler(60, 40),
    makeBowler(50, 35),
    makeBowler(30, 70),
  ];

  it('returns a valid bowler index for the first over', () => {
    const inningState = makeInningState(null, eligibleBowlingSide.map(() => ({ balls: 0 })));
    const result = selectComputerBowler({ inningState, bowlingSide: eligibleBowlingSide, previousBowlerIndex: null, overs: 20 });
    expect(result).not.toBeNull();
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(eligibleBowlingSide.length);
  });

  it('does not select the previous over bowler', () => {
    const inningState = makeInningState(0, eligibleBowlingSide.map(() => ({ balls: 0 })), [0]);
    // Run several times to confirm randomness is constrained
    for (let i = 0; i < 20; i += 1) {
      const result = selectComputerBowler({ inningState, bowlingSide: eligibleBowlingSide, previousBowlerIndex: 0, overs: 20 });
      expect(result).not.toBe(0);
    }
  });

  it('returns null when no eligible bowlers are available', () => {
    const ineligibleSide = [makeBowler(10, 10), makeBowler(5, 5)];
    const inningState = makeInningState(null, ineligibleSide.map(() => ({ balls: 0 })));
    const result = selectComputerBowler({ inningState, bowlingSide: ineligibleSide, previousBowlerIndex: null, overs: 20 });
    expect(result).toBeNull();
  });

  it('picks from under-limit bowlers when everyone has bowled', () => {
    // maxOversPerBowler for 20 overs = 4. Give 2 bowlers 24 balls (=4 overs) and 1 bowler 0 balls.
    const bowlingStats = [{ balls: 24 }, { balls: 24 }, { balls: 0 }];
    const inningState = makeInningState(0, bowlingStats, [0, 1, 0, 1]);
    const result = selectComputerBowler({ inningState, bowlingSide: eligibleBowlingSide, previousBowlerIndex: 1, overs: 20 });
    expect(result).toBe(2);
  });
});
