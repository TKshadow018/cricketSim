import {
  buildPreparedInnings,
  getBestEligibleBowlerIndex,
  selectComputerBowler,
} from './controllerInningsSetupUtils';

const buildBowlers = (paceAbility = 60, spinAbility = 10) =>
  Array.from({ length: 6 }, (_, index) => ({
    id: `bowler-${index}`,
    paceAbility: paceAbility + index,
    spinAbility,
  }));

const buildInningsState = (bowlers, overrides = {}) => ({
  completedOverBowlerIndices: [],
  bowlingStats: bowlers.map(() => ({ balls: 0 })),
  ...overrides,
});

describe('eligible bowler selection', () => {
  test('ranks eligible bowlers and handles missing alternatives', () => {
    expect(getBestEligibleBowlerIndex()).toBeNull();
    expect(getBestEligibleBowlerIndex([{ isWicketKeeper: true, paceAbility: 100 }])).toBeNull();
    const bowlers = [
      ...buildBowlers(30, 10),
      { paceAbility: 10, spinAbility: 90 },
    ];
    expect(getBestEligibleBowlerIndex(bowlers)).toBe(6);
    expect(getBestEligibleBowlerIndex(bowlers, 6)).toBe(5);
    expect(getBestEligibleBowlerIndex(bowlers.slice(0, 6), 0)).toBe(5);
    expect(getBestEligibleBowlerIndex([{ playerType: 'bowler', paceAbility: 10, spinAbility: 20 }], 0)).toBe(0);
    expect(getBestEligibleBowlerIndex([{ playerType: 'bowler' }, { playerType: 'bowler' }])).toBe(0);
  });
});

describe('computer over selection', () => {
  afterEach(() => jest.restoreAllMocks());

  test('prefers pace for the opening over and falls back to the strongest eligible option', () => {
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    const paceBowlers = buildBowlers();
    expect(
      selectComputerBowler({
        inningState: buildInningsState(paceBowlers),
        bowlingSide: paceBowlers,
        previousBowlerIndex: null,
        overs: 20,
      })
    ).toBe(0);

    const spinBowlers = buildBowlers(10, 60);
    expect(
      selectComputerBowler({
        inningState: buildInningsState(spinBowlers),
        bowlingSide: spinBowlers,
        previousBowlerIndex: null,
        overs: 20,
      })
    ).toBe(0);
    random.mockRestore();
  });

  test('avoids the first over bowler in over two when alternatives exist', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const bowlers = buildBowlers();
    const selected = selectComputerBowler({
      inningState: buildInningsState(bowlers, { completedOverBowlerIndices: [0] }),
      bowlingSide: bowlers,
      previousBowlerIndex: 0,
      overs: 20,
    });
    expect(selected).toBe(1);
  });

  test('uses the only available bowler when normal rotation has no alternative', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const bowlers = buildBowlers();
    const inningState = buildInningsState(bowlers, {
      completedOverBowlerIndices: [0],
      bowlingStats: bowlers.map((_, index) => ({ balls: index === 0 ? 0 : 6 })),
    });
    expect(
      selectComputerBowler({
        inningState,
        bowlingSide: bowlers,
        previousBowlerIndex: 1,
        overs: 5,
      })
    ).toBe(0);
  });

  test('reuses the first-over bowler on an allowed third-over roll', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const bowlers = buildBowlers();
    expect(
      selectComputerBowler({
        inningState: buildInningsState(bowlers, { completedOverBowlerIndices: [0, 1] }),
        bowlingSide: bowlers,
        previousBowlerIndex: 2,
        overs: 20,
      })
    ).toBe(0);
  });

  test('rotates to an alternative on the other third-over roll and falls back if needed', () => {
    const bowlers = buildBowlers();
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    expect(
      selectComputerBowler({
        inningState: buildInningsState(bowlers, { completedOverBowlerIndices: [0, 1] }),
        bowlingSide: bowlers,
        previousBowlerIndex: 3,
        overs: 20,
      })
    ).toBe(2);

    jest.restoreAllMocks();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const onlyOneUnderLimit = buildInningsState(bowlers, {
      completedOverBowlerIndices: [0, 0],
      bowlingStats: bowlers.map((_, index) => ({ balls: index === 0 ? 0 : 6 })),
    });
    expect(
      selectComputerBowler({
        inningState: onlyOneUnderLimit,
        bowlingSide: bowlers,
        previousBowlerIndex: null,
        overs: 5,
      })
    ).toBe(0);
  });

  test('rotates the fourth bowler, tries the alternate when requested, and falls back safely', () => {
    const bowlers = buildBowlers();
    const state = buildInningsState(bowlers, { completedOverBowlerIndices: [0, 1, 2] });
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.3);
    expect(
      selectComputerBowler({
        inningState: state,
        bowlingSide: bowlers,
        previousBowlerIndex: 5,
        overs: 20,
      })
    ).toBe(1);

    jest.restoreAllMocks();
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    expect(
      selectComputerBowler({
        inningState: state,
        bowlingSide: bowlers,
        previousBowlerIndex: 5,
        overs: 20,
      })
    ).toBe(0);

    jest.restoreAllMocks();
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0);
    expect(
      selectComputerBowler({
        inningState: state,
        bowlingSide: bowlers,
        previousBowlerIndex: 5,
        overs: 20,
      })
    ).toBe(0);

    jest.restoreAllMocks();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(
      selectComputerBowler({
        inningState: buildInningsState(bowlers, { completedOverBowlerIndices: [0, 1, 2, 3] }),
        bowlingSide: bowlers,
        previousBowlerIndex: 5,
        overs: 20,
      })
    ).toBe(0);
  });

  test('returns a remaining previous bowler or null when the quota is exhausted', () => {
    const bowlers = buildBowlers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const oneRemaining = buildInningsState(bowlers, {
      bowlingStats: bowlers.map((_, index) => ({ balls: index === 0 ? 0 : 6 })),
    });

    expect(
      selectComputerBowler({
        inningState: oneRemaining,
        bowlingSide: bowlers,
        previousBowlerIndex: 0,
        overs: 5,
      })
    ).toBe(0);

    const exhausted = buildInningsState(bowlers, {
      bowlingStats: bowlers.map(() => ({ balls: 6 })),
    });
    expect(
      selectComputerBowler({
        inningState: exhausted,
        bowlingSide: bowlers,
        previousBowlerIndex: null,
        overs: 5,
      })
    ).toBeNull();
  });

  test('handles sparse bowling state, zero-ability bowlers, and a constrained fourth-over rotation', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const zeroAbilityBowler = { playerType: 'bowler', paceAbility: 0, spinAbility: 0 };
    expect(
      selectComputerBowler({
        inningState: { bowlingStats: [{ balls: 0 }] },
        bowlingSide: [zeroAbilityBowler],
        previousBowlerIndex: null,
        overs: 20,
      })
    ).toBe(0);
    expect(
      selectComputerBowler({
        inningState: { bowlingStats: [{ balls: 0 }] },
        bowlingSide: [{ playerType: 'bowler', paceAbility: 30 }],
        previousBowlerIndex: null,
        overs: 20,
      })
    ).toBe(0);

    const constrainedBowlers = buildBowlers().slice(0, 3);
    expect(
      selectComputerBowler({
        inningState: buildInningsState(constrainedBowlers, { completedOverBowlerIndices: [0, 1, 2] }),
        bowlingSide: constrainedBowlers,
        previousBowlerIndex: 0,
        overs: 20,
      })
    ).toBe(1);
  });
});

describe('prepared innings state', () => {
  afterEach(() => jest.restoreAllMocks());

  test('waits for user openers and a user-selected opening bowler', () => {
    const bowlers = buildBowlers();
    const innings = buildPreparedInnings({
      battingSide: [{}, {}, {}],
      bowlingSide: bowlers,
      isUserBatting: true,
      isUserBowling: true,
      overs: 20,
    });
    expect(innings).toMatchObject({
      needsOpeners: true,
      waitingForNextBowler: true,
      currentBowlerIndex: null,
      lastEvent: 'Choose your opening pair.',
      battingStats: [{ runs: 0 }, { runs: 0 }, { runs: 0 }],
      bowlingStats: Array.from({ length: 6 }, () => ({ balls: 0, runsConceded: 0, wickets: 0 })),
    });
  });

  test('prepares computer openers and bowler, and tolerates a bowling side with no eligible bowlers', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const battingSide = [
      { battingOrderCoeff: 50 },
      { battingOrderCoeff: 90 },
      { battingOrderCoeff: 70 },
    ];
    const bowlers = buildBowlers();
    const computerInnings = buildPreparedInnings({
      battingSide,
      bowlingSide: bowlers,
      isUserBatting: false,
      isUserBowling: false,
      overs: 20,
    });
    expect(computerInnings).toMatchObject({
      strikerIndex: 1,
      nonStrikerIndex: 2,
      battingOrderIndices: [1, 2],
      nextBatterIndex: 0,
      currentBowlerIndex: 0,
      waitingForNextBowler: false,
    });

    const userBowlingNoEligible = buildPreparedInnings({
      battingSide,
      bowlingSide: [{ isWicketKeeper: true, paceAbility: 90 }],
      isUserBatting: false,
      isUserBowling: true,
      overs: 20,
    });
    expect(userBowlingNoEligible).toMatchObject({
      waitingForNextBowler: false,
      currentBowlerIndex: null,
      lastEvent: 'Ready for first delivery.',
    });

    const computerBowlingNoEligible = buildPreparedInnings({
      battingSide,
      bowlingSide: [],
      isUserBatting: false,
      isUserBowling: false,
      overs: 20,
    });
    expect(computerBowlingNoEligible.currentBowlerIndex).toBeNull();
  });
});
