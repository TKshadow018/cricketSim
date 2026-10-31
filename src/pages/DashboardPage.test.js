import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { LocalizationProvider } from '../localization/LocalizationProvider';
import { listRecentMatchHistory } from '../firebase/firestoreService';
import { getPlayersForNations } from '../gameData/playerListForNation';
import { matchStatusEnum } from '../gameData/matchStatusEnum';
import DashboardPage from './DashboardPage';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../features/game/CricketSimulator', () => ({
  __esModule: true,
  default: () => <div data-testid="simulator">Simulator</div>,
}));

jest.mock('../features/auth/authThunks', () => ({
  logoutUser: jest.fn(() => ({ type: 'auth/logout' })),
}));

jest.mock('../firebase/firestoreService', () => ({
  listRecentMatchHistory: jest.fn(),
}));

jest.mock('../gameData/playerListForNation', () => ({
  getPlayersForNations: jest.fn(),
}));

jest.mock('../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick, isLoading }) => (
    <button onClick={onClick} disabled={isLoading}>{text}</button>
  ),
}));

const initialGameState = {
  stage: matchStatusEnum.intro,
  matchTypeKey: 't20',
  ownTeam: 'India',
  opponentTeam: 'Australia',
  ownPlayingXI: [],
  opponentPlayingXI: [],
  ownCustomPlayers: [],
  opponentCustomPlayers: [],
  ownTeamRoles: {},
  opponentTeamRoles: {},
  firstBattingSide: 'own',
  firstInnings: { strikerIndex: 0, currentBowlerIndex: 0, balls: 0, freeHitArmed: false },
  secondInnings: { strikerIndex: 0, currentBowlerIndex: 0, balls: 0, freeHitArmed: false },
  battingIntent: 2,
  bowlingIntent: 2,
  locationCountry: 'England',
  selectedStadium: 'The Oval',
  matchCondition: { weather: 'sunny', pitch: 'sporting', outfield: 'lushGreen' },
  tossWinner: 'India',
  tossDecision: 'bat',
};

const dashboardOwnPlayers = [
  { id: 'india-1', name: 'India One', battingOrderCoeff: 2, abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 60 },
  { id: 'india-2', name: 'India Two', battingOrderCoeff: 1, abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60 },
];
const dashboardOpponentPlayers = [
  { id: 'australia-1', name: 'Australia One', battingOrderCoeff: 2, abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 60 },
  { id: 'australia-2', name: 'Australia Two', battingOrderCoeff: 1, abilityToPlayPaceBall: 60, abilityToPlaySpinBall: 60 },
];

let state;
let dispatch;

const renderPage = () => render(
  <LocalizationProvider>
    <DashboardPage />
  </LocalizationProvider>
);

beforeEach(() => {
  state = {
    auth: {
      user: { uid: 'user-1', email: 'player@example.com', displayName: 'Player' },
      isLoading: false,
    },
    game: { ...initialGameState },
  };
  dispatch = jest.fn();
  useDispatch.mockReturnValue(dispatch);
  useSelector.mockImplementation((selector) => selector(state));
  getPlayersForNations.mockReturnValue({
    ownPlayers: dashboardOwnPlayers,
    opponentPlayers: dashboardOpponentPlayers,
  });
  listRecentMatchHistory.mockResolvedValue([]);
  delete process.env.REACT_APP_FIREBASE_ADMIN_EMAIL;
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  delete process.env.REACT_APP_FIREBASE_ADMIN_EMAIL;
});

test('shows the dashboard and empty history for a regular user and dispatches logout', async () => {
  renderPage();

  expect(screen.getByText('Welcome, Player')).toBeInTheDocument();
  expect(document.body.textContent).not.toContain('👋');
  expect(screen.getByTestId('simulator')).toBeInTheDocument();
  expect(screen.getByText('Format: T20')).toBeInTheDocument();
  expect(screen.getByText(/Location Country: England/)).toBeInTheDocument();
  expect(screen.getByText(/Stadium: The Oval/)).toBeInTheDocument();
  expect(screen.getByText(/Weather: sunny/)).toBeInTheDocument();
  expect(screen.getByText(/Toss Winner:/)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('No completed matches saved yet.')).toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
  expect(dispatch).toHaveBeenCalledTimes(1);
});

test('provides guidance when match notes have no selections yet', () => {
  state.game = {
    ...initialGameState,
    stage: matchStatusEnum.ChooseGameMode,
    matchTypeKey: 'unknown-format',
    ownTeam: '',
    opponentTeam: '',
    locationCountry: '',
    selectedStadium: '',
    matchCondition: null,
    tossWinner: '',
    tossDecision: '',
  };

  renderPage();

  expect(screen.getByText('Choose a format, teams, and venue to build your match notes.')).toBeInTheDocument();
});

test('switches mobile dashboard views from the bottom navigation', () => {
  renderPage();

  const mainGrid = document.querySelector('.dashboard-main-grid');
  expect(screen.getByRole('navigation', { name: 'Dashboard views' })).toBeInTheDocument();
  expect(mainGrid).toHaveAttribute('data-mobile-view', 'play');

  fireEvent.click(screen.getByRole('button', { name: 'Panel' }));
  expect(mainGrid).toHaveAttribute('data-mobile-view', 'panel');

  fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
  expect(mainGrid).toHaveAttribute('data-mobile-view', 'notes');
});

test('renders saved match summaries, formats dates and displays empty-value fallbacks', async () => {
  listRecentMatchHistory.mockResolvedValue([
    {
      id: 'history-1',
      ownTeam: 'India',
      opponentTeam: 'Australia',
      firstInningsTeamName: 'India',
      firstInningsScore: 180,
      firstInningsWickets: 5,
      firstInningsBalls: 14,
      secondInningsTeamName: 'Australia',
      secondInningsScore: 150,
      secondInningsWickets: 8,
      secondInningsBalls: 0,
      summary: '',
      updatedAt: { toDate: () => new Date('2024-03-01T12:00:00Z') },
    },
    {
      id: 'history-2',
      firstInningsTeamName: 'England',
      firstInningsScore: 100,
      firstInningsWickets: 10,
      firstInningsBalls: '7',
      secondInningsTeamName: 'New Zealand',
      secondInningsScore: 101,
      secondInningsWickets: 2,
      secondInningsBalls: '13',
      summary: 'Won by eight wickets',
      updatedAt: 'not-a-date',
    },
    {
      id: 'history-3',
      firstInningsTeamName: 'New Zealand',
      secondInningsTeamName: 'South Africa',
      updatedAt: '2024-04-01T00:00:00Z',
    },
  ]);

  renderPage();

  await waitFor(() => expect(screen.getAllByText('Result saved')).toHaveLength(2));
  expect(screen.getByText(/2\.2/)).toBeInTheDocument();
  expect(screen.getAllByText(/0\.0/)).toHaveLength(2);
  expect(screen.getByText('Won by eight wickets')).toBeInTheDocument();
  expect(screen.getByText('Recently finished')).toBeInTheDocument();
  expect(screen.getAllByText(/2024/)).toHaveLength(2);
  expect(listRecentMatchHistory).toHaveBeenCalledWith('user-1', 10);
});

test('clears history when there is no user and ignores non-array history data', async () => {
  state.auth.user = null;
  listRecentMatchHistory.mockResolvedValueOnce({ items: [] });

  const { rerender } = renderPage();
  expect(screen.getByText('Welcome, Coach')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('No completed matches saved yet.')).toBeInTheDocument());
  expect(listRecentMatchHistory).not.toHaveBeenCalled();

  state.auth.user = { uid: 'user-2', displayName: '' };
  rerender(
    <LocalizationProvider>
      <DashboardPage />
    </LocalizationProvider>
  );
  await waitFor(() => expect(listRecentMatchHistory).toHaveBeenCalledWith('user-2', 10));
  expect(screen.getByText('Welcome, Coach')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('No completed matches saved yet.')).toBeInTheDocument());
});

test('handles sparse match notes and an admin email mismatch', async () => {
  process.env.REACT_APP_FIREBASE_ADMIN_EMAIL = 'admin@example.com';
  state.auth.user = { uid: 'user-3', displayName: 'Player' };
  state.game = {
    ...initialGameState,
    stage: matchStatusEnum.intro,
    matchTypeKey: 'unknown-format',
    ownTeam: '',
    opponentTeam: 'Australia',
    ownCustomPlayers: null,
    opponentCustomPlayers: null,
    ownPlayingXI: null,
    opponentPlayingXI: null,
    locationCountry: '',
    selectedStadium: '',
    matchCondition: null,
    tossWinner: '',
    tossDecision: '',
  };
  getPlayersForNations.mockReturnValue({});

  renderPage();

  expect(screen.getByText('Quick Panel')).toBeInTheDocument();
  expect(screen.getByText(/Teams:/)).toBeInTheDocument();
  expect(screen.queryByText(/Format:/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Location Country:/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Weather:/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Toss Decision:/)).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('No completed matches saved yet.')).toBeInTheDocument());
});

test('recovers from a history request failure', async () => {
  listRecentMatchHistory.mockRejectedValue(new Error('history unavailable'));

  renderPage();

  await waitFor(() => expect(screen.getByText('No completed matches saved yet.')).toBeInTheDocument());
});

test('refreshes recent history after a match ends', async () => {
  jest.useFakeTimers();
  state.game.stage = matchStatusEnum.MatchEnd;

  renderPage();
  await act(async () => {
    await Promise.resolve();
  });
  expect(listRecentMatchHistory).toHaveBeenCalledTimes(1);

  await act(async () => {
    jest.advanceTimersByTime(650);
    await Promise.resolve();
  });
  expect(listRecentMatchHistory).toHaveBeenCalledTimes(2);
});

test('renders admin match probabilities and batting-order preview during selection', () => {
  process.env.REACT_APP_FIREBASE_ADMIN_EMAIL = 'PLAYER@example.com';
  state.game.stage = matchStatusEnum.ChooseOwnPlayingXI;
  state.game.ownPlayingXI = dashboardOwnPlayers.map(({ id }) => id);
  state.game.opponentPlayingXI = dashboardOpponentPlayers.map(({ id }) => id);

  renderPage();

  expect(screen.getByText('Admin Matrix')).toBeInTheDocument();
  expect(screen.getByText('Matrix is visible only during TeamOneBat or TeamTwoBat stages.')).toBeInTheDocument();
  expect(screen.getByText('Selection Profile')).toBeInTheDocument();
  expect(screen.getAllByText('2/11')).toHaveLength(2);
  expect(screen.getByText('Batting Order Preview')).toBeInTheDocument();
  expect(screen.getAllByText(/batting order/)).toHaveLength(2);
});

test('omits empty batting-order previews and admin selection profiles outside setup stages', () => {
  process.env.REACT_APP_FIREBASE_ADMIN_EMAIL = 'player@example.com';
  state.game.stage = matchStatusEnum.ChooseOwnPlayingXI;

  const { rerender } = renderPage();
  expect(screen.getByText('Selection Profile')).toBeInTheDocument();
  expect(screen.queryByText(/batting order/)).not.toBeInTheDocument();

  state.game.stage = matchStatusEnum.ChooseMatchType;
  rerender(
    <LocalizationProvider>
      <DashboardPage />
    </LocalizationProvider>
  );
  expect(screen.getByText('Matrix is visible only during TeamOneBat or TeamTwoBat stages.')).toBeInTheDocument();
  expect(screen.queryByText('Selection Profile')).not.toBeInTheDocument();
});

test('renders live admin probabilities and the non-admin quick panel', () => {
  process.env.REACT_APP_FIREBASE_ADMIN_EMAIL = 'player@example.com';
  state.game.stage = matchStatusEnum.TeamOneBat;

  const { rerender } = renderPage();
  expect(screen.getByText('Role: User Batting')).toBeInTheDocument();
  expect(screen.getByText('Ability Snapshot')).toBeInTheDocument();
  expect(screen.getByText('Performance Factors')).toBeInTheDocument();

  state.game = { ...state.game, stage: matchStatusEnum.TeamTwoBat };
  rerender(
    <LocalizationProvider>
      <DashboardPage />
    </LocalizationProvider>
  );
  expect(screen.getByText('Role: User Bowling')).toBeInTheDocument();

  delete process.env.REACT_APP_FIREBASE_ADMIN_EMAIL;
  state.game.stage = matchStatusEnum.ChooseOpponentPlayingXI;
  rerender(
    <LocalizationProvider>
      <DashboardPage />
    </LocalizationProvider>
  );
  expect(screen.getByText('Quick Panel')).toBeInTheDocument();
  expect(screen.getByText('Selection Profile')).toBeInTheDocument();
});

test('shows active skill holders and outcome weight deltas in the admin matrix', () => {
  process.env.REACT_APP_FIREBASE_ADMIN_EMAIL = 'player@example.com';
  state.game.stage = matchStatusEnum.TeamOneBat;
  getPlayersForNations.mockReturnValue({
    ownPlayers: [
      { ...dashboardOwnPlayers[0], skills: ['HardHitter'] },
      dashboardOwnPlayers[1],
    ],
    opponentPlayers: [
      { ...dashboardOpponentPlayers[0], skills: ['YorkerKing'] },
      { ...dashboardOpponentPlayers[1], skills: ['SafeHands'] },
    ],
  });

  renderPage();

  expect(screen.getByText('Active skill impacts')).toBeInTheDocument();
  expect(screen.getByText('3 effects')).toBeInTheDocument();
  expect(screen.getByText('HardHitter')).toBeInTheDocument();
  expect(screen.getByText('YorkerKing')).toBeInTheDocument();
  expect(screen.getByText('SafeHands')).toBeInTheDocument();
  expect(screen.getByText('6 +3')).toBeInTheDocument();
  expect(screen.getByText('W +2')).toBeInTheDocument();
  expect(screen.getAllByText(/\(skill impact -?\d+%\)/).length).toBeGreaterThan(0);
  expect(screen.getByText(/Outcome weight delta/)).toBeInTheDocument();
});
