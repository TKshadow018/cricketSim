import React from 'react';
import { render } from '@testing-library/react';
import { useCricketSimulatorController } from './useCricketSimulatorController';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';

let mockState;
let mockDispatch;
let mockRuntime;
let mockNavigation;

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockState),
}));

jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/game', state: null }) }));
jest.mock('../../../config/runtimeConfig', () => ({ getEffectiveAuthUser: (user) => user }));
jest.mock('../../../utils/speechUtils', () => ({
  setPreferredVoice: jest.fn(),
  speak: jest.fn(),
}));
jest.mock('../../../gameData/playerListForNation', () => ({
  getPlayersForNations: jest.fn(() => ({
    ownPlayers: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
    opponentPlayers: [{ id: 3, name: 'Cara' }],
  })),
  playerListForNation: { India: [{ id: 1, name: 'Fallback' }] },
}));

jest.mock('../utils/controllerCommonUtils', () => ({
  MODE_SERIES: 'series',
  MODE_TOURNAMENT: 'tournament',
  MODE_CAREER: 'career',
  buildPlayingXI: jest.fn((players, ids = []) => players.filter((player) => ids.includes(player.id))),
  normalizePlayingXIIds: jest.fn((players, ids = []) => ids.filter((id) => players.some((player) => player.id === id))),
  pickDefaultRoles: jest.fn(() => ({ captainId: 1, viceCaptainId: 2, wicketKeeperId: 1 })),
  sanitizeRoles: jest.fn((roles) => ({
    captainId: roles?.captainId || null,
    viceCaptainId: roles?.viceCaptainId || null,
    wicketKeeperId: roles?.wicketKeeperId || null,
  })),
}));

jest.mock('./controller/controllerNavigation', () => ({
  createNavigationHandlers: jest.fn(() => mockNavigation),
}));
jest.mock('./controller/useControllerRuntimeFromContext', () => ({
  useControllerRuntimeFromContext: jest.fn(() => mockRuntime),
}));
jest.mock('./controller/useControllerBootstrap', () => ({ useControllerBootstrap: jest.fn() }));
jest.mock('./controller/controllerTournamentMatchPrep', () => ({
  prepareTournamentMatchState: jest.fn(),
}));
jest.mock('./controller/controllerInningsCore', () => ({
  getInningsContext: jest.fn(() => ({ ownPlayers: [], opponentPlayers: [] })),
  handleSelectBowler: jest.fn(),
  handleSelectNextBatter: jest.fn(),
  handleSelectOpener: jest.fn(),
  openInnings: jest.fn(),
  updateInningsState: jest.fn(),
}));
jest.mock('./controller/controllerDeliveryEngine', () => ({ processDelivery: jest.fn() }));
jest.mock('./controller/controllerInningsViewModel', () => ({
  buildInningsViewModel: jest.fn(),
}));

const makeGame = (overrides = {}) => ({
  stage: matchStatusEnum.ChooseOwnPlayingXI,
  gameMode: 'career',
  seriesLength: 3,
  seriesCurrentMatch: 2,
  seriesResults: [],
  seriesPlayerStats: {},
  tournamentUserTeam: 'Falcons',
  tournamentOpponentTeams: ['Ravens'],
  tournamentMatches: [],
  tournamentCurrentMatchId: '',
  tournamentChampion: '',
  tournamentPlayerStats: {},
  careerTeam: 'Falcons',
  careerPlayerProfile: { playerId: 1, name: 'Alice' },
  careerDomesticCountry: 'India',
  careerDomesticTeams: [
    { name: 'Falcons', country: 'India', players: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] },
    { name: 'Ravens', country: 'India', players: [{ id: 3, name: 'Cara' }] },
  ],
  careerGlobalPlayerPool: [],
  careerAuctionSummary: null,
  careerOffers: [],
  careerRetired: false,
  careerSeason: 3,
  careerSeasonLength: 'short',
  careerFormat: 't20',
  careerMatchIndex: 1,
  careerSchedule: [],
  careerStandings: {},
  careerPlayerStats: {},
  careerSeasonHistory: [],
  matchTypeKey: 't20',
  ownTeam: 'Falcons',
  opponentTeam: 'Ravens',
  ownPlayingXI: [1],
  opponentPlayingXI: [3],
  ownCustomPlayers: [],
  opponentCustomPlayers: [],
  ownTeamRoles: { captainId: 1, viceCaptainId: 2, wicketKeeperId: 1 },
  opponentTeamRoles: { captainId: 3, viceCaptainId: 2, wicketKeeperId: 3 },
  locationCountry: 'India',
  selectedStadium: 'National Ground',
  commentator: 'Voice One',
  tossWinner: 'Falcons',
  firstBattingSide: 'own',
  matchCondition: { weather: 'sunny', pitch: 'sporting', outfield: 'lushGreen' },
  battingIntent: 'normal',
  battingTactics: {
    approach: 'balanced',
    shot: 'rotate',
    target: 'straight',
    retainShotAndTarget: false,
  },
  bowlingIntent: 'normal',
  bowlingTactics: {
    overPlan: 'balanced',
    fieldPreset: 'balanced',
    line: 'stumps',
    length: 'good',
    variation: 'stock',
    specialDeliveryArmed: false,
  },
  firstInnings: { score: 100, wickets: 3, balls: 120 },
  secondInnings: { score: 101, wickets: 4, balls: 118 },
  showScoreboard: false,
  ...overrides,
});

const makeNavigation = () => ({
  goToNextStage: jest.fn(),
  goToPreviousStage: jest.fn(),
  selectGameMode: jest.fn(),
  selectSeriesLength: jest.fn(),
  toggleTournamentOpponent: jest.fn(),
  randomizeTournamentFixtures: jest.fn(),
  updateTournamentFixture: jest.fn(),
  prepareTournamentFixtures: jest.fn(),
  confirmTournamentFixtures: jest.fn(),
});

const makeRuntime = () => ({
  matchPrimaryAction: jest.fn(),
  setBattingIntent: jest.fn(),
  setBattingTactics: jest.fn(),
  setBowlingIntent: jest.fn(),
  setBowlingTactics: jest.fn(),
  autoPickOwnXI: jest.fn(),
  autoPickOpponentXI: jest.fn(),
  moveOwnPlayerInBattingOrder: jest.fn(),
  moveOpponentPlayerInBattingOrder: jest.fn(),
  startMatchWithSelectedXI: jest.fn(),
  resetMatch: jest.fn(),
  seriesStanding: { ownWins: 1, opponentWins: 1, ties: 0 },
  seriesTopRunScorers: [],
  seriesTopWicketTakers: [],
  seriesProgressLabel: 'Match 2 of 3',
  tournamentResults: [],
  tournamentTopRunScorers: [],
  tournamentTopWicketTakers: [],
  tournamentProgressLabel: 'Final',
  savedGames: [],
  isSavingGame: false,
  isGlobalSaving: false,
  isSavesLoading: false,
  saveMessage: '',
  momRecommendations: [],
  announceManOfTheMatch: jest.fn(),
  handleSetSelectedStadium: jest.fn(),
  setPreferredVoice: jest.fn(),
  speak: jest.fn(),
  handleSaveGame: jest.fn(),
  handleLoadSavedGame: jest.fn(),
  handleDeleteSavedGame: jest.fn(),
  handleTossCall: jest.fn(),
  handleUserTossDecision: jest.fn(),
  availableVoices: [],
  careerTopRunScorers: [],
  careerTopWicketTakers: [],
  careerProgressLabel: 'Match 2 of 8',
  beginCareer: jest.fn(),
  handleCareerContinueAfterAuction: jest.fn(),
  handleCareerStartNextMatch: jest.fn(),
  handleCareerMatchPrimaryAction: jest.fn(),
  handleStartNextCareerSeason: jest.fn(),
  handleEndCareer: jest.fn(),
  handleViewCareerHistory: jest.fn(),
  handleBackToCareerSchedule: jest.fn(),
  handleRetireCareer: jest.fn(),
  buildTeamOneScorecard: jest.fn(() => ({ currentInnings: null })),
  buildTeamTwoScorecard: jest.fn(() => ({ currentInnings: null })),
  oversDisplay: jest.fn((balls) => `${Math.floor(balls / 6)}.${balls % 6}`),
  simulateCurrentOver: jest.fn(),
  simulateFullMatch: jest.fn(),
});

function HookHarness({ resultRef }) {
  resultRef.current = useCricketSimulatorController();
  return null;
}

describe('useCricketSimulatorController', () => {
  beforeEach(() => {
    mockDispatch = jest.fn();
    mockNavigation = makeNavigation();
    mockRuntime = makeRuntime();
    jest.requireMock('./controller/controllerNavigation')
      .createNavigationHandlers.mockReturnValue(mockNavigation);
    jest.requireMock('./controller/useControllerRuntimeFromContext')
      .useControllerRuntimeFromContext.mockReturnValue(mockRuntime);
    const rosterHelpers = jest.requireMock('../utils/controllerCommonUtils');
    rosterHelpers.buildPlayingXI.mockImplementation((players, ids = []) => players.filter((player) => ids.includes(player.id)));
    rosterHelpers.normalizePlayingXIIds.mockImplementation((players, ids = []) => ids.filter((id) => players.some((player) => player.id === id)));
    rosterHelpers.pickDefaultRoles.mockImplementation(() => ({ captainId: 1, viceCaptainId: 2, wicketKeeperId: 1 }));
    rosterHelpers.sanitizeRoles.mockImplementation((roles) => ({
      captainId: roles?.captainId || null,
      viceCaptainId: roles?.viceCaptainId || null,
      wicketKeeperId: roles?.wicketKeeperId || null,
    }));
    jest.requireMock('../../../gameData/playerListForNation').getPlayersForNations.mockImplementation(() => ({
      ownPlayers: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
      opponentPlayers: [{ id: 3, name: 'Cara' }],
    }));
    const inningsCore = jest.requireMock('./controller/controllerInningsCore');
    inningsCore.getInningsContext.mockImplementation((context) => ({
      battingSide: context.ownPlayers,
      bowlingSide: context.opponentPlayers,
      ownPlayers: context.ownPlayers,
      opponentPlayers: context.opponentPlayers,
    }));
    inningsCore.openInnings.mockImplementation(({ getContext, setFirstInnings, setSecondInnings }) => {
      getContext(true);
      getContext(false);
      setFirstInnings({ score: 0 });
      setSecondInnings({ score: 0 });
    });
    ['handleSelectOpener', 'handleSelectNextBatter', 'handleSelectBowler'].forEach((handlerName) => {
      inningsCore[handlerName].mockImplementation(({ isFirstInnings, getContext, updateState }) => {
        getContext(isFirstInnings);
        updateState(isFirstInnings, (previous) => previous);
      });
    });
    inningsCore.updateInningsState.mockImplementation(({
      isFirstInnings,
      firstInnings,
      secondInnings,
      setFirstInnings,
      setSecondInnings,
      updater,
    }) => {
      const previous = isFirstInnings ? firstInnings : secondInnings;
      const next = updater(previous);
      (isFirstInnings ? setFirstInnings : setSecondInnings)(next);
    });
    jest.requireMock('./controller/controllerInningsViewModel')
      .buildInningsViewModel.mockImplementation(({ isFirstInnings, getContext }) => {
        getContext(isFirstInnings);
        getContext(!isFirstInnings, 'opponent', { score: 0 });
        return { isFirstInnings };
      });
    mockState = {
      auth: { user: { uid: 'user-1', displayName: 'Player' } },
      game: makeGame(),
    };
  });

  test('derives match state, readiness, score summaries, and controller navigation aliases', () => {
    mockState.game = makeGame({
      ownBattingOrderIds: [1, 2],
      opponentBattingOrderIds: [3],
    });
    const resultRef = { current: null };
    render(<HookHarness resultRef={resultRef} />);
    const controller = resultRef.current;

    expect(controller.game).toBe(mockState.game);
    expect(controller.teamOneFinal).toBe('Falcons 100/3');
    expect(controller.teamTwoFinal).toBe('Ravens 101/4');
    expect(controller.resultSummary).toBeTruthy();
    expect(controller.isCurrentMatchUserInvolved).toBe(true);
    expect(controller.ownSelectedXIPlayers).toEqual([{ id: 1, name: 'Alice' }]);
    expect(controller.opponentSelectedXIPlayers).toEqual([{ id: 3, name: 'Cara' }]);
    expect(controller.ownBattingOrderIds).toEqual([1, 2]);
    expect(controller.opponentBattingOrderIds).toEqual([3]);
    expect(controller.ownAvailablePool).toEqual([{ id: 2, name: 'Bob' }]);
    expect(controller.ownXIReady).toBe(false);
    expect(controller.ownTeamRoles).toEqual({ captainId: 1, viceCaptainId: 2, wicketKeeperId: 1 });
    expect(controller.countryList.length).toBeGreaterThan(0);

    controller.moveOwnPlayerInBattingOrder(2, -1);
    controller.moveOpponentPlayerInBattingOrder(3, 1);
    expect(mockRuntime.moveOwnPlayerInBattingOrder).toHaveBeenCalledWith(2, -1);
    expect(mockRuntime.moveOpponentPlayerInBattingOrder).toHaveBeenCalledWith(3, 1);

    controller.selectGameMode('series');
    controller.selectSeriesLength(5);
    controller.toggleTournamentOpponent('Hawks');
    controller.randomizeTournamentFixtures();
    controller.updateTournamentFixture('match-1', 'date', '2025-01-01');
    controller.prepareTournamentFixtures();
    controller.confirmTournamentFixtures();
    controller.goToNextStage();
    controller.goToPreviousStage();
    expect(mockNavigation.selectGameMode).toHaveBeenCalledWith('series');
    expect(mockNavigation.selectSeriesLength).toHaveBeenCalledWith(5);
    expect(mockNavigation.toggleTournamentOpponent).toHaveBeenCalledWith('Hawks');
    expect(mockNavigation.updateTournamentFixture).toHaveBeenCalledWith('match-1', 'date', '2025-01-01');
    expect(mockNavigation.prepareTournamentFixtures).toHaveBeenCalled();
    expect(mockNavigation.confirmTournamentFixtures).toHaveBeenCalled();
    expect(mockNavigation.goToNextStage).toHaveBeenCalled();
    expect(mockNavigation.goToPreviousStage).toHaveBeenCalled();

    controller.matchPrimaryAction();
    controller.setBattingIntent('aggressive');
    controller.setBattingTactics({ shot: 'drive' });
    controller.setBowlingIntent('spin');
    controller.setBowlingTactics({ overPlan: 'attack' });
    controller.autoPickOwnXI();
    controller.autoPickOpponentXI();
    controller.startMatchWithSelectedXI();
    controller.resetMatch();
    controller.announceManOfTheMatch({ name: 'Alice' });
    controller.saveGame();
    controller.loadSavedGame({ id: 'save' });
    controller.deleteSavedGame({ id: 'save' });
    expect(mockRuntime.matchPrimaryAction).toHaveBeenCalled();
    expect(mockRuntime.setBattingIntent).toHaveBeenCalledWith('aggressive');
    expect(mockRuntime.setBattingTactics).toHaveBeenCalledWith({ shot: 'drive' });
    expect(mockRuntime.setBowlingIntent).toHaveBeenCalledWith('spin');
    expect(mockRuntime.setBowlingTactics).toHaveBeenCalledWith({ overPlan: 'attack' });
    expect(mockRuntime.autoPickOwnXI).toHaveBeenCalled();
    expect(mockRuntime.autoPickOpponentXI).toHaveBeenCalled();
    expect(mockRuntime.startMatchWithSelectedXI).toHaveBeenCalled();
    expect(mockRuntime.resetMatch).toHaveBeenCalled();
    expect(mockRuntime.announceManOfTheMatch).toHaveBeenCalledWith({ name: 'Alice' });
    expect(mockRuntime.handleSaveGame).toHaveBeenCalled();
    expect(mockRuntime.handleLoadSavedGame).toHaveBeenCalledWith({ id: 'save' });
    expect(mockRuntime.handleDeleteSavedGame).toHaveBeenCalledWith({ id: 'save' });
  });

  test('dispatches setup mutations and composes innings, delivery, and tournament helpers', () => {
    const resultRef = { current: null };
    render(<HookHarness resultRef={resultRef} />);
    const controller = resultRef.current;

    controller.setMatchTypeKey('odi');
    controller.setOwnTeam('Hawks');
    controller.setOpponentTeam('Owls');
    controller.setLocationCountry('Australia');
    controller.setSelectedStadium('Harbour Ground');
    controller.setCommentator('Voice Two');
    controller.toggleScoreboard();
    const actionTypes = mockDispatch.mock.calls.map(([action]) => action.type);
    expect(actionTypes).toEqual(expect.arrayContaining([
      'game/setMatchTypeKey',
      'game/setOwnTeam',
      'game/setTournamentUserTeam',
      'game/setTournamentOpponentTeams',
      'game/setTournamentMatches',
      'game/setTournamentCurrentMatchId',
      'game/setTournamentChampion',
      'game/setTournamentPlayerStats',
      'game/setOwnPlayingXI',
      'game/setOwnCustomPlayers',
      'game/setOwnTeamRoles',
      'game/setOpponentTeam',
      'game/setOpponentPlayingXI',
      'game/setOpponentCustomPlayers',
      'game/setOpponentTeamRoles',
      'game/setLocationCountry',
      'game/setCommentator',
      'game/toggleShowScoreboard',
    ]));
    expect(mockRuntime.handleSetSelectedStadium).toHaveBeenCalledWith('Harbour Ground');

    const runtimeContext = jest.requireMock('./controller/useControllerRuntimeFromContext')
      .useControllerRuntimeFromContext.mock.calls[0][0];
    runtimeContext.derived.openInnings();
    controller.processDelivery(true);
    controller.handleSelectOpener(true, 2);
    controller.handleSelectNextBatter(false, 3);
    controller.handleSelectBowler(true, 4);
    const core = jest.requireMock('./controller/controllerInningsCore');
    expect(core.openInnings).toHaveBeenCalledWith(expect.objectContaining({
      firstSide: 'own',
      firstBattingSide: 'own',
      matchType: expect.objectContaining({ nameKey: 't20' }),
    }));
    expect(jest.requireMock('./controller/controllerDeliveryEngine').processDelivery)
      .toHaveBeenCalledWith(expect.objectContaining({ isFirstInnings: true, maxBalls: 120 }));
    expect(core.handleSelectOpener).toHaveBeenCalledWith(expect.objectContaining({ isFirstInnings: true, selectedIndex: 2 }));
    expect(core.handleSelectNextBatter).toHaveBeenCalledWith(expect.objectContaining({ isFirstInnings: false, batterIndex: 3 }));
    expect(core.handleSelectBowler).toHaveBeenCalledWith(expect.objectContaining({ isFirstInnings: true, bowlerIndex: 4 }));
    expect(mockDispatch.mock.calls.map(([action]) => action.type)).toEqual(expect.arrayContaining([
      'game/setFirstInnings',
      'game/setSecondInnings',
    ]));

    const navArgs = jest.requireMock('./controller/controllerNavigation').createNavigationHandlers.mock.calls[0][0];
    navArgs.prepareTournamentMatch({ id: 'match-1' });
    expect(jest.requireMock('./controller/controllerTournamentMatchPrep').prepareTournamentMatchState)
      .toHaveBeenCalledWith(expect.objectContaining({
        match: { id: 'match-1' },
        dispatch: mockDispatch,
      }));
  });

  test('uses national-team fallback rosters and passes auth plus game progress to bootstrap', () => {
    mockState = {
      auth: { user: { uid: 'user-2' } },
      game: makeGame({
        stage: matchStatusEnum.TossResult,
        gameMode: 'quick',
        careerDomesticTeams: [],
        ownTeam: 'India',
        opponentTeam: 'Australia',
        ownPlayingXI: [],
        opponentPlayingXI: [],
      }),
    };
    const resultRef = { current: null };
    render(<HookHarness resultRef={resultRef} />);
    const controller = resultRef.current;
    expect(controller.availableOwnPlayers).toEqual([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
    expect(controller.availableOpponentPlayers).toEqual([{ id: 3, name: 'Cara' }]);
    expect(controller.isCurrentMatchUserInvolved).toBe(true);

    expect(jest.requireMock('./controller/useControllerBootstrap').useControllerBootstrap)
      .toHaveBeenCalledWith(expect.objectContaining({
        authUser: { uid: 'user-2' },
        game: mockState.game,
        isGameInProgress: true,
        dispatch: mockDispatch,
      }));
  });

  test('handles empty rosters, invalid setup values, and stages outside an active match', () => {
    const playerData = jest.requireMock('../../../gameData/playerListForNation');
    playerData.getPlayersForNations.mockReturnValue({ ownPlayers: [], opponentPlayers: [] });
    delete playerData.playerListForNation.India;
    mockState = {
      auth: { user: null },
      game: makeGame({
        stage: matchStatusEnum.CareerSeasonSchedule,
        gameMode: 'tournament',
        tournamentUserTeam: 'Australia',
        ownTeam: 'India',
        opponentTeam: 'Australia',
        matchTypeKey: 'unknown',
        careerDomesticTeams: [null, { name: '', players: [] }, { name: 'Bad', players: 'invalid' }],
        ownCustomPlayers: null,
        opponentCustomPlayers: null,
        locationCountry: 'Unknown',
        firstBattingSide: 'opponent',
      }),
    };
    let resultRef = { current: null };
    render(<HookHarness resultRef={resultRef} />);
    expect(resultRef.current.availableOwnPlayers).toEqual([]);
    expect(resultRef.current.availableOpponentPlayers).toEqual([]);
    expect(resultRef.current.matchType).toBeDefined();
    expect(resultRef.current.venueStadiums).toEqual([]);
    expect(resultRef.current.isCurrentMatchUserInvolved).toBe(true);
    expect(resultRef.current.firstInningsTeamName).toBe('Australia');
    expect(jest.requireMock('./controller/useControllerBootstrap').useControllerBootstrap)
      .toHaveBeenLastCalledWith(expect.objectContaining({
        authUser: null,
        isGameInProgress: true,
      }));

    playerData.getPlayersForNations.mockReturnValue({
      ownPlayers: [{ id: 4, name: 'Diana' }],
      opponentPlayers: [{ id: 5, name: 'Evan' }],
    });
    mockState = {
      auth: { user: null },
      game: makeGame({
        stage: 'Idle',
        gameMode: 'quick',
        ownTeam: '',
        opponentTeam: '',
        careerDomesticTeams: null,
        ownCustomPlayers: null,
        opponentCustomPlayers: null,
      }),
    };
    resultRef = { current: null };
    render(<HookHarness resultRef={resultRef} />);
    expect(resultRef.current.isCurrentMatchUserInvolved).toBe(false);
    expect(jest.requireMock('./controller/useControllerBootstrap').useControllerBootstrap)
      .toHaveBeenLastCalledWith(expect.objectContaining({ isGameInProgress: false }));
  });
});
