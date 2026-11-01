import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { createBattingStats, createBowlingStats } from '../../../../utils/simulatorUtils';
import { buildInitialInnings } from '../../gameState';
import { processDelivery } from './controllerDeliveryEngine';

jest.mock('../../../../utils/speechUtils', () => ({
  announceTarget: jest.fn(),
  ballByBallCommentry: jest.fn(() => 'Delivery.'),
}));

const batters = Array.from({ length: 11 }, (_, index) => ({
  id: `bat-${index}`,
  name: `Batter ${index}`,
  battingOrderCoeff: 100 - index,
  abilityToPlayPaceBall: 70,
  abilityToPlaySpinBall: 70,
}));
const bowlers = Array.from({ length: 6 }, (_, index) => ({
  id: `bowl-${index}`,
  name: `Bowler ${index}`,
  paceAbility: 70,
  spinAbility: 20,
}));

const initial = () => ({
  ...buildInitialInnings(),
  strikerIndex: 0,
  nonStrikerIndex: 1,
  nextBatterIndex: 2,
  currentBowlerIndex: 0,
  battingOrderIndices: [0, 1],
  battingStats: createBattingStats(batters),
  bowlingStats: createBowlingStats(bowlers),
  randomState: 12345,
});

const play = (state, count) => {
  let innings = state;
  for (let index = 0; index < count; index += 1) {
    processDelivery({
      isFirstInnings: true,
      firstInnings: innings,
      secondInnings: initial(),
      getContext: () => ({
        isOwnBatting: true,
        isUserBatting: false,
        isUserBowling: false,
        battingSide: batters,
        bowlingSide: bowlers,
      }),
      matchType: { over: 20 },
      matchTypeKey: 't20',
      maxBalls: 120,
      battingIntent: battingAction.normal,
      bowlingIntent: bowlingAction.normal,
      ownSanitizedRoles: {},
      opponentSanitizedRoles: {},
      ownTeam: 'Batting',
      opponentTeam: 'Bowling',
      matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
      dispatch: jest.fn(),
      setBattingIntentAction: (payload) => ({ type: 'batting', payload }),
      setBowlingIntentAction: (payload) => ({ type: 'bowling', payload }),
      setBowlingTacticsAction: (payload) => ({ type: 'tactics', payload }),
      setFirstInnings: (next) => { innings = next; },
      setSecondInnings: jest.fn(),
      setStageAction: (payload) => ({ type: 'stage', payload }),
    });
  }
  return innings;
};

test('a saved random state reproduces deliveries, bowler changes and scorecards', () => {
  const uninterrupted = play(initial(), 18);
  const checkpoint = JSON.parse(JSON.stringify(play(initial(), 9)));
  const resumed = play(checkpoint, 9);
  expect(resumed).toEqual(uninterrupted);
  expect(resumed.deliveryEvents).toHaveLength(18);
  expect(resumed.randomState).not.toBe(12345);
});

test('the random state advances after every delivery, not only after an over', () => {
  const first = play(initial(), 1);
  const second = play(first, 1);
  expect(first.randomState).not.toBe(initial().randomState);
  expect(second.randomState).not.toBe(first.randomState);
  expect(play(JSON.parse(JSON.stringify(first)), 1)).toEqual(second);
});

test.each([1, 42, 777, 12345, 99821])('seed %s preserves innings and bowling totals', (seed) => {
  const innings = play({ ...initial(), randomState: seed }, 60);
  const batterRuns = innings.battingStats.reduce((sum, stat) => sum + stat.runs, 0);
  const dismissed = innings.battingStats.filter((stat) => stat.isOut);
  const bowlerWickets = innings.bowlingStats.reduce((sum, stat) => sum + stat.wickets, 0);
  const credited = dismissed.filter((stat) => stat.dismissal?.type !== 'runOut').length;
  expect(innings.score).toBe(batterRuns + innings.wides + innings.noBalls + innings.byes + innings.legByes);
  expect(innings.wickets).toBe(dismissed.length);
  expect(bowlerWickets).toBe(credited);
  expect(innings.bowlingStats.reduce((sum, stat) => sum + stat.balls, 0)).toBe(innings.balls);
  expect(innings.bowlingStats.reduce((sum, stat) => sum + stat.runsConceded, 0))
    .toBe(innings.score - innings.byes - innings.legByes);
});
