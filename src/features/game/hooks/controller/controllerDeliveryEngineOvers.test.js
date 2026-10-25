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
