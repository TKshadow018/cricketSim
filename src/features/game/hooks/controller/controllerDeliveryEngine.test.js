import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { buildInitialInnings } from '../../gameSlice';
import { createBattingStats, createBowlingStats } from '../../../../utils/simulatorUtils';
import { announceTarget, ballByBallCommentry } from '../../../../utils/speechUtils';
import { canUseSpecialBall, canUseSuperShot, resolveOutcome } from '../../utils/controllerOutcomeUtils';
import { processDelivery } from './controllerDeliveryEngine';

jest.mock('../../utils/controllerOutcomeUtils', () => ({
  canUseSpecialBall: jest.fn(),
  canUseSuperShot: jest.fn(),
  resolveOutcome: jest.fn(),
}));

jest.mock('../../../../utils/speechUtils', () => ({
  announceTarget: jest.fn(),
  ballByBallCommentry: jest.fn(),
}));

const battingSide = Array.from({ length: 11 }, (_, index) => ({
  id: `bat-${index}`,
  name: `Batter ${index}`,
  abilityToPlayPaceBall: 85,
  abilityToPlaySpinBall: 80,
  battingOrderCoeff: 100 - index,
}));
const bowlingSide = Array.from({ length: 6 }, (_, index) => ({
  id: `bowl-${index}`,
  name: `Bowler ${index}`,
  paceAbility: 70 + index,
  spinAbility: 20,
}));

const makeInnings = (overrides = {}) => ({
  ...buildInitialInnings(),
  strikerIndex: 0,
  nonStrikerIndex: 1,
  nextBatterIndex: 2,
  battingOrderIndices: [0, 1],
  currentBowlerIndex: 0,
  battingStats: createBattingStats(battingSide),
  bowlingStats: createBowlingStats(bowlingSide),
  ...overrides,
});

const makeProps = (overrides = {}) => ({
  isFirstInnings: true,
  firstInnings: makeInnings(),
  secondInnings: makeInnings(),
  getContext: jest.fn(() => ({
    isOwnBatting: true,
    isUserBatting: true,
    isUserBowling: false,
    battingSide,
    bowlingSide,
  })),
  matchType: { over: 20 },
  maxBalls: 120,
  battingIntent: battingAction.normal,
  bowlingIntent: bowlingAction.normal,
  ownSanitizedRoles: {},
  opponentSanitizedRoles: {},
  ownTeam: 'Team A',
  opponentTeam: 'Team B',
  matchCondition: { weather: 'sunny', pitch: 'sporting', outfield: 'fastAndHard' },
  matchTypeKey: 't20',
  locationCountry: '',
  dispatch: jest.fn(),
  setBattingIntentAction: jest.fn((payload) => ({ type: 'batting-intent', payload })),
  setBowlingIntentAction: jest.fn((payload) => ({ type: 'bowling-intent', payload })),
  setFirstInnings: jest.fn(),
  setSecondInnings: jest.fn(),
  firstInningsScore: 100,
  setStageAction: jest.fn((payload) => ({ type: 'stage', payload })),
  ...overrides,
});

describe('processDelivery guards and bowler selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveOutcome.mockReturnValue({
      token: '1',
      runs: 1,
      extraRuns: 0,
      isWicket: false,
      isLegalDelivery: true,
    });
    ballByBallCommentry.mockReturnValue('Test delivery commentary.');
    canUseSpecialBall.mockReturnValue(true);
    canUseSuperShot.mockReturnValue(true);
  });

  test('does nothing without teams or while the innings waits for player selections', () => {
    const noTeams = makeProps({
      getContext: jest.fn(() => ({
        isOwnBatting: true,
        isUserBatting: true,
        isUserBowling: false,
        battingSide: [],
        bowlingSide,
      })),
    });
    processDelivery(noTeams);
    expect(noTeams.setFirstInnings).not.toHaveBeenCalled();

    const waiting = makeProps({ firstInnings: makeInnings({ waitingForNextBatter: true }) });
    processDelivery(waiting);
    expect(waiting.setFirstInnings).not.toHaveBeenCalled();
    expect(resolveOutcome).not.toHaveBeenCalled();

    const needsOpeners = makeProps({ firstInnings: makeInnings({ needsOpeners: true }) });
    processDelivery(needsOpeners);
    expect(needsOpeners.setFirstInnings).not.toHaveBeenCalled();
  });

  test('ends a first innings already at its limit and ends an all-out second innings', () => {
    const first = makeProps({ firstInnings: makeInnings({ balls: 120 }) });
    processDelivery(first);
    expect(first.dispatch).toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.TeamTwoBat });

    const second = makeProps({
      isFirstInnings: false,
      secondInnings: makeInnings({ wickets: 10 }),
    });
    processDelivery(second);
    expect(second.dispatch).toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.MatchEnd });
  });

  test('waits for a user-selected bowler after the assigned bowler reaches the quota', () => {
    const props = makeProps({
      firstInnings: makeInnings({
        bowlingStats: bowlingSide.map((_, index) => ({ balls: index === 0 ? 24 : 0, runsConceded: 0, wickets: 0 })),
      }),
      matchType: { over: 20 },
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(props);
    expect(props.setFirstInnings).toHaveBeenCalledWith(
      expect.objectContaining({
        waitingForNextBowler: true,
        currentBowlerIndex: null,
        lastEvent: 'Selected bowler reached over limit. Choose another bowler.',
      })
    );
    expect(resolveOutcome).not.toHaveBeenCalled();

    const secondInnings = makeProps({
      isFirstInnings: false,
      secondInnings: makeInnings({
        bowlingStats: bowlingSide.map((_, index) => ({ balls: index === 0 ? 24 : 0, runsConceded: 0, wickets: 0 })),
      }),
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(secondInnings);
    expect(secondInnings.setSecondInnings).toHaveBeenCalledWith(
      expect.objectContaining({
        waitingForNextBowler: true,
        currentBowlerIndex: null,
      })
    );
  });

  test('selects a replacement computer bowler at the over limit and safely returns when none exists', () => {
    const props = makeProps({
      firstInnings: makeInnings({
        bowlingStats: bowlingSide.map((_, index) => ({ balls: index === 0 ? 24 : 0, runsConceded: 0, wickets: 0 })),
      }),
      matchType: { over: 20 },
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: false,
        battingSide,
        bowlingSide,
      })),
    });
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    processDelivery(props);
    expect(resolveOutcome).toHaveBeenCalledWith(expect.objectContaining({ bowler: bowlingSide[1] }));
    expect(props.setFirstInnings).toHaveBeenCalled();
    random.mockRestore();

    const noAssignedBowler = makeProps({
      firstInnings: makeInnings({ currentBowlerIndex: null }),
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });
    resolveOutcome.mockClear();
    processDelivery(noAssignedBowler);
    expect(resolveOutcome).not.toHaveBeenCalled();
    expect(noAssignedBowler.setFirstInnings).not.toHaveBeenCalled();

    const invalidBowler = makeProps({
      firstInnings: makeInnings({ currentBowlerIndex: 99 }),
      getContext: jest.fn(() => ({
        isOwnBatting: true,
        isUserBatting: true,
        isUserBowling: false,
        battingSide,
        bowlingSide: bowlingSide.map((player) => ({ ...player, isWicketKeeper: true })),
      })),
    });
    processDelivery(invalidBowler);
    expect(resolveOutcome).not.toHaveBeenCalled();
    expect(invalidBowler.setFirstInnings).not.toHaveBeenCalled();
  });

  test('uses fallback player stats and the last eligible spin bowler on an invalid assignment', () => {
    const spinBowlingSide = bowlingSide.map((player) => ({
      ...player,
      paceAbility: 20,
      spinAbility: 80,
    }));
    const props = makeProps({
      firstInnings: makeInnings({
        currentBowlerIndex: 99,
        lastOverBowlerIndex: 0,
        battingStats: [],
        bowlingStats: [],
        battingOrderIndices: null,
      }),
      getContext: jest.fn(() => ({
        isOwnBatting: true,
        isUserBatting: false,
        isUserBowling: false,
        battingSide,
        bowlingSide: spinBowlingSide,
      })),
    });
    resolveOutcome.mockReturnValue({
      token: '2',
      runs: 2,
      extraRuns: 0,
      isWicket: false,
      isLegalDelivery: true,
    });
    ballByBallCommentry.mockReturnValue('');
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);

    processDelivery(props);

    expect(resolveOutcome).toHaveBeenCalledWith(expect.objectContaining({ bowler: spinBowlingSide[1] }));
    expect(props.setFirstInnings).toHaveBeenCalledWith(expect.objectContaining({
      score: 2,
      balls: 1,
      battingOrderIndices: [],
      battingStats: expect.arrayContaining([expect.objectContaining({ runs: 2, balls: 1 })]),
      bowlingStats: expect.arrayContaining([expect.objectContaining({ balls: 1, runsConceded: 2 })]),
    }));
    expect(props.dispatch).not.toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.MatchEnd });
    random.mockRestore();
  });

  test('selects a computer bowler when the computer has no current assignment', () => {
    const props = makeProps({
      firstInnings: makeInnings({ currentBowlerIndex: null }),
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: false,
        battingSide,
        bowlingSide,
      })),
    });
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);

    processDelivery(props);

    expect(resolveOutcome).toHaveBeenCalledWith(expect.objectContaining({ bowler: bowlingSide[0] }));
    expect(props.setFirstInnings).toHaveBeenCalled();
    random.mockRestore();
  });
});

describe('processDelivery scoring and dismissal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveOutcome.mockReturnValue({
      token: '1',
      runs: 1,
      extraRuns: 0,
      isWicket: false,
      isLegalDelivery: true,
    });
    ballByBallCommentry.mockReturnValue('Test delivery commentary.');
    canUseSpecialBall.mockReturnValue(true);
    canUseSuperShot.mockReturnValue(true);
  });

  test('updates a run delivery, rotates the strike, advances super-shot progress, and clears a free hit', () => {
    const innings = makeInnings({
      balls: 4,
      score: 10,
      freeHitArmed: true,
      battingStats: createBattingStats(battingSide),
      bowlingStats: createBowlingStats(bowlingSide),
    });
    innings.battingStats[0].superShotPaceProgress = 4;
    const props = makeProps({
      firstInnings: innings,
      battingIntent: battingAction.normal,
    });

    processDelivery(props);
    const next = props.setFirstInnings.mock.calls[0][0];
    expect(next).toMatchObject({
      score: 11,
      balls: 5,
      strikerIndex: 1,
      nonStrikerIndex: 0,
      freeHitArmed: false,
      lastEvent: 'Test delivery commentary.',
    });
    expect(next.battingStats[0]).toMatchObject({
      runs: 1,
      balls: 1,
      superShotPaceUnlocked: 1,
      superShotPaceProgress: 0,
    });
    expect(next.bowlingStats[0]).toMatchObject({ balls: 1, runsConceded: 1 });
    expect(next.commentary[0]).toContain('Test delivery commentary.');
  });

  test('records wides and no-balls as extras, carries free hits, and charges special-ball use', () => {
    resolveOutcome.mockReturnValueOnce({
      token: 'wide',
      runs: 0,
      extraRuns: 1,
      isWicket: false,
      isLegalDelivery: false,
    });
    const wideProps = makeProps({
      bowlingIntent: bowlingAction.specialBowl,
      getContext: jest.fn(() => ({
        isOwnBatting: true,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(wideProps);
    expect(wideProps.setFirstInnings.mock.calls[0][0]).toMatchObject({
      score: 1,
      balls: 0,
      wides: 1,
      specialBallUsedInOver: 1,
      specialBallUsedMatch: 1,
    });

    resolveOutcome.mockReturnValueOnce({
      token: 'nb',
      runs: 0,
      extraRuns: 1,
      isWicket: false,
      isLegalDelivery: false,
    });
    const noBallProps = makeProps({
      bowlingIntent: bowlingAction.specialBowl,
      getContext: jest.fn(() => ({
        isOwnBatting: true,
        isUserBatting: true,
        isUserBowling: false,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(noBallProps);
    expect(noBallProps.setFirstInnings.mock.calls[0][0]).toMatchObject({
      score: 1,
      balls: 0,
      noBalls: 1,
      freeHitArmed: true,
      specialBallUsedInOver: 0,
    });
    expect(noBallProps.dispatch).toHaveBeenCalledWith({ type: 'batting-intent', payload: battingAction.freeHit });

    resolveOutcome.mockReturnValueOnce({
      token: 'nb',
      runs: 0,
      extraRuns: 1,
      isWicket: false,
      isLegalDelivery: false,
    });
    const bowlerNoBallProps = makeProps({
      bowlingIntent: bowlingAction.specialBowl,
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(bowlerNoBallProps);
    expect(bowlerNoBallProps.setFirstInnings.mock.calls[0][0]).toMatchObject({
      noBalls: 1,
      freeHitArmed: true,
      specialBallUsedInOver: 1,
      specialBallUsedMatch: 1,
    });
  });

  test('clears a selected free-hit action after a legal delivery', () => {
    const props = makeProps({
      battingIntent: battingAction.freeHit,
      firstInnings: makeInnings({ freeHitArmed: false }),
    });
    processDelivery(props);
    expect(props.dispatch).toHaveBeenCalledWith({ type: 'batting-intent', payload: battingAction.normal });
  });

  test('queues a user-selected next batter after a wicket and can finish the innings all out', () => {
    resolveOutcome.mockReturnValue({
      token: 'W',
      runs: 0,
      extraRuns: 0,
      isWicket: true,
      isLegalDelivery: true,
    });
    const userDismissal = makeProps({
      getContext: jest.fn(() => ({
        isOwnBatting: true,
        isUserBatting: true,
        isUserBowling: false,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(userDismissal);
    expect(userDismissal.setFirstInnings.mock.calls[0][0]).toMatchObject({
      wickets: 1,
      strikerIndex: null,
      nonStrikerIndex: 1,
      nextBatterIndex: 2,
      waitingForNextBatter: true,
      outBatterIndices: [0],
      bowlingStats: expect.arrayContaining([expect.objectContaining({ wickets: 1 })]),
    });

    const allOut = makeProps({
      firstInnings: makeInnings({ wickets: 9 }),
      maxBalls: 120,
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(allOut);
    expect(allOut.setFirstInnings.mock.calls[0][0]).toMatchObject({ wickets: 10, strikerIndex: null });
    expect(announceTarget).toHaveBeenCalledWith('Team A', 0);
    expect(allOut.dispatch).toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.TeamTwoBat });
  });

  test('awards a computer batter immediately and ends a completed second-innings chase', () => {
    resolveOutcome.mockReturnValue({
      token: 'W',
      runs: 0,
      extraRuns: 0,
      isWicket: true,
      isLegalDelivery: true,
    });
    const computerDismissal = makeProps({
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: false,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(computerDismissal);
    expect(computerDismissal.setFirstInnings.mock.calls[0][0]).toMatchObject({
      wickets: 1,
      strikerIndex: 2,
      waitingForNextBatter: false,
      battingOrderIndices: [0, 1, 2],
    });

    const existingOrder = makeProps({
      firstInnings: makeInnings({ battingOrderIndices: [0, 1, 2] }),
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: false,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(existingOrder);
    expect(existingOrder.setFirstInnings.mock.calls[0][0].battingOrderIndices).toEqual([0, 1, 2]);

    resolveOutcome.mockReturnValue({
      token: '4',
      runs: 4,
      extraRuns: 0,
      isWicket: false,
      isLegalDelivery: true,
    });
    const chase = makeProps({
      isFirstInnings: false,
      secondInnings: makeInnings({ score: 98 }),
      firstInningsScore: 100,
      getContext: jest.fn(() => ({
        isOwnBatting: true,
        isUserBatting: true,
        isUserBowling: false,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(chase);
    expect(chase.setSecondInnings.mock.calls[0][0]).toMatchObject({ score: 102 });
    expect(chase.dispatch).toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.MatchEnd });
  });

  test('counts special actions when a wicket ends a super-shot or special-ball delivery', () => {
    resolveOutcome.mockReturnValue({
      token: 'W',
      runs: 0,
      extraRuns: 0,
      isWicket: true,
      isLegalDelivery: true,
    });
    const superShotWicket = makeProps({ battingIntent: battingAction.superShot });
    processDelivery(superShotWicket);
    expect(superShotWicket.setFirstInnings.mock.calls[0][0]).toMatchObject({
      superShotUsedInOver: 1,
      superShotUsedMatch: 1,
      battingStats: expect.arrayContaining([expect.objectContaining({ superShotPaceUsed: 1 })]),
    });

    const specialBallWicket = makeProps({
      bowlingIntent: bowlingAction.specialBowl,
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(specialBallWicket);
    expect(specialBallWicket.setFirstInnings.mock.calls[0][0]).toMatchObject({
      specialBallUsedInOver: 1,
      specialBallUsedMatch: 1,
      specialBallBonus: 1,
    });
  });

  test('waits for the user to select a replacement after a wicket', () => {
    resolveOutcome.mockReturnValueOnce({
      token: 'W',
      runs: 0,
      extraRuns: 0,
      isWicket: true,
      isLegalDelivery: true,
    });
    const props = makeProps({
      getContext: jest.fn(() => ({
        isOwnBatting: true,
        isUserBatting: true,
        isUserBowling: false,
        battingSide,
        bowlingSide,
      })),
    });

    processDelivery(props);

    expect(props.setFirstInnings.mock.calls[0][0]).toMatchObject({
      strikerIndex: null,
      nextBatterIndex: 2,
      waitingForNextBatter: true,
    });
  });

  test('uses unnamed-player fallbacks for wides and exhausted batting lineups', () => {
    const unnamedBatters = [{ id: 'batter-1' }, { id: 'batter-2' }];
    const unnamedBowlers = [{ id: 'bowler-1', paceAbility: 0, spinAbility: 0 }];
    const wide = makeProps({
      firstInnings: makeInnings({ battingStats: [], bowlingStats: [] }),
      getContext: jest.fn(() => ({
        isOwnBatting: true,
        isUserBatting: false,
        isUserBowling: true,
        battingSide: unnamedBatters,
        bowlingSide: unnamedBowlers,
      })),
    });
    resolveOutcome.mockReturnValueOnce({
      token: 'wide',
      runs: 0,
      extraRuns: 1,
      isWicket: false,
      isLegalDelivery: false,
    });
    processDelivery(wide);
    expect(wide.setFirstInnings.mock.calls[0][0].lastEvent).toBe('Batsman leaves it. Wide ball signaled.');

    const noBall = makeProps({
      firstInnings: makeInnings({ battingStats: [], bowlingStats: [] }),
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide: unnamedBatters,
        bowlingSide: unnamedBowlers,
      })),
    });
    resolveOutcome.mockReturnValueOnce({
      token: 'nb',
      runs: 0,
      extraRuns: 1,
      isWicket: false,
      isLegalDelivery: false,
    });
    processDelivery(noBall);
    expect(noBall.setFirstInnings.mock.calls[0][0].lastEvent).toBe(
      'Bowler oversteps. No ball and free hit next.'
    );

    const wicket = makeProps({
      firstInnings: makeInnings({ wickets: 9, battingStats: [], bowlingStats: [] }),
      bowlingIntent: bowlingAction.specialBowl,
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide: unnamedBatters,
        bowlingSide: unnamedBowlers,
      })),
    });
    resolveOutcome.mockReturnValueOnce({
      token: 'W',
      runs: 0,
      extraRuns: 0,
      isWicket: true,
      isLegalDelivery: true,
    });
    ballByBallCommentry.mockReturnValueOnce('');
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);

    processDelivery(wicket);

    expect(wicket.setFirstInnings.mock.calls[0][0]).toMatchObject({
      wickets: 10,
      strikerIndex: null,
      outBatterIndices: [0],
      specialBallUsedInOver: 1,
      specialBallUsedMatch: 1,
      specialBallBonus: 1,
    });
    expect(wicket.setFirstInnings.mock.calls[0][0].lastEvent).toContain('Out!');
    expect(wicket.setFirstInnings.mock.calls[0][0].battingStats[0].outByBowler).toBe('Unknown');
    random.mockRestore();
  });
});

describe('processDelivery over transitions and intent cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveOutcome.mockReturnValue({
      token: '0',
      runs: 0,
      extraRuns: 0,
      isWicket: false,
      isLegalDelivery: true,
    });
    ballByBallCommentry.mockReturnValue('');
    canUseSpecialBall.mockReturnValue(false);
    canUseSuperShot.mockReturnValue(false);
  });

  test('finishes an over, requests a user bowler, and resets per-over allowances', () => {
    const innings = makeInnings({
      balls: 5,
      superShotUsedInOver: 1,
      specialBallUsedInOver: 1,
      completedOverBowlerIndices: null,
    });
    const props = makeProps({
      firstInnings: innings,
      battingIntent: battingAction.normal,
      bowlingIntent: bowlingAction.specialBowl,
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(props);
    const next = props.setFirstInnings.mock.calls[0][0];
    expect(next).toMatchObject({
      balls: 6,
      waitingForNextBowler: true,
      currentBowlerIndex: null,
      lastOverBowlerIndex: 0,
      completedOverBowlerIndices: [0],
      superShotUsedInOver: 0,
      specialBallUsedInOver: 0,
    });
    expect(canUseSpecialBall).toHaveBeenCalledWith(expect.objectContaining({ bowler: bowlingSide[0] }));
    expect(props.dispatch).toHaveBeenCalledWith({ type: 'bowling-intent', payload: bowlingAction.normal });
  });

  test('continues without requesting a bowler when the bowling side has none eligible', () => {
    const wicketkeepers = bowlingSide.map((player) => ({ ...player, isWicketKeeper: true }));
    const props = makeProps({
      firstInnings: makeInnings({ balls: 5 }),
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide: wicketkeepers,
      })),
    });
    processDelivery(props);
    expect(props.setFirstInnings.mock.calls[0][0]).toMatchObject({
      balls: 6,
      waitingForNextBowler: false,
      currentBowlerIndex: null,
      completedOverBowlerIndices: [0],
    });
  });

  test('validates a user special ball against the bowler retained in the next state', () => {
    const props = makeProps({
      bowlingIntent: bowlingAction.specialBowl,
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });
    canUseSpecialBall.mockReturnValue(false);

    processDelivery(props);

    expect(canUseSpecialBall).toHaveBeenCalledWith(expect.objectContaining({
      bowler: bowlingSide[0],
    }));
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'bowling-intent',
      payload: bowlingAction.normal,
    });
  });

  test('falls back to the prior bowler after an over requests a new user selection', () => {
    const props = makeProps({
      firstInnings: makeInnings({ balls: 5, currentBowlerIndex: 2 }),
      bowlingIntent: bowlingAction.specialBowl,
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });

    processDelivery(props);

    expect(props.setFirstInnings.mock.calls[0][0].currentBowlerIndex).toBeNull();
    expect(canUseSpecialBall).toHaveBeenCalledWith(expect.objectContaining({
      bowler: bowlingSide[2],
    }));
  });

  test('selects a computer bowler after an over and clears exhausted user actions', () => {
    const innings = makeInnings({ balls: 5 });
    const props = makeProps({
      firstInnings: innings,
      battingIntent: battingAction.superShot,
      bowlingIntent: bowlingAction.specialBowl,
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: true,
        isUserBowling: false,
        battingSide,
        bowlingSide,
      })),
    });
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    processDelivery(props);
    const next = props.setFirstInnings.mock.calls[0][0];
    expect(next.currentBowlerIndex).toBe(1);
    expect(next.waitingForNextBowler).toBe(false);
    expect(props.dispatch).toHaveBeenCalledWith({ type: 'batting-intent', payload: battingAction.normal });
    random.mockRestore();
  });

  test('announces a first-innings target and ends the chase at the ball limit', () => {
    const firstInnings = makeProps({
      firstInnings: makeInnings({ balls: 119, score: 50 }),
      maxBalls: 120,
      getContext: jest.fn(() => ({
        isOwnBatting: true,
        isUserBatting: false,
        isUserBowling: false,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(firstInnings);
    expect(announceTarget).toHaveBeenCalledWith('Team B', 50);
    expect(firstInnings.dispatch).toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.TeamTwoBat });

    resolveOutcome.mockReturnValue({
      token: '0',
      runs: 0,
      extraRuns: 0,
      isWicket: false,
      isLegalDelivery: true,
    });
    const chase = makeProps({
      isFirstInnings: false,
      secondInnings: makeInnings({ balls: 119, score: 50 }),
      maxBalls: 120,
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });
    processDelivery(chase);
    expect(chase.dispatch).toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.MatchEnd });
  });

  test('keeps the chase live below the target and resets an already-full super-shot unlock', () => {
    const overInnings = makeInnings({
      battingStats: createBattingStats(battingSide),
    });
    overInnings.battingStats[0].superShotPaceUnlocked = 5;
    overInnings.battingStats[0].superShotPaceProgress = 4;
    const unlockProps = makeProps({ firstInnings: overInnings });
    resolveOutcome.mockReturnValueOnce({
      token: '1',
      runs: 1,
      extraRuns: 0,
      isWicket: false,
      isLegalDelivery: true,
    });
    processDelivery(unlockProps);
    expect(unlockProps.setFirstInnings.mock.calls[0][0].battingStats[0]).toMatchObject({
      superShotPaceUnlocked: 5,
      superShotPaceProgress: 0,
    });

    const liveChase = makeProps({
      isFirstInnings: false,
      secondInnings: makeInnings({ score: 20 }),
      firstInningsScore: 100,
    });
    resolveOutcome.mockReturnValueOnce({
      token: '0',
      runs: 0,
      extraRuns: 0,
      isWicket: false,
      isLegalDelivery: true,
    });
    processDelivery(liveChase);
    expect(liveChase.setSecondInnings).toHaveBeenCalled();
    expect(liveChase.dispatch).not.toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.MatchEnd });
  });
});
