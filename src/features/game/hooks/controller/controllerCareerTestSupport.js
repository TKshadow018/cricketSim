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

export const makePlayers = (team) => Array.from({ length: 12 }, (_, index) => ({
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

export const domesticTeams = [
  { name: 'Falcons', country: 'Country A', location: 'A City', players: makePlayers('Falcons') },
  { name: 'Ravens', country: 'Country A', location: 'R City', players: makePlayers('Ravens') },
  { name: 'Hawks', country: 'Country B', location: 'H City', players: makePlayers('Hawks') },
  { name: 'Owls', country: 'Country B', location: 'O City', players: makePlayers('Owls') },
];

export const makeFlow = (overrides = {}) => {
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

export const resetCareerFlowMocks = () => {
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
  
};
