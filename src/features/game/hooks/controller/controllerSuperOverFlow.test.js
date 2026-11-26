import { createCompetitionFlowHandlers } from './controllerCompetitionFlow';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';

const players = (team) => Array.from({ length: 11 }, (_, index) => ({
  id: `${team}-${index}`,
  name: `${team} ${index}`,
  battingOrderCoeff: 100 - index,
  paceAbility: 60,
  spinAbility: 20,
}));

const makeFlow = (tournamentTiebreak = null) => {
  const dispatch = jest.fn();
  const input = {
    dispatch,
    game: { tournamentTiebreak },
    gameMode: 'tournament',
    stage: matchStatusEnum.MatchEnd,
    tournamentCurrentMatchId: 'final',
    tournamentMatches: [{ id: 'final', round: 1, matchNumber: 1, teamA: 'A', teamB: 'B', isComplete: false }],
    tournamentResultCommitSignatureRef: { current: '' },
    firstInnings: { score: 100, wickets: 5, balls: 120 },
    secondInnings: { score: 100, wickets: 8, balls: 120 },
    resultSummary: 'The match is tied.',
    firstInningsTeamName: 'A',
    secondInningsTeamName: 'B',
    firstBattingSide: 'own',
    ownTeam: 'A',
    opponentTeam: 'B',
    ownPlayers: players('A'),
    opponentPlayers: players('B'),
    userTeamName: 'A',
    tournamentPlayerStats: {},
    setTournamentTiebreakAction: (payload) => ({ type: 'tiebreak', payload }),
    setTournamentMatchesAction: (payload) => ({ type: 'matches', payload }),
    setTournamentPlayerStatsAction: (payload) => ({ type: 'stats', payload }),
    setTournamentChampionAction: (payload) => ({ type: 'champion', payload }),
    setStageAction: (payload) => ({ type: 'stage', payload }),
    prepareTournamentMatch: jest.fn(),
  };
  return { dispatch, flow: createCompetitionFlowHandlers(input) };
};

test('a tied tournament match starts a Super Over without advancing either team', () => {
  const { dispatch, flow } = makeFlow();
  flow.handleMatchPrimaryAction();
  expect(dispatch).toHaveBeenCalledWith({
    type: 'tiebreak',
    payload: expect.objectContaining({ phase: 'first', firstSide: 'opponent', round: 1 }),
  });
  expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'matches' }));
});

test('a resolved Super Over advances its winner while retaining the tied match score', () => {
  const { dispatch, flow } = makeFlow({ phase: 'resolved', winnerTeam: 'B', round: 2 });
  flow.handleMatchPrimaryAction();
  expect(dispatch).toHaveBeenCalledWith({
    type: 'matches',
    payload: [expect.objectContaining({
      winnerTeam: 'B',
      isComplete: true,
      firstInningsScore: 100,
      secondInningsScore: 100,
      summary: expect.stringContaining('Super Over'),
    })],
  });
});
