import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { fieldSettingList } from '../../../../gameData/fieldSettingList';
import { createBattingStats, createBowlingStats } from '../../../../utils/simulatorUtils';
import { buildInitialInnings } from '../../gameState';
import { resolveOutcome } from '../../utils/controllerOutcomeUtils';
import { handleSelectNextBatter } from './controllerInningsCore';
import { processDelivery } from './controllerDeliveryEngine';

jest.mock('../../utils/controllerOutcomeUtils', () => ({
  canUseSpecialBall: jest.fn(() => false),
  canUseSuperShot: jest.fn(() => false),
  resolveOutcome: jest.fn(),
}));
jest.mock('../../../../utils/speechUtils', () => ({
  announceTarget: jest.fn(),
  ballByBallCommentry: jest.fn(() => ''),
  speak: jest.fn(),
}));

const battingSide = Array.from({ length: 11 }, (_, index) => ({
  id: `bat-${index}`,
  name: `Batter ${index}`,
  battingOrderCoeff: 100 - index,
  abilityToPlayPaceBall: 70,
  abilityToPlaySpinBall: 70,
}));
const bowlingSide = Array.from({ length: 6 }, (_, index) => ({
  id: `bowl-${index}`,
  name: `Bowler ${index}`,
  paceAbility: 70,
  spinAbility: 20,
}));

const makeInnings = (patch = {}) => ({
  ...buildInitialInnings(),
  strikerIndex: 0,
  nonStrikerIndex: 1,
  nextBatterIndex: 2,
  currentBowlerIndex: 0,
  battingOrderIndices: [0, 1],
  battingStats: createBattingStats(battingSide),
  bowlingStats: createBowlingStats(bowlingSide),
  ...patch,
});

const play = (innings, outcome, isUserBatting = true, options = {}) => {
  resolveOutcome.mockReturnValue(outcome);
  const setFirstInnings = jest.fn();
  const setSecondInnings = jest.fn();
  const isFirstInnings = options.isFirstInnings !== false;
  processDelivery({
    isFirstInnings,
    firstInnings: isFirstInnings ? innings : makeInnings(),
    secondInnings: isFirstInnings ? makeInnings() : innings,
    getContext: () => ({
      isOwnBatting: isUserBatting,
      isUserBatting,
      isUserBowling: !isUserBatting,
      battingSide,
      bowlingSide,
    }),
    matchType: options.matchType || { over: 20 },
    matchTypeKey: options.matchTypeKey || 't20',
    maxBalls: options.maxBalls || 120,
    battingIntent: battingAction.normal,
    bowlingIntent: bowlingAction.normal,
    ruleset: options.ruleset,
    battingTactics: options.battingTactics,
    bowlingTactics: options.bowlingTactics,
    ownSanitizedRoles: {},
    opponentSanitizedRoles: {},
    ownTeam: 'Batting',
    opponentTeam: 'Bowling',
    matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
    dispatch: jest.fn(),
    setBattingIntentAction: (payload) => ({ type: 'batting', payload }),
    setBowlingIntentAction: (payload) => ({ type: 'bowling', payload }),
    setBowlingTacticsAction: (payload) => ({ type: 'tactics', payload }),
    setFirstInnings,
    setSecondInnings,
    firstInningsScore: 999,
    setStageAction: (payload) => ({ type: 'stage', payload }),
  });
  return (isFirstInnings ? setFirstInnings : setSecondInnings).mock.calls[0][0];
};

const wide = { token: 'wide', runs: 0, extraRuns: 1, isWicket: false, isLegalDelivery: false };
const noBall = { token: 'nb', runs: 0, extraRuns: 1, isWicket: false, isLegalDelivery: false };
const dot = { token: '0', runs: 0, extraRuns: 0, isWicket: false, isLegalDelivery: true };
const wicket = { token: 'W', runs: 0, extraRuns: 0, isWicket: true, isLegalDelivery: true };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => jest.restoreAllMocks());

test.each([true, false])('free hits survive wides and repeated no-balls with user batting %s', (userBatting) => {
  const armed = play(makeInnings(), noBall, userBatting);
  const afterWide = play(armed, wide, userBatting);
  const afterNoBall = play(afterWide, noBall, userBatting);
  const afterLegalBall = play(afterNoBall, dot, userBatting);

  expect(armed.freeHitArmed).toBe(true);
  expect(afterWide.freeHitArmed).toBe(true);
  expect(afterNoBall.freeHitArmed).toBe(true);
  expect(afterLegalBall.freeHitArmed).toBe(false);
  expect(afterLegalBall.balls).toBe(1);
  expect(afterLegalBall.battingStats[0].balls).toBe(3);
});

test.each([true, false])('second-innings free-hit chains obey the same rules with user batting %s', (userBatting) => {
  const options = { isFirstInnings: false };
  const armed = play(makeInnings(), noBall, userBatting, options);
  const afterWide = play(armed, wide, userBatting, options);
  const afterLegal = play(afterWide, dot, userBatting, options);
  expect(afterWide.freeHitArmed).toBe(true);
  expect(afterLegal).toMatchObject({ freeHitArmed: false, balls: 1, score: 2 });
});

test('a no-ball can include bat runs and changes strike based on completed runs', () => {
  const next = play(makeInnings(), { ...noBall, runs: 1 });
  expect(next).toMatchObject({ score: 2, balls: 0, noBalls: 1, freeHitArmed: true, strikerIndex: 1 });
  expect(next.battingStats[0]).toMatchObject({ runs: 1, balls: 1 });
  expect(next.bowlingStats[0]).toMatchObject({ balls: 0, runsConceded: 2 });
  expect(next.lastEvent).toContain('1 run off the bat');
});

test('a realism Test no-ball does not arm a limited-overs free hit', () => {
  const next = play(makeInnings(), noBall, false, {
    ruleset: 'realism',
    matchTypeKey: 'test',
    matchType: { over: 90, unlimitedBowling: true },
  });
  expect(next).toMatchObject({ noBalls: 1, freeHitArmed: false });
  expect(next.lastEvent).not.toContain('free hit');
});

test.each(['bye', 'legBye'])('a %s changes strike without being charged to the bowler', (type) => {
  const next = play(makeInnings(), {
    token: type,
    runs: 0,
    extraRuns: 1,
    extras: { [type]: 1 },
    isWicket: false,
    isLegalDelivery: true,
  });
  expect(next).toMatchObject({ score: 1, balls: 1, strikerIndex: 1, nonStrikerIndex: 0 });
  expect(next.battingStats[0]).toMatchObject({ runs: 0, balls: 1 });
  expect(next.bowlingStats[0]).toMatchObject({ balls: 1, runsConceded: 0 });
  expect(next.ballHistory[0].extraBreakdown[type]).toBe(1);
});

test('a non-striker run-out is attributed to the dismissed batter, not the bowler', () => {
  const next = play(makeInnings(), {
    ...wicket,
    dismissal: { type: 'runOut', batterIndex: 1, fielderName: 'Bowler 2' },
  });
  expect(next.outBatterIndices).toEqual([1]);
  expect(next.battingStats[0].isOut).toBe(false);
  expect(next.battingStats[1]).toMatchObject({
    isOut: true,
    dismissal: { type: 'runOut', batterIndex: 1, fielderName: 'Bowler 2' },
  });
  expect(next.bowlingStats[0].wickets).toBe(0);
  expect(next.ballHistory[0].dismissal).toMatchObject({ type: 'runOut', batterIndex: 1 });
  expect(next.strikerIndex).toBe(0);
  expect(next.nonStrikerIndex).toBeNull();
});

test('a run-out is possible on a no-ball without crediting the bowler', () => {
  const next = play(makeInnings(), {
    ...noBall,
    isWicket: true,
    dismissal: { type: 'runOut', batterIndex: 0 },
  });
  expect(next).toMatchObject({ score: 1, balls: 0, wickets: 1, noBalls: 1, freeHitArmed: true });
  expect(next.battingStats[0]).toMatchObject({ balls: 1, isOut: true });
  expect(next.bowlingStats[0]).toMatchObject({ balls: 0, runsConceded: 1, wickets: 0 });
  expect(next.lastEvent).toContain('No ball');
});

test('a sixth-ball wicket completes the over before the replacement batter is selected', () => {
  const next = play(makeInnings({ balls: 5, superShotUsedInOver: 1, specialBallUsedInOver: 1 }), wicket);
  expect(next).toMatchObject({
    balls: 6,
    waitingForNextBatter: true,
    strikerIndex: 1,
    nonStrikerIndex: null,
    completedOverBowlerIndices: [0],
    lastOverBowlerIndex: 0,
    superShotUsedInOver: 0,
    specialBallUsedInOver: 0,
  });
  expect(next.currentBowlerIndex).not.toBe(0);

  let selected;
  handleSelectNextBatter({
    isFirstInnings: true,
    batterIndex: 2,
    getContext: () => ({ battingSide }),
    updateState: (_, update) => { selected = update(next); },
  });
  expect(selected).toMatchObject({
    waitingForNextBatter: false,
    strikerIndex: 1,
    nonStrikerIndex: 2,
  });
});

test('a Super Over innings ends at two wickets without requesting another batter', () => {
  const next = play(
    makeInnings({ wickets: 1, outBatterIndices: [5] }),
    wicket,
    true,
    { matchType: { over: 1, maxWickets: 2 }, maxBalls: 6 }
  );
  expect(next).toMatchObject({ wickets: 2, waitingForNextBatter: false, strikerIndex: null });
});

test('retains the complete delivery ledger separately from the compact recent history', () => {
  let innings = makeInnings();
  for (let index = 0; index < 61; index += 1) {
    innings = play(innings, dot);
  }
  expect(innings.ballHistory).toHaveLength(60);
  expect(innings.deliveryEvents).toHaveLength(61);
  expect(JSON.parse(JSON.stringify(innings)).deliveryEvents).toEqual(innings.deliveryEvents);
});

test('realism passes the actual user field and a computer batting plan to the shared resolver', () => {
  const positions = [...fieldSettingList.find(({ key }) => key === 'newBall').positions];
  const next = play(makeInnings(), dot, false, {
    ruleset: 'realism',
    bowlingTactics: { fieldPreset: 'custom', fieldPositions: positions },
  });

  const delivery = resolveOutcome.mock.calls[0][0].realismDelivery;
  expect(delivery.fieldPositions).toEqual(positions);
  expect(delivery.batting).toMatchObject({ approach: 'balanced', target: 'straight' });
  expect(next.deliveryEvents[0].execution).toMatchObject({
    fieldPositions: positions,
    batting: delivery.batting,
    bowling: delivery.bowling,
  });
});

test('an illegal realism field is reported without delivering a ball', () => {
  const positions = [...fieldSettingList.find(({ key }) => key === 'boundary').positions];
  const innings = makeInnings();
  const next = play(innings, dot, false, {
    ruleset: 'realism',
    bowlingTactics: { fieldPreset: 'custom', fieldPositions: positions },
  });
  expect(next.balls).toBe(0);
  expect(next.lastEvent).toContain('outside the circle');
  expect(resolveOutcome).not.toHaveBeenCalled();
});
