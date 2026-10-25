import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { MODE_CAREER, MODE_SERIES, MODE_TOURNAMENT } from '../../utils/controllerCommonUtils';
import { createNavigationHandlers } from './controllerNavigation';

const actionNames = [
  'setStageAction',
  'setTossCallAction',
  'setGameModeAction',
  'setTournamentChampionAction',
  'setTournamentMatchesAction',
  'setTournamentCurrentMatchIdAction',
  'setTournamentOpponentTeamsAction',
  'setTournamentPlayerStatsAction',
  'setSeriesCurrentMatchAction',
  'setSeriesResultsAction',
  'setSeriesPlayerStatsAction',
  'setSeriesLengthAction',
  'setCareerTeamAction',
  'setCareerPlayerProfileAction',
  'setCareerDomesticCountryAction',
  'setCareerDomesticTeamsAction',
  'setCareerGlobalPlayerPoolAction',
  'setCareerAuctionSummaryAction',
  'setCareerOffersAction',
  'setCareerRetiredAction',
  'setCareerSeasonAction',
  'setCareerSeasonLengthAction',
  'setCareerFormatAction',
  'setCareerMatchIndexAction',
  'setCareerScheduleAction',
  'setCareerStandingsAction',
  'setCareerPlayerStatsAction',
  'setCareerSeasonHistoryAction',
];

const makeNavigation = (overrides = {}) => {
  const actions = Object.fromEntries(
    actionNames.map((name) => [name, (payload) => ({ type: name, payload })])
  );
  const dispatch = jest.fn();
  const setSaveMessage = jest.fn();
  const prepareTournamentMatch = jest.fn();
  const handlers = createNavigationHandlers({
    stage: matchStatusEnum.ChooseGameMode,
    gameMode: 'quick',
    tournamentMatches: [],
    tournamentOpponentTeams: [],
    tournamentUserTeam: 'User Team',
    dispatch,
    setSaveMessage,
    prepareTournamentMatch,
    ...actions,
    ...overrides,
  });
  return { handlers, dispatch, setSaveMessage, prepareTournamentMatch };
};

const expectStage = (dispatch, stage) =>
  expect(dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: stage });

describe('match navigation', () => {
  test('advances special mode stages and prepares the next tournament fixture', () => {
    const series = makeNavigation({ stage: matchStatusEnum.ChooseGameMode, gameMode: MODE_SERIES });
    series.handlers.goToNextStage();
    expectStage(series.dispatch, matchStatusEnum.ChooseSeriesLength);

    const quick = makeNavigation({ stage: matchStatusEnum.ChooseGameMode });
    quick.handlers.goToNextStage();
    expectStage(quick.dispatch, matchStatusEnum.ChooseMatchType);

    const seriesLength = makeNavigation({ stage: matchStatusEnum.ChooseSeriesLength });
    seriesLength.handlers.goToNextStage();
    expectStage(seriesLength.dispatch, matchStatusEnum.ChooseMatchType);

    const opponent = makeNavigation({ stage: matchStatusEnum.ChooseOpponent });
    opponent.handlers.goToNextStage();
    expectStage(opponent.dispatch, matchStatusEnum.ChooseMatchLocation);

    const pendingMatch = { id: 'next', teamA: 'A', teamB: 'B', isComplete: false };
    const tournament = makeNavigation({
      stage: matchStatusEnum.ChooseCommentator,
      gameMode: MODE_TOURNAMENT,
      tournamentMatches: [
        { id: 'missing-first-team', isComplete: false, teamA: '', teamB: 'B' },
        { id: 'missing-team', isComplete: false, teamA: 'A', teamB: '' },
        pendingMatch,
      ],
    });
    tournament.handlers.goToNextStage();
    expect(tournament.prepareTournamentMatch).toHaveBeenCalledWith(pendingMatch);
    expect(tournament.dispatch).toHaveBeenCalledWith({ type: 'setTossCallAction', payload: '' });
    expectStage(tournament.dispatch, matchStatusEnum.TossTime);

    const noPendingMatch = makeNavigation({
      stage: matchStatusEnum.ChooseCommentator,
      gameMode: MODE_TOURNAMENT,
      tournamentMatches: null,
    });
    noPendingMatch.handlers.goToNextStage();
    expect(noPendingMatch.prepareTournamentMatch).not.toHaveBeenCalled();
    expectStage(noPendingMatch.dispatch, matchStatusEnum.TossTime);
  });

  test('moves backward through special stages and safely handles the ends of the stage list', () => {
    const seriesType = makeNavigation({ stage: matchStatusEnum.ChooseMatchType, gameMode: MODE_SERIES });
    seriesType.handlers.goToPreviousStage();
    expectStage(seriesType.dispatch, matchStatusEnum.ChooseSeriesLength);

    const quickType = makeNavigation({ stage: matchStatusEnum.ChooseMatchType });
    quickType.handlers.goToPreviousStage();
    expectStage(quickType.dispatch, matchStatusEnum.ChooseGameMode);

    const length = makeNavigation({ stage: matchStatusEnum.ChooseSeriesLength });
    length.handlers.goToPreviousStage();
    expectStage(length.dispatch, matchStatusEnum.ChooseGameMode);

    const tournamentSetup = makeNavigation({ stage: matchStatusEnum.SetupTournamentFixtures });
    tournamentSetup.handlers.goToPreviousStage();
    expectStage(tournamentSetup.dispatch, matchStatusEnum.ChooseOpponent);

    const regularLocation = makeNavigation({ stage: matchStatusEnum.ChooseMatchLocation });
    regularLocation.handlers.goToPreviousStage();
    expectStage(regularLocation.dispatch, matchStatusEnum.ChooseOpponent);

    const fallback = makeNavigation({ stage: matchStatusEnum.TossResult });
    fallback.handlers.goToPreviousStage();
    expectStage(fallback.dispatch, matchStatusEnum.TossTime);

    const firstStage = makeNavigation({ stage: matchStatusEnum.ChooseGameMode });
    firstStage.handlers.goToPreviousStage();
    expect(firstStage.dispatch).not.toHaveBeenCalled();

    const lastStage = makeNavigation({ stage: matchStatusEnum.TournamentChampion });
    lastStage.handlers.goToNextStage();
    expect(lastStage.dispatch).not.toHaveBeenCalled();
  });

  test('resets non-career state for other modes and preserves career state when entering career mode', () => {
    const quick = makeNavigation();
    quick.handlers.selectGameMode('quick');
    expect(quick.dispatch).toHaveBeenCalledWith({ type: 'setGameModeAction', payload: 'quick' });
    expect(quick.dispatch).toHaveBeenCalledWith({ type: 'setCareerTeamAction', payload: '' });
    expect(quick.dispatch).toHaveBeenCalledWith({ type: 'setCareerPlayerProfileAction', payload: null });
    expect(quick.dispatch).toHaveBeenCalledWith({ type: 'setCareerSeasonLengthAction', payload: 'standard' });
    expectStage(quick.dispatch, matchStatusEnum.ChooseMatchType);

    const tournament = makeNavigation();
    tournament.handlers.selectGameMode(MODE_TOURNAMENT);
    expect(tournament.dispatch).toHaveBeenCalledWith({ type: 'setSeriesLengthAction', payload: 1 });
    expectStage(tournament.dispatch, matchStatusEnum.ChooseMatchType);

    const series = makeNavigation();
    series.handlers.selectGameMode(MODE_SERIES);
    expectStage(series.dispatch, matchStatusEnum.ChooseSeriesLength);

    const career = makeNavigation();
    career.handlers.selectGameMode(MODE_CAREER);
    expect(career.dispatch).not.toHaveBeenCalledWith({ type: 'setCareerTeamAction', payload: '' });
    expect(career.dispatch).toHaveBeenCalledWith({ type: 'setSeriesLengthAction', payload: 1 });
    expectStage(career.dispatch, matchStatusEnum.CareerSetup);
  });

  test('clamps series length and clears prior series results', () => {
    const min = makeNavigation();
    min.handlers.selectSeriesLength('invalid');
    expect(min.dispatch).toHaveBeenCalledWith({ type: 'setSeriesLengthAction', payload: 2 });

    const max = makeNavigation();
    max.handlers.selectSeriesLength(99);
    expect(max.dispatch).toHaveBeenCalledWith({ type: 'setSeriesLengthAction', payload: 7 });
    expect(max.dispatch).toHaveBeenCalledWith({ type: 'setSeriesCurrentMatchAction', payload: 1 });
    expect(max.dispatch).toHaveBeenCalledWith({ type: 'setSeriesResultsAction', payload: [] });
    expect(max.dispatch).toHaveBeenCalledWith({ type: 'setSeriesPlayerStatsAction', payload: {} });
    expectStage(max.dispatch, matchStatusEnum.ChooseMatchType);
  });
});

describe('tournament fixture navigation', () => {
  test('toggles opponents, respects user and team-count constraints, and randomizes fixtures', () => {
    const navigation = makeNavigation({
      tournamentUserTeam: 'User Team',
      tournamentOpponentTeams: ['Team 1'],
    });
    navigation.handlers.toggleTournamentOpponent('');
    navigation.handlers.toggleTournamentOpponent('User Team');
    navigation.handlers.toggleTournamentOpponent('Team 2');
    expect(navigation.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentOpponentTeamsAction',
      payload: ['Team 1', 'Team 2'],
    });

    navigation.dispatch.mockClear();
    navigation.handlers.toggleTournamentOpponent('Team 1');
    expect(navigation.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentOpponentTeamsAction',
      payload: [],
    });

    const capped = makeNavigation({
      tournamentOpponentTeams: Array.from({ length: 15 }, (_, index) => `Team ${index}`),
    });
    capped.handlers.toggleTournamentOpponent('Team 16');
    expect(capped.dispatch).not.toHaveBeenCalled();

    const malformed = makeNavigation({ tournamentOpponentTeams: 'invalid' });
    malformed.handlers.toggleTournamentOpponent('Team A');
    expect(malformed.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentOpponentTeamsAction',
      payload: ['Team A'],
    });

    const randomize = makeNavigation({
      tournamentOpponentTeams: ['A', 'B', 'C'],
    });
    randomize.handlers.randomizeTournamentFixtures();
    const fixtureAction = randomize.dispatch.mock.calls[0][0];
    expect(fixtureAction.type).toBe('setTournamentMatchesAction');
    expect(fixtureAction.payload).toHaveLength(2);

    const emptyTournament = makeNavigation({ tournamentOpponentTeams: null });
    emptyTournament.handlers.randomizeTournamentFixtures();
    expect(emptyTournament.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentMatchesAction',
      payload: [],
    });
  });

  test('updates fixtures and validates tournament preparation and confirmation', () => {
    const invalidCount = makeNavigation({ tournamentOpponentTeams: ['A', 'B'] });
    invalidCount.handlers.prepareTournamentFixtures();
    expect(invalidCount.setSaveMessage).toHaveBeenCalledWith('Tournament needs exactly 3, 7, or 15 opponents.');
    expect(invalidCount.dispatch).not.toHaveBeenCalled();

    const prepared = makeNavigation({ tournamentOpponentTeams: ['A', 'B', 'C'] });
    prepared.handlers.prepareTournamentFixtures();
    expect(prepared.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'setTournamentMatchesAction', payload: expect.any(Array) })
    );
    expectStage(prepared.dispatch, matchStatusEnum.SetupTournamentFixtures);

    const noUserTeam = makeNavigation({
      tournamentUserTeam: '',
      tournamentOpponentTeams: ['A', 'B', 'C'],
    });
    noUserTeam.handlers.prepareTournamentFixtures();
    expect(noUserTeam.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'setTournamentMatchesAction', payload: expect.any(Array) })
    );

    const updated = makeNavigation({
      tournamentMatches: [
        { id: 'R1-M1', round: 1, teamA: 'User Team', teamB: 'A' },
        { id: 'R1-M2', round: 1, teamA: 'B', teamB: 'C' },
      ],
      tournamentOpponentTeams: ['A', 'B', 'C'],
    });
    updated.handlers.updateTournamentFixture('R1-M2', 'date', '2026-01-01');
    expect(updated.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentMatchesAction',
      payload: [
        { id: 'R1-M1', round: 1, teamA: 'User Team', teamB: 'A' },
        { id: 'R1-M2', round: 1, teamA: 'B', teamB: 'C', date: '2026-01-01' },
      ],
    });

    const missingMatches = makeNavigation({ tournamentMatches: null });
    missingMatches.handlers.updateTournamentFixture('missing', 'date', '2026-01-01');
    expect(missingMatches.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentMatchesAction',
      payload: [],
    });

    const missingOpponents = makeNavigation({ tournamentOpponentTeams: null });
    missingOpponents.handlers.prepareTournamentFixtures();
    expect(missingOpponents.setSaveMessage).toHaveBeenCalledWith('Tournament needs exactly 3, 7, or 15 opponents.');

    const missingConfirmationData = makeNavigation({
      tournamentOpponentTeams: null,
      tournamentMatches: null,
    });
    missingConfirmationData.handlers.confirmTournamentFixtures();
    expect(missingConfirmationData.setSaveMessage).toHaveBeenCalledWith(
      'Each team must appear exactly once in first-round fixtures.'
    );

    const invalidFixtures = makeNavigation({
      tournamentOpponentTeams: ['A', 'B', 'C'],
      tournamentMatches: [{ id: 'bad', round: 1, teamA: 'User Team', teamB: 'A' }],
    });
    invalidFixtures.handlers.confirmTournamentFixtures();
    expect(invalidFixtures.setSaveMessage).toHaveBeenCalledWith(
      'Each team must appear exactly once in first-round fixtures.'
    );
    expect(invalidFixtures.dispatch).not.toHaveBeenCalled();

    const confirmed = makeNavigation({
      tournamentOpponentTeams: ['A', 'B', 'C'],
      tournamentMatches: [
        { id: 'R1-M1', round: 1, teamA: 'User Team', teamB: 'A' },
        { id: 'R1-M2', round: 1, teamA: 'B', teamB: 'C' },
      ],
    });
    confirmed.handlers.confirmTournamentFixtures();
    expect(confirmed.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentCurrentMatchIdAction',
      payload: 'R1-M1',
    });
    expectStage(confirmed.dispatch, matchStatusEnum.ChooseMatchLocation);

    const fixtureWithoutId = makeNavigation({
      tournamentUserTeam: '',
      tournamentOpponentTeams: ['A', 'B', 'C', 'D'],
      tournamentMatches: [
        { round: 1, teamA: 'A', teamB: 'B' },
        { id: 'R1-M2', round: 1, teamA: 'C', teamB: 'D' },
      ],
    });
    fixtureWithoutId.handlers.confirmTournamentFixtures();
    expect(fixtureWithoutId.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentCurrentMatchIdAction',
      payload: '',
    });
  });
});
