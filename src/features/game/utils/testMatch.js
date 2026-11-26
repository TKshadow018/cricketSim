import { buildPreparedInnings } from './controllerInningsSetupUtils';
import { createSeededRandom } from './seededRandom';
import { buildInitialInnings } from '../gameState';

const otherSide = (side) => side === 'own' ? 'opponent' : 'own';
const playersFor = (context, side) => side === 'own' ? context.ownPlayers : context.opponentPlayers;
const teamFor = (context, side) => side === 'own' ? context.ownTeam : context.opponentTeam;

const prepareInnings = (state, context, side, target = null) => {
  const generator = createSeededRandom(state.randomState);
  const seed = Math.floor(generator.next() * 4294967296);
  const opposingSide = otherSide(side);
  const controlTeamName = context.teamControlName ?? context.userTeamName;
  return {
    ...state,
    phase: 'batting',
    currentSide: side,
    target,
    randomState: generator.getState(),
    currentInnings: buildPreparedInnings({
      battingSide: playersFor(context, side),
      bowlingSide: playersFor(context, opposingSide),
      isUserBatting: teamFor(context, side) === controlTeamName,
      isUserBowling: teamFor(context, opposingSide) === controlTeamName,
      overs: state.oversPerDay,
      randomSeed: seed,
      unlimitedBowling: true,
    }),
  };
};

const followOnThreshold = (days) => days >= 5 ? 200 : days >= 3 ? 150 : days === 2 ? 100 : 75;
const totalsFor = (innings) => innings.reduce((totals, entry) => ({
  ...totals,
  [entry.side]: totals[entry.side] + entry.innings.score,
}), { own: 0, opponent: 0 });

export const shouldDeclareTestInnings = (state) => {
  if (state.phase !== 'batting' || state.target != null || state.currentInnings.wickets >= 10) return false;
  const previousOwnInnings = state.innings.filter(({ side }) => side === state.currentSide);
  if (!previousOwnInnings.length) return false;
  const totals = totalsFor(state.innings);
  const lead = totals[state.currentSide] + state.currentInnings.score - totals[otherSide(state.currentSide)];
  const usedBalls = state.innings.reduce((sum, entry) => sum + entry.innings.balls, 0) + state.currentInnings.balls;
  const remaining = state.totalBalls - usedBalls;
  return lead >= 200 && remaining >= 60 && remaining <= state.oversPerDay * 9;
};

export const startTestMatch = ({
  firstSide,
  days = 5,
  oversPerDay = 90,
  randomSeed = Math.floor(Math.random() * 4294967296),
  ...context
}) => {
  if (!['own', 'opponent'].includes(firstSide)) throw new Error('A Test match requires a valid first batting side.');
  if (days < 1 || oversPerDay < 1) throw new Error('A Test match requires a positive duration.');
  return prepareInnings({
    firstSide,
    days,
    oversPerDay,
    totalBalls: days * oversPerDay * 6,
    randomState: randomSeed,
    innings: [],
    phase: 'batting',
    result: null,
  }, context, firstSide);
};

export const chooseFollowOn = ({ state, enforce, ...context }) => {
  if (state.phase !== 'followOnChoice') throw new Error('A follow-on decision is not available.');
  return prepareInnings(state, context, enforce ? otherSide(state.firstSide) : state.firstSide);
};

export const finishTestInnings = ({ state, reason, ...context }) => {
  if (state.phase !== 'batting') throw new Error('There is no active Test innings to complete.');
  const innings = [...state.innings, { side: state.currentSide, innings: state.currentInnings, reason }];
  const totals = totalsFor(innings);
  const totalBalls = innings.reduce((sum, entry) => sum + entry.innings.balls, 0);
  const completed = { ...state, innings };
  const finish = (result) => ({ ...completed, phase: 'result', result });

  if (reason === 'targetReached') {
    return finish({ type: 'win', winnerSide: state.currentSide, marginType: 'wickets', margin: 10 - state.currentInnings.wickets });
  }
  if (innings.length === 4) {
    const difference = totals[state.currentSide] - totals[otherSide(state.currentSide)];
    if (difference > 0) return finish({ type: 'win', winnerSide: state.currentSide, marginType: 'wickets', margin: 10 - state.currentInnings.wickets });
    if (difference === 0 && reason !== 'time') return finish({ type: 'tie' });
    if (reason !== 'time') return finish({ type: 'win', winnerSide: otherSide(state.currentSide), marginType: 'runs', margin: -difference });
  }
  if (innings.length === 3 && reason !== 'time' && totals[state.currentSide] < totals[otherSide(state.currentSide)]) {
    return finish({
      type: 'win',
      winnerSide: otherSide(state.currentSide),
      marginType: 'innings',
      margin: totals[otherSide(state.currentSide)] - totals[state.currentSide],
    });
  }
  if (reason === 'time' || totalBalls >= state.totalBalls) return finish({ type: 'draw' });
  if (innings.length === 1) return prepareInnings(completed, context, otherSide(state.firstSide));
  if (innings.length === 2) {
    const lead = totals[state.firstSide] - totals[otherSide(state.firstSide)];
    if (lead >= followOnThreshold(state.days)) return { ...completed, phase: 'followOnChoice', followOnLead: lead };
    return prepareInnings(completed, context, state.firstSide);
  }
  if (innings.length === 3) {
    const battingTotal = totals[state.currentSide];
    const otherTotal = totals[otherSide(state.currentSide)];
    return prepareInnings(completed, context, otherSide(state.currentSide), battingTotal - otherTotal + 1);
  }
  throw new Error('Invalid Test match innings sequence.');
};

export const aggregateTestMatch = (state) => {
  const firstInnings = buildInitialInnings();
  const secondInnings = buildInitialInnings();
  state.innings.forEach(({ side, innings }) => {
    const aggregate = side === state.firstSide ? firstInnings : secondInnings;
    aggregate.score += innings.score;
    aggregate.wickets += innings.wickets;
    aggregate.balls += innings.balls;
    aggregate.wides += innings.wides || 0;
    aggregate.noBalls += innings.noBalls || 0;
    aggregate.byes = (aggregate.byes || 0) + (innings.byes || 0);
    aggregate.legByes = (aggregate.legByes || 0) + (innings.legByes || 0);
    innings.battingStats.forEach((stat, index) => {
      const previous = aggregate.battingStats[index] || { runs: 0, balls: 0, outs: 0 };
      const outs = previous.outs + (stat.isOut ? 1 : 0);
      aggregate.battingStats[index] = {
        ...previous,
        ...stat,
        runs: previous.runs + (stat.runs || 0),
        balls: previous.balls + (stat.balls || 0),
        outs,
        isOut: outs > 0,
      };
    });
    innings.bowlingStats.forEach((stat, index) => {
      const previous = aggregate.bowlingStats[index] || { balls: 0, runsConceded: 0, wickets: 0 };
      aggregate.bowlingStats[index] = {
        ...stat,
        balls: previous.balls + (stat.balls || 0),
        runsConceded: previous.runsConceded + (stat.runsConceded || 0),
        wickets: previous.wickets + (stat.wickets || 0),
      };
    });
  });
  return { firstInnings, secondInnings };
};

export const formatTestResult = (state, context) => {
  if (state.result.type === 'draw') return 'The match is drawn.';
  if (state.result.type === 'tie') return 'The match is tied.';
  const winner = teamFor(context, state.result.winnerSide);
  if (state.result.marginType === 'innings') return `${winner} won by an innings and ${state.result.margin} runs`;
  return `${winner} won by ${state.result.margin} ${state.result.marginType}`;
};

export const getTestWinner = (state, context) => {
  if (state.result.type === 'draw') return 'Draw';
  if (state.result.type === 'tie') return 'Tie';
  return teamFor(context, state.result.winnerSide);
};

export const getFirstInningsLeader = (state, context) => {
  if (state.innings.length < 2) return '';
  const [first, second] = state.innings;
  if (first.innings.score === second.innings.score) return '';
  return teamFor(context, first.innings.score > second.innings.score ? first.side : second.side);
};
