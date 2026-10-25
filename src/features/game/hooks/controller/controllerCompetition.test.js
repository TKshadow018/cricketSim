import { createCompetitionHandlers } from './controllerCompetition';
import { MODE_QUICK, MODE_SERIES, MODE_TOURNAMENT } from '../../utils/controllerCommonUtils';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';

jest.mock('../../../../utils/speechUtils', () => ({
  announceTeamChoice: jest.fn(),
  speak: jest.fn(),
}));

jest.mock('../../../../utils/simulatorUtils', () => ({
  ...jest.requireActual('../../../../utils/simulatorUtils'),
  getOpponentDecision: jest.fn(),
}));

jest.mock('../../utils/controllerCommonUtils', () => ({
  ...jest.requireActual('../../utils/controllerCommonUtils'),
  randomKey: jest.fn((values) => Object.keys(values)[0]),
}));

import { getOpponentDecision } from '../../../../utils/simulatorUtils';
import { randomKey } from '../../utils/controllerCommonUtils';

const actionNames = [
  'setTossDecisionAction',
  'setFirstBattingSideAction',
  'setStageAction',
  'setOwnPlayingXIAction',
  'setOpponentPlayingXIAction',
  'setOwnTeamRolesAction',
  'setOpponentTeamRolesAction',
  'setOwnCustomPlayersAction',
  'setOpponentCustomPlayersAction',
  'setOwnTeamAction',
  'setOpponentTeamAction',
  'setBattingIntentAction',
  'setBowlingIntentAction',
  'setFirstInningsAction',
  'setSecondInningsAction',
  'setShowScoreboardAction',
  'setTournamentCurrentMatchIdAction',
  'setTournamentMatchesAction',
  'setTournamentPlayerStatsAction',
  'setSeriesResultsAction',
  'setSeriesPlayerStatsAction',
  'setTossWinnerAction',
  'setTossCallAction',
  'setMatchConditionAction',
  'setSeriesCurrentMatchAction',
  'setTournamentChampionAction',
];

const makeHandler = (overrides = {}) => {
  const dispatch = jest.fn();
  const actions = Object.fromEntries(actionNames.map((name) => [name, (payload) => ({ type: name, payload })]));
  const ownPlayers = [{ id: 1, name: 'A', isWicketKeeper: true }, { id: 2, name: 'B' }];
  const opponentPlayers = [{ id: 3, name: 'C', isWicketKeeper: true }, { id: 4, name: 'D' }];
  const input = {
    dispatch,
    gameMode: MODE_QUICK,
    ownTeam: 'Falcons',
    opponentTeam: 'Ravens',
    userTeamName: 'Falcons',
    firstBattingSide: 'own',
    openInnings: jest.fn(),
    ownSelectedXIIds: [1, 2],
    opponentSelectedXIIds: [3, 4],
    availableOwnPlayers: ownPlayers,
    availableOpponentPlayers: opponentPlayers,
    ownSanitizedRoles: { captainId: 1, viceCaptainId: 2, wicketKeeperId: 1 },
    opponentSanitizedRoles: { captainId: 3, viceCaptainId: 4, wicketKeeperId: 3 },
    sanitizeRoles: jest.fn((roles, ids) => ({ ...roles, selectedIds: ids })),
    pickDefaultRoles: jest.fn(() => ({ captainId: 1, viceCaptainId: 2, wicketKeeperId: 1 })),
    ownSelectedXIPlayers: ownPlayers,
    opponentSelectedXIPlayers: opponentPlayers,
    ownCustomPlayers: [],
    opponentCustomPlayers: [],
    ownXIReady: true,
    opponentXIReady: true,
    ownRolesReady: true,
    opponentRolesReady: true,
    tournamentResultCommitSignatureRef: { current: 'old-tournament' },
    tournamentPlayerStats: [],
    firstInnings: { score: 100, wickets: 4, balls: 60 },
    secondInnings: { score: 95, wickets: 8, balls: 60 },
    firstInningsTeamName: 'Falcons',
    secondInningsTeamName: 'Ravens',
    tournamentCurrentMatchId: 'match-1',
    tournamentMatches: [],
    resultSummary: 'Falcons won',
    seriesPlayerStats: [],
    seriesCurrentMatch: 1,
    seriesResultCommitSignatureRef: { current: 'old-series' },
    seriesResults: [],
    setSeriesResultsAction: actions.setSeriesResultsAction,
    setSeriesPlayerStatsAction: actions.setSeriesPlayerStatsAction,
    setTossWinnerAction: actions.setTossWinnerAction,
    setTossCallAction: actions.setTossCallAction,
    setMatchConditionAction: actions.setMatchConditionAction,
    seriesCurrent: 1,
    seriesLength: 3,
    setSeriesCurrentMatchAction: actions.setSeriesCurrentMatchAction,
    setAutoSimMode: jest.fn(),
    tournamentUserTeam: 'Falcons',
    tournamentOpponentTeams: ['Ravens'],
    stage: matchStatusEnum.MatchEnd,
    matchCondition: { weather: 'sunny' },
    selectedStadium: 'Oval',
    venueStadiums: [{ name: 'Oval', pitchType: 'dusty', outfieldType: 'wetWithDew' }],
    ...actions,
    ...overrides,
  };
  return { handlers: createCompetitionHandlers(input), input, dispatch, actions };
};

describe('createCompetitionHandlers', () => {
  test('handles toss decisions and keeps XI, role, and auto-pick updates valid', () => {
    const { handlers, input, dispatch, actions } = makeHandler({ gameMode: MODE_TOURNAMENT });
    handlers.handleUserTossDecision('bat');
    expect(input.openInnings).toHaveBeenCalledWith('own');
    const quick = makeHandler();
    quick.handlers.handleUserTossDecision('bowl');
    expect(quick.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.ChooseOwnPlayingXI,
    });

    handlers.moveOwnPlayerToXI(1);
    handlers.moveOwnPlayerToXI(3);
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: [1, 2, 3] });
    handlers.removeOwnPlayerFromXI(99);
    handlers.removeOwnPlayerFromXI(2);
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnTeamRolesAction', payload: { ...input.ownSanitizedRoles, selectedIds: [1] } });
    handlers.moveOpponentPlayerToXI(3);
    handlers.removeOpponentPlayerFromXI(4);
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOpponentTeamRolesAction', payload: { ...input.opponentSanitizedRoles, selectedIds: [3] } });

    handlers.setOwnRole('wicketKeeperId', 2);
    handlers.setOwnRole('captainId', 2);
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnTeamRolesAction', payload: { ...input.ownSanitizedRoles, captainId: 2, viceCaptainId: null } });
    handlers.setOpponentRole('viceCaptainId', 3);
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOpponentTeamRolesAction', payload: { ...input.opponentSanitizedRoles, viceCaptainId: 3, captainId: null } });

    handlers.autoPickOwnXI();
    handlers.autoPickOpponentXI();
    expect(input.pickDefaultRoles).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'setOwnPlayingXIAction' }));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'setOpponentPlayingXIAction' }));
    handlers.startMatchWithSelectedXI();
    expect(input.openInnings).toHaveBeenCalledWith('own');
    expect(actions.setOwnPlayingXIAction).toBeDefined();
  });

  test('covers alternate user-side, selection, and role paths', () => {
    const opponentUser = makeHandler({ userTeamName: 'Ravens' });
    opponentUser.handlers.handleUserTossDecision('bat');
    expect(opponentUser.dispatch).toHaveBeenCalledWith({
      type: 'setFirstBattingSideAction',
      payload: 'opponent',
    });
    const opponentUserBowls = makeHandler({ userTeamName: 'Ravens' });
    opponentUserBowls.handlers.handleUserTossDecision('bowl');
    expect(opponentUserBowls.dispatch).toHaveBeenCalledWith({
      type: 'setFirstBattingSideAction',
      payload: 'own',
    });
    const defaultUserName = makeHandler({ userTeamName: '' });
    defaultUserName.handlers.handleUserTossDecision('bat');
    expect(defaultUserName.dispatch).toHaveBeenCalledWith({
      type: 'setFirstBattingSideAction',
      payload: 'opponent',
    });

    const missingPlayers = makeHandler({
      ownSelectedXIIds: [1],
      opponentSelectedXIIds: [3],
    });
    missingPlayers.handlers.moveOwnPlayerToXI(99);
    missingPlayers.handlers.moveOpponentPlayerToXI(99);
    missingPlayers.handlers.removeOwnPlayerFromXI(99);
    missingPlayers.handlers.removeOpponentPlayerFromXI(99);
    expect(missingPlayers.dispatch).toHaveBeenCalledWith({
      type: 'setOwnPlayingXIAction',
      payload: [1, 99],
    });
    expect(missingPlayers.dispatch).toHaveBeenCalledWith({
      type: 'setOpponentPlayingXIAction',
      payload: [3, 99],
    });
    const knownPlayers = makeHandler({
      ownSelectedXIIds: [],
      opponentSelectedXIIds: [],
    });
    knownPlayers.handlers.moveOwnPlayerToXI(1);
    knownPlayers.handlers.moveOpponentPlayerToXI(3);
    expect(knownPlayers.dispatch).toHaveBeenCalledWith({
      type: 'setOwnPlayingXIAction',
      payload: [1],
    });
    expect(knownPlayers.dispatch).toHaveBeenCalledWith({
      type: 'setOpponentPlayingXIAction',
      payload: [3],
    });
    const removedPlayersUnavailable = makeHandler({
      ownSelectedXIIds: [9],
      opponentSelectedXIIds: [10],
      availableOwnPlayers: [],
      availableOpponentPlayers: [],
    });
    removedPlayersUnavailable.handlers.removeOwnPlayerFromXI(9);
    removedPlayersUnavailable.handlers.removeOpponentPlayerFromXI(10);
    expect(removedPlayersUnavailable.dispatch).toHaveBeenCalledWith({
      type: 'setOwnPlayingXIAction',
      payload: [],
    });
    expect(removedPlayersUnavailable.dispatch).toHaveBeenCalledWith({
      type: 'setOpponentPlayingXIAction',
      payload: [],
    });

    const fullXIs = makeHandler({
      ownSelectedXIIds: Array.from({ length: 11 }, (_, index) => index),
      opponentSelectedXIIds: Array.from({ length: 11 }, (_, index) => index),
    });
    fullXIs.handlers.moveOwnPlayerToXI(12);
    fullXIs.handlers.moveOpponentPlayerToXI(12);
    expect(fullXIs.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({
      type: 'setOwnPlayingXIAction',
    }));

    const roles = makeHandler();
    roles.handlers.setOwnRole('wicketKeeperId', null);
    roles.handlers.setOwnRole('wicketKeeperId', 99);
    roles.handlers.setOwnRole('wicketKeeperId', 1);
    roles.handlers.setOwnRole('viceCaptainId', 1);
    roles.handlers.setOwnRole('captainId', 1);
    roles.handlers.setOpponentRole('wicketKeeperId', null);
    roles.handlers.setOpponentRole('wicketKeeperId', 99);
    roles.handlers.setOpponentRole('wicketKeeperId', 3);
    roles.handlers.setOpponentRole('captainId', 4);
    expect(roles.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setOwnTeamRolesAction',
      payload: expect.objectContaining({ wicketKeeperId: null }),
    }));
    expect(roles.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setOpponentTeamRolesAction',
      payload: expect.objectContaining({ wicketKeeperId: 3 }),
    }));
  });

  test('creates custom players for both teams and starts only when both XIs and roles are ready', () => {
    const { handlers, input, dispatch } = makeHandler({
      ownXIReady: false,
      ownSelectedXIIds: Array.from({ length: 11 }, (_, index) => index + 1),
      ownCustomPlayers: [{ id: 11, name: 'Existing' }],
    });
    handlers.startMatchWithSelectedXI();
    expect(input.openInnings).not.toHaveBeenCalled();

    const payload = {
      name: 'Custom',
      abilityToPlayPaceBall: 70,
      abilityToPlaySpinBall: 65,
      battingAggresion: 50,
      isWicketKeeper: true,
      spinAbility: 60,
      paceAbility: 55,
    };
    handlers.createCustomPlayer('own', payload);
    handlers.createCustomPlayer('opponent', payload);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setOwnCustomPlayersAction',
      payload: [input.ownCustomPlayers[0], expect.objectContaining({ id: 3, name: 'Custom', isWicketKeeper: true })],
    }));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setOpponentCustomPlayersAction',
      payload: [expect.objectContaining({ id: 5, name: 'Custom' })],
    }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: input.ownSelectedXIIds });
  });

  test('creates custom players when team rosters or custom-player lists are empty', () => {
    const own = makeHandler({
      availableOwnPlayers: [],
      ownCustomPlayers: null,
      ownSelectedXIIds: [],
    });
    own.handlers.createCustomPlayer('own', {
      name: 'First',
      abilityToPlayPaceBall: 60,
      abilityToPlaySpinBall: 60,
      battingAggresion: 50,
      spinAbility: 50,
      paceAbility: 50,
    });
    expect(own.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setOwnCustomPlayersAction',
      payload: [expect.objectContaining({ id: 1, name: 'First' })],
    }));

    const opponent = makeHandler({
      availableOpponentPlayers: [{ id: 0, name: 'Zero' }],
      opponentCustomPlayers: null,
      opponentSelectedXIIds: [],
    });
    opponent.handlers.createCustomPlayer('opponent', {
      name: 'Second',
      abilityToPlayPaceBall: 60,
      abilityToPlaySpinBall: 60,
      battingAggresion: 50,
      spinAbility: 50,
      paceAbility: 50,
    });
    expect(opponent.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setOpponentCustomPlayersAction',
      payload: [expect.objectContaining({ id: 1, name: 'Second' })],
    }));
  });

  test('prepares tournament matches and ignores incomplete fixtures', () => {
    const { handlers, input, dispatch } = makeHandler();
    handlers.prepareTournamentMatch({ id: 'incomplete', teamA: 'Falcons' });
    expect(dispatch).not.toHaveBeenCalled();
    handlers.prepareTournamentMatch({ id: 'next', teamA: 'Falcons', teamB: 'Hawks' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnTeamAction', payload: 'Falcons' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOpponentTeamAction', payload: 'Hawks' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setTournamentCurrentMatchIdAction', payload: 'next' });
    expect(input.tournamentResultCommitSignatureRef.current).toBe('');
  });

  test('resolves stadium conditions and handles quick, series, and tournament results', () => {
    const quick = makeHandler();
    quick.handlers.matchPrimaryAction();
    expect(quick.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'game/resetMatchRuntime' }));

    const series = makeHandler({ gameMode: MODE_SERIES, seriesCurrentMatch: 1, seriesLength: 2 });
    series.handlers.matchPrimaryAction();
    expect(series.dispatch).toHaveBeenCalledWith({
      type: 'setSeriesResultsAction',
      payload: [expect.objectContaining({ matchNumber: 1, winnerTeam: 'Falcons' })],
    });
    expect(series.dispatch).toHaveBeenCalledWith({ type: 'setSeriesCurrentMatchAction', payload: 2 });
    expect(series.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.TossTime });

    const finalSeries = makeHandler({ gameMode: MODE_SERIES, seriesCurrentMatch: 3, seriesLength: 3 });
    finalSeries.handlers.matchPrimaryAction();
    expect(finalSeries.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.SeriesSummary });

    const seriesWin = makeHandler({
      gameMode: MODE_SERIES,
      firstInnings: { score: 90, wickets: 4, balls: 60 },
      secondInnings: { score: 100, wickets: 3, balls: 55 },
      seriesResults: null,
      seriesLength: 2,
    });
    seriesWin.handlers.matchPrimaryAction();
    expect(seriesWin.dispatch).toHaveBeenCalledWith({
      type: 'setSeriesResultsAction',
      payload: [expect.objectContaining({ winnerTeam: 'Ravens' })],
    });

    const seriesTie = makeHandler({
      gameMode: MODE_SERIES,
      firstInnings: { score: 90, wickets: 4, balls: 60 },
      secondInnings: { score: 90, wickets: 3, balls: 55 },
      seriesCurrentMatch: 1,
      seriesLength: 2,
    });
    seriesTie.handlers.matchPrimaryAction();
    expect(seriesTie.dispatch).toHaveBeenCalledWith({
      type: 'setSeriesResultsAction',
      payload: [expect.objectContaining({ winnerTeam: 'Tie' })],
    });

    const tournament = makeHandler({
      gameMode: MODE_TOURNAMENT,
      tournamentMatches: [{ id: 'match-1', teamA: 'Falcons', teamB: 'Ravens', round: 1, matchNumber: 1 }],
    });
    tournament.handlers.matchPrimaryAction();
    expect(tournament.dispatch).toHaveBeenCalledWith({ type: 'setTournamentChampionAction', payload: 'Falcons' });
    expect(tournament.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.TournamentChampion });

    const tournamentNextMatch = makeHandler({
      gameMode: MODE_TOURNAMENT,
      tournamentMatches: [
        { id: 'match-1', teamA: 'Falcons', teamB: 'Ravens', round: 1, matchNumber: 1 },
        { id: 'match-2', teamA: 'Lions', teamB: 'Hawks', round: 1, matchNumber: 2, isComplete: false },
      ],
    });
    tournamentNextMatch.handlers.matchPrimaryAction();
    expect(tournamentNextMatch.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentCurrentMatchIdAction',
      payload: 'match-2',
    });
    expect(tournamentNextMatch.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.TossTime,
    });

    const emptyTournament = makeHandler({
      gameMode: MODE_TOURNAMENT,
      tournamentMatches: null,
    });
    emptyTournament.handlers.matchPrimaryAction();
    expect(emptyTournament.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentChampionAction',
      payload: '',
    });

    const orderedFinals = makeHandler({
      gameMode: MODE_TOURNAMENT,
      tournamentCurrentMatchId: 'final',
      tournamentMatches: [
        { id: 'earlier-2', round: 1, matchNumber: 2, isComplete: true, winnerTeam: 'Lions' },
        { id: 'earlier-1', round: 1, matchNumber: 1, isComplete: true, winnerTeam: 'Hawks' },
        { id: 'final', round: 2, matchNumber: 1, teamA: 'Falcons', teamB: 'Ravens' },
      ],
    });
    orderedFinals.handlers.matchPrimaryAction();
    expect(orderedFinals.dispatch).toHaveBeenCalledWith({
      type: 'setTournamentChampionAction',
      payload: 'Falcons',
    });

    tournament.handlers.setSelectedStadium('unknown');
    expect(tournament.dispatch).toHaveBeenCalledWith({
      type: 'setMatchConditionAction',
      payload: { weather: 'sunny', pitch: 'sporting', outfield: 'lushGreen' },
    });
  });

  test('resets match state, updates stadium, and records toss call outcomes', () => {
    const { handlers, input, dispatch } = makeHandler();
    handlers.resetMatch();
    expect(input.setAutoSimMode).toHaveBeenCalledWith(null);
    expect(input.seriesResultCommitSignatureRef.current).toBe('');
    handlers.setSelectedStadium('Oval');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setMatchConditionAction',
      payload: { weather: 'sunny', pitch: 'dusty', outfield: 'wetWithDew' },
    });

    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9);
    handlers.handleTossCall('crown');
    expect(dispatch).toHaveBeenCalledWith({ type: 'setTossWinnerAction', payload: 'Falcons' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setTossDecisionAction', payload: 'bat' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setFirstBattingSideAction', payload: 'own' });
    randomSpy.mockReturnValue(0);
    handlers.handleTossCall('crown');
    expect(dispatch).toHaveBeenCalledWith({ type: 'setTossWinnerAction', payload: 'Ravens' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.TossResult });
    randomSpy.mockRestore();

    getOpponentDecision.mockReturnValue('bat');
    const opponentToss = makeHandler({
      userTeamName: 'Ravens',
      venueStadiums: null,
      matchCondition: {},
    });
    const deterministicToss = jest.spyOn(Math, 'random').mockReturnValue(0);
    randomKey.mockReturnValueOnce('');
    opponentToss.handlers.setSelectedStadium('unknown');
    expect(opponentToss.dispatch).toHaveBeenCalledWith({
      type: 'setMatchConditionAction',
      payload: { weather: 'sunny', pitch: 'sporting', outfield: 'lushGreen' },
    });
    opponentToss.handlers.handleTossCall('crown');
    expect(opponentToss.dispatch).toHaveBeenCalledWith({
      type: 'setFirstBattingSideAction',
      payload: 'own',
    });
    getOpponentDecision.mockReturnValue('bowl');
    opponentToss.handlers.handleTossCall('crown');
    expect(opponentToss.dispatch).toHaveBeenCalledWith({
      type: 'setFirstBattingSideAction',
      payload: 'opponent',
    });

    const userWinsAsOpponent = makeHandler({ userTeamName: 'Ravens' });
    deterministicToss.mockReturnValue(0.9);
    userWinsAsOpponent.handlers.handleTossCall('crown');
    expect(userWinsAsOpponent.dispatch).toHaveBeenCalledWith({
      type: 'setFirstBattingSideAction',
      payload: 'opponent',
    });

    const userNameFallback = makeHandler({ userTeamName: '' });
    deterministicToss.mockReturnValue(0);
    getOpponentDecision.mockReturnValue('bowl');
    userNameFallback.handlers.handleTossCall('crown');
    expect(userNameFallback.dispatch).toHaveBeenCalledWith({
      type: 'setTossWinnerAction',
      payload: 'Ravens',
    });

    getOpponentDecision.mockReturnValue('bat');
    const opponentWinsBatting = makeHandler();
    opponentWinsBatting.handlers.handleTossCall('crown');
    expect(opponentWinsBatting.dispatch).toHaveBeenCalledWith({
      type: 'setFirstBattingSideAction',
      payload: 'opponent',
    });
    deterministicToss.mockRestore();
  });
});
