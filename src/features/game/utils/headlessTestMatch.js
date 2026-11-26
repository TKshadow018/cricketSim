import { battingAction, bowlingAction } from '../../../gameData/actionType';
import { processDelivery } from '../hooks/controller/controllerDeliveryEngine';
import { buildCareerMatchScorecard } from './controllerCareerUtils';
import { withInningsExtras } from './scorecardExtras';
import { buildTestInningsScorecards } from './testScorecards';
import {
  aggregateTestMatch,
  chooseFollowOn,
  finishTestInnings,
  formatTestResult,
  getTestWinner,
  shouldDeclareTestInnings,
  startTestMatch,
} from './testMatch';

export const simulateHeadlessTestMatch = ({
  teamA,
  teamB,
  playersA,
  playersB,
  seed = Math.floor(Math.random() * 4294967296),
  condition = { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
  days = 4,
  oversPerDay = 90,
  ruleset = 'realism',
}) => {
  if (playersA.length < 11 || playersB.length < 11) throw new Error('Both teams need eleven players for a simulated match.');
  const context = { ownPlayers: playersA, opponentPlayers: playersB, ownTeam: teamA, opponentTeam: teamB };
  let state = startTestMatch({ ...context, firstSide: 'own', randomSeed: seed, days, oversPerDay });
  let nextInnings;
  const setInnings = (next) => { nextInnings = next; };
  const action = (payload) => ({ type: 'intent', payload });
  let deliveries = 0;

  while (state.phase !== 'result') {
    if (state.phase === 'followOnChoice') {
      state = chooseFollowOn({ state, enforce: true, ...context });
      continue;
    }
    const innings = state.currentInnings;
    const completedBalls = state.innings.reduce((sum, entry) => sum + entry.innings.balls, 0);
    const matchType = { over: oversPerDay, unlimitedBowling: true, matchBallsRemaining: state.totalBalls - completedBalls };
    const isOwnBatting = state.currentSide === 'own';
    nextInnings = undefined;
    processDelivery({
      isFirstInnings: true,
      firstInnings: innings,
      secondInnings: innings,
      getContext: () => ({
        isOwnBatting,
        isUserBatting: false,
        isUserBowling: false,
        battingSide: isOwnBatting ? playersA : playersB,
        bowlingSide: isOwnBatting ? playersB : playersA,
      }),
      matchType,
      matchTypeKey: 'test',
      maxBalls: state.totalBalls - completedBalls,
      battingIntent: battingAction.normal,
      bowlingIntent: bowlingAction.normal,
      ownSanitizedRoles: {},
      opponentSanitizedRoles: {},
      ownTeam: teamA,
      opponentTeam: teamB,
      matchCondition: condition,
      ruleset,
      targetScore: state.target,
      silent: true,
      suppressInningsTransition: true,
      dispatch: () => {},
      setBattingIntentAction: action,
      setBowlingIntentAction: action,
      setBowlingTacticsAction: action,
      setFirstInnings: setInnings,
      setSecondInnings: setInnings,
      setStageAction: action,
    });
    deliveries += 1;
    if (!nextInnings || deliveries > state.totalBalls * 10) {
      throw new Error('The unattended first-class match could not advance.');
    }
    const updated = { ...state, currentInnings: nextInnings };
    const reason = state.target != null && nextInnings.score >= state.target
      ? 'targetReached'
      : nextInnings.wickets >= 10
        ? 'allOut'
        : completedBalls + nextInnings.balls >= state.totalBalls
          ? 'time'
          : shouldDeclareTestInnings(updated) ? 'declared' : null;
    state = reason ? finishTestInnings({ state: updated, reason, ...context }) : updated;
  }

  const aggregate = aggregateTestMatch(state);
  const scorecard = buildCareerMatchScorecard({
    firstBattingSide: 'own',
    ownPlayers: playersA,
    opponentPlayers: playersB,
    ownTeam: teamA,
    opponentTeam: teamB,
    ...aggregate,
  });
  scorecard.previousInnings = withInningsExtras(scorecard.previousInnings, aggregate.firstInnings);
  scorecard.currentInnings = withInningsExtras(scorecard.currentInnings, aggregate.secondInnings);
  const inningsScorecards = buildTestInningsScorecards({ state, ...context });
  return {
    seed,
    ...aggregate,
    scorecard,
    inningsScorecards,
    testMatch: state,
    winner: getTestWinner(state, context),
    summary: formatTestResult(state, context),
  };
};
