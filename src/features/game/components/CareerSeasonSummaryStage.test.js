import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CareerSeasonSummaryStage from './CareerSeasonSummaryStage';

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
  CAREER_FORMATS: ['t20', 'odi', 'test'],
  formatCareerMatchLabel: jest.fn((format) => String(format || 't20').toUpperCase()),
  getCareerFormatStandings: jest.fn((standings, format) => standings[format] || []),
  sortStandings: jest.fn((rows) => [...rows].sort((left, right) => right.points - left.points)),
  applyEndOfSeasonPlayerAbilityUpdates: jest.fn(),
}));

jest.mock('../utils/controllerCareerPlayerUtils', () => ({
  buildSeasonProgressionNotes: jest.fn(),
}));

const makeProps = (overrides = {}) => ({
  stageCommonProps: {},
  careerTeam: 'Falcons',
  careerSeason: 2,
  careerSchedule: [
    { isComplete: true, result: { momAward: { team: 'Falcons', playerId: 1, name: 'Career Player' } } },
    { isComplete: true, result: { momShortlist: [{ team: 'Falcons', playerId: 1, name: 'Career Player' }] } },
    { isComplete: true, result: { momShortlist: [{ team: 'Falcons', playerId: 2, name: 'Young Player' }] } },
    { isComplete: true, result: { momShortlist: [{ team: 'Falcons', playerId: 4, name: 'Young Runner Up' }] } },
    { isComplete: true, result: { momAward: { team: 'Falcons', playerId: 5, name: 'Young Tie' } } },
    { isComplete: true, result: { momAward: { team: 'Falcons', playerId: 5, name: 'Young Tie' } } },
    { isComplete: true, result: { momAward: { team: 'Falcons', name: 'Award Without Player Id' } } },
    { isComplete: false, result: { momAward: { team: 'Falcons', playerId: 1, name: 'Career Player' } } },
    { isComplete: true, result: { momAward: { name: 'Missing Team' } } },
  ],
  careerStandings: {
    t20: [
      { team: 'Ravens', played: 8, wins: 5, losses: 3, ties: 0, points: 10 },
      { team: 'Falcons', played: 8, wins: 6, losses: 2, ties: 0, points: 12 },
    ],
    odi: [{ team: 'Hawks', played: 4, wins: 4, losses: 0, ties: 0, points: 8 }],
  },
  careerPlayerStats: {
    career: {
      playerId: '1',
      name: 'Career Player',
      team: 'Falcons',
      playerType: 'batsman',
      runs: 300,
      outs: 6,
      balls: 150,
      wickets: 10,
      runsConceded: 120,
      ballsBowled: 120,
      matches: 8,
    },
    young: {
      playerId: 2,
      name: 'Young Player',
      team: 'Falcons',
      runs: 200,
      outs: 5,
      balls: 140,
      wickets: 5,
      runsConceded: 90,
      ballsBowled: 90,
      matches: 7,
    },
    youngRunnerUp: {
      playerId: 4,
      name: 'Young Runner Up',
      team: 'Falcons',
      runs: 176,
      outs: 4,
      balls: 110,
      wickets: 6,
      runsConceded: 90,
      ballsBowled: 90,
      matches: 8,
    },
    youngTie: {
      playerId: 5,
      name: 'Young Tie',
      team: 'Falcons',
      runs: 176,
      outs: 4,
      balls: 110,
      wickets: 5,
      runsConceded: 90,
      ballsBowled: 90,
      matches: 11,
    },
    zeroTotals: {
      playerId: 7,
      name: 'Zero Totals',
      team: 'Falcons',
      runs: 0,
      outs: 1,
      balls: 1,
      wickets: 1,
      runsConceded: 0,
      ballsBowled: 1,
      matches: 1,
    },
    youngZeroA: {
      playerId: 8,
      name: 'Young Zero A',
      team: 'Falcons',
      runs: 0,
      wickets: 0,
      matches: 5,
    },
    youngZeroB: {
      playerId: 9,
      name: 'Young Zero B',
      team: 'Falcons',
      runs: 0,
      wickets: 0,
      matches: 5,
    },
    freeAgent: {
      playerId: 3,
      name: 'Free Agent',
      team: 'Ravens',
      runs: 75,
      outs: 3,
      balls: 60,
      wickets: 2,
      runsConceded: 40,
      ballsBowled: 36,
      matches: 4,
    },
    ignored: { runs: 20, team: 'Ravens' },
  },
  careerTopRunScorers: [{ key: 'top-runs', name: 'Career Player', team: 'Falcons', runs: 300, battingAverage: 50 }],
  careerTopWicketTakers: [{ key: 'top-wickets', name: 'Career Player', team: 'Falcons', wickets: 10, bowlingAverage: 12 }],
  careerPlayerProfile: { playerId: 1, name: 'Career Player', age: 29, nationality: 'India', currentValue: 250000, playerType: 'batsman' },
  careerDomesticCountry: 'India',
  careerDomesticTeams: [
    {
      name: 'Falcons',
      players: [
        { id: 1, name: 'Career Player', age: 35, playerType: 'batsman', abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 50, battingAggresion: 50, paceAbility: 50, spinAbility: 50 },
        { id: 2, name: 'Young Player', age: 21, playerType: 'all-rounder', abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40, battingAggresion: 40, paceAbility: 40, spinAbility: 40 },
        { id: 4, name: 'Young Runner Up', age: 21 },
        { id: 5, name: 'Young Tie', age: 21 },
        { id: 6, name: 'Equal Ability Change', age: 24, abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40, battingAggresion: 40, paceAbility: 40, spinAbility: 40 },
        { id: 8, name: 'Young Zero A', age: 22 },
        { id: 9, name: 'Young Zero B', age: 22 },
      ],
    },
    {
      name: 'Ravens',
      players: [{ id: 3, name: 'Free Agent', age: 25, abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, battingAggresion: 20, paceAbility: 20, spinAbility: 20 }],
    },
    { name: 'Empty Club' },
  ],
  careerOffers: [
    { team: 'Ravens', amount: 320000, valuation: 400000 },
    { team: 'Ravens', amount: 999999, valuation: 999999 },
    { team: 'Hawks', amount: 280000, amountLabel: '$280,000', valuation: 350000, valuationLabel: '$350,000' },
  ],
  careerRetired: false,
  handleStartNextCareerSeason: jest.fn(),
  handleEndCareer: jest.fn(),
  handleRetireCareer: jest.fn(),
  ...overrides,
});

describe('CareerSeasonSummaryStage', () => {
  beforeEach(() => {
    const playerUtils = jest.requireMock('../utils/controllerCareerPlayerUtils');
    playerUtils.buildSeasonProgressionNotes.mockImplementation((stats) => (
      Object.keys(stats || {}).length
        ? [{ player: 'Career Player', team: 'Falcons', note: 'Excellent season', playerType: 'batsman' }]
        : []
    ));

    const scheduleUtils = jest.requireMock('../utils/controllerCareerScheduleUtils');
    scheduleUtils.formatCareerMatchLabel.mockImplementation((format) => String(format || 't20').toUpperCase());
    scheduleUtils.getCareerFormatStandings.mockImplementation((standings, format) => standings?.[format] || []);
    scheduleUtils.sortStandings.mockImplementation((rows) => [...(rows || [])].sort((left, right) => right.points - left.points));
    scheduleUtils.applyEndOfSeasonPlayerAbilityUpdates.mockImplementation(({ domesticTeams }) => (
      domesticTeams.map((team) => ({
        ...team,
        players: team.players
          ? [
              ...team.players.map((player) => ({
                ...player,
                abilityToPlayPaceBall: [1, 6].includes(player.id) ? player.abilityToPlayPaceBall + 2 : player.abilityToPlayPaceBall,
                paceAbility: player.id === 2 ? player.paceAbility - 1 : player.paceAbility,
              })),
              ...(team.name === 'Falcons' ? [{ id: 'preview-only', name: 'Preview-only player' }] : []),
            ]
          : team.players,
      }))
    ));
  });

  test('shows season awards, transfer offers, standings, report details, and retirement eligibility', () => {
    const props = makeProps();
    render(<CareerSeasonSummaryStage {...props} />);

    expect(screen.getByRole('heading', { name: 'Season 2 Complete' })).toBeInTheDocument();
    expect(screen.getByText(/Falcons topped at least one format table/)).toBeInTheDocument();
    expect(screen.getByText('Age: 30 • Nationality: India')).toBeInTheDocument();
    expect(screen.getByText('Estimated Value: $250,000')).toBeInTheDocument();
    const awardRows = [...document.querySelectorAll('.sim-scoreboard-panel p')];
    expect(awardRows.find((row) => row.textContent.includes('Best Batsman'))).toHaveTextContent('Career Player');
    expect(awardRows.find((row) => row.textContent.includes('Best Bowler'))).toHaveTextContent('Career Player');
    expect(awardRows.find((row) => row.textContent.includes('Young Player of the Year'))).toHaveTextContent('Young Player');
    expect(awardRows.find((row) => row.firstElementChild?.textContent === 'Player of the Year:')).toHaveTextContent('Career Player');
    expect(awardRows.find((row) => row.textContent.includes('Most Man of the Match Awards'))).toHaveTextContent('Career Player');
    expect(screen.getByText('Stay at Falcons')).toBeInTheDocument();
    expect(screen.getByText('Ravens Offer')).toBeInTheDocument();
    expect(screen.getAllByText('Ravens Offer')).toHaveLength(1);
    expect(screen.getByText('T20 Standings')).toBeInTheDocument();
    expect(screen.getByText('ODI Standings')).toBeInTheDocument();
    expect(screen.queryByText('TEST Standings')).not.toBeInTheDocument();
    expect(screen.getByText('6W / 2L / 0T — 12 points')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retire Now' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ravens Offer/ }));
    expect(screen.getByRole('button', { name: 'Accept Ravens Offer & Start' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accept Ravens Offer & Start' }));
    expect(props.handleStartNextCareerSeason).toHaveBeenCalledWith({ selectedTeam: 'Ravens' });

    fireEvent.click(screen.getByRole('button', { name: 'End Season' }));
    expect(screen.getByText('Ability Change Preview')).toBeInTheDocument();
    expect(screen.getByText('50 → 52')).toBeInTheDocument();
    expect(screen.getByText('40 → 39')).toBeInTheDocument();
    expect(screen.getByText('Top 10 Run Scorers')).toBeInTheDocument();
    expect(screen.getByText('Top 10 Wicket Takers')).toBeInTheDocument();
    expect(screen.getByText('Highlighted Performances')).toBeInTheDocument();
    expect(screen.getAllByText(/Excellent season/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Hide Season Report' }));
    expect(screen.queryByText('Ability Change Preview')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retire Now' }));
    expect(props.handleRetireCareer).toHaveBeenCalled();
  });

  test('provides no-winner, empty-report, fallback-offer, and retired-career paths', () => {
    const props = makeProps({
      careerSeason: 1,
      careerTeam: 'Owls',
      careerSchedule: [],
      careerStandings: {},
      careerPlayerStats: {},
      careerTopRunScorers: [],
      careerTopWicketTakers: [],
      careerPlayerProfile: {},
      careerDomesticCountry: '',
      careerDomesticTeams: [],
      careerOffers: [],
      careerRetired: true,
    });
    const { rerender } = render(<CareerSeasonSummaryStage {...props} />);

    expect(screen.getByText(/Season finished\./)).toBeInTheDocument();
    expect(screen.getByText('Age: 18 • Nationality: N/A')).toBeInTheDocument();
    expect(screen.getByText('Domestic League: N/A • Clubs: 0')).toBeInTheDocument();
    expect(screen.getByText(/Career ended by retirement/)).toBeInTheDocument();
    const emptyAwardRows = [...document.querySelectorAll('.sim-scoreboard-panel p')];
    expect(emptyAwardRows.find((row) => row.textContent.includes('Best Batsman'))).toHaveTextContent('No winner');
    expect(emptyAwardRows.find((row) => row.textContent.includes('Best Bowler'))).toHaveTextContent('No winner');
    expect(emptyAwardRows.find((row) => row.textContent.includes('Young Player of the Year'))).toHaveTextContent('No eligible under-23 player');
    expect(emptyAwardRows.find((row) => row.textContent.includes('Most Man of the Match Awards'))).toHaveTextContent('No MOM awards recorded');
    expect(screen.getByText('Stay at Owls')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Next Season (Stay)' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'End Career View' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retire Now' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'End Season' }));
    expect(screen.getByText('No ability changes calculated for this season.')).toBeInTheDocument();
    expect(screen.queryByText('Top 10 Run Scorers')).not.toBeInTheDocument();
    expect(screen.queryByText('Highlighted Performances')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'End Career View' }));
    expect(props.handleEndCareer).toHaveBeenCalled();

    rerender(<CareerSeasonSummaryStage {...props} careerTeam="" careerOffers={[]} careerRetired={false} />);
    expect(screen.getByRole('button', { name: 'Start Next Season (Stay)' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start Next Season (Stay)' }));
    expect(props.handleStartNextCareerSeason).toHaveBeenCalledWith({ selectedTeam: '' });

    rerender(<CareerSeasonSummaryStage
      {...props}
      careerTeam="Owls"
      careerStandings={{ t20: [{ team: 'Ravens', points: 10 }] }}
    />);
    expect(screen.getByText('Season finished - Ravens leads T20 table.')).toBeInTheDocument();

    rerender(<CareerSeasonSummaryStage
      {...props}
      careerTeam=""
      careerOffers={[{ team: '', amount: 0 }, { team: 'Ravens', amount: 100 }]}
    />);
    expect(screen.getByRole('button', { name: 'Accept Ravens Offer & Start' })).toBeInTheDocument();
  });

  test('resets a selected offer when it is removed and allows a non-retirement end-career action', () => {
    const props = makeProps({
      careerSeason: 1,
      careerSchedule: undefined,
      careerOffers: [{ team: 'Ravens', amount: 100000 }],
      careerPlayerProfile: { age: 18, currentValue: 50000 },
    });
    const { rerender } = render(<CareerSeasonSummaryStage {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Ravens Offer/ }));
    rerender(<CareerSeasonSummaryStage {...props} careerOffers={[{ team: 'Hawks', amount: 90000 }]} />);
    expect(screen.getByRole('button', { name: 'Start Next Season (Stay)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Career View' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'End Career View' }));
    expect(props.handleEndCareer).toHaveBeenCalled();
  });

  test('handles sparse career stats, name-only roster matches, and malformed awards and offers', () => {
    const props = makeProps({
      careerSeason: 0,
      careerSchedule: [
        null,
        { isComplete: false },
        { isComplete: true, result: { momShortlist: [] } },
        { isComplete: true, result: { momAward: { team: 'Falcons' } } },
      ],
      careerStandings: {},
      careerPlayerStats: {
        nameMatch: {
          team: 'Falcons',
          name: 'Name Matched',
          runs: 0,
          outs: 0,
          balls: 0,
          wickets: 0,
          runsConceded: 0,
          ballsBowled: 0,
          matches: 0,
        },
        noRoster: { team: 'Ghosts', name: 'No Roster Match', playerType: 'bowler' },
        incomplete: { team: 'Falcons' },
      },
      careerPlayerProfile: { name: 'Unmatched Profile', age: 0, currentValue: 0 },
      careerDomesticTeams: [
        { name: 'Falcons', players: [{ name: 'Name Matched', age: 22 }, { id: 8 }] },
      ],
      careerOffers: [
        { team: 'Falcons', amount: 0, amountLabel: '', valuation: 0, valuationLabel: '' },
        { team: 'Falcons', amount: 100 },
        { team: '', amount: 200 },
      ],
    });
    render(<CareerSeasonSummaryStage {...props} />);

    expect(screen.getByText('Season finished.')).toBeInTheDocument();
    expect(screen.getByText('Age: 18 • Nationality: N/A')).toBeInTheDocument();
    expect(screen.getAllByText('Name Matched').length).toBeGreaterThan(0);
    expect(screen.getByText('Contract: $0 • Valuation: $0')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'End Season' }));
    expect(screen.getByText('No ability changes calculated for this season.')).toBeInTheDocument();
  });

  test('accepts absent career collections and an empty market', () => {
    const scheduleUtils = jest.requireMock('../utils/controllerCareerScheduleUtils');
    scheduleUtils.applyEndOfSeasonPlayerAbilityUpdates.mockReturnValue([]);
    const props = makeProps({
      careerTeam: '',
      careerSchedule: null,
      careerStandings: null,
      careerPlayerStats: null,
      careerPlayerProfile: null,
      careerDomesticCountry: '',
      careerDomesticTeams: null,
      careerOffers: null,
    });
    render(<CareerSeasonSummaryStage {...props} />);

    expect(screen.getByText('Season finished.')).toBeInTheDocument();
    expect(screen.getByText('Domestic League: N/A • Clubs: 0')).toBeInTheDocument();
    expect(screen.getAllByText('No winner').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'End Season' }));
    expect(screen.getByText('No ability changes calculated for this season.')).toBeInTheDocument();
  });
});
