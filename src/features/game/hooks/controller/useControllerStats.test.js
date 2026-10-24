import React from 'react';
import { render } from '@testing-library/react';
import { useControllerStats } from './useControllerStats';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';

let mockStatsProps;
let mockStats;

jest.mock('../../../../utils/speechUtils', () => ({ speak: jest.fn() }));

const makeProps = (overrides = {}) => ({
  firstBattingSide: 'own',
  ownPlayers: [],
  opponentPlayers: [],
  firstInnings: { score: 100 },
  secondInnings: { score: 101 },
  ownTeam: 'Falcons',
  opponentTeam: 'Ravens',
  firstInningsTeamName: 'Falcons',
  secondInningsTeamName: 'Ravens',
  ownSanitizedRoles: {},
  opponentSanitizedRoles: {},
  seriesResults: [],
  seriesPlayerStats: {},
  gameMode: 'quick',
  seriesCurrentMatch: 1,
  seriesLength: 3,
  tournamentMatches: [],
  tournamentPlayerStats: {},
  tournamentChampion: '',
  careerPlayerStats: {},
  careerSeason: 1,
  careerMatchIndex: 0,
  careerSchedule: [],
  careerSeasonHistory: [],
  stage: 'TossTime',
  resultSummary: 'Falcons won',
  ...overrides,
});

function HookHarness() {
  mockStats = useControllerStats(mockStatsProps);
  return null;
}

describe('useControllerStats', () => {
  beforeEach(() => {
    mockStatsProps = makeProps();
    jest.clearAllMocks();
  });

  test('derives series, tournament, and career summaries and announces match outcomes', () => {
    const speak = jest.requireMock('../../../../utils/speechUtils').speak;
    mockStatsProps = makeProps({
      gameMode: 'series',
      seriesCurrentMatch: 5,
      seriesLength: 3,
      seriesResults: [
        { winnerTeam: 'Falcons' },
        { winnerTeam: 'Ravens' },
        { winnerTeam: 'Tie' },
      ],
      seriesPlayerStats: {
        alice: { name: 'Alice', team: 'Falcons', runs: 42, wickets: 1 },
        invalid: { runs: 5 },
        empty: null,
      },
      tournamentMatches: [
        { isComplete: true, teamA: 'Falcons', teamB: 'Ravens', winnerTeam: 'Falcons' },
        { isComplete: false, teamA: 'Falcons', teamB: 'Ravens', round: 2, matchNumber: 3 },
      ],
      tournamentPlayerStats: {
        bob: { name: 'Bob', team: 'Ravens', runs: 12, wickets: 3 },
      },
      careerPlayerStats: {
        alice: { name: 'Alice', team: 'Falcons', runs: 42, wickets: 1 },
      },
      careerSeason: 2,
      careerMatchIndex: 9,
      careerSchedule: [{}, {}, {}],
    });
    render(<HookHarness />);

    expect(mockStats.seriesStanding).toEqual({ ownWins: 1, opponentWins: 1, ties: 1 });
    expect(mockStats.seriesProgressLabel).toBe('Match 3 of 3');
    expect(mockStats.seriesTopRunScorers[0].name).toBe('Alice');
    expect(mockStats.tournamentResults).toHaveLength(1);
    expect(mockStats.tournamentProgressLabel).toBe('Round 2 • Match 3');
    expect(mockStats.tournamentTopWicketTakers[0].name).toBe('Bob');
    expect(mockStats.careerProgressLabel).toBe('');
    expect(mockStats.careerTopRunScorers[0].name).toBe('Alice');

    mockStats.announceManOfTheMatch({
      name: 'Alice',
      team: 'Falcons',
      runs: 42,
      balls: 30,
      strikeRate: 140,
      oversBowled: 2,
      runsConceded: 10,
      wickets: 1,
      points: 14,
      notes: ['Runs', 'Wicket'],
    });
    expect(speak).toHaveBeenCalledWith(expect.stringContaining('Congratulations to Ravens for winning the match.'));
    expect(speak).toHaveBeenCalledWith(expect.stringContaining('Key points: Runs, Wicket.'));
  });

  test('announces ties and series summaries and handles empty career schedules', () => {
    const speak = jest.requireMock('../../../../utils/speechUtils').speak;
    mockStatsProps = makeProps({
      gameMode: 'career',
      seriesResults: [{ winnerTeam: 'Falcons' }],
      seriesPlayerStats: null,
      tournamentMatches: [{ isComplete: false, teamA: '', teamB: 'Ravens' }],
      tournamentPlayerStats: null,
      tournamentChampion: 'Falcons',
      careerPlayerStats: null,
      careerSeason: 0,
      careerMatchIndex: 0,
      careerSchedule: [],
      stage: matchStatusEnum.SeriesSummary,
      firstInnings: { score: 20 },
      secondInnings: { score: 20 },
    });
    render(<HookHarness />);

    expect(mockStats.seriesStanding.ownWins).toBe(1);
    expect(mockStats.tournamentProgressLabel).toBe('Champion: Falcons');
    expect(mockStats.careerProgressLabel).toBe('Season 1 — No fixtures');
    mockStats.announceManOfTheMatch({
      name: 'Ravi',
      team: 'Ravens',
      runs: 20,
      balls: 15,
      strikeRate: 133,
      oversBowled: 1,
      runsConceded: 5,
      wickets: 0,
      points: 4,
    });
    expect(speak).toHaveBeenCalledWith(expect.stringContaining('The match is tied.'));

    mockStatsProps = makeProps({
      gameMode: 'series',
      stage: matchStatusEnum.SeriesSummary,
      seriesResults: [{ winnerTeam: 'Falcons' }],
    });
    render(<HookHarness />);
    expect(speak).toHaveBeenCalledWith('Falcons wins the series by 1-0.');

    mockStatsProps = makeProps({
      gameMode: 'series',
      stage: matchStatusEnum.SeriesSummary,
      seriesResults: [{ winnerTeam: 'Ravens' }, { winnerTeam: 'Ravens' }],
    });
    render(<HookHarness />);
    expect(speak).toHaveBeenCalledWith('Ravens wins the series by 2-0.');

    mockStatsProps = makeProps({
      stage: matchStatusEnum.MatchEnd,
      resultSummary: 'Match over',
      gameMode: 'series',
    });
    render(<HookHarness />);
    expect(speak).toHaveBeenCalledWith('Match over');
  });

  test('does not announce a missing player and covers the other series result branches', () => {
    const speak = jest.requireMock('../../../../utils/speechUtils').speak;
    mockStatsProps = makeProps({
      gameMode: 'series',
      stage: matchStatusEnum.SeriesSummary,
      seriesResults: [{ winnerTeam: 'Ravens' }, { winnerTeam: 'Ravens' }],
      firstInnings: { score: 50 },
      secondInnings: { score: 40 },
    });
    render(<HookHarness />);
    const initialCalls = speak.mock.calls.length;
    mockStats.announceManOfTheMatch(null);
    expect(speak).toHaveBeenCalledTimes(initialCalls);
    expect(speak).toHaveBeenCalledWith('Ravens wins the series by 2-0.');
    mockStats.announceManOfTheMatch({
      name: 'Alice',
      team: 'Falcons',
      runs: 50,
      balls: 30,
      strikeRate: 166,
      oversBowled: 0,
      runsConceded: 0,
      wickets: 0,
      points: 10,
    });
    expect(speak).toHaveBeenCalledWith(expect.stringContaining('Congratulations to Falcons for winning the match.'));
    mockStatsProps = makeProps({
      gameMode: 'series',
      stage: matchStatusEnum.SeriesSummary,
      seriesResults: [{ winnerTeam: 'Tie' }],
    });
    render(<HookHarness />);
    expect(speak).toHaveBeenCalledWith('Series ended tied at 0-0.');
  });

  test('uses fallbacks for missing fixture data and reports progress for an active career schedule', () => {
    mockStatsProps = makeProps({
      gameMode: 'career',
      tournamentMatches: null,
      tournamentChampion: '',
      careerSeason: 4,
      careerMatchIndex: 1,
      careerSchedule: [{}, {}, {}],
    });
    render(<HookHarness />);

    expect(mockStats.tournamentResults).toEqual([]);
    expect(mockStats.tournamentProgressLabel).toBe('Tournament in progress');
    expect(mockStats.careerProgressLabel).toBe('Season 4 — Match 2 of 3');

    mockStatsProps = makeProps({
      gameMode: 'career',
      careerSeason: 0,
      careerMatchIndex: 0,
      careerSchedule: [{}, {}],
    });
    render(<HookHarness />);
    expect(mockStats.careerProgressLabel).toBe('Season 1 — Match 1 of 2');

    mockStatsProps = makeProps({ careerSchedule: null });
    render(<HookHarness />);
    expect(mockStats.careerProgressLabel).toBe('');
  });
});
