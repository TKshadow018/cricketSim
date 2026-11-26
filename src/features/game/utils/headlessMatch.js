import { battingAction, bowlingAction } from '../../../gameData/actionType';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import { resolveResultSummary } from '../../../utils/simulatorUtils';
import { processDelivery } from '../hooks/controller/controllerDeliveryEngine';
import { buildCareerMatchScorecard } from './controllerCareerUtils';
import { buildPreparedInnings } from './controllerInningsSetupUtils';
import { createSeededRandom } from './seededRandom';

const formats = {
  t10: { key: 't10', over: 10 },
  t20: { key: 't20', over: 20 },
  odi: { key: 'ODI', over: 50 },
};

export const simulateHeadlessMatch = ({
  teamA,
  teamB,
  playersA,
  playersB,
  format,
  seed = Math.floor(Math.random() * 4294967296),
  condition = { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
  ruleset = 'realism',
}) => {
  const matchType = formats[format];
  if (!matchType) throw new Error(`Unsupported headless match format: ${format}`);
  if (playersA.length < 11 || playersB.length < 11) throw new Error('Both teams need eleven players for a simulated match.');
  const generator = createSeededRandom(seed);
  const nextSeed = () => Math.floor(generator.next() * 4294967296);
  let first = buildPreparedInnings({
    battingSide: playersA,
    bowlingSide: playersB,
    isUserBatting: false,
    isUserBowling: false,
    overs: matchType.over,
    randomSeed: nextSeed(),
  });
  let second = buildPreparedInnings({
    battingSide: playersB,
    bowlingSide: playersA,
    isUserBatting: false,
    isUserBowling: false,
    overs: matchType.over,
    randomSeed: nextSeed(),
  });
  let stage = matchStatusEnum.TeamOneBat;
  const dispatch = (action) => {
    if (action.type === 'stage') stage = action.payload;
  };
  const setFirstInnings = (next) => { first = next; };
  const setSecondInnings = (next) => { second = next; };
  const action = (payload) => ({ type: 'intent', payload });
  let deliveries = 0;
  while (stage !== matchStatusEnum.MatchEnd) {
    const isFirstInnings = stage === matchStatusEnum.TeamOneBat;
    const previous = isFirstInnings ? first : second;
    const previousStage = stage;
    processDelivery({
      isFirstInnings,
      firstInnings: first,
      secondInnings: second,
      getContext: () => ({
        isOwnBatting: isFirstInnings,
        isUserBatting: false,
        isUserBowling: false,
        battingSide: isFirstInnings ? playersA : playersB,
        bowlingSide: isFirstInnings ? playersB : playersA,
      }),
      matchType,
      matchTypeKey: matchType.key,
      maxBalls: matchType.over * 6,
      battingIntent: battingAction.normal,
      bowlingIntent: bowlingAction.normal,
      ownSanitizedRoles: {},
      opponentSanitizedRoles: {},
      ownTeam: teamA,
      opponentTeam: teamB,
      matchCondition: condition,
      ruleset,
      silent: true,
      dispatch,
      setBattingIntentAction: action,
      setBowlingIntentAction: action,
      setBowlingTacticsAction: action,
      setFirstInnings,
      setSecondInnings,
      firstInningsScore: first.score,
      setStageAction: (payload) => ({ type: 'stage', payload }),
    });
    deliveries += 1;
    if (deliveries > 10000 || (previousStage === stage && previous === (isFirstInnings ? first : second))) {
      throw new Error('The unattended match could not advance to the next delivery.');
    }
  }
  const scorecard = buildCareerMatchScorecard({
    firstBattingSide: 'own',
    ownPlayers: playersA,
    opponentPlayers: playersB,
    ownTeam: teamA,
    opponentTeam: teamB,
    firstInnings: first,
    secondInnings: second,
  });
  const summary = resolveResultSummary({
    firstInningsScore: first.score,
    secondInningsScore: second.score,
    secondInningsWickets: second.wickets,
    firstInningsTeamName: teamA,
    secondInningsTeamName: teamB,
  });
  return {
    seed,
    firstInnings: first,
    secondInnings: second,
    scorecard,
    winner: first.score === second.score ? 'Tie' : first.score > second.score ? teamA : teamB,
    summary,
  };
};
