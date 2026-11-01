import { getNextBatterIndex, getTopOpenerIndices } from '../../../utils/simulatorUtils';
import { buildPreparedInnings, selectComputerBowler } from './controllerInningsSetupUtils';
import { createSeededRandom } from './seededRandom';

const otherSide = (side) => side === 'own' ? 'opponent' : 'own';
const playersFor = (context, side) => side === 'own' ? context.ownPlayers : context.opponentPlayers;
const teamFor = (context, side) => side === 'own' ? context.ownTeam : context.opponentTeam;

const prepareSuperOverInnings = ({ context, battingSide, excluded, previousBowler, seed }) => {
  const bowlingSide = otherSide(battingSide);
  const batters = playersFor(context, battingSide);
  const bowlers = playersFor(context, bowlingSide);
  const isUserBatting = teamFor(context, battingSide) === context.userTeamName;
  const isUserBowling = teamFor(context, bowlingSide) === context.userTeamName;
  const eligible = batters.map((player, index) => ({ player, index })).filter(({ index }) => !excluded.includes(index));
  if (eligible.length < 3) throw new Error('Not enough eligible batters remain for another Super Over.');

  const innings = buildPreparedInnings({
    battingSide: batters,
    bowlingSide: bowlers,
    isUserBatting,
    isUserBowling,
    overs: 1,
    randomSeed: seed,
  });
  innings.outBatterIndices = [...excluded];
  if (!isUserBatting) {
    const [first, second] = getTopOpenerIndices(eligible.map(({ player }) => player));
    innings.strikerIndex = eligible[first].index;
    innings.nonStrikerIndex = eligible[second].index;
    innings.battingOrderIndices = [innings.strikerIndex, innings.nonStrikerIndex];
    innings.nextBatterIndex = getNextBatterIndex(batters, excluded, innings.battingOrderIndices);
  }
  if (previousBowler !== null && previousBowler !== undefined) {
    innings.lastOverBowlerIndex = previousBowler;
    if (!isUserBowling) {
      const generator = createSeededRandom(innings.randomState);
      innings.currentBowlerIndex = selectComputerBowler({
        inningState: innings,
        bowlingSide: bowlers,
        previousBowlerIndex: previousBowler,
        overs: 1,
        random: generator.next,
      });
      innings.randomState = generator.getState();
      if (innings.currentBowlerIndex === previousBowler || innings.currentBowlerIndex === null) {
        throw new Error('No eligible bowler is available for another Super Over.');
      }
    }
  }
  return innings;
};

const prepareRound = (state, context) => {
  const generator = createSeededRandom(state.randomState);
  const firstSeed = Math.floor(generator.next() * 4294967296);
  const secondSeed = Math.floor(generator.next() * 4294967296);
  const firstSide = state.firstSide;
  const secondSide = otherSide(firstSide);
  return {
    ...state,
    phase: 'first',
    randomState: generator.getState(),
    firstInnings: prepareSuperOverInnings({
      context,
      battingSide: firstSide,
      excluded: state.excludedBatters[firstSide],
      previousBowler: state.lastBowlers[secondSide],
      seed: firstSeed,
    }),
    secondInnings: prepareSuperOverInnings({
      context,
      battingSide: secondSide,
      excluded: state.excludedBatters[secondSide],
      previousBowler: state.lastBowlers[firstSide],
      seed: secondSeed,
    }),
  };
};

export const startSuperOver = ({ originalFirstSide, randomSeed, ...context }) =>
  prepareRound({
    round: 1,
    firstSide: otherSide(originalFirstSide),
    originalFirstSide,
    phase: 'first',
    winnerTeam: '',
    rounds: [],
    excludedBatters: { own: [], opponent: [] },
    lastBowlers: { own: null, opponent: null },
    randomState: randomSeed ?? Math.floor(Math.random() * 4294967296),
  }, context);

export const advanceSuperOver = ({ state, ...context }) => {
  if (state.phase === 'resolved') return state;
  if (state.phase !== 'complete') throw new Error('The Super Over is not complete.');
  const firstSide = state.firstSide;
  const secondSide = otherSide(firstSide);
  const first = state.firstInnings;
  const second = state.secondInnings;
  const winnerSide = first.score === second.score ? null : first.score > second.score ? firstSide : secondSide;
  const rounds = [...state.rounds, {
    round: state.round,
    firstSide,
    firstScore: first.score,
    secondScore: second.score,
    firstInnings: first,
    secondInnings: second,
  }];
  if (winnerSide) return { ...state, rounds, phase: 'resolved', winnerTeam: teamFor(context, winnerSide) };

  const excludedBatters = {
    ...state.excludedBatters,
    [firstSide]: [...new Set(first.outBatterIndices)],
    [secondSide]: [...new Set(second.outBatterIndices)],
  };
  const lastBowlers = {
    ...state.lastBowlers,
    [secondSide]: first.completedOverBowlerIndices?.[0] ?? first.currentBowlerIndex,
    [firstSide]: second.completedOverBowlerIndices?.[0] ?? second.currentBowlerIndex,
  };
  return prepareRound({
    ...state,
    rounds,
    excludedBatters,
    lastBowlers,
    round: state.round + 1,
    firstSide: secondSide,
  }, context);
};
