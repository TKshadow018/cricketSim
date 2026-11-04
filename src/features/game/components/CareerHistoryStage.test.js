import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CareerHistoryStage from './CareerHistoryStage';

jest.mock('faker-user', () => ({ createPerson: jest.fn() }));

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick }) => <button onClick={onClick}>{text}</button>,
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
  careerSeason: 4,
  careerTopRunScorers: [{ key: 'runs', name: 'Top Batter', team: 'Falcons', runs: 500, matches: 10, battingAverage: 50 }],
  careerTopWicketTakers: [{ key: 'wickets', name: 'Top Bowler', team: 'Ravens', wickets: 20, matches: 10, bowlingAverage: 12 }],
  careerSeasonHistory: [
    {
      season: 1,
      careerTeam: 'Falcons',
      standings: {
        t20: [
          { team: 'Falcons', wins: 5, losses: 1, ties: 0, points: 10 },
          { team: 'Ravens', wins: 4, losses: 2, ties: 0, points: 8 },
        ],
      },
      seasonReport: {
        currentAge: 22,
        awards: [
          { id: 'best-batsman', title: 'Best Batsman', winner: { name: 'Top Batter', team: 'Falcons' }, summary: '500 runs' },
          { id: 'best-bowler', title: 'Best Bowler', winner: { name: 'Top Bowler', team: 'Ravens' }, summary: '20 wickets' },
          { id: 'young-player', title: 'Young Player', winner: { name: 'Young Player', team: 'Falcons' }, summary: 'Great season' },
          { id: 'player-of-year', title: 'Player of Year', winner: { name: 'Year Player', team: 'Hawks' }, summary: 'Impact 100' },
          { id: 'most-mom', title: 'Most MOM', winner: null, summary: 'No winner' },
          { id: 'unknown-award', title: 'Extra Award', winner: { name: 'Extra Player', team: 'Owls' }, summary: 'Extra' },
        ],
        abilityChangePreview: [
          { team: 'Falcons', player: { id: 1, name: 'Improved Player' }, delta: 3 },
          { team: 'Ravens', player: { id: 2, name: 'Declined Player' }, delta: -2 },
        ],
        topRunScorers: [{ key: 'season-runs', name: 'Season Batter', team: 'Falcons', runs: 250 }],
        topWicketTakers: [{ key: 'season-wickets', name: 'Season Bowler', team: 'Ravens', wickets: 12 }],
        progressionNotes: [{ player: 'Career Player', team: 'Falcons', note: 'Improved batting' }],
      },
    },
    {
      season: 2,
      careerTeam: 'Ravens',
      standings: {},
      seasonReport: { currentAge: 23, awards: [], abilityChangePreview: [], topRunScorers: [], topWicketTakers: [], progressionNotes: [] },
    },
  ],
  careerPlayerProfile: { name: 'Career Player', nationality: 'India' },
  careerDomesticCountry: 'India',
  careerRetired: true,
  handleBackToCareerSchedule: jest.fn(),
  ...overrides,
});

describe('CareerHistoryStage', () => {
  beforeEach(() => {
    const helpers = jest.requireMock('../utils/controllerCareerScheduleUtils');
    helpers.formatCareerMatchLabel.mockImplementation((format) => String(format || 't20').toUpperCase());
    helpers.getCareerFormatStandings.mockImplementation((standings, format) => standings[format] || []);
    helpers.sortStandings.mockImplementation((rows) => [...rows].sort((left, right) => right.points - left.points));
  });

  test('renders reversed history, awards, abilities, and all-time leaders', () => {
    const props = makeProps();
    render(<CareerHistoryStage {...props} />);
    expect(screen.getByRole('heading', { name: 'Career History' })).toBeInTheDocument();
    expect(screen.getByText(/Retired career across 3 completed seasons/)).toBeInTheDocument();
    expect(screen.getByText('Season 2')).toBeInTheDocument();
    expect(screen.getByText('Season 1')).toBeInTheDocument();
    expect(screen.getByText('All-Time Top Run Scorers')).toBeInTheDocument();
    expect(screen.getByText('All-Time Top Wicket Takers')).toBeInTheDocument();
    expect(screen.getByText('Top Batter')).toBeInTheDocument();
    expect(screen.getByText('Top Bowler')).toBeInTheDocument();
    expect(screen.getByText(/BAT: Top Batter \| BWL: Top Bowler \| YNG: Young Player \| POY: Year Player \| MOM: N\/A \| AWD: Extra Player/)).toBeInTheDocument();
    expect(screen.getByText('Best Batsman:')).toBeInTheDocument();
    expect(screen.getByText('Ability Changes')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
    expect(screen.getByText('Highlighted Performances')).toBeInTheDocument();
    expect([...document.querySelectorAll('.sim-scoreboard-panel')].some((panel) => panel.textContent.includes('Improved batting'))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Schedule' }));
    expect(props.handleBackToCareerSchedule).toHaveBeenCalled();
  });

  test('shows empty season history, fallback profile values, and the active career message', () => {
    const props = makeProps({
      careerSeason: 1,
      careerSeasonHistory: [],
      careerTopRunScorers: [],
      careerTopWicketTakers: [],
      careerPlayerProfile: {},
      careerDomesticCountry: '',
      careerRetired: false,
    });
    render(<CareerHistoryStage {...props} />);
    expect(document.querySelector('section > div')).toHaveTextContent(/Active career across 0 completed season$/);
    expect(screen.getByText('No completed seasons yet.')).toBeInTheDocument();
    expect(screen.getByText('Nationality: N/A')).toBeInTheDocument();
    expect(screen.getByText('Domestic League Country: N/A')).toBeInTheDocument();
    expect(screen.queryByText('Season History')).not.toBeInTheDocument();
  });

  test('supports a missing saved history for an active career in season two', () => {
    render(
      <CareerHistoryStage
        {...makeProps({
          careerSeason: 2,
          careerSeasonHistory: null,
          careerTopRunScorers: null,
          careerTopWicketTakers: undefined,
          careerPlayerProfile: null,
          careerDomesticCountry: null,
          careerRetired: false,
        })}
      />
    );

    expect(screen.getByText(/Active career across 1 completed season$/)).toBeInTheDocument();
    expect(screen.getByText('No completed seasons yet.')).toBeInTheDocument();
    expect(screen.getByText('Nationality: N/A')).toBeInTheDocument();
  });

  test('renders a season without standings or a saved season report', () => {
    render(
      <CareerHistoryStage
        {...makeProps({
          careerSeasonHistory: [{
            season: 3,
            careerTeam: 'Falcons',
            standings: null,
          }],
        })}
      />
    );

    expect(screen.getByText('Season 3')).toBeInTheDocument();
    expect(screen.getByText('T20: No results')).toBeInTheDocument();
    expect(screen.queryByText('Season Report')).not.toBeInTheDocument();
  });

  test('ignores malformed award collections in persisted season history', () => {
    const props = makeProps({
      careerSeasonHistory: [{
        season: 3,
        careerTeam: 'Falcons',
        standings: {},
        seasonReport: {
          currentAge: 24,
          awards: { length: 1, map: () => [] },
          abilityChangePreview: [],
          topRunScorers: [],
          topWicketTakers: [],
          progressionNotes: [],
        },
      }],
    });
    render(<CareerHistoryStage {...props} />);
    expect(screen.getByText('Season 3')).toBeInTheDocument();
    expect(screen.getByText('Awards:')).toBeInTheDocument();
  });
});
