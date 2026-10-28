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
  setBowlingTacticsAction: jest.fn((payload) => ({ type: 'bowling-tactics', payload })),
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

  test('passes the pending bowling call to resolution, records the delivery, and consumes special once', () => {
    const bowlingTactics = {
      overPlan: 'attack',
      fieldPreset: 'attacking',
      line: 'outside',
      length: 'yorker',
      variation: 'slower',
      specialDeliveryArmed: true,
    };
    const props = makeProps({
      bowlingIntent: bowlingAction.normal,
      bowlingTactics,
      getContext: jest.fn(() => ({
        isOwnBatting: false,
        isUserBatting: false,
        isUserBowling: true,
        battingSide,
        bowlingSide,
      })),
    });

    processDelivery(props);

    expect(resolveOutcome).toHaveBeenCalledWith(expect.objectContaining({
      bowlingTactics: expect.objectContaining(bowlingTactics),
      isUserBowling: true,
    }));
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'bowling-tactics',
      payload: { specialDeliveryArmed: false },
    });
    expect(props.setFirstInnings.mock.calls[0][0].ballHistory).toEqual([
      expect.objectContaining({
        overNumber: 1,
        ballNumber: 1,
        token: '1',
        bowler: 'Bowler 0',
        striker: 'Batter 0',
        tactics: {
          overPlan: 'attack',
          fieldPreset: 'attacking',
          line: 'outside',
          length: 'yorker',
          variation: 'slower',
        },
        specialDelivery: true,
      }),
    ]);
  });

  test('passes batting tactics to resolution, records the shot, and resets one-ball choices', () => {
    const battingTactics = {
      approach: 'attack',
      shot: 'loft',
      target: 'leg',
      retainShotAndTarget: false,
    };
    const props = makeProps({
      battingTactics,
      setBattingTacticsAction: jest.fn((payload) => ({ type: 'batting-tactics', payload })),
    });

    processDelivery(props);

    expect(resolveOutcome).toHaveBeenCalledWith(expect.objectContaining({ battingTactics }));
    expect(props.setFirstInnings.mock.calls[0][0].ballHistory[0]).toMatchObject({
      battingTactics: { approach: 'attack', shot: 'loft', target: 'leg' },
      specialShot: false,
    });
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'batting-tactics',
      payload: { shot: 'rotate', target: 'straight' },
    });
  });
});
