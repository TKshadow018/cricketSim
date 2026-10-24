import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CricketSimulator from './CricketSimulator';

let mockController;

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

const makeController = (overrides = {}) => {
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

describe('CricketSimulator', () => {
  beforeEach(() => {
    mockController = makeController();
    const scheduleUtils = jest.requireMock('./utils/controllerCareerScheduleUtils');
    scheduleUtils.formatCareerMatchLabel.mockImplementation((format) => String(format || '').toUpperCase());
    scheduleUtils.getCareerFormatStandings.mockImplementation((standings, format) => standings?.[format] || []);
    scheduleUtils.sortStandings.mockImplementation((rows) => (
      (Array.isArray(rows)
        ? [...rows]
        : Object.entries(rows || {}).map(([team, stats]) => ({ team, ...stats }))
      ).sort((left, right) => right.points - left.points)
    ));
  });

  test('opens domestic stats, player profiles, league tables, and league player rankings', () => {
    const { rerender } = render(<CricketSimulator />);

    fireEvent.click(screen.getByRole('button', { name: 'Domestic Teams Season Stats' }));
    const domesticDialog = screen.getByRole('dialog', { name: 'Domestic team season statistics' });
    expect(within(domesticDialog).getByText('Domestic Teams - Current Season Player Statistics')).toBeInTheDocument();
    expect(within(domesticDialog).getByRole('tab', { name: 'Falcons' })).toBeInTheDocument();
    expect(within(domesticDialog).getByText('Batting')).toBeInTheDocument();
    expect(within(domesticDialog).getByText('Bowling')).toBeInTheDocument();
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Alice' })[0]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(domesticDialog).getByRole('tab', { name: 'Sharks' }));
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Unknown player' })[0]);
    expect(screen.queryByRole('dialog', { name: 'Career player profile' })).not.toBeInTheDocument();
    fireEvent.click(within(domesticDialog).getByRole('tab', { name: 'Falcons' }));
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Alice' })[1]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));

    fireEvent.click(within(domesticDialog).getByRole('tab', { name: 'ODI' }));
    expect(within(domesticDialog).getByRole('tab', { name: 'ODI' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Close' }).at(-1));

    fireEvent.click(screen.getByRole('button', { name: 'My Current Stats/Ability' }));
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('My Current Season Stats and Ability');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));

    fireEvent.click(screen.getByRole('button', { name: 'See League Table' }));
    const leagueDialog = screen.getByRole('dialog', { name: 'League table by format' });
    expect(within(leagueDialog).getByText('T20 Standings (India)')).toBeInTheDocument();
    expect(within(leagueDialog).getByText('Falcons')).toBeInTheDocument();
    fireEvent.change(within(leagueDialog).getByLabelText('Country'), { target: { value: 'England' } });
    expect(within(leagueDialog).getByText('Ravens')).toBeInTheDocument();
    fireEvent.click(within(leagueDialog).getByRole('tab', { name: 'ODI' }));
    expect(within(leagueDialog).getByText('ODI Standings (England)')).toBeInTheDocument();
    fireEvent.click(within(leagueDialog).getAllByRole('button', { name: 'Close' }).at(-1));

    fireEvent.click(screen.getByRole('button', { name: 'See League Player Statistics' }));
    const playerStatsDialog = screen.getByRole('dialog', { name: 'League player statistics by format' });
    expect(within(playerStatsDialog).getByText(/Top 20 Scorers/)).toBeInTheDocument();
    fireEvent.change(within(playerStatsDialog).getByLabelText('Country'), { target: { value: 'India' } });
    expect(within(playerStatsDialog).getAllByRole('button', { name: 'Alice' })).toHaveLength(2);
    fireEvent.click(within(playerStatsDialog).getAllByRole('button', { name: 'Alice' })[0]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(playerStatsDialog).getByRole('tab', { name: 'ODI' }));
    fireEvent.click(within(playerStatsDialog).getAllByRole('button', { name: 'Alice' })[1]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(playerStatsDialog).getAllByRole('button', { name: 'Close' }).at(-1));

    mockController = makeController({
      careerDomesticTeams: null,
      careerDomesticCountry: '',
      careerPlayerProfile: {},
      careerPlayerStats: null,
      careerStandings: null,
      careerGlobalPlayerPool: null,
    });
    rerender(<CricketSimulator />);
    expect(screen.getByRole('button', { name: 'My Current Stats/Ability' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Domestic Teams Season Stats' }));
    const emptyDomesticDialog = screen.getByRole('dialog', { name: 'Domestic team season statistics' });
    expect(within(emptyDomesticDialog).getByText('No team data available for this format yet.')).toBeInTheDocument();
    fireEvent.click(emptyDomesticDialog.querySelector('button[aria-label="Close"]'));
    fireEvent.click(screen.getByRole('button', { name: 'See League Table' }));
    const emptyLeagueDialog = screen.getByRole('dialog', { name: 'League table by format' });
    expect(within(emptyLeagueDialog).getByText('ODI Standings (N/A)')).toBeInTheDocument();
    expect(within(emptyLeagueDialog).getByLabelText('Country')).toHaveValue('');
    fireEvent.click(emptyLeagueDialog.querySelector('button[aria-label="Close"]'));
    fireEvent.click(screen.getByRole('button', { name: 'See League Player Statistics' }));
    fireEvent.click(screen.getByRole('dialog', { name: 'League player statistics by format' }).querySelector('button[aria-label="Close"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Search Players Worldwide' }));
    const emptySearch = screen.getByRole('dialog', { name: 'Global player search' });
    fireEvent.change(within(emptySearch).getByPlaceholderText('Player Name'), { target: { value: 'Unavailable' } });
    expect(within(emptySearch).getByText('Players List (0)')).toBeInTheDocument();
    fireEvent.click(emptySearch.querySelector('button[aria-label="Close"]'));
  });

  test('resolves career player statistics by name when player IDs are unavailable or do not match', () => {
    mockController = makeController({
      careerTeam: '',
      careerPlayerProfile: { name: 'Alice', age: 25, team: 'Falcons' },
      careerPlayerStats: {
        legacy: {
          team: 'Falcons',
          name: 'Alice',
          runs: 10,
          balls: 0,
          outs: 0,
          wickets: 0,
          ballsBowled: 0,
          runsConceded: 0,
          matches: 0,
          formatStats: { t20: { runs: 10, balls: 0, outs: 0, wickets: 0, ballsBowled: 0, runsConceded: 0, matches: 0 } },
        },
        keyFallback: {
          key: 'Falcons::99::Ghost',
          runs: 30,
          balls: 10,
          outs: 0,
          wickets: 1,
          matches: 2,
          formatStats: { t20: { runs: 30, balls: 10, outs: 0, wickets: 1, ballsBowled: 6, runsConceded: 5, matches: 2 } },
        },
        twin: {
          key: 'Falcons::100::Twin',
          team: 'Falcons',
          name: 'Twin',
          playerId: 100,
          formatStats: { t20: { runs: 10, balls: 0, outs: 0, wickets: 0, ballsBowled: 0, runsConceded: 0, matches: 0 } },
        },
        zero: {
          key: 'External::405::Zero',
          team: 'External',
          name: 'Zero',
          playerId: 405,
          formatStats: { t20: { runs: 0, balls: 0, outs: 0, wickets: 0, ballsBowled: 0, runsConceded: 0, matches: 0 } },
        },
        external: {
          key: 'External::404::Orphan',
          team: 'External',
          name: 'Orphan',
          playerId: 404,
          formatStats: { t20: { runs: 5, balls: 5, outs: 1, wickets: 1, ballsBowled: 6, runsConceded: 3, matches: 1 } },
        },
        invalid: {},
        nullEntry: null,
      },
      careerDomesticTeams: [
        {
          name: 'Falcons',
          country: 'India',
          players: [
            { id: 'replacement-id', name: 'Alice', playerType: 'batsman' },
            { id: '99', name: 'Ghost', playerType: 'bowler' },
            { id: '100', name: 'Twin', playerType: 'batsman' },
          ],
        },
        { name: 'External', country: 'India', players: [] },
        { country: 'India', players: [] },
        { name: 'No Roster', country: 'India', players: null },
      ],
    });
    const { rerender } = render(<CricketSimulator />);

    fireEvent.click(screen.getByRole('button', { name: 'My Current Stats/Ability' }));
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));

    fireEvent.click(screen.getByRole('button', { name: 'Domestic Teams Season Stats' }));
    const domesticDialog = screen.getByRole('dialog', { name: 'Domestic team season statistics' });
    fireEvent.click(within(domesticDialog).getByRole('tab', { name: 'Falcons' }));
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Alice' })[0]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Alice');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Ghost' })[0]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Ghost');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(domesticDialog).getAllByRole('button', { name: 'Close' }).at(-1));

    fireEvent.click(screen.getByRole('button', { name: 'See League Player Statistics' }));
    const leaguePlayers = screen.getByRole('dialog', { name: 'League player statistics by format' });
    fireEvent.click(within(leaguePlayers).getByRole('tab', { name: 'T20' }));
    fireEvent.click(within(leaguePlayers).getAllByRole('button', { name: 'Orphan' })[0]);
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('Orphan');
    fireEvent.click(screen.getByRole('button', { name: 'Close Profile' }));
    fireEvent.click(within(leaguePlayers).getAllByRole('button', { name: 'Close' }).at(-1));

    mockController = makeController({
      careerTeam: '',
      careerPlayerProfile: { name: 'No Stats' },
      careerPlayerStats: {},
      careerDomesticTeams: null,
    });
    rerender(<CricketSimulator />);
    fireEvent.click(screen.getByRole('button', { name: 'My Current Stats/Ability' }));
    expect(screen.getByRole('dialog', { name: 'Career player profile' })).toHaveTextContent('No Stats');
  });

  test('searches sparse unassigned players without stats or profile attributes', () => {
    mockController = makeController({
      careerDomesticTeams: [
        { name: 'No Country', players: null },
        { country: 'India', players: [] },
      ],
      careerPlayerStats: null,
      careerGlobalPlayerPool: [
        { id: 'blank-1', name: 'Blank Player' },
        { id: 'blank-2', name: 'Blank Player' },
        { name: 'No ID', assignedTeamName: 'Falcons' },
        { id: 'nameless', name: '', assignedTeamName: 'Falcons' },
      ],
    });
    render(<CricketSimulator />);
    fireEvent.click(screen.getByRole('button', { name: 'Search Players Worldwide' }));
    const dialog = screen.getByRole('dialog', { name: 'Global player search' });
    fireEvent.change(within(dialog).getByPlaceholderText('Player Name'), { target: { value: 'Blank' } });

    expect(within(dialog).getByText('Players List (2)')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Unassigned')).toHaveLength(2);
    expect(within(dialog).getAllByText('Blank Player')).toHaveLength(2);
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Close' }).at(-1));
  });

  test('filters worldwide players, paginates results, and applies malformed and numeric ranges', () => {
    render(<CricketSimulator />);
    fireEvent.click(screen.getByRole('button', { name: 'Search Players Worldwide' }));
    const dialog = screen.getByRole('dialog', { name: 'Global player search' });
    expect(within(dialog).getByText('Enter at least one filter to load players.')).toBeInTheDocument();
    expect(within(dialog).getByText('Players: 0')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByPlaceholderText('Player Name'), { target: { value: 'Global' } });
    expect(within(dialog).getByText('Players List (26)')).toBeInTheDocument();
    expect(within(dialog).getByText('Page 1 of 2')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByText('Page 2 of 2')).toBeInTheDocument();
    expect(within(dialog).getByText('Global Player 27')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Prev' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByText('Page 2 of 2')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByPlaceholderText('Bat vs Pace (e.g. 30-80)'), { target: { value: '80-50' } });
    expect(within(dialog).getByText('Page 1 of 1')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText('Player Name'), { target: { value: 'Global Player 02' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Bat vs Pace (e.g. 30-80)'), { target: { value: 'not-a-range' } });
    expect(within(dialog).getByText('Players List (1)')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText('Total Runs (e.g. 200-900)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Runs/Match (e.g. 20-60)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Total Wickets (e.g. 5-30)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Matches (e.g. 5-20)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Pace Ability (e.g. 40-90)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Spin Ability (e.g. 20-70)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Aggression (e.g. 50-95)'), { target: { value: '0' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Bat vs Spin (e.g. 30-80)'), { target: { value: '0' } });
    const searchSelects = within(dialog).getAllByRole('combobox');
    fireEvent.change(searchSelects[0], { target: { value: 'Batter' } });
    fireEvent.change(searchSelects[1], { target: { value: 'India' } });
    expect(within(dialog).getByText('Players List (1)')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText('Player Name'), { target: { value: '' } });
    expect(within(dialog).getByText(/^Players List \(\d+\)$/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Close' }).at(-1));
    fireEvent.click(screen.getByRole('button', { name: 'Search Players Worldwide' }));
    fireEvent.click(screen.getByRole('dialog', { name: 'Global player search' }).querySelector('button[aria-label="Close"]'));
  });

  test('searches assigned players through name-based statistics and derived ability scores', () => {
    mockController = makeController({
      careerDomesticCountry: '',
      careerPlayerStats: {
        legacy: {
          key: 'Ravens::3::Cara',
          team: 'Ravens',
          name: 'Cara',
          playerId: 3,
          runs: 20,
          balls: 10,
          outs: 0,
          wickets: 0,
          matches: 2,
          ballsBowled: 0,
          runsConceded: 0,
        },
      },
      careerGlobalPlayerPool: [{
        id: 3,
        name: 'Cara',
        assignedTeamName: 'Ravens',
        assignedTeamId: 'Ravens',
        country: 'England',
        playerType: 'Bowler',
        abilityToPlayPaceBall: 40,
        abilityToPlaySpinBall: 50,
        paceAbility: 60,
        spinAbility: 30,
        battingAggresion: 20,
        abilityScore: 0,
      }],
    });
    render(<CricketSimulator />);
    fireEvent.click(screen.getByRole('button', { name: 'Search Players Worldwide' }));
    const dialog = screen.getByRole('dialog', { name: 'Global player search' });
    const playerName = within(dialog).getByPlaceholderText('Player Name');
    fireEvent.change(playerName, { target: { value: 'Cara' } });
    expect(within(dialog).getByText('Players List (1)')).toBeInTheDocument();
    expect(within(dialog).getByText('10.00')).toBeInTheDocument();

    const selects = within(dialog).getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'India' } });
    expect(within(dialog).getByText('Players List (0)')).toBeInTheDocument();
    fireEvent.change(selects[1], { target: { value: 'England' } });
    fireEvent.change(selects[0], { target: { value: 'Bowler' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Matches (e.g. 5-20)'), { target: { value: '1-3' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Runs/Match (e.g. 20-60)'), { target: { value: '11-20' } });
    expect(within(dialog).getByText('Players List (0)')).toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText('Runs/Match (e.g. 20-60)'), { target: { value: '10' } });
    expect(within(dialog).getByText('Players List (1)')).toBeInTheDocument();
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Close' }).at(-1));
  });

  test('routes setup and live-match stages and displays saving state for the active game mode', () => {
    mockController = makeController({ gameMode: 'single' });
    const { rerender } = render(<CricketSimulator />);
    expect(screen.getByTestId('pre-match')).toHaveAttribute('data-stage', '19');
    expect(screen.queryByRole('button', { name: 'Search Players Worldwide' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Advance Setup' }));
    expect(mockController.goToNextStage).toHaveBeenCalled();

    mockController = makeController({
      game: { stage: 11 },
      gameMode: 'series',
      isGlobalSaving: true,
    });
    rerender(<CricketSimulator />);
    expect(screen.getByTestId('live-match')).toHaveAttribute('data-stage', '11');
    expect(screen.getByText('T20 Series')).toBeInTheDocument();
    expect(screen.getByText('Saving match...')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Match Primary Action' }));
    expect(mockController.matchPrimaryAction).toHaveBeenCalled();

    mockController = makeController({ game: { stage: 12 }, gameMode: 'tournament' });
    rerender(<CricketSimulator />);
    expect(screen.getByText('T20 Tournament')).toBeInTheDocument();
    expect(screen.queryByText('Saving match...')).not.toBeInTheDocument();

    mockController = makeController({ game: { stage: 22 }, gameMode: 'career' });
    rerender(<CricketSimulator />);
    expect(screen.getByText('Career — T20')).toBeInTheDocument();
    expect(screen.getByText('Match 1 of 8')).toBeInTheDocument();

    mockController = makeController({
      game: { stage: 13, selectedStadium: '' },
      gameMode: 'quick',
    });
    rerender(<CricketSimulator />);
    expect(screen.getByText('T20 Match')).toBeInTheDocument();
    expect(screen.getByText('Venue: India')).toBeInTheDocument();
    expect(screen.getByText('Match 1 of 3')).toBeInTheDocument();
  });
});
