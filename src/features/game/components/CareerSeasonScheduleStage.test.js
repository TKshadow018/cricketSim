import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CareerSeasonScheduleStage from './CareerSeasonScheduleStage';

jest.mock('faker-user', () => ({ createPerson: jest.fn() }));

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick, disabled }) => <button onClick={onClick} disabled={disabled}>{text}</button>,
}));

jest.mock('./StageShell', () => ({
  __esModule: true,
  default: ({ title, subtitle, children }) => <section><h2>{title}</h2><div>{subtitle}</div>{children}</section>,
}));

jest.mock('../utils/controllerCareerScheduleUtils', () => ({
  CAREER_FORMATS: ['t20', 'odi'],
  formatCareerMatchLabel: jest.fn(),
  getCareerFormatStandings: jest.fn(),
  sortStandings: jest.fn(),
}));

const makeProps = (overrides = {}) => ({
  stageCommonProps: {},
  careerTeam: 'Falcons',
  careerSeason: 2,
  careerMatchIndex: 1,
  careerSchedule: [
    {
      id: 'done',
      matchNumber: 1,
      teamA: 'Falcons',
      teamB: 'Ravens',
      format: 't20',
      isComplete: true,
      isUserMatch: true,
      result: {
        winner: 'Falcons',
        summary: 'Falcons won by 10 runs',
        teamAScore: 120,
        teamAWickets: 4,
        teamBScore: 110,
        teamBWickets: 8,
        scorecard: { currentInnings: null, previousInnings: null },
      },
    },
    {
      id: 'next',
      matchNumber: 2,
      teamA: 'Falcons',
      teamB: 'Hawks',
      format: 'odi',
      scheduledDate: '2025-02-01',
      leagueCountry: 'Country A',
      isUserMatch: true,
      isComplete: false,
    },
    null,
    {
      id: 'later',
      matchNumber: 3,
      teamA: 'Ravens',
      teamB: 'Hawks',
      format: 't20',
      scheduledDate: '2025-02-02',
      leagueCountry: 'Country A',
      isComplete: false,
    },
  ],
  careerStandings: {
    t20: [{ team: 'Falcons', played: 2, wins: 1, losses: 1, ties: 0, points: 2 }],
    odi: [{ team: 'Ravens', played: 2, wins: 2, losses: 0, ties: 0, points: 4 }],
  },
  careerDomesticCountry: 'Country A',
  careerDomesticTeams: [
    { name: 'Falcons', country: 'Country A' },
    { name: 'Ravens', country: 'Country A' },
    { name: 'Hawks', country: 'Country A' },
    { name: 'Owls', country: 'Country B' },
  ],
  careerPlayerProfile: { name: 'Career Player', age: 22, playerType: 'batsman' },
  careerRetired: false,
  handleCareerStartNextMatch: jest.fn(),
  handleViewCareerHistory: jest.fn(),
  ...overrides,
});

describe('CareerSeasonScheduleStage', () => {
  beforeEach(() => {
    const helpers = jest.requireMock('../utils/controllerCareerScheduleUtils');
    helpers.formatCareerMatchLabel.mockImplementation((format) => String(format || 't20').toUpperCase());
    helpers.getCareerFormatStandings.mockImplementation((standings, format) => standings[format] || []);
    helpers.sortStandings.mockImplementation((rows) => [...rows].sort((left, right) => right.points - left.points));
  });

  test('shows next fixtures, expands the schedule, toggles standings, and exposes career actions', () => {
    const props = makeProps();
    const { rerender } = render(<CareerSeasonScheduleStage {...props} />);
    expect(screen.getByRole('heading', { name: 'Season 2 Schedule' })).toBeInTheDocument();
    expect(screen.getByText('Next Fixture')).toBeInTheDocument();
    expect([...document.querySelectorAll('.sim-saved-item')].some((item) => item.textContent.includes('Match 2:'))).toBe(true);
    expect(screen.getByText('ODI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simulate Until Next Club Match' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show Full Schedule' }));
    expect(screen.getByText('Fixtures')).toBeInTheDocument();
    expect([...document.querySelectorAll('.sim-saved-item')].some((item) => item.textContent.includes('Match 1:'))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Hide Full Schedule' }));
    expect([...document.querySelectorAll('.sim-saved-item')].some((item) => item.textContent.includes('Match 1:'))).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Show Points Table' }));
    expect(screen.getByText('T20 Standings')).toBeInTheDocument();
    expect(screen.getByText('ODI Standings')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide Points Table' }));
    expect(screen.queryByText('T20 Standings')).not.toBeInTheDocument();
    rerender(<CareerSeasonScheduleStage {...props} careerStandings={{ t20: [], odi: [] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show Points Table' }));
    expect(screen.queryByText('T20 Standings')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide Points Table' }));

    fireEvent.click(screen.getByRole('button', { name: 'Simulate Until Next Club Match' }));
    fireEvent.click(screen.getByRole('button', { name: 'Career History' }));
    expect(props.handleCareerStartNextMatch).toHaveBeenCalled();
    expect(props.handleViewCareerHistory).toHaveBeenCalled();

    rerender(<CareerSeasonScheduleStage {...props} careerRetired />);
    expect(screen.getByRole('button', { name: 'Retired' })).toBeDisabled();
  });

  test('opens completed user scorecards from mouse and keyboard and closes through either control', () => {
    const props = makeProps();
    render(<CareerSeasonScheduleStage {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show Full Schedule' }));
    const completedFixture = [...document.querySelectorAll('[role="button"].sim-saved-item')]
      .find((item) => item.textContent.includes('Match 1:'));
    fireEvent.click(completedFixture);
    expect(screen.getByRole('dialog', { name: 'Completed fixture scoreboard' })).toBeInTheDocument();
    expect(screen.getByText('Falcons won by 10 runs')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close Scoreboard' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const completed = [...document.querySelectorAll('[role="button"].sim-saved-item')]
      .find((item) => item.textContent.includes('Match 1:'));
    fireEvent.keyDown(completed, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const completedAgain = [...document.querySelectorAll('[role="button"].sim-saved-item')]
      .find((item) => item.textContent.includes('Match 1:'));
    fireEvent.keyDown(completedAgain, { key: ' ' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close Scoreboard' }));
    fireEvent.keyDown(completedAgain, { key: 'ArrowDown' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('handles no fixtures, AI-only matches, and country-filtered leagues', () => {
    const noFixtures = makeProps({ careerSchedule: [], careerDomesticTeams: [] });
    const { rerender } = render(<CareerSeasonScheduleStage {...noFixtures} />);
    expect(screen.getByText('No upcoming match scheduled.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Simulate/ })).not.toBeInTheDocument();

    const aiOnly = makeProps({
      careerSchedule: [{ id: 'ai', teamA: 'Ravens', teamB: 'Hawks', isComplete: false, leagueCountry: 'Country B' }],
      careerDomesticCountry: 'Country A',
    });
    rerender(<CareerSeasonScheduleStage {...aiOnly} />);
    expect(screen.getByText('No upcoming match scheduled.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simulate Remaining AI Matches' })).toBeInTheDocument();

    const noUserFixture = makeProps({
      careerSchedule: [
        { id: 'ai', teamA: 'Ravens', teamB: 'Hawks', isComplete: false, leagueCountry: 'Country B' },
      ],
      careerDomesticCountry: 'Country A',
    });
    rerender(<CareerSeasonScheduleStage {...noUserFixture} />);
    expect(screen.getByRole('button', { name: 'Simulate Remaining AI Matches' })).toBeInTheDocument();
    const noneLeft = makeProps({ careerSchedule: [{ id: 'done', isComplete: true }] });
    rerender(<CareerSeasonScheduleStage {...noneLeft} />);
    expect(screen.queryByRole('button', { name: 'No Fixtures Left' })).not.toBeInTheDocument();
  });

  test('renders tied, lost, and simulated results with sparse scorecards', () => {
    const props = makeProps({
      careerSeason: 0,
      careerDomesticCountry: '',
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A' },
        { name: 'Ravens', country: 'Country B' },
        { name: 'Hawks', country: 'Country A' },
        { name: '', country: 'Country A' },
      ],
      careerPlayerProfile: { name: '', age: 0 },
      careerStandings: null,
      careerSchedule: [
        {
          id: 'tie',
          matchNumber: 0,
          teamA: 'Falcons',
          teamB: 'Ravens',
          format: 't20',
          isComplete: true,
          isUserMatch: true,
          result: { winner: 'Tie', summary: 'The match was tied', teamAScore: 90, teamBScore: 90 },
        },
        {
          id: 'loss',
          matchNumber: 2,
          teamA: 'Falcons',
          teamB: 'Hawks',
          format: 'odi',
          isComplete: true,
          isUserMatch: true,
          result: { winner: 'Hawks', summary: 'Lost by 5 wickets', teamAScore: 100, teamBScore: 101 },
        },
        {
          id: 'simulated',
          matchNumber: 3,
          teamA: 'Ravens',
          teamB: 'Hawks',
          format: 't20',
          isComplete: true,
          isUserMatch: false,
          result: { winner: 'Ravens', summary: 'Auto result', teamAScore: 75, teamBScore: 60 },
        },
      ],
    });
    render(<CareerSeasonScheduleStage {...props} />);

    expect(screen.getByText('Career Player')).toBeInTheDocument();
    expect(document.body.textContent).toContain('Career Player (18)');
    expect(screen.getByText('No upcoming match scheduled.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show Full Schedule' }));
    expect(screen.getByText(/Tie — The match was tied/)).toBeInTheDocument();
    expect(screen.getByText(/Lost — Lost by 5 wickets/)).toBeInTheDocument();
    expect(screen.getByText(/Auto-simulated — Auto result/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[🤝❌🧮]/);
    expect(screen.getByText(/Match N\/A:/)).toBeInTheDocument();
    expect(screen.getAllByText('TBD')).toHaveLength(3);

    const tiedFixture = [...document.querySelectorAll('[role="button"].sim-saved-item')]
      .find((item) => item.textContent.includes('The match was tied'));
    fireEvent.click(tiedFixture);
    expect(screen.getByRole('dialog', { name: 'Completed fixture scoreboard' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close Scoreboard' }));
  });

  test('handles null schedule data, team-B fixtures, and completed matches without results', () => {
    const props = makeProps({
      careerSeason: 0,
      careerDomesticCountry: 'Country A',
      careerDomesticTeams: null,
      careerPlayerProfile: null,
      careerStandings: null,
      careerSchedule: null,
    });
    const { rerender } = render(<CareerSeasonScheduleStage {...props} />);
    expect(screen.getByText('Career Player')).toBeInTheDocument();
    expect(document.body.textContent).toContain('Career Player (18)');
    expect(screen.getByText('No upcoming match scheduled.')).toBeInTheDocument();

    const userMatch = makeProps({
      careerDomesticCountry: 'Country A',
      careerDomesticTeams: null,
      careerSchedule: [
        { id: 'next', teamA: 'Hawks', teamB: 'Falcons', leagueCountry: 'Country A', isComplete: false },
        { id: 'completed-no-result', teamA: 'Owls', teamB: 'Ravens', leagueCountry: 'Country A', isComplete: true },
      ],
    });
    rerender(<CareerSeasonScheduleStage {...userMatch} />);
    expect(document.body.textContent).toContain('Match N/A');
    expect(screen.getByText('▶ Your next match')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show Full Schedule' }));
    const completedWithoutResult = [...document.querySelectorAll('[role="button"].sim-saved-item')]
      .find((item) => item.textContent.includes('completed-no-result') || item.textContent.includes('Owls'));
    fireEvent.click(completedWithoutResult);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const aiMatch = makeProps({
      careerSeason: 3,
      careerDomesticCountry: 'Country A',
      careerDomesticTeams: null,
      careerSchedule: [
        { id: 'ai', teamA: 'Hawks', teamB: 'Owls', leagueCountry: 'Country A', isComplete: false },
      ],
    });
    rerender(<CareerSeasonScheduleStage {...aiMatch} />);
    expect(screen.getByText('▶ Next scheduled match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simulate Remaining AI Matches' })).toBeInTheDocument();
  });
});
