import { createCompetitionFlowHandlers } from './controllerCompetitionFlow';
import { MODE_CAREER, MODE_QUICK, MODE_SERIES, MODE_TOURNAMENT } from '../../utils/controllerCommonUtils';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';

const actionNames = [
  'setTournamentMatchesAction',
  'setTournamentPlayerStatsAction',
  'setSeriesResultsAction',
  'setSeriesPlayerStatsAction',
  'setTossWinnerAction',
  'setTossDecisionAction',
  'setTossCallAction',
  'setFirstBattingSideAction',
  'setMatchConditionAction',
  'setBattingIntentAction',
  'setBowlingIntentAction',
  'setFirstInningsAction',
  'setSecondInningsAction',
  'setShowScoreboardAction',
  'setStageAction',
  'setSeriesCurrentMatchAction',
  'setTournamentChampionAction',
];

const makeFlow = (overrides = {}) => {
  const dispatch = jest.fn();
  const actions = Object.fromEntries(actionNames.map((name) => [name, (payload) => ({ type: name, payload })]));
  const input = {
    dispatch,
    gameMode: MODE_QUICK,
    stage: matchStatusEnum.MatchEnd,
    tournamentCurrentMatchId: 'match-1',
    tournamentMatches: [],
    tournamentResultCommitSignatureRef: { current: '' },
    firstInnings: { score: 100, wickets: 4, balls: 60 },
    secondInnings: { score: 95, wickets: 8, balls: 60 },
    resultSummary: 'Falcons won',
    firstInningsTeamName: 'Falcons',
    secondInningsTeamName: 'Ravens',
    tournamentPlayerStats: [],
    firstBattingSide: 'own',
    ownPlayers: [],
    opponentPlayers: [],
    ownTeam: 'Falcons',
    opponentTeam: 'Ravens',
    seriesCurrentMatch: 1,
    seriesResultCommitSignatureRef: { current: '' },
    seriesResults: [],
    seriesPlayerStats: [],
    seriesLength: 3,
    prepareTournamentMatch: jest.fn(),
    setAutoSimMode: jest.fn(),
    handleCareerMatchPrimaryAction: jest.fn(),
    resetMatchRuntime: () => ({ type: 'game/resetMatchRuntime' }),
    ...actions,
    ...overrides,
  };
  return { flow: createCompetitionFlowHandlers(input), input, dispatch };
};

describe('createCompetitionFlowHandlers', () => {
  test('handles quick and career primary actions and resets fresh-match state', () => {
    const quick = makeFlow();
    quick.flow.handleMatchPrimaryAction();
    expect(quick.dispatch).toHaveBeenCalledWith({ type: 'game/resetMatchRuntime' });

    const career = makeFlow({ gameMode: MODE_CAREER });
    career.flow.handleMatchPrimaryAction();
    expect(career.input.handleCareerMatchPrimaryAction).toHaveBeenCalled();
    const careerWithoutHandler = makeFlow({ gameMode: MODE_CAREER, handleCareerMatchPrimaryAction: null });
    expect(() => careerWithoutHandler.flow.handleMatchPrimaryAction()).not.toThrow();

    quick.input.seriesResultCommitSignatureRef.current = 'series';
    quick.input.tournamentResultCommitSignatureRef.current = 'tournament';
    quick.flow.handlePlayFreshMatch();
    expect(quick.input.seriesResultCommitSignatureRef.current).toBe('');
    expect(quick.input.tournamentResultCommitSignatureRef.current).toBe('');
    expect(quick.input.setAutoSimMode).toHaveBeenCalledWith(null);
  });

  test('commits tournament matches once, generates the next round, and opens its next fixture', () => {
    const tournament = makeFlow({
      gameMode: MODE_TOURNAMENT,
      tournamentMatches: [
        { id: 'match-1', round: 1, matchNumber: 1, teamA: 'Falcons', teamB: 'Ravens', isComplete: false },
        { id: 'match-2', round: 1, matchNumber: 2, teamA: 'Hawks', teamB: 'Owls', winnerTeam: 'Hawks', isComplete: true },
      ],
    });
    tournament.flow.handleMatchPrimaryAction();
    expect(tournament.input.prepareTournamentMatch).toHaveBeenCalledWith(expect.objectContaining({
      round: 2,
      teamA: 'Falcons',
      teamB: 'Hawks',
    }));
    expect(tournament.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.TossTime,
    });
    expect(tournament.input.tournamentResultCommitSignatureRef.current).toContain('match-1|100|4|60|95|8|60');

    const duplicateSignature = 'match-1|100|4|60|95|8|60|Falcons won';
    const duplicate = makeFlow({
      gameMode: MODE_TOURNAMENT,
      tournamentResultCommitSignatureRef: { current: duplicateSignature },
      tournamentMatches: [{ id: 'match-1', round: 1, matchNumber: 1, winnerTeam: 'Falcons', isComplete: true }],
    });
    expect(duplicate.flow.commitTournamentMatchIfNeeded()).toEqual({
      mergedMatches: duplicate.input.tournamentMatches,
      winnerTeam: 'Falcons',
    });
    duplicate.flow.handleMatchPrimaryAction();
    expect(duplicate.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentChampionAction',
      payload: 'Falcons',
    });
    expect(duplicate.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.TournamentChampion,
    });
  });

  test('skips tournament commits outside a finished active fixture and supports empty tournament finals', () => {
    const inactive = makeFlow({
      gameMode: MODE_TOURNAMENT,
      stage: matchStatusEnum.TossTime,
      tournamentMatches: [{ id: 'match-1', teamA: 'Falcons', teamB: 'Ravens' }],
    });
    expect(inactive.flow.commitTournamentMatchIfNeeded()).toEqual({
      mergedMatches: inactive.input.tournamentMatches,
      winnerTeam: '',
    });

    const noMatch = makeFlow({
      gameMode: MODE_TOURNAMENT,
      tournamentCurrentMatchId: '',
      tournamentMatches: [],
    });
    noMatch.flow.handleMatchPrimaryAction();
    expect(noMatch.dispatch).toHaveBeenCalledWith({ type: 'setTournamentChampionAction', payload: '' });
  });

  test('covers tournament commit guards, missing schedules, and final-round ordering', () => {
    const wrongMode = makeFlow({ tournamentMatches: null });
    expect(wrongMode.flow.commitTournamentMatchIfNeeded()).toEqual({ mergedMatches: [], winnerTeam: '' });

    const wrongStage = makeFlow({
      gameMode: MODE_TOURNAMENT,
      stage: matchStatusEnum.TossTime,
      tournamentMatches: null,
    });
    expect(wrongStage.flow.commitTournamentMatchIfNeeded()).toEqual({ mergedMatches: [], winnerTeam: '' });

    const missingId = makeFlow({
      gameMode: MODE_TOURNAMENT,
      tournamentCurrentMatchId: '',
      tournamentMatches: null,
    });
    expect(missingId.flow.commitTournamentMatchIfNeeded()).toEqual({ mergedMatches: [], winnerTeam: '' });

    const emptySchedule = makeFlow({
      gameMode: MODE_TOURNAMENT,
      tournamentMatches: null,
    });
    expect(emptySchedule.flow.commitTournamentMatchIfNeeded()).toEqual({
      mergedMatches: [],
      winnerTeam: 'Falcons',
    });
    expect(emptySchedule.flow.commitTournamentMatchIfNeeded()).toEqual({
      mergedMatches: [],
      winnerTeam: 'Falcons',
    });

    const finals = makeFlow({
      gameMode: MODE_TOURNAMENT,
      tournamentMatches: [
        { id: 'old', round: 1, matchNumber: 1, isComplete: true, winnerTeam: 'Old Winner' },
        { id: 'latest-1', round: 2, matchNumber: 1, isComplete: true, winnerTeam: 'Latest Winner' },
        { id: 'latest-2', round: 2, matchNumber: 2, isComplete: true, winnerTeam: 'Other Winner' },
        { id: 'pending-no-team-a', round: 3, isComplete: false, teamA: '', teamB: 'B' },
        { id: 'pending-no-team-b', round: 3, isComplete: false, teamA: 'A', teamB: '' },
      ],
    });
    finals.flow.handleMatchPrimaryAction();
    expect(finals.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentChampionAction',
      payload: 'Other Winner',
    });
  });

  test('commits series scorelines and stats only once and prepares the next fixture', () => {
    const series = makeFlow({ gameMode: MODE_SERIES });
    series.flow.commitSeriesMatchIfNeeded();
    series.flow.commitSeriesMatchIfNeeded();
    expect(series.dispatch).toHaveBeenCalledTimes(2);
    expect(series.dispatch).toHaveBeenCalledWith({
      type: 'setSeriesResultsAction',
      payload: [expect.objectContaining({ winnerTeam: 'Falcons', matchNumber: 1 })],
    });
    expect(series.input.seriesResultCommitSignatureRef.current).toContain('1|100|4|60|95|8|60');

    series.flow.handleMatchPrimaryAction();
    expect(series.dispatch).toHaveBeenCalledWith({ type: 'setSeriesCurrentMatchAction', payload: 2 });
    expect(series.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.TossTime,
    });

    const tie = makeFlow({
      gameMode: MODE_SERIES,
      secondInnings: { score: 100, wickets: 10, balls: 60 },
    });
    tie.flow.commitSeriesMatchIfNeeded();
    expect(tie.dispatch).toHaveBeenCalledWith({
      type: 'setSeriesResultsAction',
      payload: [expect.objectContaining({ winnerTeam: 'Tie' })],
    });

    const chaseWin = makeFlow({
      gameMode: MODE_SERIES,
      seriesResults: null,
      firstInnings: { score: 100, wickets: 4, balls: 60 },
      secondInnings: { score: 101, wickets: 8, balls: 60 },
    });
    chaseWin.flow.commitSeriesMatchIfNeeded();
    expect(chaseWin.dispatch).toHaveBeenCalledWith({
      type: 'setSeriesResultsAction',
      payload: [expect.objectContaining({ winnerTeam: 'Ravens' })],
    });

    const lastMatch = makeFlow({ gameMode: MODE_SERIES, seriesCurrentMatch: 3, seriesLength: 3 });
    lastMatch.flow.handleMatchPrimaryAction();
    expect(lastMatch.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.SeriesSummary,
    });
  });

  test('does not commit series results when the stage or mode is not eligible', () => {
    const wrongMode = makeFlow({ stage: matchStatusEnum.TossTime });
    wrongMode.flow.commitSeriesMatchIfNeeded();
    expect(wrongMode.dispatch).not.toHaveBeenCalled();

    const wrongStage = makeFlow({ gameMode: MODE_SERIES, stage: matchStatusEnum.TossTime });
    wrongStage.flow.commitSeriesMatchIfNeeded();
    expect(wrongStage.dispatch).not.toHaveBeenCalled();
  });
});
