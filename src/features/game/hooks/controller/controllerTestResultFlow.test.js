import { createCompetitionFlowHandlers } from './controllerCompetitionFlow';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';

const makeFlow = ({ mode, testMatch, firstScore = 500, secondScore = 350 }) => {
  const dispatch = jest.fn();
  const prepareTournamentMatch = jest.fn();
  const match = { id: 'final', round: 1, matchNumber: 1, teamA: 'A', teamB: 'B', isComplete: false };
  const flow = createCompetitionFlowHandlers({
    dispatch,
    game: { testMatch },
    gameMode: mode,
    stage: matchStatusEnum.MatchEnd,
    firstInnings: { score: firstScore, wickets: 10, balls: 600, battingStats: [], bowlingStats: [] },
    secondInnings: { score: secondScore, wickets: 8, balls: 500, battingStats: [], bowlingStats: [] },
    firstInningsTeamName: 'A',
    secondInningsTeamName: 'B',
    firstBattingSide: 'own',
    resultSummary: 'The match is drawn.',
    ownTeam: 'A',
    opponentTeam: 'B',
    ownPlayers: [],
    opponentPlayers: [],
    tournamentCurrentMatchId: 'final',
    tournamentMatches: [match],
    tournamentResultCommitSignatureRef: { current: '' },
    tournamentPlayerStats: {},
    seriesCurrentMatch: 1,
    seriesResultCommitSignatureRef: { current: '' },
    seriesResults: [],
    seriesPlayerStats: {},
    seriesLength: 1,
    prepareTournamentMatch,
    setTournamentMatchesAction: (payload) => ({ type: 'matches', payload }),
    setTournamentPlayerStatsAction: (payload) => ({ type: 'stats', payload }),
    setTournamentChampionAction: (payload) => ({ type: 'champion', payload }),
    setSeriesResultsAction: (payload) => ({ type: 'series', payload }),
    setSeriesPlayerStatsAction: (payload) => ({ type: 'stats', payload }),
    setTestMatchAction: (payload) => ({ type: 'testMatch', payload }),
    setStageAction: (payload) => ({ type: 'stage', payload }),
  });
  return { dispatch, flow, prepareTournamentMatch, match };
};

const drawnTest = (first, second) => ({
  firstSide: 'own',
  phase: 'result',
  result: { type: 'draw' },
  innings: [
    { side: 'own', innings: { score: first } },
    { side: 'opponent', innings: { score: second } },
  ],
});

test('a drawn Test remains a draw in a series regardless of aggregate score', () => {
  const { dispatch, flow } = makeFlow({ mode: 'series', testMatch: drawnTest(300, 350) });
  flow.commitSeriesMatchIfNeeded();
  expect(dispatch).toHaveBeenCalledWith({
    type: 'series',
    payload: [expect.objectContaining({ winnerTeam: 'Draw', summary: 'The match is drawn.' })],
  });
});

test('a drawn Test knockout advances the side with the first-innings lead', () => {
  const { dispatch, flow } = makeFlow({ mode: 'tournament', testMatch: drawnTest(300, 350) });
  flow.handleMatchPrimaryAction();
  expect(dispatch).toHaveBeenCalledWith({
    type: 'matches',
    payload: [expect.objectContaining({ winnerTeam: 'B', matchResult: 'Draw', summary: expect.stringContaining('first-innings lead') })],
  });
});

test('a drawn Test knockout with level first innings is replayed', () => {
  const { dispatch, flow, prepareTournamentMatch, match } = makeFlow({ mode: 'tournament', testMatch: drawnTest(300, 300) });
  flow.handleMatchPrimaryAction();
  expect(prepareTournamentMatch).toHaveBeenCalledWith(expect.objectContaining({
    ...match,
    drawnReplays: [expect.objectContaining({ summary: 'The match is drawn.' })],
  }));
  expect(dispatch).toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.TossTime });
  expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'champion' }));
});
