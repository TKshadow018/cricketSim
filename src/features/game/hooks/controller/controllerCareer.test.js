import { createCareerFlowHandlers } from './controllerCareer';
import { MODE_CAREER } from '../../utils/controllerCommonUtils';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';

jest.mock('../../utils/controllerCareerScheduleUtils', () => ({
  applyEndOfSeasonPlayerAbilityUpdates: jest.fn(({ domesticTeams = [] }) => domesticTeams),
  applyDomesticMatchPlayerUpdates: jest.fn(({ domesticTeams = [] }) => domesticTeams),
  assignGlobalPoolPlayersToDomesticTeams: jest.fn(({ domesticTeams = [], globalPlayerPool = [] }) => ({
    domesticTeams,
    globalPlayerPool,
  })),
  buildCareerSeasonSchedule: jest.fn((seedTeam, teams, _seasonLength, options = {}) => {
    const opponent = teams.find((team) => team.name !== seedTeam);
    return opponent
      ? [{
          id: `${options.leagueCountry}-fixture`,
          teamA: seedTeam,
          teamB: opponent.name,
          isUserMatch: true,
          format: 't20',
          scheduledDate: '2025-01-01',
          isComplete: false,
        }]
      : [];
  }),
  buildCareerStandings: jest.fn((careerTeam) => ({
    t20: { [careerTeam]: { points: 12 }, Ravens: { points: 8 }, Hawks: { points: 4 } },
  })),
  resolveNextCareerMatch: jest.fn((schedule = []) => schedule.find((match) => !match.isComplete) || null),
  runCareerAuction: jest.fn(({ domesticTeams = [], careerPlayer, globalPlayerPool = [] }) => ({
    careerTeam: 'Falcons',
    domesticTeams: domesticTeams.map((team) => team.name === 'Falcons'
      ? { ...team, players: [careerPlayer, ...(team.players || [])] }
      : team),
    globalPlayerPool,
    auctionSummary: { winner: 'Falcons' },
  })),
  simulateCareerFixture: jest.fn(({ match, existingStats = {}, domesticTeams = [] }) => ({
    result: { winner: match.teamA, summary: 'simulated fixture' },
    updatedStats: { ...existingStats, simulated: { team: match.teamA, name: 'Simulated Player' } },
    updatedDomesticTeams: domesticTeams,
  })),
}));

jest.mock('../../utils/controllerCareerUtils', () => ({
  buildCareerMatchScorecard: jest.fn(() => ({
    previousInnings: null,
    currentInnings: { title: 'Falcons Innings', battingRows: [], bowlingRows: [] },
  })),
  buildTopRunScorers: jest.fn((stats = []) => stats),
  buildTopWicketTakers: jest.fn((stats = []) => stats),
  mergePlayerStatsForCurrentMatch: jest.fn(({ existingStats = {} }) => ({ ...existingStats, committed: true })),
}));

jest.mock('../../utils/controllerMomUtils', () => ({
  buildMomRecommendations: jest.fn(() => [
    { playerId: 1, name: 'Player 1', team: 'Falcons' },
    { playerId: 2, name: 'Player 2', team: 'Ravens' },
  ]),
}));

jest.mock('../../utils/controllerCareerPlayerUtils', () => ({
  buildSeasonProgressionNotes: jest.fn(() => []),
}));

const actionNames = [
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
  'setOwnTeamAction',
  'setOpponentTeamAction',
  'setLocationCountryAction',
  'setSelectedStadiumAction',
  'setMatchTypeKeyAction',
  'setOwnCustomPlayersAction',
  'setOpponentCustomPlayersAction',
  'setOwnPlayingXIAction',
  'setOpponentPlayingXIAction',
  'setOwnTeamRolesAction',
  'setOpponentTeamRolesAction',
  'setTossWinnerAction',
  'setTossDecisionAction',
  'setTossCallAction',
  'setFirstBattingSideAction',
  'setStageAction',
  'resetMatchForCareerAction',
  'resetMatchRuntimeAction',
];

const makePlayers = (team) => Array.from({ length: 12 }, (_, index) => ({
  id: `${team}-${index + 1}`,
  name: `${team} Player ${index + 1}`,
  age: 20 + (index % 12),
  playerType: index === 0 ? 'wicketkeeper' : index % 2 ? 'batsman' : 'bowler',
  isWicketKeeper: index === 0,
  abilityToPlayPaceBall: 45 + index,
  abilityToPlaySpinBall: 48 + index,
  battingAggresion: 50 + index,
  paceAbility: 42 + index,
  spinAbility: 40 + index,
  fitness: 90,
  form: 60,
  morale: 55,
  confidence: 58,
}));

const domesticTeams = [
  { name: 'Falcons', country: 'Country A', location: 'A City', players: makePlayers('Falcons') },
  { name: 'Ravens', country: 'Country A', location: 'R City', players: makePlayers('Ravens') },
  { name: 'Hawks', country: 'Country B', location: 'H City', players: makePlayers('Hawks') },
  { name: 'Owls', country: 'Country B', location: 'O City', players: makePlayers('Owls') },
];

const makeFlow = (overrides = {}) => {
  const dispatch = jest.fn();
  const actions = Object.fromEntries(actionNames.map((name) => [name, (payload) => ({ type: name, payload })]));
  const input = {
    dispatch,
    gameMode: MODE_CAREER,
    stage: matchStatusEnum.CareerSeasonSchedule,
    careerTeam: 'Falcons',
    careerPlayerProfile: {
      name: 'Career Player',
      playerId: 'Falcons-1',
      nationality: 'Country A',
      age: 24,
      currentValue: 150000,
      playerType: 'batsman',
      abilityToPlayPaceBall: 60,
      abilityToPlaySpinBall: 58,
      battingAggresion: 62,
      paceAbility: 20,
      spinAbility: 22,
    },
    careerDomesticCountry: 'Country A',
    careerDomesticTeams: domesticTeams,
    careerGlobalPlayerPool: [{ id: 'pool-1', name: 'Pool Player' }],
    careerOffers: [{ team: 'Ravens', amount: 225000 }],
    careerRetired: false,
    careerSeason: 1,
    careerSeasonLength: 'short',
    careerMatchIndex: 0,
    careerSchedule: [{
      id: 'fixture-1',
      teamA: 'Falcons',
      teamB: 'Ravens',
      isUserMatch: true,
      format: 't20',
      isComplete: false,
    }],
    careerStandings: { t20: { Falcons: { points: 12 } } },
    careerPlayerStats: {},
    careerSeasonHistory: [],
    firstBattingSide: 'own',
    firstInnings: {
      score: 120,
      wickets: 4,
      balls: 120,
      battingStats: [{ balls: 12, run: 24 }, { balls: 0 }],
      bowlingStats: [{ balls: 0 }, { balls: 12 }],
    },
    secondInnings: {
      score: 110,
      wickets: 8,
      balls: 120,
      battingStats: [{ balls: 12, run: 20 }, { balls: 0 }],
      bowlingStats: [{ balls: 12 }, { balls: 0 }],
    },
    firstInningsTeamName: 'Falcons',
    secondInningsTeamName: 'Ravens',
    resultSummary: 'Falcons won by 10 runs',
    ownPlayers: makePlayers('Falcons').slice(0, 11),
    opponentPlayers: makePlayers('Ravens').slice(0, 11),
    ownTeam: 'Falcons',
    opponentTeam: 'Ravens',
    careerResultCommitSignatureRef: { current: '' },
    setAutoSimMode: jest.fn(),
    ...actions,
    ...overrides,
  };
  return { flow: createCareerFlowHandlers(input), input, dispatch };
};

describe('createCareerFlowHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const scheduleUtils = jest.requireMock('../../utils/controllerCareerScheduleUtils');
    scheduleUtils.applyEndOfSeasonPlayerAbilityUpdates.mockImplementation(({ domesticTeams = [] }) => domesticTeams);
    scheduleUtils.applyDomesticMatchPlayerUpdates.mockImplementation(({ domesticTeams = [] }) => domesticTeams);
    scheduleUtils.assignGlobalPoolPlayersToDomesticTeams.mockImplementation(({ domesticTeams = [], globalPlayerPool = [] }) => ({
      domesticTeams,
      globalPlayerPool,
    }));
    scheduleUtils.buildCareerSeasonSchedule.mockImplementation((seedTeam, teams, _seasonLength, options = {}) => {
      const opponent = teams.find((team) => team.name !== seedTeam);
      return opponent
        ? [{
            id: `${options.leagueCountry}-fixture`,
            teamA: seedTeam,
            teamB: opponent.name,
            isUserMatch: true,
            format: 't20',
            scheduledDate: '2025-01-01',
            isComplete: false,
          }]
        : [];
    });
    scheduleUtils.buildCareerStandings.mockImplementation((careerTeam) => ({
      t20: { [careerTeam]: { points: 12 }, Ravens: { points: 8 }, Hawks: { points: 4 } },
    }));
    scheduleUtils.resolveNextCareerMatch.mockImplementation((schedule = []) => schedule.find((match) => !match.isComplete) || null);
    scheduleUtils.runCareerAuction.mockImplementation(({ domesticTeams: teams = [], careerPlayer, globalPlayerPool = [] }) => ({
      careerTeam: 'Falcons',
      domesticTeams: teams.map((team) => team.name === 'Falcons'
        ? { ...team, players: [careerPlayer, ...(team.players || [])] }
        : team),
      globalPlayerPool,
      auctionSummary: { winner: 'Falcons' },
    }));
    scheduleUtils.simulateCareerFixture.mockImplementation(({ match, existingStats = {}, domesticTeams: teams = [] }) => ({
      result: { winner: match.teamA, summary: 'simulated fixture' },
      updatedStats: { ...existingStats, simulated: { team: match.teamA, name: 'Simulated Player' } },
      updatedDomesticTeams: teams,
    }));
    const careerUtils = jest.requireMock('../../utils/controllerCareerUtils');
    careerUtils.buildCareerMatchScorecard.mockImplementation(() => ({
      previousInnings: null,
      currentInnings: { title: 'Falcons Innings', battingRows: [], bowlingRows: [] },
    }));
    careerUtils.buildTopRunScorers.mockImplementation((stats = []) => stats);
    careerUtils.buildTopWicketTakers.mockImplementation((stats = []) => stats);
    careerUtils.mergePlayerStatsForCurrentMatch.mockImplementation(({ existingStats = {} }) => ({
      ...existingStats,
      committed: true,
    }));
    jest.requireMock('../../utils/controllerMomUtils').buildMomRecommendations.mockImplementation(() => [
      { playerId: 1, name: 'Player 1', team: 'Falcons' },
      { playerId: 2, name: 'Player 2', team: 'Ravens' },
    ]);
    jest.requireMock('../../utils/controllerCareerPlayerUtils').buildSeasonProgressionNotes.mockImplementation(() => []);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('starts careers only with valid setup and creates supported player archetypes', () => {
    const { flow, dispatch } = makeFlow();
    flow.beginCareer({});
    flow.beginCareer({
      playerProfile: { name: 'Player' },
      domesticCountry: 'Country A',
      domesticTeams: [domesticTeams[0]],
    });
    expect(dispatch).not.toHaveBeenCalled();

    const profiles = [
      [' wicketkeeper ', 'wicketkeeper'],
      ['pace allrounder', 'pace allrounder'],
      ['spin allrounder', 'spin allrounder'],
      ['pacer', 'pacer'],
      ['spiner', 'spiner'],
      ['bowler', 'bowler'],
      ['batsman', 'batsman'],
      ['unknown type', 'batsman'],
    ];
    profiles.forEach(([playerType, expectedType]) => {
      const run = makeFlow();
      if (playerType === 'bowler') {
        jest.spyOn(Math, 'random').mockReturnValue(0);
      }
      run.flow.beginCareer({
        seasonLength: 'short',
        playerProfile: { name: 'New Player', age: 19, playerType },
        domesticCountry: 'Country A',
        domesticTeams,
        globalPlayerPool: [{ id: 99, name: 'Pool Player' }],
        offers: [{ team: 'Falcons', amount: 100000 }],
        countryList: [{ country: 'Country A' }],
      });
      const profileAction = run.dispatch.mock.calls
        .map(([action]) => action)
        .find((action) => action.type === 'setCareerPlayerProfileAction');
      expect(profileAction.payload.playerType).toBe(expectedType);
      expect(profileAction.payload.playerId).toMatch(/^career-player-/);
      expect(run.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerAuction });
      if (playerType === 'bowler') {
        expect(profileAction.payload.paceAbility).toBeLessThan(profileAction.payload.spinAbility);
        jest.restoreAllMocks();
      }
    });

    const noAuctionWinner = makeFlow();
    jest.requireMock('../../utils/controllerCareerScheduleUtils').runCareerAuction.mockReturnValueOnce({
      careerTeam: '',
      domesticTeams,
      globalPlayerPool: [],
    });
    noAuctionWinner.flow.beginCareer({
      playerProfile: { name: 'Unassigned Player' },
      domesticCountry: 'Country A',
      domesticTeams,
    });
    expect(noAuctionWinner.dispatch).not.toHaveBeenCalled();
  });

  test('uses safe setup defaults when optional auction data is absent', () => {
    const run = makeFlow();
    jest.requireMock('../../utils/controllerCareerScheduleUtils').runCareerAuction.mockReturnValueOnce({
      careerTeam: 'Falcons',
    });

    run.flow.beginCareer({
      playerProfile: { name: 'Default Player' },
      domesticCountry: 'Country A',
      domesticTeams,
    });

    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setCareerGlobalPlayerPoolAction', payload: [] });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setCareerAuctionSummaryAction', payload: null });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setCareerOffersAction', payload: [] });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setCareerSeasonLengthAction', payload: 'standard' });
  });

  test('normalizes missing player ids and orders generated schedules across countries by date', () => {
    const scheduleUtils = jest.requireMock('../../utils/controllerCareerScheduleUtils');
    scheduleUtils.buildCareerSeasonSchedule.mockImplementation((seedTeam, _teams, _length, options) => [{
      id: `${options.leagueCountry}-fixture`,
      teamA: seedTeam,
      teamB: 'Opponent',
      globalMatchNumber: 1,
      scheduledDate: options.leagueCountry === 'Country A' ? '2025-02-01' : '2025-01-01',
      isUserMatch: true,
      opponent: 'Opponent',
    }]);
    const teams = [
      { name: 'Falcons', country: 'Country A', players: [{ name: 'Anonymous Player' }] },
      { name: 'Ravens', country: 'Country A', players: [] },
      { name: 'Hawks', country: 'Country B', players: [] },
      { name: 'Owls', country: 'Country B', players: [] },
    ];
    const run = makeFlow();

    run.flow.beginCareer({
      playerProfile: { name: 'Career Player' },
      domesticCountry: 'Country A',
      domesticTeams: teams,
    });

    const auctionTeams = scheduleUtils.runCareerAuction.mock.calls.at(-1)[0].domesticTeams;
    const schedule = run.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerScheduleAction').payload;
    expect(auctionTeams[0].players[0].id).toBe('Falcons-P1-1');
    expect(schedule.map(({ leagueCountry }) => leagueCountry)).toEqual(['Country B', 'Country A']);
    expect(schedule[0].isUserMatch).toBe(false);
    expect(schedule[1].isUserMatch).toBe(true);
  });

  test('continues after auction only when a career and schedule are available', () => {
    const invalid = makeFlow({ careerTeam: '' });
    invalid.flow.handleCareerContinueAfterAuction();
    expect(invalid.dispatch).not.toHaveBeenCalled();

    const valid = makeFlow({
      careerSchedule: [
        { id: 'done', isComplete: true },
        { id: 'next', isComplete: false },
      ],
    });
    valid.flow.handleCareerContinueAfterAuction();
    expect(valid.dispatch).toHaveBeenCalledWith({ type: 'setCareerMatchIndexAction', payload: 1 });
    expect(valid.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.CareerSeasonSchedule,
    });
  });

  test('launches user fixtures with prior match XI and correctly reset match state', () => {
    const previousFixture = {
      id: 'previous',
      teamA: 'Falcons',
      teamB: 'Ravens',
      isComplete: true,
      result: {
        scorecard: {
          previousInnings: {
            title: 'Match report for Falcons',
            battingRows: [{ playerId: 'Falcons-1', name: 'Falcons Player 1', runs: 42 }],
            bowlingRows: [{ playerId: 'Falcons-2', name: 'Falcons Player 2', wickets: 2 }],
          },
          currentInnings: {
            title: 'Ravens Innings',
            battingRows: [{ playerId: 'Ravens-1', name: 'Ravens Player 1', runs: 22 }, { runs: 1 }],
            bowlingRows: [{ playerId: 'Ravens-2', name: 'Ravens Player 2', wickets: 1 }, { wickets: 1 }],
          },
        },
      },
    };
    const nextFixture = { ...makeFlow().input.careerSchedule[0], id: 'next', format: 'odi' };
    const { flow, dispatch } = makeFlow({ careerSchedule: [previousFixture, nextFixture] });
    flow.handleCareerStartNextMatch();
    expect(dispatch).toHaveBeenCalledWith({ type: 'setMatchTypeKeyAction', payload: 'ODI' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnTeamAction', payload: 'Falcons' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOpponentTeamAction', payload: 'Ravens' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: expect.any(Array) });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnTeamRolesAction', payload: expect.objectContaining({ wicketKeeperId: expect.anything() }) });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.TossTime });

    const withoutRosters = makeFlow({ careerDomesticTeams: [] });
    withoutRosters.flow.handleCareerStartNextMatch();
    expect(withoutRosters.dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: [] });
    expect(withoutRosters.dispatch).toHaveBeenCalledWith({
      type: 'setOwnTeamRolesAction',
      payload: { captainId: null, viceCaptainId: null, wicketKeeperId: null },
    });

    const firstClassMatch = makeFlow({
      careerPlayerProfile: null,
      careerDomesticCountry: '',
      careerSchedule: [{ ...makeFlow().input.careerSchedule[0], format: 'firstClass' }],
    });
    firstClassMatch.flow.handleCareerStartNextMatch();
    expect(firstClassMatch.dispatch).toHaveBeenCalledWith({ type: 'setMatchTypeKeyAction', payload: 'test' });
    expect(firstClassMatch.dispatch).toHaveBeenCalledWith({ type: 'setLocationCountryAction', payload: '' });
    expect(firstClassMatch.dispatch).toHaveBeenCalledWith({ type: 'setCareerPlayerProfileAction', payload: null });

    const profileByName = makeFlow({
      careerPlayerProfile: { name: 'Name Only Player' },
      careerDomesticTeams: [
        { name: 'Falcons', players: [{ id: 'name-only-id', name: 'Name Only Player', isWicketKeeper: true }] },
        { name: 'Ravens', players: [] },
      ],
    });
    profileByName.flow.handleCareerStartNextMatch();
    const syncedProfile = profileByName.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerPlayerProfileAction');
    expect(syncedProfile.payload).toMatchObject({ name: 'Name Only Player', id: 'name-only-id' });
  });

  test('launches a reversed fixture with fallback roles and a prior name-only scorecard', () => {
    const run = makeFlow({
      careerTeam: 'Ravens',
      careerPlayerProfile: null,
      careerDomesticCountry: '',
      careerDomesticTeams: [
        { name: 'Ravens', players: [{ id: 'r-1', name: 'Raven Player', playerType: 'batsman' }] },
        { name: 'Falcons', players: [] },
      ],
      careerSchedule: [
        {
          id: 'previous',
          teamA: 'Ravens',
          teamB: 'Hawks',
          isComplete: true,
          result: {
            scorecard: {
              previousInnings: {
                title: 'Match report for Ravens',
                battingRows: [{ name: 'Raven Player', runs: 30 }],
              },
            },
          },
        },
        { id: 'unrelated', teamA: 'Hawks', teamB: 'Owls', isComplete: false },
        { id: 'current', teamA: 'Falcons', teamB: 'Ravens', isComplete: false, format: null },
      ],
      careerMatchIndex: 2,
    });

    run.flow.handleCareerStartNextMatch();

    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setOwnTeamAction', payload: 'Ravens' });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setOpponentTeamAction', payload: 'Falcons' });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setCareerFormatAction', payload: 't20' });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setMatchTypeKeyAction', payload: 't20' });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: ['r-1'] });
    expect(run.dispatch).toHaveBeenCalledWith({
      type: 'setOwnTeamRolesAction',
      payload: { captainId: 'r-1', viceCaptainId: 'r-1', wicketKeeperId: 'r-1' },
    });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setOpponentPlayingXIAction', payload: [] });
  });

  test('simulates unattended fixtures, stops at user fixtures, and summarizes completed seasons', () => {
    const { simulateCareerFixture } = jest.requireMock('../../utils/controllerCareerScheduleUtils');
    const unattended = makeFlow({
      careerSchedule: [
        { id: 'sim-1', teamA: 'Ravens', teamB: 'Hawks', isComplete: false, isUserMatch: false },
        { id: 'sim-2', teamA: 'Hawks', teamB: 'Owls', isComplete: false, isUserMatch: false },
      ],
    });
    unattended.flow.handleCareerStartNextMatch();
    expect(simulateCareerFixture).toHaveBeenCalledTimes(2);
    expect(unattended.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerSeasonSummary });
    expect(unattended.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerOffersAction',
      payload: expect.any(Array),
    }));

    const userPending = makeFlow({
      careerSchedule: [
        { id: 'sim', teamA: 'Ravens', teamB: 'Hawks', isComplete: false, isUserMatch: false },
        { id: 'user', teamA: 'Falcons', teamB: 'Ravens', isComplete: false, isUserMatch: true },
      ],
    });
    userPending.flow.handleCareerStartNextMatch();
    expect(userPending.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.TossTime });
    expect(userPending.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'setCareerMatchIndexAction' }));

    const retired = makeFlow({ careerRetired: true });
    retired.flow.handleCareerStartNextMatch();
    expect(retired.dispatch).not.toHaveBeenCalled();
    const empty = makeFlow({ careerSchedule: [] });
    empty.flow.handleCareerStartNextMatch();
    expect(empty.dispatch).not.toHaveBeenCalled();

    const completed = makeFlow({
      careerSchedule: [{ id: 'done', teamA: 'Falcons', teamB: 'Ravens', isComplete: true }],
    });
    completed.flow.handleCareerStartNextMatch();
    expect(completed.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerSeasonSummary });
  });

  test('skips previously completed fixtures between simulated and user matches', () => {
    const run = makeFlow({
      careerSchedule: [
        { id: 'sim', teamA: 'Ravens', teamB: 'Hawks', isComplete: false, isUserMatch: false },
        { id: 'already-done', teamA: 'Hawks', teamB: 'Owls', isComplete: true },
        { id: 'user', teamA: 'Falcons', teamB: 'Ravens', isComplete: false, isUserMatch: true },
      ],
    });

    run.flow.handleCareerStartNextMatch();

    expect(jest.requireMock('../../utils/controllerCareerScheduleUtils').simulateCareerFixture)
      .toHaveBeenCalledTimes(1);
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.TossTime });
  });

  test('commits career results, handles score ties, and suppresses duplicates and invalid stages', () => {
    const { flow, input, dispatch } = makeFlow({ stage: matchStatusEnum.MatchEnd });
    const invalid = makeFlow({ stage: matchStatusEnum.TossTime });
    expect(invalid.flow.commitCareerMatchResult()).toEqual({ didCommit: false, seasonComplete: false });
    const noFixture = makeFlow({ stage: matchStatusEnum.MatchEnd, careerSchedule: [] });
    expect(noFixture.flow.commitCareerMatchResult()).toEqual({ didCommit: false, seasonComplete: false });

    const result = flow.commitCareerMatchResult();
    expect(result).toEqual({ didCommit: true, seasonComplete: true });
    expect(input.careerResultCommitSignatureRef.current).toContain('fixture-1|120|4|120|110|8|120');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'setCareerScheduleAction' }));

    expect(flow.commitCareerMatchResult()).toEqual({ didCommit: false, seasonComplete: false });
    const tie = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      secondInnings: {
        score: 120,
        wickets: 10,
        balls: 120,
        battingStats: [],
        bowlingStats: [],
      },
    });
    expect(tie.flow.commitCareerMatchResult()).toEqual({ didCommit: true, seasonComplete: true });

    const opponentBatsFirst = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      firstBattingSide: 'opponent',
      firstInningsTeamName: 'Ravens',
      secondInningsTeamName: 'Falcons',
    });
    expect(opponentBatsFirst.flow.commitCareerMatchResult()).toEqual({ didCommit: true, seasonComplete: true });
    expect(opponentBatsFirst.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'setCareerScheduleAction', payload: [expect.objectContaining({
        result: expect.objectContaining({ winner: 'Ravens', teamAScore: 110, teamBScore: 120 }),
      })] })
    );

    const nonFinal = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerSchedule: [
        { id: 'fixture-1', teamA: 'Falcons', teamB: 'Ravens', isUserMatch: true, isComplete: false },
        { id: 'fixture-2', teamA: 'Hawks', teamB: 'Owls', isUserMatch: false, isComplete: false },
      ],
    });
    expect(nonFinal.flow.commitCareerMatchResult()).toEqual({ didCommit: true, seasonComplete: false });

    const fallbackFixture = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerMatchIndex: -1,
      careerResultCommitSignatureRef: null,
      firstInnings: { score: 100, wickets: 5, balls: 120, battingStats: [], bowlingStats: [] },
      secondInnings: { score: 105, wickets: 4, balls: 110, battingStats: [], bowlingStats: [] },
    });
    expect(fallbackFixture.flow.commitCareerMatchResult()).toEqual({ didCommit: true, seasonComplete: true });
    expect(fallbackFixture.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerScheduleAction',
      payload: [expect.objectContaining({
        result: expect.objectContaining({ winner: 'Ravens', teamAScore: 100, teamBScore: 105 }),
      })],
    }));
  });

  test('commits sparse reversed fixtures with missing player identities and no MOM award', () => {
    const momUtils = jest.requireMock('../../utils/controllerMomUtils');
    momUtils.buildMomRecommendations.mockReturnValueOnce([]);
    const run = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerMatchIndex: -1,
      careerSchedule: [{
        id: 'reversed',
        teamA: 'Ravens',
        teamB: 'Falcons',
        isUserMatch: true,
        isComplete: false,
      }],
      firstInningsTeamName: 'Unexpected A',
      secondInningsTeamName: 'Unexpected B',
      ownPlayers: [{}],
      opponentPlayers: [{}],
      careerResultCommitSignatureRef: null,
      firstInnings: {
        score: 100,
        wickets: 4,
        balls: 90,
        battingStats: [{ balls: 12, run: 20 }],
        bowlingStats: [{ balls: 6 }],
      },
      secondInnings: {
        score: 90,
        wickets: 5,
        balls: 100,
        battingStats: [{ balls: 10, run: 15 }],
        bowlingStats: [{ balls: 12 }],
      },
    });

    expect(run.flow.commitCareerMatchResult()).toEqual({ didCommit: true, seasonComplete: true });
    expect(momUtils.buildMomRecommendations.mock.calls.at(-1)[0].ownSanitizedRoles).toEqual({
      captainId: null,
      viceCaptainId: null,
      wicketKeeperId: null,
    });
    expect(run.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerScheduleAction',
      payload: [expect.objectContaining({
        result: expect.objectContaining({ momAward: null }),
      })],
    }));
  });

  test('advances a career match to the next schedule or season summary', () => {
    const nextFixture = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerSchedule: [
        { id: 'fixture-1', teamA: 'Falcons', teamB: 'Ravens', isUserMatch: true, isComplete: false },
        { id: 'fixture-2', teamA: 'Hawks', teamB: 'Owls', isUserMatch: false, isComplete: false },
      ],
    });
    nextFixture.flow.handleCareerMatchPrimaryAction();
    expect(nextFixture.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.CareerSeasonSchedule,
    });

    const finished = makeFlow({ stage: matchStatusEnum.MatchEnd });
    finished.flow.handleCareerMatchPrimaryAction();
    expect(finished.dispatch).toHaveBeenCalledWith({ type: 'setCareerOffersAction', payload: expect.any(Array) });
    expect(finished.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.CareerSeasonSummary,
    });

    const wrongMode = makeFlow({ gameMode: 'quick' });
    wrongMode.flow.handleCareerMatchPrimaryAction();
    expect(wrongMode.dispatch).not.toHaveBeenCalled();

    [18, 22, 23, 27, 28, 31, 32, 34, 35].forEach((age) => {
      const ageFlow = makeFlow({
        stage: matchStatusEnum.MatchEnd,
        careerPlayerProfile: {
          name: 'Career Player',
          playerId: 'Falcons-1',
          age,
          currentValue: 0,
        },
      });
      ageFlow.flow.handleCareerMatchPrimaryAction();
      expect(ageFlow.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'setCareerOffersAction', payload: expect.any(Array) })
      );
    });

    const oneTeam = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerDomesticTeams: [{ name: 'Falcons', country: 'Country A', players: makePlayers('Falcons') }],
    });
    oneTeam.flow.handleCareerMatchPrimaryAction();
    expect(oneTeam.dispatch).toHaveBeenCalledWith({ type: 'setCareerOffersAction', payload: [] });
  });

  test('builds fallback transfer offers from flat standings when the career team is absent', () => {
    const run = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerTeam: 'Unlisted Club',
      careerPlayerProfile: null,
      careerDomesticTeams: [{ name: 'Falcons' }, { name: 'Ravens' }],
      careerStandings: {
        Falcons: { points: 10 },
        Ravens: { points: 20 },
      },
    });

    run.flow.handleCareerMatchPrimaryAction();

    const offerAction = run.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerOffersAction');
    expect(offerAction.payload).toContainEqual(expect.objectContaining({
      team: 'Unlisted Club',
      location: '',
      country: '',
      isCurrentTeam: true,
      offerType: 'stay',
    }));
    const transferOffers = offerAction.payload.filter(({ isCurrentTeam }) => !isCurrentTeam);
    expect(transferOffers).toHaveLength(1);
    expect(['Falcons', 'Ravens']).toContain(transferOffers[0].team);
    expect(transferOffers[0]).toMatchObject({ location: '', country: '' });
  });

  test('processes offseason progression, transfers, assignment, and retirement', () => {
    const { flow, dispatch } = makeFlow({
      careerPlayerStats: {
        batter: { playerId: 'Falcons-1', name: 'Falcons Player 1', team: 'Falcons', runs: 180, outs: 5, balls: 120, matches: 5 },
        bowler: { playerId: 'Ravens-2', name: 'Ravens Player 2', team: 'Ravens', wickets: 12, runsConceded: 180, ballsBowled: 120, matches: 5 },
      },
      careerSchedule: [{
        id: 'done',
        teamA: 'Falcons',
        teamB: 'Ravens',
        round: 1,
        matchNumber: 1,
        isComplete: true,
        result: { momAward: { playerId: 'Falcons-1', team: 'Falcons', name: 'Falcons Player 1' } },
      }],
    });
    flow.handleStartNextCareerSeason({ selectedTeam: 'Ravens', countryList: [{ country: 'Country A' }] });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setCareerSeasonAction', payload: 2 });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setCareerTeamAction', payload: 'Ravens' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setCareerOffersAction', payload: [] });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.CareerSeasonSchedule,
    });
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerSeasonHistoryAction',
      payload: [expect.objectContaining({ season: 1, seasonReport: expect.objectContaining({ awards: expect.any(Array) }) })],
    }));

    const retired = makeFlow({ careerPlayerProfile: { age: 40, name: 'Old Player' } });
    retired.flow.handleStartNextCareerSeason();
    expect(retired.dispatch).toHaveBeenCalledWith({ type: 'setCareerRetiredAction', payload: true });
    expect(retired.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerHistory });
  });

  test('retires an over-age player before starting another season', () => {
    const overAge = makeFlow({
      careerPlayerProfile: { name: 'Veteran', age: 39 },
      careerSeason: 2,
    });
    overAge.flow.handleStartNextCareerSeason();
    expect(overAge.dispatch).toHaveBeenCalledWith({ type: 'setCareerRetiredAction', payload: true });
    expect(overAge.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerHistory });

    const alreadyRetired = makeFlow({ careerRetired: true });
    alreadyRetired.flow.handleStartNextCareerSeason();
    expect(alreadyRetired.dispatch).not.toHaveBeenCalled();

  });

  test('ranks season awards by batting and bowling tie-breakers and MOM counts', () => {
    const players = [
      { id: 'a', name: 'Alpha', age: 20 },
      { id: 'b', name: 'Beta', age: 21 },
      { id: 'c', name: 'Charlie', age: 22 },
      { id: 'd', name: 'Delta', age: 24 },
      { id: 'mom', name: 'MOM Winner', age: 25 },
    ].map((player) => ({ ...player, playerType: 'batsman' }));
    const makeStats = (player, values) => ({
      playerId: player.id,
      team: 'Falcons',
      name: player.name,
      runs: 100,
      outs: 5,
      balls: 100,
      wickets: 4,
      runsConceded: 20,
      ballsBowled: 30,
      matches: 5,
      ...values,
    });
    const awardsFlow = makeFlow({
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A', players },
        { name: 'Ravens', country: 'Country A', players: [] },
      ],
      careerPlayerStats: {
        alpha: makeStats(players[0]),
        beta: makeStats(players[1]),
        charlie: makeStats(players[2], { balls: 60, runsConceded: 40 }),
        delta: makeStats(players[3], { runs: 80, balls: 40, runsConceded: 10, ballsBowled: 60 }),
        mom: makeStats(players[4], { runs: 40, wickets: 8 }),
      },
      careerSchedule: [
        { id: 'mom-award', isComplete: true, result: { momAward: { playerId: 'mom', team: 'Falcons', name: 'MOM Winner' } } },
        { id: 'mom-shortlist', isComplete: true, result: { momShortlist: [{ playerId: 'mom', team: 'Falcons', name: 'MOM Winner' }] } },
        { id: 'invalid-award', isComplete: true, result: { momAward: { name: 'No Team' } } },
        { id: 'incomplete-award', isComplete: false, result: { momAward: { playerId: 'alpha', team: 'Falcons', name: 'Alpha' } } },
      ],
    });
    awardsFlow.flow.handleStartNextCareerSeason();

    const seasonHistory = awardsFlow.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerSeasonHistoryAction').payload;
    const awards = seasonHistory[0].seasonReport.awards;
    expect(awards.find(({ id }) => id === 'best-batsman').winner.name).toBe('Charlie');
    expect(awards.find(({ id }) => id === 'best-bowler').winner.name).toBe('MOM Winner');
    expect(awards.find(({ id }) => id === 'most-mom').summary).toBe('2 awards');
  });

  test('resolves award leaderboards through average, strike-rate, economy, and name ties', () => {
    const players = [
      { id: 'bat-alpha', name: 'Bat Alpha', age: 24 },
      { id: 'bat-beta', name: 'Bat Beta', age: 24 },
      { id: 'bat-charlie', name: 'Bat Charlie', age: 24 },
      { id: 'bat-delta', name: 'Bat Delta', age: 24 },
      { id: 'bowl-alpha', name: 'Bowl Alpha', age: 25 },
      { id: 'bowl-beta', name: 'Bowl Beta', age: 25 },
      { id: 'bowl-charlie', name: 'Bowl Charlie', age: 25 },
      { id: 'bowl-delta', name: 'Bowl Delta', age: 25 },
      { id: 'young-wickets', name: 'Young Wickets', age: 20 },
      { id: 'young-matches', name: 'Young Matches', age: 21 },
    ];
    const statsFor = (player, values = {}) => ({
      playerId: player.id,
      team: 'Falcons',
      name: player.name,
      matches: 1,
      ...values,
    });
    const stats = Object.fromEntries([
      ...players.slice(0, 4).map((player) => [
        player.id,
        statsFor(player, {
          runs: 100,
          outs: 4,
          balls: player.id === 'bat-beta' ? 50 : 100,
        }),
      ]),
      ...players.slice(4, 8).map((player, index) => [
        player.id,
        statsFor(player, {
          wickets: 4,
          runsConceded: index === 1 ? 40 : 20,
          ballsBowled: index < 2 ? 30 : 60,
        }),
      ]),
      [players[8].id, statsFor(players[8], { wickets: 1, matches: 0 })],
      [players[9].id, statsFor(players[9], { matches: 14 })],
    ]);
    const run = makeFlow({
      careerPlayerProfile: { name: 'Career Player', playerId: 'not-in-roster', age: 24 },
      careerDomesticTeams: [{ name: 'Falcons', players }],
      careerPlayerStats: stats,
      careerSchedule: [],
    });

    run.flow.handleStartNextCareerSeason();

    const history = run.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerSeasonHistoryAction').payload[0];
    const awards = history.seasonReport.awards;
    expect(awards.find(({ id }) => id === 'best-batsman').winner.name).toBe('Bat Beta');
    expect(awards.find(({ id }) => id === 'best-bowler').winner.name).toBe('Bowl Charlie');
    expect(awards.find(({ id }) => id === 'young-player').winner.name).toBe('Young Wickets');
  });

  test('falls back to rotating transfers when random shuffles keep team order unchanged', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    const transferTeams = [
      { name: 'Falcons', country: 'Country A', players: makePlayers('Falcons').slice(0, 7) },
      { name: 'Ravens', country: 'Country A', players: makePlayers('Ravens').slice(0, 7) },
    ];
    const transferFlow = makeFlow({
      careerDomesticTeams: transferTeams,
      careerOffers: [{ team: 'Ravens', amount: 200000 }],
      careerSeasonHistory: [],
    });
    transferFlow.flow.handleStartNextCareerSeason({ selectedTeam: 'Unknown Team' });

    const updatedTeams = transferFlow.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerDomesticTeamsAction').payload;
    expect(updatedTeams.find(({ name }) => name === 'Falcons').players).toHaveLength(7);
    expect(updatedTeams.find(({ name }) => name === 'Ravens').players).toHaveLength(7);
    expect(updatedTeams.find(({ name }) => name === 'Falcons').players.map(({ id }) => id)).toContain('Ravens-1');
    expect(updatedTeams.find(({ name }) => name === 'Ravens').players.map(({ id }) => id)).toContain('Falcons-2');
    const history = transferFlow.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerSeasonHistoryAction').payload[0];
    expect(history.offseasonDecision).toMatchObject({ selectedTeam: 'Unknown Team', acceptedOffer: null });
  });

  test('continues an offseason with one team and creates an empty next-season schedule', () => {
    const soloTeam = makeFlow({
      careerDomesticTeams: [{ name: 'Falcons', country: 'Country A', players: [] }],
      careerGlobalPlayerPool: null,
      careerPlayerProfile: { name: 'Career Player', playerId: 'career-1', age: 20 },
      careerOffers: [],
    });
    soloTeam.flow.handleStartNextCareerSeason({ selectedTeam: 'Missing Team' });

    expect(soloTeam.dispatch).toHaveBeenCalledWith({ type: 'setCareerDomesticCountryAction', payload: 'Country A' });
    expect(soloTeam.dispatch).toHaveBeenCalledWith({ type: 'setCareerScheduleAction', payload: [] });
    expect(soloTeam.dispatch).toHaveBeenCalledWith({ type: 'setCareerMatchIndexAction', payload: 0 });
  });

  test('handles offseason transfer exits for small, unnamed, and empty team sets', () => {
    const smallRosters = makeFlow({
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A', players: makePlayers('Falcons').slice(0, 5) },
        { name: 'Ravens', country: 'Country A', players: makePlayers('Ravens').slice(0, 5) },
      ],
    });
    smallRosters.flow.handleStartNextCareerSeason();
    expect(smallRosters.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerDomesticTeamsAction',
      payload: expect.arrayContaining([
        expect.objectContaining({ name: 'Falcons' }),
        expect.objectContaining({ name: 'Ravens' }),
      ]),
    }));

    const unnamedTeam = makeFlow({
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A', players: [] },
        { country: 'Country B', players: null },
      ],
    });
    unnamedTeam.flow.handleStartNextCareerSeason();
    expect(unnamedTeam.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerDomesticTeamsAction',
      payload: expect.any(Array),
    }));

    const emptyTeams = makeFlow({ careerDomesticTeams: [] });
    emptyTeams.flow.handleStartNextCareerSeason();
    expect(emptyTeams.dispatch).toHaveBeenCalledWith({ type: 'setCareerDomesticTeamsAction', payload: [] });

    const noCareerTeam = makeFlow({
      careerTeam: '',
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A', players: [{}] },
        { name: 'Ravens', country: 'Country A', players: [] },
      ],
    });
    jest.requireMock('../../utils/controllerCareerScheduleUtils')
      .assignGlobalPoolPlayersToDomesticTeams.mockReturnValueOnce({ globalPlayerPool: null });
    noCareerTeam.flow.handleStartNextCareerSeason();
    expect(noCareerTeam.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerDomesticTeamsAction',
      payload: expect.any(Array),
    }));
    expect(noCareerTeam.dispatch).toHaveBeenCalledWith({
      type: 'setCareerGlobalPlayerPoolAction',
      payload: [{ id: 'pool-1', name: 'Pool Player' }],
    });
  });

  test('records an empty-season report and handles progression with missing statistics', () => {
    const emptySeason = makeFlow({
      careerPlayerProfile: { name: 'Career Player', playerId: 'career-1', age: 31, currentValue: 0 },
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A', players: [] },
        { name: 'Ravens', country: 'Country A', players: [] },
      ],
      careerOffers: [],
      careerPlayerStats: { invalid: { playerId: 'unassigned' }, unnamed: { team: 'Falcons' } },
      careerStandings: null,
      careerSchedule: [],
    });
    emptySeason.flow.handleStartNextCareerSeason();

    const historyAction = emptySeason.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerSeasonHistoryAction');
    expect(historyAction.payload[0].seasonReport).toMatchObject({
      currentAge: 31,
      awards: [
        { id: 'best-batsman', winner: null, summary: 'No winner' },
        { id: 'best-bowler', winner: null, summary: 'No winner' },
        { id: 'young-player', winner: null, summary: 'No eligible under-23 player' },
        { id: 'player-of-year', winner: null, summary: 'No winner' },
        { id: 'most-mom', winner: null, summary: 'No MOM awards recorded' },
      ],
      abilityChangePreview: [],
    });
    expect(emptySeason.dispatch).toHaveBeenCalledWith({ type: 'setCareerTeamAction', payload: 'Falcons' });
    expect(emptySeason.dispatch).toHaveBeenCalledWith({ type: 'setCareerOffersAction', payload: [] });
  });

  test('builds populated season awards, MOM counts, and ability-change previews', () => {
    jest.requireMock('../../utils/controllerCareerScheduleUtils')
      .applyEndOfSeasonPlayerAbilityUpdates.mockImplementation(({ domesticTeams: teams = [] }) =>
        teams.map((team) => ({
          ...team,
          players: team.players.map((player) => ({
            ...player,
            abilityToPlayPaceBall: player.abilityToPlayPaceBall + 1,
          })).concat({ id: 'new-player', name: 'Newly Added Player', abilityToPlayPaceBall: 30 }),
        }))
      );
    const populatedSeason = makeFlow({
      careerPlayerProfile: { name: 'Career Player', playerId: 'career-1', age: 22, currentValue: 150000 },
      careerDomesticTeams: [
        {
          name: 'Falcons',
          country: 'Country A',
          players: [
            { id: 'career-1', name: 'Career Player', age: 22, abilityToPlayPaceBall: 50 },
            { id: 'other-1', name: 'Other Player', age: 25, abilityToPlayPaceBall: 40 },
          ],
        },
        { name: 'Ravens', country: 'Country A', players: [] },
      ],
      careerOffers: [{ team: 'Ravens', amount: 200000 }],
      careerPlayerStats: {
        star: {
          playerId: 'career-1',
          team: 'Falcons',
          name: 'Career Player',
          runs: 120,
          wickets: 2,
          outs: 0,
          balls: 0,
          runsConceded: 10,
          ballsBowled: 0,
          matches: 3,
        },
        batter: {
          team: 'Falcons',
          name: 'Other Player',
          runs: 120,
          wickets: 0,
          outs: 4,
          balls: 40,
          runsConceded: 0,
          ballsBowled: 0,
          matches: 4,
        },
        invalid: { team: 'Falcons' },
      },
      careerSchedule: [
        {
          isComplete: true,
          result: { momAward: { playerId: 'career-1', team: 'Falcons', name: 'Career Player' } },
        },
        {
          isComplete: true,
          result: { momShortlist: [{ team: 'Falcons', name: 'Other Player' }] },
        },
        { isComplete: false, result: { momAward: { team: 'Falcons', name: 'Ignored' } } },
      ],
    });

    populatedSeason.flow.handleStartNextCareerSeason({ selectedTeam: 'Ravens' });
    const history = populatedSeason.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerSeasonHistoryAction').payload[0];
    expect(history.offseasonDecision).toMatchObject({
      selectedTeam: 'Ravens',
      acceptedOffer: { team: 'Ravens', amount: 200000 },
    });
    expect(history.seasonReport.abilityChangePreview).toHaveLength(2);
    expect(history.seasonReport.abilityChangePreview.some(({ player }) => player.id === 'new-player')).toBe(false);
    expect(history.seasonReport.awards.map(({ id, winner }) => [id, winner?.name])).toEqual([
      ['best-batsman', 'Career Player'],
      ['best-bowler', 'Career Player'],
      ['young-player', 'Career Player'],
      ['player-of-year', 'Career Player'],
      ['most-mom', 'Career Player'],
    ]);
    expect(history.seasonReport.awards[4].summary).toBe('1 awards');
  });

  test('exposes retirement, end, history, and return-to-schedule controls', () => {
    const { flow, input, dispatch } = makeFlow();
    flow.handleRetireCareer();
    flow.handleEndCareer();
    flow.handleViewCareerHistory();
    expect(input.setAutoSimMode).toHaveBeenCalledWith(null);
    expect(input.careerResultCommitSignatureRef.current).toBe('');
    expect(dispatch).toHaveBeenCalledWith({ type: 'setCareerRetiredAction', payload: true });
    expect(dispatch).toHaveBeenCalledWith({ type: 'resetMatchRuntimeAction', payload: undefined });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerHistory });

    const back = makeFlow({
      careerSchedule: [
        { id: 'done', isComplete: true },
        { id: 'next', isComplete: false },
      ],
    });
    back.flow.handleBackToCareerSchedule();
    expect(back.dispatch).toHaveBeenCalledWith({ type: 'setCareerMatchIndexAction', payload: 1 });
    const retiredBack = makeFlow({ careerRetired: true });
    retiredBack.flow.handleBackToCareerSchedule();
    expect(retiredBack.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerHistory });
  });
});
