import React from 'react';



export let mockController;

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
}));

jest.mock('./hooks/useCricketSimulatorController', () => ({
  useCricketSimulatorController: () => mockController,
}));

jest.mock('../../utils/simulatorUtils', () => ({
  stageOrder: [0, 14, 15, 1, 2, 3, 17, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 18, 19, 20, 21, 22, 23],
}));

jest.mock('../../gameData/matchStatusEnum', () => ({
  matchStatusEnum: {
    TeamOneBat: 11,
    TeamTwoBat: 12,
    MatchEnd: 13,
    SeriesSummary: 16,
    TournamentChampion: 18,
    CareerSeasonSummary: 22,
    CareerHistory: 23,
  },
}));

jest.mock('./utils/controllerCareerScheduleUtils', () => ({
  CAREER_FORMATS: ['t20', 'odi', 'firstClass'],
  formatCareerMatchLabel: jest.fn((format) => String(format || '').toUpperCase()),
  getCareerFormatStandings: jest.fn((standings, format) => standings[format] || []),
  sortStandings: jest.fn((rows) => [...rows].sort((left, right) => right.points - left.points)),
}));

jest.mock('../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick, disabled }) => <button onClick={onClick} disabled={disabled}>{text}</button>,
}));

jest.mock('./components/PreMatchStages', () => ({
  __esModule: true,
  default: ({ stage, stageCommonProps, goToNextStage }) => (
    <div data-testid="pre-match" data-stage={stage}>
      <span>{stageCommonProps.stageIndex}/{stageCommonProps.totalStages}</span>
      <button onClick={goToNextStage}>Advance Setup</button>
    </div>
  ),
}));

jest.mock('./components/LiveMatchStages', () => ({
  __esModule: true,
  default: ({ stage, onMatchPrimaryAction, resultSummary }) => (
    <div data-testid="live-match" data-stage={stage}>
      <span>{resultSummary}</span>
      <button onClick={onMatchPrimaryAction}>Match Primary Action</button>
    </div>
  ),
}));

jest.mock('./components/TeamNameWithFlag', () => ({
  __esModule: true,
  default: ({ teamName }) => <span>{teamName}</span>,
}));

jest.mock('./components/PlayerNameWithType', () => ({
  __esModule: true,
  default: ({ player, name }) => <span>{name || player?.name || 'Unknown player'}</span>,
}));

jest.mock('./components/CareerPlayerProfileModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, player, onClose }) => (
    isOpen ? (
      <div role="dialog" aria-label="Career player profile">
        <h2>{title}</h2>
        <span>{player?.name}</span>
        <button onClick={onClose}>Close Profile</button>
      </div>
    ) : null
  ),
}));

const buildStats = () => ({
  alice: {
    key: 'Falcons::1::Alice',
    team: 'Falcons',
    name: 'Alice',
    playerId: 1,
    runs: 120,
    balls: 60,
    outs: 4,
    wickets: 4,
    ballsBowled: 24,
    runsConceded: 25,
    matches: 4,
    formatStats: {
      t20: { runs: 120, balls: 60, outs: 4, wickets: 4, ballsBowled: 24, runsConceded: 25, matches: 4 },
      odi: { runs: 80, balls: 90, outs: 3, wickets: 2, ballsBowled: 30, runsConceded: 20, matches: 3 },
    },
  },
  bob: {
    key: 'Falcons::2::Bob',
    team: 'Falcons',
    name: 'Bob',
    playerId: 2,
    runs: 45,
    balls: 38,
    outs: 2,
    wickets: 1,
    ballsBowled: 12,
    runsConceded: 18,
    matches: 3,
    formatStats: { t20: { runs: 45, balls: 38, outs: 2, wickets: 1, ballsBowled: 12, runsConceded: 18, matches: 3 } },
  },
  noFormatStats: { key: 'Ravens::3::Cara', team: 'Ravens', name: 'Cara', runs: 20, matches: 2 },
});

const buildGlobalPool = () => [
  {
    id: 1,
    name: 'Alice',
    assignedTeamName: 'Falcons',
    assignedTeamId: 'Falcons',
    country: 'India',
    playerType: 'Batter',
    abilityToPlayPaceBall: 72,
    abilityToPlaySpinBall: 70,
    battingAggresion: 65,
    paceAbility: 20,
    spinAbility: 22,
    baseMarketPrice: 100000,
  },
  ...Array.from({ length: 26 }, (_, index) => ({
    id: index + 2,
    name: `Global Player ${String(index + 2).padStart(2, '0')}`,
    assignedTeamName: index % 2 === 0 ? 'Falcons' : '',
    assignedTeamId: index % 2 === 0 ? 'Falcons' : '',
    country: index === 25 ? '' : index % 2 === 0 ? 'India' : 'England',
    playerType: index % 2 === 0 ? 'Batter' : 'Bowler',
    abilityToPlayPaceBall: 40 + index,
    abilityToPlaySpinBall: 50 + index,
    battingAggresion: 60 + index,
    paceAbility: 30 + index,
    spinAbility: 20 + index,
    abilityScore: 500 - index,
    baseMarketPrice: 50000 + index * 1000,
  })),
];

export const makeController = (overrides = {}) => {
  const defaults = {
    game: {
      stage: 19,
      ownTeam: 'Falcons',
      opponentTeam: 'Ravens',
      selectedStadium: 'National Ground',
      locationCountry: 'India',
    },
    gameMode: 'career',
    seriesLength: 3,
    seriesCurrentMatch: 1,
    seriesResults: [],
    seriesStanding: { ownWins: 1, opponentWins: 0 },
    seriesTopRunScorers: [],
    seriesTopWicketTakers: [],
    seriesProgressLabel: 'Match 1 of 3',
    tournamentUserTeam: 'Falcons',
    tournamentOpponentTeams: ['Ravens', 'Hawks'],
    tournamentMatches: [],
    tournamentChampion: '',
    tournamentResults: [],
    tournamentTopRunScorers: [],
    tournamentTopWicketTakers: [],
    tournamentProgressLabel: 'Semi-final',
    isCurrentMatchUserInvolved: true,
    autoSimMode: null,
    countryList: [{ country: 'India' }],
    venueStadiums: ['National Ground'],
    availableVoices: [],
    matchType: { nameKey: 't20', over: 20 },
    matchVisual: '🔥',
    firstInningsTeamName: 'Falcons',
    secondInningsTeamName: 'Ravens',
    isUserWinner: true,
    firstInningsView: {},
    secondInningsView: {},
    savedGames: [],
    isSavingGame: false,
    isGlobalSaving: false,
    isSavesLoading: false,
    saveMessage: '',
    teamOneFinal: 'Falcons 100/4',
    teamTwoFinal: 'Ravens 101/5',
    resultSummary: 'Ravens won by 5 wickets',
    momRecommendations: [],
    announceManOfTheMatch: jest.fn(),
    goToNextStage: jest.fn(),
    goToPreviousStage: jest.fn(),
    selectGameMode: jest.fn(),
    selectSeriesLength: jest.fn(),
    toggleTournamentOpponent: jest.fn(),
    prepareTournamentFixtures: jest.fn(),
    confirmTournamentFixtures: jest.fn(),
    randomizeTournamentFixtures: jest.fn(),
    updateTournamentFixture: jest.fn(),
    matchPrimaryAction: jest.fn(),
    simulateCurrentOver: jest.fn(),
    simulateFullMatch: jest.fn(),
    toggleScoreboard: jest.fn(),
    setMatchTypeKey: jest.fn(),
    setOwnTeam: jest.fn(),
    setOpponentTeam: jest.fn(),
    setLocationCountry: jest.fn(),
    setSelectedStadium: jest.fn(),
    setCommentator: jest.fn(),
    setPreferredVoice: jest.fn(),
    speak: jest.fn(),
    saveGame: jest.fn(),
    loadSavedGame: jest.fn(),
    deleteSavedGame: jest.fn(),
    setBattingIntent: jest.fn(),
    setBowlingIntent: jest.fn(),
    processDelivery: jest.fn(),
    handleSelectOpener: jest.fn(),
    handleSelectNextBatter: jest.fn(),
    handleSelectBowler: jest.fn(),
    handleTossCall: jest.fn(),
    handleUserTossDecision: jest.fn(),
    ownAvailablePool: [],
    opponentAvailablePool: [],
    ownSelectedXIIds: [],
    opponentSelectedXIIds: [],
    ownSelectedXIPlayers: [],
    opponentSelectedXIPlayers: [],
    ownTeamRoles: {},
    opponentTeamRoles: {},
    ownXIReady: false,
    opponentXIReady: false,
    ownRolesReady: false,
    opponentRolesReady: false,
    moveOwnPlayerToXI: jest.fn(),
    removeOwnPlayerFromXI: jest.fn(),
    moveOpponentPlayerToXI: jest.fn(),
    removeOpponentPlayerFromXI: jest.fn(),
    setOwnRole: jest.fn(),
    setOpponentRole: jest.fn(),
    createCustomPlayer: jest.fn(),
    autoPickOwnXI: jest.fn(),
    autoPickOpponentXI: jest.fn(),
    startMatchWithSelectedXI: jest.fn(),
    buildTeamOneScorecard: jest.fn(),
    buildTeamTwoScorecard: jest.fn(),
    resetMatch: jest.fn(),
    oversDisplay: '20 overs',
    careerTeam: 'Falcons',
    careerSeason: 2,
    careerSeasonLength: 'short',
    careerFormat: 't20',
    careerMatchIndex: 0,
    careerSchedule: [],
    careerStandings: {
      t20: [
        { team: 'Falcons', wins: 6, losses: 2, ties: 0, points: 12, played: 8 },
        { team: 'Ravens', wins: 5, losses: 3, ties: 0, points: 10, played: 8 },
      ],
      odi: [
        { team: 'Ravens', wins: 3, losses: 1, ties: 0, points: 6, played: 4 },
      ],
    },
    careerPlayerStats: buildStats(),
    careerSeasonHistory: [],
    careerPlayerProfile: { playerId: 1, name: 'Alice', playerType: 'batsman', age: 24 },
    careerDomesticCountry: 'India',
    careerDomesticTeams: [
      {
        name: 'Falcons',
        country: 'India',
        players: [
          { id: 1, name: 'Alice', playerType: 'batsman', abilityToPlayPaceBall: 72, abilityToPlaySpinBall: 70, battingAggresion: 65, paceAbility: 20, spinAbility: 22 },
          { id: 2, name: 'Bob', playerType: 'bowler', abilityToPlayPaceBall: 55, abilityToPlaySpinBall: 50, battingAggresion: 45, paceAbility: 80, spinAbility: 72 },
        ],
      },
      { name: 'Ravens', country: 'England', players: [{ id: 3, name: 'Cara', playerType: 'all-rounder' }] },
      { name: 'Sharks', country: 'India', players: [{ id: 4, playerType: 'bowler' }] },
    ],
    careerGlobalPlayerPool: buildGlobalPool(),
    careerAuctionSummary: null,
    careerOffers: [],
    careerRetired: false,
    careerTopRunScorers: [],
    careerTopWicketTakers: [],
    careerProgressLabel: 'Match 1 of 8',
    beginCareer: jest.fn(),
    handleCareerContinueAfterAuction: jest.fn(),
    handleCareerStartNextMatch: jest.fn(),
    handleStartNextCareerSeason: jest.fn(),
    handleEndCareer: jest.fn(),
    handleRetireCareer: jest.fn(),
    handleViewCareerHistory: jest.fn(),
    handleBackToCareerSchedule: jest.fn(),
  };

  return {
    ...defaults,
    ...overrides,
    game: { ...defaults.game, ...(overrides.game || {}) },
  };
};


export const setMockController = (controller) => {
  mockController = controller;
};

export const prepareSimulatorTest = () => {
    setMockController(makeController());
    const scheduleUtils = jest.requireMock('./utils/controllerCareerScheduleUtils');
    scheduleUtils.formatCareerMatchLabel.mockImplementation((format) => String(format || '').toUpperCase());
    scheduleUtils.getCareerFormatStandings.mockImplementation((standings, format) => standings?.[format] || []);
    scheduleUtils.sortStandings.mockImplementation((rows) => (
      (Array.isArray(rows)
        ? [...rows]
        : Object.entries(rows || {}).map(([team, stats]) => ({ team, ...stats }))
      ).sort((left, right) => right.points - left.points)
    ));
  
};
